"""Exports the Kairos44 keymap and combos from a compiled build for the companion app.

The app's key labels are written by hand. This script writes the machine readable keymap, so
companion/src/keymap.test.ts can fail when the hand written data no longer matches the firmware.

    python3 scripts/generate_companion_keymap.py <build-dir> --output companion/src/generated/keymap.json
    python3 scripts/generate_companion_keymap.py <build-dir> --output ... --check

Needs ZEPHYR_BASE (the west workspace's zephyr folder), like validate_firmware.py.
"""
import argparse
import importlib
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_firmware import bindings, cells  # noqa: E402

KEYBOARD_LAYERS = 7
KEY_COUNT = 44
# Keymap layer nodes in order, and the names layers.keymap gives them.
LAYER_NODES = ("base_layer", "navigation_layer", "functions_layer", "symkp_layer",
               "utils_layer", "mirror_layer", "combos_layer")
LAYER_NAMES = ("BASE", "NAVIGATION", "FUNCTIONS",
               "SYMBOL_KP", "UTILS", "MIRROR", "COMBOS")

# HID keyboard usages (page 0x07), then the consumer usages this keymap uses (page 0x0C).
KEYBOARD_NAMES = {
    **{4 + i: chr(ord("A") + i) for i in range(26)},
    **{30 + i: str((i + 1) % 10) for i in range(10)},
    40: "ENTER", 41: "ESC", 42: "BSPC", 43: "TAB", 44: "SPACE", 45: "MINUS", 46: "EQUAL",
    47: "LBKT", 48: "RBKT", 49: "BSLH", 50: "NON_US_HASH", 51: "SEMI", 52: "SQT", 53: "GRAVE",
    54: "COMMA", 55: "DOT", 56: "FSLH", 57: "CAPS", 70: "PSCRN", 71: "SLCK", 72: "PAUSE",
    73: "INS", 74: "HOME", 75: "PG_UP", 76: "DEL", 77: "END", 78: "PG_DN", 79: "RIGHT",
    80: "LEFT", 81: "DOWN", 82: "UP", 83: "NUMLOCK", 84: "KP_DIVIDE", 85: "KP_MULTIPLY",
    86: "KP_MINUS", 87: "KP_PLUS", 88: "KP_ENTER", 98: "KP_N0", 99: "KP_DOT", 101: "K_APP",
    224: "LCTRL", 225: "LSHFT", 226: "LALT", 227: "LGUI", 228: "RCTRL", 229: "RSHFT",
    230: "RALT", 231: "RGUI",
    **{58 + i: f"F{i + 1}" for i in range(12)},
    **{89 + i: f"KP_N{i + 1}" for i in range(9)},
    **{104 + i: f"F{i + 13}" for i in range(12)},
}
CONSUMER_NAMES = {
    0xE9: "C_VOL_UP", 0xEA: "C_VOL_DN", 0xE2: "C_MUTE", 0xCD: "C_PLAY_PAUSE", 0xB5: "C_NEXT",
    0xB6: "C_PREV", 0x6F: "C_BRI_UP", 0x70: "C_BRI_DN",
}
MODIFIER_NAMES = ("LC", "LS", "LA", "LG", "RC", "RS", "RA", "RG")
LAYER_BEHAVIORS = {"mo", "to", "sl", "tog", "lt", "mo_tog", "td_to"}


def keycode(value):
    modifiers = [MODIFIER_NAMES[bit]
                 for bit in range(8) if (value >> 24) & (1 << bit)]
    page = (value >> 16) & 0xFF
    usage = value & 0xFFFF
    names = {0x07: KEYBOARD_NAMES, 0x0C: CONSUMER_NAMES}.get(page, {})
    name = names.get(usage, f"0x{page:02X}:{usage:04X}")
    for modifier in reversed(modifiers):
        name = f"{modifier}({name})"
    return name


def decode_parameter(label, value, layer_names):
    if label in ("kp", "sk"):
        return keycode(value)
    if label in LAYER_BEHAVIORS and value < len(layer_names):
        return layer_names[value]
    return str(value - (1 << 32) if value >= 1 << 31 else value)


