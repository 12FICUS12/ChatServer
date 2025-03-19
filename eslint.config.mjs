import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { ignores:  ["dist/*", "coverage/*", "node_modules/*"] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        test: "readonly",
        reject: "readonly",
        expect: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        exports: "readonly",
        // Добавьте глобальные переменные для Node.js
        process: "readonly", 
        __filename: "readonly", 
        jest: "readonly",
        describe: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
  {
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];