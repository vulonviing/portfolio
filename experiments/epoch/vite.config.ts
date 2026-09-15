import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/epoch/",
  plugins: [react()],
  build: {
    outDir: "../../epoch",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
