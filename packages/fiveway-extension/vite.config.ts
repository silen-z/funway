import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import dts from "vite-plugin-dts";
import path from "node:path";

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solid(),
    webExtension({
      additionalInputs: ["src/panel.html", "src/hook.ts"],
      manifest: generateManifest,
    }),
    dts({ include: ["src/hook.ts"] }),
  ],
  resolve: {
    alias: {
      // In dev mode, make sure fast refresh works
      "/@react-refresh": path.resolve(
        "node_modules/@vitejs/plugin-react-swc/refresh-runtime.js",
      ),
    },
  },
});
