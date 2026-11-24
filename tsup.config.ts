import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/core/index.ts", react: "src/react/index.tsx", icons: "src/react/icons.tsx" },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  external: ["react", "lucide-react"],
  
});
