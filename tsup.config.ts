import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/core/index.ts", react: "src/react/index.tsx", icons: "src/react/icons.tsx", data: "src/data/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    treeshake: true,
    external: ["react", "lucide-react"],
  },
  {
    // `npx @placeholderkit/core data ...`
    entry: { cli: "src/data/cli.ts" },
    format: ["esm"],
    platform: "node",
    dts: false,
    clean: false,
    treeshake: true,
    banner: { js: "#!/usr/bin/env node" },
    external: ["@placeholderkit/core/data"],
  },
]);
