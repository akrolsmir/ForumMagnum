#!/usr/bin/env node
const { build, cliopts } = require("estrella");
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');
const { zlib } = require("mz");

const defaultServerPort = 3000;

const getServerPort = () => {
  const port = parseInt(process.env.PORT ?? "");
  return Number.isNaN(port) ? defaultServerPort : port;
}

let latestCompletedBuildId = generateBuildId();
let inProgressBuildId = null;
let clientRebuildInProgress = false;
let serverRebuildInProgress = false;
const serverPort = getServerPort();
const websocketPort = serverPort + 1;

const outputDir = `build${serverPort === defaultServerPort ? "" : serverPort}`;

const [opts, args] = cliopts.parse(
  ["production", "Run in production mode"],
  ["settings", "A JSON config file for the server", "<file>"],
  ["mongoUrl", "A mongoDB connection connection string", "<url>"],
  ["mongoUrlFile", "The name of a text file which contains a mongoDB URL for the database", "<file>"],
  ["shell", "Open an interactive shell instead of running a webserver"],
);

// Two things this script should do, that it currently doesn't:
//  * Provide a websocket server for signaling autorefresh
//  * Start a local mongodb server, if no mongo URL was provided
//      https://github.com/shelfio/jest-mongodb

const isProduction = !!opts.production;
const settingsFile = opts.settings || "settings.json"

if (isProduction) {
  process.env.NODE_ENV="production";
} else {
  process.env.NODE_ENV="development";
}
if (opts.mongoUrl) {
  process.env.MONGO_URL = opts.mongoUrl;
} else if (opts.mongoUrlFile) {
  try {
    process.env.MONGO_URL = fs.readFileSync(opts.mongoUrlFile, 'utf8').trim();
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}

const clientBundleBanner = `/*
 * LessWrong 2.0 (client JS bundle)
 * Copyright (c) 2022 the LessWrong development team. See https://github.com/ForumMagnum/ForumMagnum
 * for source and license details.
 *
 * Includes CkEditor.
 * Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://github.com/ckeditor/ckeditor5/blob/master/LICENSE.md
 */`

const bundleDefinitions = {
  "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
  "bundleIsProduction": isProduction,
  "bundleIsTest": false,
  "defaultSiteAbsoluteUrl": `\"${process.env.ROOT_URL || ""}\"`,
  "buildId": `"${latestCompletedBuildId}"`,
  "serverPort": getServerPort(),
};

const clientOutfilePath = `./${outputDir}/client/js/bundle.js`;
build({
  entryPoints: ['./packages/lesswrong/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: clientOutfilePath,
  minify: isProduction,
  banner: clientBundleBanner,
  treeShaking: "ignore-annotations",
  run: false,
  onStart: (config, changedFiles, ctx, esbuildOptions) => {
    clientRebuildInProgress = true;
    inProgressBuildId = generateBuildId();
    esbuildOptions.define.buildId = `"${inProgressBuildId}"`;
  },
  onEnd: (config, buildResult, ctx) => {
    clientRebuildInProgress = false;
    if (buildResult?.errors?.length > 0) {
      console.log("Skipping browser refresh notification because there were build errors");
    } else {
      // Creating brotli compressed version of bundle.js to save on client download size:
      const brotliOutfilePath = `${clientOutfilePath}.br`;
      // Always delete compressed version if it exists, to avoid stale files
      if (fs.existsSync(brotliOutfilePath)) {
        fs.unlinkSync(brotliOutfilePath);
      }
      if (isProduction) {
        fs.writeFileSync(brotliOutfilePath, zlib.brotliCompressSync(fs.readFileSync(clientOutfilePath, 'utf8')));
      }

      latestCompletedBuildId = inProgressBuildId;
      initiateRefresh();
    }
    inProgressBuildId = null;
  },
  define: {
    ...bundleDefinitions,
    "bundleIsServer": false,
    "global": "window",
  },
});

let serverCli = ["node", "-r", "source-map-support/register", "--", `./${outputDir}/server/js/serverBundle.js`, "--settings", settingsFile]
if (opts.shell)
  serverCli.push("--shell");
if (!isProduction)
  serverCli.splice(1, 0, "--inspect");

build({
  entryPoints: ['./packages/lesswrong/server/serverStartup.ts'],
  bundle: true,
  outfile: `./${outputDir}/server/js/serverBundle.js`,
  platform: "node",
  sourcemap: true,
  minify: false,
  run: cliopts.run && serverCli,
  onStart: (config, changedFiles, ctx, esbuildOptions) => {
    serverRebuildInProgress = true;
  },
  onEnd: () => {
    serverRebuildInProgress = false;
    initiateRefresh();
  },
  define: {
    ...bundleDefinitions,
    "bundleIsServer": true,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax", "mathjax-node", "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql", "csso",
    "bcrypt", "node-pre-gyp", "intercom-client",
    "fsevents", "chokidar", "auth0", "dd-trace"
  ],
})

const openWebsocketConnections = [];

async function isServerReady() {
  try {
    const response = await fetch(`http://localhost:${serverPort}/robots.txt`);
    return response.ok;
  } catch(e) {
    return false;
  }
}

async function waitForServerReady() {
  while (!(await isServerReady())) {
    await asyncSleep(100);
  }
}

async function asyncSleep(durationMs) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), durationMs);
  });
}

function getClientBundleTimestamp() {
  const stats = fs.statSync(`./${outputDir}/client/js/bundle.js`);
  return stats.mtime.toISOString();
}

function generateBuildId() {
  return crypto.randomBytes(12).toString('base64');
}

let refreshIsPending = false;
async function initiateRefresh() {
  if (!cliopts.watch) {
    return;
  }
  if (refreshIsPending || clientRebuildInProgress || serverRebuildInProgress) {
    return;
  }
  
  if (openWebsocketConnections.length > 0) {
    refreshIsPending = true;
    console.log("Initiated refresh; waiting for server to be ready");
    await waitForServerReady();
    console.log("Notifying connected browser windows to refresh");
    for (let connection of openWebsocketConnections) {
      connection.send(`{"latestBuildTimestamp": "${getClientBundleTimestamp()}"}`);
    }
    refreshIsPending = false;
  }
}

function startWebsocketServer() {
  const server = new WebSocket.Server({
    port: websocketPort,
  });
  server.on('connection', (ws) => {
    openWebsocketConnections.push(ws);
    
    ws.on('message', (data) => {
    });
    ws.on('close', function close() {
      const connectionIndex = openWebsocketConnections.indexOf(ws);
      if (connectionIndex >= 0) {
        openWebsocketConnections.splice(connectionIndex, 1);
      }
    });
    ws.send(`{"latestBuildTimestamp": "${getClientBundleTimestamp()}"}`);
  });
}

if (cliopts.watch && cliopts.run && !isProduction) {
  startWebsocketServer();
}
