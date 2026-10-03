import argparse
import importlib
import os
from pathlib import Path
import struct
import sys


def cells(prop):
    return list(struct.unpack(f">{len(prop.value) // 4}I", prop.value))


def bindings(tree, prop, cell_property="#binding-cells"):
    values = cells(prop)
    result = []
    offset = 0
    while offset < len(values):
        behavior = tree.phandle2node[values[offset]]
        count = behavior.props[cell_property].to_num()
        parameters = values[offset + 1:offset + 1 + count]
        assert len(parameters) == count, behavior.path
        result.append((behavior.name, tuple(parameters)))
        offset += count + 1
    return result


def node_reference(prop, dtlib):
    return prop.to_path() if prop.type == dtlib.Type.PATH else prop.to_node()


def enabled(node):
    while node is not None:
        status = node.props.get("status")
        if status is not None and status.to_string() != "okay":
            return False
        node = node.parent
    return True


def validate(build_dir, key_count, side, baseline_dir, dtlib):
    tree = dtlib.DT(str(build_dir / "zephyr/zephyr.dts"))
    config = (build_dir / "zephyr/.config").read_text().splitlines()
    chosen = tree.get_node("/chosen")
    physical = node_reference(chosen.props["zmk,physical-layout"], dtlib)
    transform = physical.props["transform"].to_node()
    matrix = cells(transform.props["map"])
    assert len(matrix) == len(set(matrix)) == key_count
    assert transform.props["rows"].to_num() == 4
    assert transform.props["columns"].to_num() == 12
    assert len(cells(physical.props["keys"])) == key_count * 8
    offset = transform.props.get("col-offset")
    assert (offset.to_num() if offset else 0) == (6 if side == "right" else 0)

    scan = node_reference(chosen.props["zmk,kscan"], dtlib)
    assert bindings(tree, scan.props["row-gpios"], "#gpio-cells") == [
        ("connector", (pin, 0x20)) for pin in (6, 7, 8, 9)
    ]
    columns = (
        10,
        16,
        14,
        15,
        18,
        19) if side == "left" else (
        19,
        18,
        15,
        14,
        16,
        10)
    assert bindings(tree, scan.props["col-gpios"], "#gpio-cells") == [
        ("connector", (pin, 0)) for pin in columns
    ]
    assert scan.props["diode-direction"].to_string() == "col2row"

    layers = list(tree.get_node("/keymap").nodes.values())
    assert [layer.name for layer in layers] == [
        "base_layer", "navigation_layer", "functions_layer", "symkp_layer",
        "utils_layer", "mirror_layer", "combos_layer",
    ]
    layer_bindings = [bindings(tree, layer.props["bindings"])
                      for layer in layers]
    assert all(len(layer) == key_count for layer in layer_bindings)
    for position, target in ((36, 1), (37, 2), (40, 3), (41, 4)):
        assert layer_bindings[0][position] == ("momentary_layer", (target,))
    assert layer_bindings[1][1] == ("to_layer", (4,))
    assert layer_bindings[4][21] == ("sticky_layer", (1,))
    if key_count == 44:
        assert layer_bindings[0][42:] == [
            ("key_press", (0x70028,)), ("key_press", (0x7002C,))]
        assert all(layer[42:] == [("transparent", ()), ("transparent", ())]
                   for layer in layer_bindings[1:])
        assert matrix[36:] == [0x302, 0x303, 0x304,
                               0x307, 0x308, 0x309, 0x305, 0x306]
    for layer in layer_bindings:
        for behavior, parameters in layer:
            if behavior in ("momentary_layer", "to_layer", "sticky_layer"):
                assert parameters[0] < len(layers)

    home_row = tree.label2node["ht"]
    assert home_row.props["tapping-term-ms"].to_num() == 200
    assert home_row.props["quick-tap-ms"].to_num() == 200
    assert home_row.props["flavor"].to_string() == "tap-preferred"
    for label in ("td_left_space_key", "td_semi_first_tap"):
        assert tree.label2node[label].props["tapping-term-ms"].to_num() == 220

    combos = list(tree.get_node("/combos").nodes.values())
    assert len(combos) == 43
    for index, combo in enumerate(combos):
        positions = cells(combo.props["key-positions"])
        active_layers = set(cells(combo.props["layers"]))
        assert combo.props["timeout-ms"].to_num() == 50
        assert len(positions) == len(set(positions))
        assert all(position < key_count for position in positions)
        assert active_layers <= set(range(len(layers)))
        for other in combos[index + 1:]:
            if set(positions) == set(cells(other.props["key-positions"])):
                assert not active_layers.intersection(
                    cells(other.props["layers"])), (combo.name, other.name)
    recovery = tree.get_node("/combos/combo_reset_BASE")
    assert cells(recovery.props["key-positions"]) == [36, 37, 38]
    assert cells(recovery.props["layers"]) == list(range(7))
    assert bindings(tree, recovery.props["bindings"]) == [("to_layer", (0,))]

    display_expected = key_count == 42 or side == "left"
    assert ("zephyr,display" in chosen.props) == display_expected
    assert ("CONFIG_ZMK_DISPLAY=y" in config) == display_expected
    if display_expected:
        assert enabled(node_reference(chosen.props["zephyr,display"], dtlib))
    else:
        assert "nice_view" not in tree.label2node
        assert not enabled(tree.label2node["spi0"])
        assert not enabled(tree.label2node["i2c0"])
    strip = node_reference(chosen.props["zmk,underglow"], dtlib)
    assert strip.props["chain-length"].to_num() == (21 if key_count ==
                                                    42 else 22)
    assert enabled(strip)
    assert "CONFIG_ZMK_POINTING=y" in config
    assert ("CONFIG_ZMK_SPLIT_ROLE_CENTRAL=y" in config) == (side == "left")
    assert not any("zmk,input-split" in node.props["compatible"].to_strings()
                   for node in tree.node_iter() if "compatible" in node.props)

    if baseline_dir:
        baseline = dtlib.DT(str(baseline_dir / "zephyr/zephyr.dts"))
        unchanged_layers = (
            (0, {36, 37, 40, 41}),
            (1, {1, 2, 4, 13, 25, 26, 27, 30}),
            (2, set()),
            (3, set()),
            (4, {9, 19, 20, 21, 30, 34}),
        )
        for layer_index, changed_positions in unchanged_layers:
            original = bindings(
                baseline, baseline.get_node(
                    layers[layer_index].path).props["bindings"])
            for position, binding in enumerate(original):
                if position not in changed_positions:
                    assert layer_bindings[layer_index][position] == binding, (
                        layer_index, position)
        for combo in combos:
            original = baseline.get_node(combo.path)
            assert cells(combo.props["key-positions"]
                         ) == cells(original.props["key-positions"])
            assert bindings(
                tree, combo.props["bindings"]) == bindings(
                baseline, original.props["bindings"])
            if combo.name in ("combo_esc_left", "combo_delete"):
                assert cells(combo.props["layers"]) == list(range(6))
            else:
                assert cells(
                    combo.props["layers"]) == cells(
                    original.props["layers"])
        macros = tree.get_node("/macros").nodes
        assert list(macros) == list(baseline.get_node("/macros").nodes)
        for macro in macros.values():
            assert bindings(
                tree, macro.props["bindings"]) == bindings(
                baseline, baseline.get_node(
                    macro.path).props["bindings"])
        for label in ("td_equal", "td_quote", "td_comma", "td_period",
                      "td_fslash", "td_bslash",
                      "td_lshift_caps", "td_semicolon"):
            current = tree.label2node[label]
            original = baseline.label2node[label]
            assert current.props["tapping-term-ms"].to_num(
            ) == original.props["tapping-term-ms"].to_num()
            assert bindings(
                tree, current.props["bindings"]) == bindings(
                baseline, original.props["bindings"])

    assert (build_dir / "zephyr/zmk.uf2").stat().st_size > 0
    preservation = (
        ", baseline preservation" if baseline_dir
        else " (no original baseline supplied)"
    )
    print(
        f"PASS: {key_count}-{side}: matrix, seven layers, 43 combos, "
        f"timings, display, RGB, split{preservation}"
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("build_dir", type=Path)
    parser.add_argument("--keys", required=True, type=int, choices=(42, 44))
    parser.add_argument("--side", required=True, choices=("left", "right"))
    parser.add_argument("--baseline", type=Path)
    args = parser.parse_args()
    parser_path = (Path(os.environ["ZEPHYR_BASE"])
                   / "scripts/dts/python-devicetree/src")
    sys.path.insert(0, str(parser_path))
    dtlib = importlib.import_module("devicetree.dtlib")
    validate(args.build_dir, args.keys, args.side, args.baseline, dtlib)


if __name__ == "__main__":
    main()
