import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintImport from "eslint-plugin-import";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("plugin:@typescript-eslint/recommended-type-checked"),
  {
    plugins: { "simple-import-sort": simpleImportSort, import: eslintImport },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "require-await": "error",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];

export default config;
