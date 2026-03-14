import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          include: ["frontend/src"],
          name: "unit",
        },
      },
      {
        test: {
          name: "browser",
          include: ["frontend/src"],
          browser: {
            enabled: true,
            provider: playwright(),
            // https://vitest.dev/config/browser/playwright
            instances: [
              { browser: "chromium" },
              // { browser: 'firefox' },
              // { browser: 'webkit' },
            ],
          },
        },
      },
    ],
  },
});
