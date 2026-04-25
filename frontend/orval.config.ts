import { defineConfig } from "orval";

export default defineConfig({
  telehealth: {
    input: {
      target: "http://localhost:5144/openapi/v1.json",
    },
    output: {
      baseUrl: "/api/v1",
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      indexFiles: false,
      mode: "tags-split",
      namingConvention: "PascalCase",
      override: {
        mutator: {
          path: "ofetch-mutator.ts",
          name: "ofetchMutator",
        },
      },
      schemas: "model",
      target: "generated",
      workspace: "src/api"
    },
  },
});
