import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export default function globalSetup() {
  const repositoryDirectory = resolve(__dirname, "../../..");
  const apiDirectory = resolve(repositoryDirectory, "apps/api");
  const prismaCli = resolve(repositoryDirectory, "node_modules/prisma/build/index.js");
  const environment = {
    ...process.env,
    DOTENV_CONFIG_PATH: resolve(apiDirectory, ".env.test"),
  };

  execFileSync(process.execPath, [prismaCli, "migrate", "reset", "--force"], {
    cwd: apiDirectory,
    env: environment,
    stdio: "inherit",
  });
}
