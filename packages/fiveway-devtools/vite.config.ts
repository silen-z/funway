import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "@fiveway/core",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["@fiveway/react", "react", "react/jsx-runtime"],
    },
  },
  plugins: [react(), dts()],
});
