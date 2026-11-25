import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));

// Unique strings from each module, used to detect what ended up in a bundle.
const MARKERS = {
  placeholder: "M16 50H84", // food glyph path
  logo: "Juniper", // company name prefix
  animals: "penguin",
  person: "F6D3B3", // first skin tone
};

async function bundle(code) {
  const out = await build({
    stdin: { contents: code, resolveDir: dist, loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
    external: ["react", "react/jsx-runtime", "lucide-react"],
    logLevel: "silent",
  });
  return out.outputFiles[0].text;
}

const has = (js, key) => js.includes(MARKERS[key]);

test("importing one component or function only bundles its own module", async () => {
  const cases = [
    ['import { Avatar } from "./react.js"; console.log(Avatar);', ["person"], ["animals", "placeholder", "logo"]],
    ['import { AnimalAvatar } from "./react.js"; console.log(AnimalAvatar);', ["animals"], ["person", "placeholder", "logo"]],
    ['import { Placeholder } from "./react.js"; console.log(Placeholder);', ["placeholder"], ["person", "animals", "logo"]],
    ['import { Logo } from "./react.js"; console.log(Logo);', ["logo"], ["person", "animals", "placeholder"]],
    ['import { avatarUrl } from "./index.js"; console.log(avatarUrl);', ["person"], ["animals", "placeholder", "logo"]],
    ['import { animalUrl } from "./index.js"; console.log(animalUrl);', ["animals"], ["person", "placeholder", "logo"]],
    ['import { placeholderUrl } from "./index.js"; console.log(placeholderUrl);', ["placeholder"], ["person", "animals", "logo"]],
    ['import { logoUrl } from "./index.js"; console.log(logoUrl);', ["logo"], ["person", "animals", "placeholder"]],
  ];
  for (const [code, included, excluded] of cases) {
    const js = await bundle(code);
    for (const key of included) assert.ok(has(js, key), `${code} should include ${key}`);
    for (const key of excluded) assert.ok(!has(js, key), `${code} should not include ${key}`);
  }
});
