import { defineConfig } from "vite";
import { resolve } from "path";
import solid from "vite-plugin-solid";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@fiveway/core"],
    },
  },

  plugins: [solid({ hot: false }), cssInjectedByJsPlugin(), dts()],
});
