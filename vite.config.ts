import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import tsconfigPaths from "vite-tsconfig-paths"



export default defineConfig(() => {
  return {
    plugins: [react(), tsconfigPaths(), nodePolyfills()],
  }
})
