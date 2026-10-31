import { GESTURE_INFO, KIND_INFO } from "./keys";
import {
  COMBOS,
  LAYERS,
  comboKeyLabels,
  type Combo,
  type KeyCell,
} from "./layout";

// HTML keeps keys such as `|` and a backtick intact in tables for both Markdown renderers; \| is not unescaped by MkDocs.
function code(text: string): string {
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "&#124;")
    .replaceAll("`", "&#96;");
  return `<code>${escaped}</code>`;
}

function cell(entry: KeyCell): string {
  if (entry.kind === "none") return "—";
  if (entry.kind === "transparent") return `_${code(entry.label)}_`;
  const lines = [`**${code(entry.label)}**`];
  for (const item of entry.gestures) {
    lines.push(code(`${GESTURE_INFO[item.gesture].short} ${item.action}`));
  }
  return lines.join("<br>");
}

function row(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function layerSection(index: number): string {
  const layer = LAYERS[index];
  const at = (position: number) => cell(layer.keys[position]);
  const main = ["Top", "Home", "Bottom"].map((name, rowIndex) =>
    row([
      name,
      ...Array.from({ length: 12 }, (_, column) => at(rowIndex * 12 + column)),
    ]),
  );
  return [
    `### ${layer.name}`,
    "",
    `${layer.title}. ${layer.reach}.`,
    "",
    row([
      "",
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
    ]),
    row(Array.from({ length: 13 }, () => "---")),
    ...main,
    "",
    row(["Thumbs", "Lower", "Raise", "Space", "Enter", "Down", "Up"]),
    row(Array.from({ length: 7 }, () => "---")),
    row(["", ...[36, 37, 38, 39, 40, 41].map(at)]),
    "",
    row(["Extra thumbs", "Left Enter", "Right Space"]),
    row(["---", "---", "---"]),
    row(["", at(42), at(43)]),
    "",
  ].join("\n");
}

function layerNames(entry: Combo): string {
  if (entry.layers.length === LAYERS.length) return "All";
  if (entry.layers.length === LAYERS.length - 1 && !entry.layers.includes(6)) {
    return "All except COMBOS";
  }
  return entry.layers.map((id) => LAYERS[id].name).join(", ");
}

const KIND_TITLE = {
  shortcut: "Shortcuts",
  symbol: "Keys and symbols",
  system: "System",
} as const;

function comboSection(): string {
  const parts: string[] = [];
  for (const kind of Object.keys(KIND_TITLE) as (keyof typeof KIND_TITLE)[]) {
    const entries = COMBOS.filter((entry) => entry.kind === kind);
    parts.push(
      `### ${KIND_TITLE[kind]}`,
      "",
      row(["Action", "Keys to press", "Layers"]),
      row(["---", "---", "---"]),
      ...entries.map((entry) =>
        row([
          entry.action,
          comboKeyLabels(entry.layers[0], entry).map(code).join(" + "),
          layerNames(entry),
        ]),
      ),
      "",
    );
  }
  return parts.join("\n");
}

export function renderReference(): string {
  const kinds = Object.values(KIND_INFO).map(
    (info) => `- ${info.name}: ${info.description}`,
  );
  return [
    "# Layer and combo reference",
    "",
    "This page is generated from `src/layers.ts` and `src/layout.ts` by",
    "`npm run docs:reference`. Do not edit it by hand.",
    "",
    "## How to read the tables",
    "",
    "Each layer is shown as the keyboard is laid out: three rows of twelve keys,",
    "six on the left half (L1 to L6) and six on the right (R1 to R6), then the",
    "thumb keys. In a cell:",
    "",
    "- **Bold** is the key's label, with its gestures underneath as a code and an",
    "  action, such as `hold GUI` or `2× Caps Word`. The codes are explained in",
    "  [Reading a key](reading-keys.md).",
    "- _Italic_ is a transparent key: it is not assigned on this layer and uses the",
    "  BASE key shown.",
    "- A dash is an unassigned key that does nothing.",
    "",
    "The key types are:",
    "",
    ...kinds,
    "",
    "## Layers",
    "",
    ...LAYERS.map((_, index) => layerSection(index)),
    "## Combos",
    "",
    "Press the keys together. Key labels are those of the first layer listed for the",
    "combo, and the physical keys are the same on every layer.",
    "",
    comboSection(),
  ].join("\n");
}
