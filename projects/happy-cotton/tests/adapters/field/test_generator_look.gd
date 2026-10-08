extends GutTest
## The Generator's loudspeaker lamp and tap area, and the fence's gate out to it.

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


func test_a_tap_on_or_beside_the_treadmill_counts_and_one_far_away_does_not() -> void:
	assert_true(_generator.covers(Vector3(-8.0, 0.0, 2.0)))
	assert_true(_generator.covers(Vector3(-9.5, 0.0, 2.5)), "the pump")
	assert_false(_generator.covers(Vector3(-5.0, 0.0, 2.0)))
	assert_false(_generator.covers(Vector3(-8.0, 0.0, 4.0)))


func test_he_runs_on_the_belt_facing_along_it() -> void:
	assert_eq(_generator.run_spot(), Vector3(-7.85, Generator.BELT_TOP, 2.0))
	assert_almost_eq(_generator.run_facing(), PI / 2.0, 0.001)


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
