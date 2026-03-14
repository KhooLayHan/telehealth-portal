import { defineConfig } from "orval";
 
export default defineConfig({
  telehealth: {
    input: {
      target: "../../docs/api/openapi.json",
    },
    output: {
      baseUrl: {
        getBaseUrlFromSpecification: true,
      },
      biome: true,
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      namingConvention: "camelCase",
      operationSchemas: "src/api/schemas",
      override: {
        mutator: {
          path: "src/lib/ofetch-mutator.ts",
          name: "ofetchMutator",
        },
      },
      target: "src/services/generated",
      workspace: "src",
    },
    hooks: {
        afterAllFilesWrite: ['biome', 'check', '--write', '.']
    }
  },
});