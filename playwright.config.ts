import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

const e2eDb = join(tmpdir(), `kotoba-e2e-${process.pid}.sqlite`);

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  timeout: 120_000,
  use: { baseURL: "http://127.0.0.1:5173" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DB_PATH: e2eDb,
      PORT: "3001",
      HOST: "127.0.0.1",
    },
  },
});
