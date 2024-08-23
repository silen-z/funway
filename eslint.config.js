import js from "@eslint/js";
import ts from "typescript-eslint";
import solid from "eslint-plugin-solid/dist/configs/typescript.js";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  { ignores: ["**/dist/**/*", "packages/fiveway-extension/**/*"] },
  {
    files: ["packages/fiveway-solid/src/**/*"],
    ...solid,
  }
];
