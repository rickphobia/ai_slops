extends GutTest
## The debug overlay is off unless the owner asks for it in the URL or on the command line.


func test_it_is_off_by_default() -> void:
	assert_false(DebugOverlay.is_requested("", PackedStringArray()))


func test_debug_1_in_the_url_turns_it_on() -> void:
	assert_true(DebugOverlay.is_requested("?debug=1", PackedStringArray()))
	assert_true(DebugOverlay.is_requested("?x=2&debug=1", PackedStringArray()))


func test_other_values_in_the_url_leave_it_off() -> void:
	assert_false(DebugOverlay.is_requested("?debug=0", PackedStringArray()))
	assert_false(DebugOverlay.is_requested("?debug=10", PackedStringArray()))


func test_the_command_line_flag_turns_it_on() -> void:
	assert_true(DebugOverlay.is_requested("", PackedStringArray(["--debug"])))


func test_it_shows_humanity_and_urge() -> void:
	var night := Night.new(PiggyPose.new(Vector3.ZERO, 0.0, 0.0), NightTestTuning.table())
	night.advance(2.0, false, false, Vector3.ZERO)
	var overlay: DebugOverlay = add_child_autofree(DebugOverlay.new())
	overlay.setup(night)

	await wait_process_frames(1)

	assert_string_contains(overlay.text, "humanity 100")
	assert_string_contains(overlay.text, "urge 20")
