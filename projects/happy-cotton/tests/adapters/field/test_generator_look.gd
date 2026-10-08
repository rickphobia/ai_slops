extends GutTest
## The Generator's loudspeaker lamp, cables and tap area, and the fence's gate out to it.

var _generator: Generator


func before_each() -> void:
	_generator = Generator.new()
	_generator.position = Vector3(-8.0, 0.0, 2.0)
	add_child_autofree(_generator)


func test_the_lamp_is_dark_until_he_runs() -> void:
	assert_false(_generator.is_lit())
	assert_false((_generator.get_node("LampLight") as OmniLight3D).visible)


func test_the_lamp_glows_while_lit_and_dims_again() -> void:
	_generator.set_lit(true)
	assert_true((_generator.get_node("LampLight") as OmniLight3D).visible)

	_generator.set_lit(false)
	assert_false(_generator.is_lit())
	assert_false((_generator.get_node("LampLight") as OmniLight3D).visible)


func test_a_tap_on_the_lap_line_or_the_machine_counts_and_one_far_away_does_not() -> void:
	assert_true(_generator.covers(Vector3(-8.0, 0.0, 2.0)), "the lap line")
	assert_true(_generator.covers(Vector3(-8.0 + Generator.PUMP_SPOT.x, 0.0, 2.9)), "the pump")
	assert_false(_generator.covers(Vector3(-5.0, 0.0, 2.0)), "inside the fence")
	assert_false(_generator.covers(Vector3(-8.0, 0.0, 5.0)), "further along the track")


func test_cables_run_from_under_the_track_to_the_machine_and_nothing_crosses_it() -> void:
	var cables := _generator.find_children("Cable*", "MeshInstance3D", false, false)

	assert_eq(cables.size(), Generator.CABLE_ALONG.size())
	for part in _generator.get_children():
		var shape := part as Node3D
		var over_the_track := absf(shape.position.x) < Generator.TRACK_EDGE_X
		assert_false(
			over_the_track and shape.position.y > 0.05, "%s stands on the track" % part.name
		)


func test_while_lit_each_step_pulses_the_lamp_faintly_and_it_settles() -> void:
	var light: OmniLight3D = _generator.get_node("LampLight")
	_generator.set_lit(true)

	_generator.pulse()
	var pulsed := light.light_energy
	_generator._process(1.0)

	assert_gt(pulsed, Generator.LAMP_LIGHT_ENERGY)
	assert_lte(pulsed, Generator.LAMP_LIGHT_ENERGY * 1.5, "faint")
	assert_almost_eq(light.light_energy, Generator.LAMP_LIGHT_ENERGY, 0.001)


func test_a_dark_lamp_does_not_pulse() -> void:
	_generator.pulse()

	assert_false((_generator.get_node("LampLight") as OmniLight3D).visible)
	assert_false(_generator.is_pulsing())


func test_with_the_pulse_skipped_the_lamp_stays_steady() -> void:
	_generator.skip_pulse = true
	_generator.set_lit(true)

	_generator.pulse()

	assert_false(_generator.is_pulsing())
	var light: OmniLight3D = _generator.get_node("LampLight")
	assert_almost_eq(light.light_energy, Generator.LAMP_LIGHT_ENERGY, 0.001)


func test_the_fence_leaves_a_gate_on_the_left_side_only() -> void:
	var half_size := Vector2(6.0, 5.0)
	var fence := FenceLook.build(half_size, 2.0)
	autofree(fence)
	var gate_sections := 0
	var left_sections := 0
	for child in fence.get_children():
		var section := child as Node3D
		if not is_equal_approx(section.rotation.y, PI / 2.0):
			continue
		var on_left := section.position.x < 0.0
		left_sections += 1 if on_left else 0
		if on_left and absf(section.position.z - 2.0) < 1.0:
			gate_sections += 1
	assert_eq(gate_sections, 0)
	assert_eq(left_sections, 4, "one of the left side's 5 sections is the gate")
