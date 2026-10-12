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
    static uint8_t portrait[KAIROS44_PORTRAIT_WIDTH * KAIROS44_PORTRAIT_HEIGHT];
    static uint8_t display[KAIROS44_PORTRAIT_WIDTH * KAIROS44_PORTRAIT_HEIGHT];
    for (unsigned int index = 0; index < sizeof(portrait); index++) {
        portrait[index] = (uint8_t)(index * 7 + 1);
    }
    kairos44_rotate_portrait(portrait, display);
    for (uint8_t y = 0; y < KAIROS44_PORTRAIT_HEIGHT; y++) {
        for (uint8_t x = 0; x < KAIROS44_PORTRAIT_WIDTH; x++) {
            kairos44_portrait_to_display(x, y, &display_x, &display_y);
            assert(display[display_y * KAIROS44_PORTRAIT_HEIGHT + display_x] ==
                   portrait[y * KAIROS44_PORTRAIT_WIDTH + x]);
        }
    }
    assert(display[159] == portrait[0]);
    assert(display[67 * 160] == portrait[159 * 68 + 67]);
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
    assert(!kairos44_status_trackpad_refresh_due(99, 100, false));
    assert(kairos44_status_trackpad_refresh_due(100, 100, false));
    assert(kairos44_status_trackpad_refresh_due(99, 100, true));
    assert(!kairos44_status_trackpad_refresh_due(UINT32_MAX - 5, 5, false));
    assert(kairos44_status_trackpad_refresh_due(5, UINT32_MAX - 5, false));
    struct kairos44_status_activity activity = {0};
    assert(kairos44_status_note_trackpad(&activity, 1000, "SCROLL", "NONE"));
    assert(!kairos44_status_note_trackpad(&activity, 1100, "SCROLL", "NONE"));
    assert(kairos44_status_note_trackpad(&activity, 1200, "MOVE", "NONE"));
    assert(kairos44_status_note_trackpad(&activity, 1300, "MOVE", "1"));
    assert(!kairos44_status_note_trackpad(&activity, 3299, "MOVE", "1"));
    assert(kairos44_status_note_trackpad(&activity, 5299, "MOVE", "1"));
    activity = (struct kairos44_status_activity){0};
    kairos44_status_note_trackpad(&activity, 1000, "SCROLL", "NONE");
    assert(kairos44_status_active_view(&activity, 1000) == KAIROS44_VIEW_TRACKPAD);
    kairos44_status_note_action(&activity, 1100, "CAPS", false);
    assert(kairos44_status_active_view(&activity, 1100) == KAIROS44_VIEW_ACTION);
    assert(kairos44_status_active_view(&activity, 3099) == KAIROS44_VIEW_ACTION);
    assert(kairos44_status_active_view(&activity, 4100) == KAIROS44_VIEW_OVERVIEW);
    kairos44_status_note_trackpad(&activity, 3900, "CLICK", "1");
    kairos44_status_note_action(&activity, 4500, "MOD+", true);
    assert(kairos44_status_active_view(&activity, 8000) == KAIROS44_VIEW_ACTION);
    kairos44_status_note_action(&activity, 7000, "MOD-", false);
    kairos44_status_note_trackpad(&activity, 8500, "CLICK", "1");
    assert(kairos44_status_active_view(&activity, 9999) == KAIROS44_VIEW_ACTION);
    assert(kairos44_status_active_view(&activity, 10000) == KAIROS44_VIEW_TRACKPAD);
    state.left_valid = true;
    state.left_level = 42;
    state.right_connected = true;
    state.right_valid = false;
    kairos44_status_format_view(&state, &activity, 10000, &frame);
    assert(strcmp(frame.portrait_lines[2], "L:42%") == 0);
    assert(strcmp(frame.portrait_lines[3], "R:--") == 0);
    assert(strcmp(frame.portrait_lines[5], "TRACKPAD") == 0);
    assert(strcmp(frame.portrait_lines[9], "CLICK") == 0);
    assert(strcmp(frame.portrait_lines[10], "BUTTONS:") == 0);
    assert(strcmp(frame.portrait_lines[11], "1") == 0);
    assert(strcmp(frame.portrait_lines[12], "HOST:") == 0);
    assert(frame.portrait_lines[14][0] == '\0' && frame.portrait_lines[15][0] == '\0');
    check_bounds(&frame);
    struct kairos44_status_frame repeated;
    struct kairos44_status_activity moved = activity;
    assert(!kairos44_status_note_trackpad(&moved, 10050, "CLICK", "1"));
    kairos44_status_format_view(&state, &moved, 10050, &repeated);
    assert(memcmp(&frame, &repeated, sizeof(frame)) == 0);
    kairos44_status_format_view(&state, &activity, 10500, &frame);
    assert(strcmp(frame.portrait_lines[5], "HOST:") == 0);
    assert(strcmp(frame.portrait_lines[1], "BATTERY:") == 0);
    check_bounds(&frame);
    kairos44_status_note_action(&activity, 11000, "NAV", false);
    kairos44_status_format_view(&state, &activity, 11000, &frame);
    assert(strcmp(frame.portrait_lines[5], "ACTION:") == 0);
    assert(strcmp(frame.portrait_lines[13], "NAV") == 0);
    assert(strcmp(frame.portrait_lines[2], "L:42%") == 0);
    assert(strcmp(frame.portrait_lines[3], "R:--") == 0);
    check_bounds(&frame);
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
    puts("PASS: display battery validity, context view arbitration, per-view batteries, connection, output, modifiers, locks, layers, pointer priority and text bounds");
    return 0;
}