Package.describe({
  name: "vulcan:categories",
  summary: "Telescope tags package",
  version: '1.3.1',
  git: "https://github.com/TelescopeJS/telescope-tags.git"
});

Package.onUse(function (api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'vulcan:core@1.3.1',
    'vulcan:posts@1.3.1',
  ]);

  api.mainModule("lib/server.js", "server");
  api.mainModule("lib/client.js", "client");

});