import "./integrationTestSetup";
import path from "path";
import { makeMigrations } from "../server/scripts/makeMigrations";

describe('Schema check', () => {
  it('Has an accepted_schema.sql file which matches the schema defined in code', async () => {
    await makeMigrations({writeSchemaChangelog: false, writeAcceptedSchema: false, generateMigrations: false, rootPath: path.join(__dirname, "../../../")});
  });
});
