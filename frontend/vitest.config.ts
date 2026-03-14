import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          name: "unit",
        },
      },
      {
        test: {
          name: "browser",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
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
