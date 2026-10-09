#include <assert.h>
#include "../../src/display/kairos44_status.h"

static void check_bounds(const struct kairos44_status_frame *frame) {
    assert(strlen(frame->left) * 8 <= 76);
    assert(strlen(frame->right) * 8 <= 76);
    assert(strlen(frame->output) * 8 <= 156);
    assert(strlen(frame->layer) * 8 <= 156);
    assert(strlen(frame->pointer) * 8 <= 156);
    assert(frame->portrait_line_count == KAIROS44_PORTRAIT_LINE_COUNT);
    for (unsigned int line = 0; line < frame->portrait_line_count; line++) {
        assert(strlen(frame->portrait_lines[line]) <= KAIROS44_PORTRAIT_LINE_CHARS);
    }
}

int main(void) {
    struct kairos44_status state = {.profile = 1};
    struct kairos44_status_frame frame;
    uint8_t display_x;
    uint8_t display_y;
    kairos44_portrait_to_display(0, 0, &display_x, &display_y);
    assert(display_x == 159 && display_y == 0);
    kairos44_portrait_to_display(67, 0, &display_x, &display_y);
    assert(display_x == 159 && display_y == 67);
    kairos44_portrait_to_display(0, 159, &display_x, &display_y);
    assert(display_x == 0 && display_y == 0);
    kairos44_portrait_to_display(67, 159, &display_x, &display_y);
    assert(display_x == 0 && display_y == 67);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.left, "L--") == 0);
    assert(strcmp(frame.right, "R OFF") == 0);
    assert(strcmp(frame.portrait_lines[1], "BATTERY:") == 0);
    assert(strcmp(frame.portrait_lines[2], "L:--") == 0);
    assert(strcmp(frame.portrait_lines[3], "R:OFF") == 0);
    assert(strcmp(frame.portrait_lines[7], "LINK: R-") == 0);
    assert(strcmp(frame.pointer, "PAD NORMAL") == 0);
    kairos44_status_connection(&state, true);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.right, "R--") == 0);
    kairos44_status_battery(&state, true, 1, 80);
    assert(!state.right_valid);
    kairos44_status_battery(&state, true, 0, 0);
    kairos44_status_battery(&state, false, 0, 0);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.left, "L0%") == 0);
    assert(strcmp(frame.right, "R0%") == 0);
    kairos44_status_battery(&state, false, 0, 100);
    kairos44_status_battery(&state, true, 0, 100);
    state.usb_powered = true;
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.left, "L100% USB") == 0);
    assert(strcmp(frame.right, "R100%") == 0);
    assert(strcmp(frame.output, "B1? R+ ---- ???") == 0);
    check_bounds(&frame);
    state.usb_output = true;
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "USB R+ ---- ???") == 0);
    state.usb_output = false;
    state.profile_bonded = true;
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B1- R+ ---- ???") == 0);
    state.profile_connected = true;
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B1+ R+ ---- ???") == 0);
    kairos44_status_modifiers(&state, 0x05, true);
    kairos44_status_modifiers(&state, 0x01, true);
    kairos44_status_modifiers(&state, 0x05, false);
    kairos44_status_locks(&state, 0x07);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B1+ R+ ---C C-N-S") == 0);
    kairos44_status_modifiers(&state, 0x01, false);
    kairos44_status_modifiers(&state, 0x82, true);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B1+ R+ G-S- C-N-S") == 0);
    kairos44_status_locks(&state, 0x02);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B1+ R+ G-S- C----") == 0);
    state.profile = 255;
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B255+ R+ G-S- C----") == 0);
    check_bounds(&frame);
    kairos44_status_locks(&state, 0x07);
    kairos44_status_format(&state, &frame);
    assert(strcmp(frame.output, "B255+ R+ G-S- C-N-S") == 0);
    assert(strcmp(frame.portrait_lines[0], "KAIROS44") == 0);
    assert(strcmp(frame.portrait_lines[5], "HOST:") == 0);
    assert(strcmp(frame.portrait_lines[1], "BATTERY:") == 0);
    assert(strcmp(frame.portrait_lines[2], "L:100%") == 0);
    assert(strcmp(frame.portrait_lines[3], "R:100%") == 0);
    assert(strcmp(frame.portrait_lines[7], "LINK: R+") == 0);
    assert(strcmp(frame.portrait_lines[8], "MOD:") == 0);
    assert(strcmp(frame.portrait_lines[9], "G-S-") == 0);
    assert(strcmp(frame.portrait_lines[10], "LOCK:") == 0);
    assert(strcmp(frame.portrait_lines[11], "C-N-S") == 0);
    assert(strcmp(frame.portrait_lines[12], "LAYER:") == 0);
    assert(strcmp(frame.portrait_lines[13], "BASE") == 0);
    assert(strcmp(frame.portrait_lines[14], "PAD:") == 0);
    assert(strcmp(frame.portrait_lines[15], "NORMAL") == 0);
    check_bounds(&frame);
    const char *const expected_layers[] = {
        "LAYER BASE", "LAYER NAV", "LAYER FUNCTIONS", "LAYER SYMBOL_KP",
        "LAYER UTILS", "LAYER MIRROR", "LAYER COMBOS"};
    const char *const expected_portrait_layers[] = {
        "BASE", "NAV", "FUNC", "SYM-KP", "UTILS", "MIRROR", "COMBOS"};
    for (unsigned int layer = BASE; layer <= COMBOS; layer++) {
        state.layers = (1u << layer) | (1u << POINTER_COMBOS);
        kairos44_status_format(&state, &frame);
        check_bounds(&frame);
        assert(strcmp(frame.layer, expected_layers[layer]) == 0);
        assert(strcmp(frame.portrait_lines[13], expected_portrait_layers[layer]) == 0);
    }
    assert(strcmp(kairos44_status_pointer(1u << POINTER_FAST), "FAST") == 0);
    for (unsigned int layer = POINTER_PRECISION; layer <= POINTER_EXTRA_SCROLL; layer++) {
        state.layers = (1u << POINTER_FAST) | (1u << layer);
        bool scroll = layer == POINTER_SCROLL || layer == POINTER_EXTRA_SCROLL;
        assert(strcmp(kairos44_status_pointer(state.layers), scroll ? "SCROLL" : "PREC") == 0);
    }
    assert(strcmp(kairos44_status_pointer((1u << POINTER_EXTRA_SCROLL) |
                                         (1u << POINTER_EXTRA_PRECISION)), "SCROLL") == 0);
    kairos44_status_connection(&state, false);
    assert(!state.right_valid);
    kairos44_status_battery(&state, true, 0, 75);
    assert(!state.right_valid);
    kairos44_status_connection(&state, true);
    assert(!state.right_valid);
    kairos44_status_battery(&state, true, 0, 101);
    assert(!state.right_valid);
    kairos44_status_battery(&state, true, 0, 75);
    assert(state.right_valid);
    kairos44_status_connection(&state, true);
    assert(state.right_valid && state.right_level == 75);
    state.profile = 255;
    state.profile_connected = false;
    state.profile_bonded = false;
    kairos44_status_connection(&state, false);
    kairos44_status_format(&state, &frame);
    check_bounds(&frame);
    puts("PASS: display battery validity, connection, output, modifiers, locks, layers, pointer priority and text bounds");
    return 0;
}