def node_label(node):
    return node.labels[0] if node.labels else node.name


def cell_count(node, tree):
    prop = node.props.get("#binding-cells")
    return prop.to_num() if prop else 0


def decode_binding(tree, behavior, parameters, layer_names, depth=0):
    label = node_label(behavior)
    compatible = behavior.props["compatible"].to_string(
    ) if "compatible" in behavior.props else ""
    result = {"behavior": label, "compatible": compatible,
              "params": list(parameters)}
    args = [decode_parameter(label, value, layer_names)
            for value in parameters]
    if compatible == "zmk,behavior-hold-tap" and depth < 2:
        hold, tap = behavior.props["bindings"].to_nodes()
        counts = (cell_count(hold, tree), cell_count(tap, tree))
        hold_params = list(parameters[: counts[0]]) if counts[0] else []
        tap_params = list(parameters[1:][: counts[1]]) if counts[1] else []
        result["hold"] = decode_binding(
            tree, hold, hold_params, layer_names, depth + 1)
        result["tap"] = decode_binding(
            tree, tap, tap_params, layer_names, depth + 1)
        args = [result["hold"]["text"], result["tap"]["text"]]
    elif compatible == "zmk,behavior-tap-dance" and depth < 2:
        result["taps"] = [
            decode_binding(tree, node, list(params), layer_names, depth + 1)
            for node, params in bindings_with_nodes(tree, behavior.props["bindings"])
        ]
    result["text"] = " ".join([label] + args)
    return result


def bindings_with_nodes(tree, prop):
    values = cells(prop)
    offset = 0
    while offset < len(values):
        behavior = tree.phandle2node[values[offset]]
        count = behavior.props["#binding-cells"].to_num()
        yield behavior, tuple(values[offset + 1:offset + 1 + count])
        offset += count + 1


def export(build_dir, dtlib):
    tree = dtlib.DT(str(build_dir / "zephyr/zephyr.dts"))
    keymap = tree.get_node("/keymap")
    layer_nodes = [node for node in keymap.nodes.values()][:KEYBOARD_LAYERS]
    assert tuple(
        node.name for node in layer_nodes) == LAYER_NODES, "layer order changed"
    layer_names = list(LAYER_NAMES)
    layers = []
    for index, node in enumerate(layer_nodes):
        entries = list(bindings_with_nodes(tree, node.props["bindings"]))
        assert len(entries) == KEY_COUNT, (node.name, len(entries))
        layers.append({
            "index": index,
            "node": node.name,
            "name": layer_names[index],
            "keys": [decode_binding(tree, behavior, params, layer_names)
                     for behavior, params in entries],
        })
    combos = []
    for node in tree.get_node("/combos").nodes.values():
        [(behavior, params)] = bindings_with_nodes(
            tree, node.props["bindings"])
        positions = cells(node.props["key-positions"])
        combo_layers = sorted(cells(node.props["layers"]))
        combos.append({
            "name": node.name.removeprefix("combo_"),
            "positions": positions,
            "layers": [layer for layer in combo_layers if layer < KEYBOARD_LAYERS],
            "timeoutMs": node.props["timeout-ms"].to_num() if "timeout-ms" in node.props else None,
            "binding": decode_binding(tree, behavior, params, layer_names),
        })
    return {
        "generatedBy": "scripts/generate_companion_keymap.py",
        "keyCount": KEY_COUNT,
        "layers": layers,
        "combos": combos,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("build_dir", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    sys.path.insert(
        0, str(Path(os.environ["ZEPHYR_BASE"]) / "scripts/dts/python-devicetree/src"))
    dtlib = importlib.import_module("devicetree.dtlib")
    text = json.dumps(export(args.build_dir, dtlib), indent=2) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != text:
            sys.exit(f"{args.output} is out of date; regenerate it.")
        print(f"PASS: {args.output} matches the compiled keymap")
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
