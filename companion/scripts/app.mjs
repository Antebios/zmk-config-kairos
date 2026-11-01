// Build, install, start, stop and remove the app on the current platform: node scripts/app.mjs <command>.
import { spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const NAME = "kairos44-companion";
const PRODUCT = "Kairos44 Companion";
const DESCRIPTION = "Floating Kairos44 keyboard layer and shortcut viewer";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tauri = join(root, "src-tauri");
const release = join(tauri, "target", "release");
const platform = process.platform;
const home = homedir();

const linux = {
  binary: join(home, ".local", "bin", NAME),
  desktop: join(home, ".local", "share", "applications", `${NAME}.desktop`),
  iconRoot: join(home, ".local", "share", "icons", "hicolor"),
  // Source icon, then the hicolor size folder it belongs in.
  icons: [
    ["32x32.png", "32x32"],
    ["128x128.png", "128x128"],
    ["128x128@2x.png", "256x256"],
  ],
};
const macApp = join(home, "Applications", `${PRODUCT}.app`);
const windowsHome = join(
  process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
  PRODUCT,
);

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: platform === "win32" && /\.(cmd|bat)$/i.test(command),
    ...options,
  });
  if (result.error) fail(`${command}: ${result.error.message}`);
  return result.status ?? 1;
}

function quietly(command, args) {
  return spawnSync(command, args, { stdio: "ignore" }).status;
}

// An anchored pattern, so this script's own command line and folder names never match.
const processPattern = `(^|/)${NAME}( |$)`;

function isRunning() {
  if (platform === "win32") {
    const list = spawnSync("tasklist", ["/FI", `IMAGENAME eq ${NAME}.exe`], {
      encoding: "utf8",
    });
    return (list.stdout ?? "").toLowerCase().includes(`${NAME}.exe`);
  }
  return quietly("pgrep", ["-f", processPattern]) === 0;
}

function kill() {
  if (!isRunning()) {
    console.log(`${PRODUCT} is not running.`);
    return;
  }
  if (platform === "win32") {
    quietly("taskkill", ["/F", "/IM", `${NAME}.exe`]);
  } else {
    quietly("pkill", ["-f", processPattern]);
    // Give it a moment to exit, then insist.
    for (let attempt = 0; attempt < 20 && isRunning(); attempt++) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
    if (isRunning()) quietly("pkill", ["-9", "-f", processPattern]);
  }
  console.log(`Stopped ${PRODUCT}.`);
}

function build() {
  const npm = platform === "win32" ? "npm.cmd" : "npm";
  // Linux installs the bare binary; Windows and macOS need the installer or app bundle.
  const targets =
    platform === "win32"
      ? ["--bundles", "nsis"]
      : platform === "darwin"
        ? ["--bundles", "app"]
        : ["--no-bundle"];
  const status = run(npm, ["run", "tauri", "--", "build", ...targets], {
    cwd: root,
  });
  if (status !== 0) fail("The build failed.");
}

function desktopEntry() {
  return `${[
    "[Desktop Entry]",
    "Type=Application",
    `Name=${PRODUCT}`,
    `Comment=${DESCRIPTION}`,
    `Exec="${linux.binary}"`,
    `Icon=${NAME}`,
    "Terminal=false",
    "Categories=Utility;",
    "Keywords=keyboard;layers;kairos;zmk;shortcuts;",
    `StartupWMClass=${NAME}`,
  ].join("\n")}\n`;
}

