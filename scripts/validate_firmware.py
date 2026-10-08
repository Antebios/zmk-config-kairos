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


def pointer_combo_layers(original, trackpad):
    original = set(original)
    if not trackpad:
        return original
    if original == set(range(7)):
        return set(range(22))
    contexts = {0: (13,), 1: (14, 15, 16), 2: (17,), 3: (18,),
                4: (19,), 5: (20,), 6: (21,)}
    return original | {context for layer in original
                       for context in contexts[layer]}


def validate_pointer_modes(tree, layer_bindings, side):
    for index in range(7, 22):
        expected = [("transparent", ())] * 44
        if index in (15, 16):
            expected[29] = (
                "pointer_cycle_precision" if index == 15
                else "pointer_cycle_normal", (9, 0))
        assert layer_bindings[index] == expected, index

    for label, action in (
        ("pointer_cycle_fast", "pointer_next_fast"),
        ("pointer_cycle_precision", "pointer_next_precision"),
        ("pointer_cycle_normal", "pointer_next_normal"),
    ):
        behavior = tree.label2node[label]
        assert behavior.props["tapping-term-ms"].to_num() == 200
        assert behavior.props["flavor"].to_string() == "tap-preferred"
        assert behavior.props["bindings"].to_nodes() == [
            tree.label2node["mo"], tree.label2node[action]]

    scroll_hold = tree.label2node["pointer_scroll"]
    assert scroll_hold.props["tapping-term-ms"].to_num() == 200
    assert scroll_hold.props["flavor"].to_string() == "tap-preferred"
    assert scroll_hold.props["bindings"].to_nodes() == [
        tree.label2node["mo"], tree.label2node["sk"]]

    thumb = tree.label2node["pointer_thumb"]
    assert thumb.props["tapping-term-ms"].to_num() == 200
    assert thumb.props["flavor"].to_string() == "tap-preferred"
    assert thumb.props["bindings"].to_nodes() == [
        tree.label2node["mo"], tree.label2node["kp"]]

    for label, mode in (("pointer_layer_on", "on"),
                        ("pointer_layer_off", "off")):
        assert tree.label2node[label].props["toggle-mode"].to_string() == mode
    for name, actions in {
        "pointer_next_fast": [("pointer_layer_off", (8,)),
                              ("pointer_layer_on", (7,))],
        "pointer_next_precision": [("pointer_layer_off", (7,)),
                                   ("pointer_layer_on", (8,))],
        "pointer_next_normal": [("pointer_layer_off", (7,)),
                                ("pointer_layer_off", (8,))],
    }.items():
        macro = tree.label2node[name]
        assert macro.props["wait-ms"].to_num() == 0
        assert macro.props["tap-ms"].to_num() == 0
        current = bindings(tree, macro.props["bindings"])
        assert current[0][0] == tree.label2node["macro_tap"].name
        assert current[1:] == actions, name

    scroll = tree.label2node["nav_scroll"]
    assert scroll.props["wait-ms"].to_num() == 0
    assert scroll.props["tap-ms"].to_num() == 20
    scroll_actions = [
        ("macro_param_2to1", ()), ("macro_tap", ()),
        ("nav_scroll_step", (0,)), ("macro_param_1to1", ()),
        ("macro_press", ()), ("msc", (0,)),
        ("macro_pause_for_release", ()), ("macro_param_1to1", ()),
        ("macro_release", ()), ("msc", (0,)),
    ]
    assert bindings(tree, scroll.props["bindings"]) == [
        (tree.label2node[label].name, parameters)
        for label, parameters in scroll_actions]
    step = tree.label2node["nav_scroll_step"]
    for prop, value in (("trigger-period-ms", 16),
                        ("time-to-max-speed-ms", 0),
                        ("acceleration-exponent", 0),
                        ("x-input-code", 6), ("y-input-code", 8)):
        assert step.props[prop].to_num() == value, prop
    listener = tree.get_node("/nav_scroll_step_listener")
    assert listener.props["device"].to_node() is step
    assert "input-processors" not in listener.props

    expected_contexts = {}
    for name, source, target in (
        ("base", 0, 13), ("functions", 2, 17), ("symbols", 3, 18),
        ("utils", 4, 19), ("mirror", 5, 20), ("combos", 6, 21),
    ):
        for mode, state in (("fast", 7), ("precision", 8),
                            ("hold_precision", 9), ("scroll", 10),
                            ("extra_precision", 11), ("extra_scroll", 12)):
            expected_contexts[f"{name}_{mode}"] = ([state, source], target)
    expected_contexts["nav_fast"] = ([7, 1], 15)
    expected_contexts["nav_precision"] = ([8, 1], 16)
    expected_contexts["nav_hold_precision"] = ([9, 1], 16)
    expected_contexts["nav_scroll"] = ([10, 1], 14)
    expected_contexts["nav_extra_precision"] = ([11, 1], 16)
    expected_contexts["nav_extra_scroll"] = ([12, 1], 14)
    contexts = tree.get_node("/conditional_layers").nodes
    assert set(contexts) == set(expected_contexts)
    for name, (sources, target) in expected_contexts.items():
        assert cells(contexts[name].props["if-layers"]) == sources
        assert contexts[name].props["then-layer"].to_num() == target

    if side == "left":
        listener = tree.label2node["trackpad_listener"]
        assert "input-processors" not in listener.props
        assert list(listener.nodes) == ["scroll", "precision", "fast"]
        scroll_override = listener.nodes["scroll"]
        assert cells(scroll_override.props["layers"]) == [10, 12]
        assert "process-next" not in scroll_override.props
        assert bindings(tree, scroll_override.props["input-processors"],
                        "#input-processor-cells") == [
                            ("zip_xy_scaler", (1, 16)),
                            ("zip_xy_transform", (4,)),
                            ("zip_xy_to_scroll_mapper", ())]
        mapper = tree.label2node["zip_xy_to_scroll_mapper"]
        assert cells(mapper.props["map"]) == [1, 8, 0, 6]
        transform = tree.label2node["zip_xy_transform"]
        assert cells(transform.props["x-codes"]) == [0]
        assert cells(transform.props["y-codes"]) == [1]
        for name, states, ratio in (("precision", [8, 9, 11], (1, 4)),
                                    ("fast", [7], (2, 1))):
            override = listener.nodes[name]
            assert cells(override.props["layers"]) == states
            assert "process-next" not in override.props
            assert bindings(tree, override.props["input-processors"],
                            "#input-processor-cells") == [
                                ("zip_xy_scaler", ratio)]
        scaler = tree.label2node["zip_xy_scaler"]
        assert scaler.props["type"].to_num() == 2
        assert cells(scaler.props["codes"]) == [0, 1]
        assert "track-remainders" in scaler.props


