import { defineConfig } from "orval";

export default defineConfig({
  telehealth: {
    input: {
      target: "http://localhost:5144/openapi/v1.json",
    },
    output: {
      baseUrl: {
        getBaseUrlFromSpecification: true,
      },
      indexFiles: false,
      biome: true,
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      namingConvention: "camelCase",
      operationSchemas: "src/api/schemas",
      override: {
        mutator: {
          path: "api/ofetch-mutator.ts",
          name: "ofetchMutator",
        },
      },
      target: "api/generated",
      workspace: "src",
    },
    hooks: {
      afterAllFilesWrite: ["biome", "check", "--write", "."],
    },
  },
});
