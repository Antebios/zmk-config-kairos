// Regenerates or checks companion/src/generated/keymap.json from a compiled firmware build.
// Developer only: needs Python 3 and a west workspace with the left trackpad build.
//   KAIROS_BUILD_DIR  compiled build (default ~/kairos-build/zmk/build-kairos44-left-trackpad-verified)
//   ZEPHYR_BASE       zephyr folder of that workspace (default ~/kairos-build/zmk/zephyr)
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = join(homedir(), "kairos-build", "zmk");
const build =
  process.env.KAIROS_BUILD_DIR ??
  join(workspace, "build-kairos44-left-trackpad-verified");
const zephyr = process.env.ZEPHYR_BASE ?? join(workspace, "zephyr");
const mode = process.argv[2];

if (!["generate", "check"].includes(mode)) {
  console.error("Usage: node scripts/keymap.mjs <generate|check>");
  process.exit(1);
}

const result = spawnSync(
  "python3",
  [
    join(root, "..", "scripts", "generate_companion_keymap.py"),
    build,
    "--output",
    join(root, "src", "generated", "keymap.json"),
    ...(mode === "check" ? ["--check"] : []),
  ],
  { stdio: "inherit", env: { ...process.env, ZEPHYR_BASE: zephyr } },
);
process.exit(result.status ?? 1);