def validate(build_dir, key_count, side, baseline_dir, dtlib, trackpad=False):
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
    expected_layers = [
        "base_layer", "navigation_layer", "functions_layer", "symkp_layer",
        "utils_layer", "mirror_layer", "combos_layer",
    ]
    if trackpad:
        expected_layers += [
            f"pointer_{name}_layer" for name in (
                "fast", "precision", "hold_precision", "scroll",
                "extra_precision", "extra_scroll", "base",
                "nav_scroll",
                "nav_fast", "nav_precision",
                "functions", "symbols", "utils", "mirror", "combos")]
    assert [layer.name for layer in layers] == expected_layers
    layer_bindings = [bindings(tree, layer.props["bindings"])
                      for layer in layers]
    assert all(len(layer) == key_count for layer in layer_bindings)
    for position, target in ((36, 1), (37, 2), (40, 3), (41, 4)):
        assert layer_bindings[0][position] == ("momentary_layer", (target,))
    assert layer_bindings[1][1] == ("to_layer", (4,))
    assert layer_bindings[4][21] == ("sticky_layer", (1,))
    trackpad_nav_bindings = {
        6: ("nav_scroll", (10, 64)),
        7: ("nav_scroll", (0xFFF60000, 0xFFC00000)),
        9: ("nav_scroll", (0xA0000, 0x400000)),
        10: ("key_press", (0x7004A,)),
        11: ("key_press", (0x7004D,)),
        18: ("nav_scroll", (0xFFF6, 0xFFC0)),
        25: ("pointer_scroll", (10, 0x700E2)),
        26: ("mouse_key_press", (2,)),
        27: ("mouse_key_press", (4,)),
        28: ("mouse_key_press", (1,)),
        29: ("pointer_cycle_fast", (9, 0)),
        31: ("none", ()),
        32: ("none", ()),
        33: ("none", ()),
    }
    if trackpad:
        assert key_count == 44
        for position, binding in trackpad_nav_bindings.items():
            assert layer_bindings[1][position] == binding, position
        validate_pointer_modes(tree, layer_bindings, side)
    extra_base_bindings = [
        ("pointer_thumb", (12, 0x70028)),
        ("pointer_thumb", (11, 0x7002C)),
    ] if trackpad else [
        ("key_press", (0x70028,)), ("key_press", (0x7002C,))]
    if key_count == 44:
        assert layer_bindings[0][42:] == extra_base_bindings
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
    assert len(combos) == 42
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
    assert cells(recovery.props["layers"]) == list(range(len(layers)))
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
    split_inputs = [node for node in tree.node_iter()
                    if "compatible" in node.props and enabled(node)
                    and "zmk,input-split" in
                    node.props["compatible"].to_strings()]
    assert len(split_inputs) == (1 if trackpad else 0)
    assert ("CONFIG_ZMK_INPUT_SPLIT=y" in config) == trackpad

    sensors = [node for node in tree.node_iter()
               if "compatible" in node.props and enabled(node)
               and "cirque,pinnacle" in node.props["compatible"].to_strings()]
    sensor_expected = trackpad and side == "right"
    assert len(sensors) == (1 if sensor_expected else 0)
    assert ("CONFIG_INPUT_PINNACLE=y" in config) == sensor_expected
    listeners = [node for node in tree.node_iter()
                 if "compatible" in node.props and enabled(node)
                 and "zmk,input-listener" in
                 node.props["compatible"].to_strings()]
    if trackpad:
        assert key_count == 44
        split_input = split_inputs[0]
        assert split_input.props["reg"].to_num() == 0
        trackpad_listeners = [
            listener for listener in listeners
            if listener.props["device"].to_node() in [split_input] + sensors
        ]
        assert enabled(tree.label2node["spi3"])
        if side == "left":
            assert "CONFIG_SHIELD_KAIROS44_TRACKPAD_RECEIVER=y" in config
            assert "device" not in split_input.props
            assert len(trackpad_listeners) == 1
            listener_device = trackpad_listeners[0].props["device"].to_node()
            assert listener_device is split_input
            assert not enabled(tree.label2node["i2c0"])
            assert not enabled(tree.label2node["i2c1"])
            assert enabled(tree.label2node["spi0"])
    if sensor_expected:
        assert "CONFIG_SHIELD_KAIROS44_TRACKPAD=y" in config
        assert "CONFIG_I2C=y" in config
        sensor = sensors[0]
        assert split_input.props["device"].to_node() is sensor
        assert not trackpad_listeners
        bus = tree.label2node["i2c1"]
        assert sensor.parent is bus and enabled(bus)
        assert sensor.props["reg"].to_num() == 0x2A
        assert bindings(tree, sensor.props["dr-gpios"], "#gpio-cells") == [
            (tree.label2node["gpio0"].name, (8, 0))
        ]
        assert bus.props["clock-frequency"].to_num() == 100000
        assert bus.props["pinctrl-names"].to_strings() == ["default", "sleep"]
        for index in (0, 1):
            pinctrl = bus.props[f"pinctrl-{index}"].to_nodes()
            assert len(pinctrl) == 1
            group = pinctrl[0].nodes["group1"]
            assert set(cells(group.props["psels"])) == {0xC001F, 0xB001D}
            assert ("low-power-enable" in group.props) == (index == 1)
        assert not enabled(tree.label2node["i2c0"])
        assert not enabled(tree.label2node["spi1"])
        assert not enabled(tree.label2node["spi0"])
        assert enabled(tree.label2node["spi3"])
        for prop in ("sleep", "no-taps", "no-secondary-tap"):
            assert prop not in sensor.props

    if baseline_dir:
        baseline = dtlib.DT(str(baseline_dir / "zephyr/zephyr.dts"))
        if trackpad:
            for layer, current in zip(layers[:7], layer_bindings[:7]):
                expected = bindings(
                    baseline, baseline.get_node(layer.path).props["bindings"])
                if layer.name == "base_layer":
                    expected[42:] = extra_base_bindings
                if layer.name == "navigation_layer":
                    for position, binding in trackpad_nav_bindings.items():
                        expected[position] = binding
                assert current == expected, layer.name
            for combo in combos:
                assert set(cells(combo.props["layers"])) == (
                    pointer_combo_layers(cells(baseline.get_node(
                        combo.path).props["layers"]), True)), combo.name
        unchanged_layers = (
            (0, {36, 37, 40, 41}),
            (1, {1, 2, 4, 13, 25, 26, 27, 30}),
            (2, set()),
            (3, set()),
            (4, {9, 19, 20, 21, 30, 34}),
        )
        for layer_index, changed_positions in unchanged_layers:
            if trackpad and layer_index == 0:
                changed_positions = changed_positions | {42, 43}
            if trackpad and layer_index == 1:
                changed_positions = (
                    changed_positions | trackpad_nav_bindings.keys())
            original = bindings(
                baseline, baseline.get_node(
                    layers[layer_index].path).props["bindings"])
            for position, binding in enumerate(original):
                if position not in changed_positions:
                    assert layer_bindings[layer_index][position] == binding, (
                        layer_index, position)
        for combo in combos:
            original = baseline.get_node(combo.path)
            expected_positions = (
                [15, 16] if combo.name == "combo_vscode_new_console2"
                else cells(original.props["key-positions"]))
            assert cells(combo.props["key-positions"]) == expected_positions
            assert bindings(
                tree, combo.props["bindings"]) == bindings(
                baseline, original.props["bindings"])
            if combo.name in ("combo_esc_left", "combo_delete"):
                expected = range(6)
            else:
                expected = cells(original.props["layers"])
            assert set(cells(combo.props["layers"])) == (
                pointer_combo_layers(expected, trackpad)), combo.name
        macros = tree.get_node("/macros").nodes
        original_macros = baseline.get_node("/macros").nodes
        additions = ["pointer_next_fast", "pointer_next_precision",
                     "pointer_next_normal", "nav_scroll"] if trackpad else []
        assert list(macros) == list(original_macros) + additions
        for macro in original_macros.values():
            assert bindings(
                tree, tree.get_node(macro.path).props["bindings"]) == bindings(
                baseline, macro.props["bindings"])
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
        f"PASS: {key_count}-{side}: matrix, {len(layers)} layers, 42 combos, "
        f"timings, display, RGB, split{preservation}"
        + ((", right Pinnacle I2C1/DRDY transmitter" if side == "right"
            else ", left split-input receiver/listener")
           if trackpad else ", no trackpad")
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("build_dir", type=Path)
    parser.add_argument("--keys", required=True, type=int, choices=(42, 44))
    parser.add_argument("--side", required=True, choices=("left", "right"))
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--trackpad", action="store_true")
    args = parser.parse_args()
    parser_path = (Path(os.environ["ZEPHYR_BASE"])
                   / "scripts/dts/python-devicetree/src")
    sys.path.insert(0, str(parser_path))
    dtlib = importlib.import_module("devicetree.dtlib")
    validate(args.build_dir, args.keys, args.side, args.baseline, dtlib,
             args.trackpad)


if __name__ == "__main__":
    main()