function installLinux() {
  const built = join(release, NAME);
  if (!existsSync(built)) fail(`Missing ${built}; run without --skip-build.`);
  mkdirSync(dirname(linux.binary), { recursive: true });
  // Rename over the old file: copying onto a running binary fails with "text file busy".
  const staged = `${linux.binary}.new`;
  copyFileSync(built, staged);
  chmodSync(staged, 0o755);
  renameSync(staged, linux.binary);

  for (const [source, size] of linux.icons) {
    const folder = join(linux.iconRoot, size, "apps");
    mkdirSync(folder, { recursive: true });
    copyFileSync(join(tauri, "icons", source), join(folder, `${NAME}.png`));
  }
  mkdirSync(dirname(linux.desktop), { recursive: true });
  writeFileSync(linux.desktop, desktopEntry());

  quietly("update-desktop-database", [dirname(linux.desktop)]);
  quietly("gtk-update-icon-cache", ["-f", "-t", linux.iconRoot]);
  console.log(`Installed ${linux.binary}`);
  console.log(
    `Registered ${linux.desktop} (shows in the application launcher)`,
  );
  if (!(process.env.PATH ?? "").split(":").includes(dirname(linux.binary))) {
    console.log(`Note: ${dirname(linux.binary)} is not on your PATH.`);
  }
}

function installMac() {
  const bundle = join(release, "bundle", "macos", `${PRODUCT}.app`);
  if (!existsSync(bundle)) fail(`Missing ${bundle}; run without --skip-build.`);
  mkdirSync(dirname(macApp), { recursive: true });
  rmSync(macApp, { recursive: true, force: true });
  if (run("ditto", [bundle, macApp]) !== 0) fail("Copying the app failed.");
  console.log(`Installed ${macApp} (shows in Launchpad and Spotlight)`);
}

function installWindows() {
  const folder = join(release, "bundle", "nsis");
  const setups = existsSync(folder)
    ? readdirSync(folder)
        .filter((file) => file.endsWith("-setup.exe"))
        .map((file) => join(folder, file))
        .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    : [];
  if (setups.length === 0)
    fail(`No installer in ${folder}; run without --skip-build.`);
  // A per-user silent install: it needs no administrator rights and adds the Start menu shortcut.
  if (run(setups[0], ["/S"]) !== 0) fail("The installer failed.");
  console.log(`Installed ${PRODUCT} (Start menu: Kairos44 > ${PRODUCT})`);
}

function install(args) {
  kill();
  if (!args.includes("--skip-build")) build();
  if (platform === "win32") installWindows();
  else if (platform === "darwin") installMac();
  else installLinux();
}

function uninstall() {
  kill();
  if (platform === "win32") {
    const uninstaller = join(windowsHome, "uninstall.exe");
    if (!existsSync(uninstaller)) {
      console.log(`${PRODUCT} is not installed.`);
      return;
    }
    run(uninstaller, ["/S"]);
  } else if (platform === "darwin") {
    rmSync(macApp, { recursive: true, force: true });
  } else {
    rmSync(linux.binary, { force: true });
    rmSync(linux.desktop, { force: true });
    for (const [, size] of linux.icons) {
      rmSync(join(linux.iconRoot, size, "apps", `${NAME}.png`), {
        force: true,
      });
    }
    quietly("update-desktop-database", [dirname(linux.desktop)]);
    quietly("gtk-update-icon-cache", ["-f", "-t", linux.iconRoot]);
  }
  console.log(`Removed ${PRODUCT}. Your saved settings were kept.`);
}

function start() {
  if (isRunning()) {
    console.log(`${PRODUCT} is already running.`);
    return;
  }
  const [command, args] =
    platform === "win32"
      ? [join(windowsHome, `${NAME}.exe`), []]
      : platform === "darwin"
        ? ["open", [macApp]]
        : [linux.binary, []];
  if (command.includes("/") || command.includes("\\")) {
    if (!existsSync(command))
      fail(`${PRODUCT} is not installed; run npm run app:install.`);
  }
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
  console.log(`Started ${PRODUCT}.`);
}

const commands = { kill, build, install, uninstall, start };
const [name, ...args] = process.argv.slice(2);
if (!commands[name]) {
  fail(`Usage: node scripts/app.mjs <${Object.keys(commands).join("|")}>`);
}
commands[name](args);
