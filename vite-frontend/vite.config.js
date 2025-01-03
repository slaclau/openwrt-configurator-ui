import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": {
        target: "ws://localhost:5000",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
    host: "0.0.0.0",
  },
});
