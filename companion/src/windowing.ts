import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { KeyboardLink } from "./keyboard";
import type { Size } from "./settings";

export const inTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function run(
  action: (current: ReturnType<typeof getCurrentWindow>) => Promise<void>,
): Promise<void> {
  if (!inTauri()) return;
  try {
    await action(getCurrentWindow());
  } catch (error) {
    console.warn("Window action failed", error);
  }
}

// Pinning and sizing go through Rust, which also drives Hyprland where the toolkit cannot.
export async function applyAlwaysOnTop(on: boolean): Promise<void> {
  if (!inTauri()) return;
  try {
    await invoke("set_always_on_top", { pinned: on });
  } catch (error) {
    console.warn("Pinning failed", error);
  }
}

export async function applyWindowSize(size: Size): Promise<void> {
  if (!inTauri()) return;
  try {
    await invoke("set_window_size", { width: size.width, height: size.height });
  } catch (error) {
    console.warn("Resizing failed", error);
  }
}

// The reader thread may have connected before the UI started listening.
export async function currentKeyboard(): Promise<KeyboardLink | null> {
  if (!inTauri()) return null;
  try {
    return await invoke<KeyboardLink>("get_keyboard");
  } catch (error) {
    console.warn("Reading the keyboard state failed", error);
    return null;
  }
}

export async function onWindowResized(
  handler: (size: Size) => void,
): Promise<UnlistenFn> {
  if (!inTauri()) return () => {};
  const current = getCurrentWindow();
  return current.onResized(async ({ payload }) => {
    const scale = await current.scaleFactor();
    const logical = payload.toLogical(scale);
    handler({ width: logical.width, height: logical.height });
  });
}
export const applySkipTaskbar = (on: boolean) =>
  run((current) => current.setSkipTaskbar(on));
export const applyClickThrough = (on: boolean) =>
  run((current) => current.setIgnoreCursorEvents(on));
export const minimizeWindow = () => run((current) => current.minimize());
export const closeWindow = () => run((current) => current.close());

export async function onCommand<T = void>(
  event: string,
  handler: (payload: T) => void,
): Promise<UnlistenFn> {
  if (!inTauri()) return () => {};
  return listen<T>(event, (message) => handler(message.payload));
}
