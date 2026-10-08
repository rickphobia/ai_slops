extends GutTest
## The field's sounds: footsteps, the power tiles' tick, the Generator's whine, the Overseer's
## whistle and whip, all on one bus, and silent until the player's first tap.

var _sounds: FieldSounds


func before_each() -> void:
	_sounds = FieldSounds.new()
	add_child_autofree(_sounds)


func _tap() -> void:
	var touch := InputEventScreenTouch.new()
	touch.pressed = true
	_sounds._input(touch)


func test_every_sound_goes_through_the_field_bus() -> void:
	assert_ne(AudioServer.get_bus_index(FieldSounds.BUS), -1, "the bus is in the layout")
	var players := _sounds.find_children("*", "AudioStreamPlayer", true, false)
	assert_eq(players.size(), 5)
	for player: AudioStreamPlayer in players:
		assert_eq(player.bus, FieldSounds.BUS, player.name)


func test_the_tile_tick_is_quieter_than_the_footsteps() -> void:
	assert_lt(FieldSounds.TILE_TICK_DB, FieldSounds.FOOTSTEP_DB)


func test_nothing_plays_before_the_first_tap() -> void:
	_sounds.whistle()
	_sounds.whip_crack()
	_sounds.footstep()
	_sounds.tile_tick()
	_sounds.set_generator_speed(FieldSounds.FULL_WHINE_SPEED)
	_sounds.update_whine(1.0)

	assert_eq(_sounds.sounds_played(), 0)
	assert_false(_sounds.is_whining())


func test_after_the_first_tap_the_sounds_play() -> void:
	_tap()

	_sounds.whistle()
	_sounds.whip_crack()
	_sounds.footstep()
	_sounds.tile_tick()

	assert_eq(_sounds.sounds_played(), 4)


func test_a_drag_or_a_release_does_not_count_as_the_first_tap() -> void:
	var release := InputEventScreenTouch.new()
	release.pressed = false
	_sounds._input(release)
	_sounds._input(InputEventMouseMotion.new())

	_sounds.whistle()

	assert_eq(_sounds.sounds_played(), 0)


func test_the_whine_rises_with_his_speed() -> void:
	_tap()
	_sounds.set_generator_speed(FieldSounds.FULL_WHINE_SPEED / 2.0)
	_sounds.update_whine(5.0)
	var half := _sounds.whine_level()
	_sounds.set_generator_speed(FieldSounds.FULL_WHINE_SPEED * 2.0)
	_sounds.update_whine(5.0)

	assert_almost_eq(half, 0.5, 0.01)
	assert_almost_eq(_sounds.whine_level(), 1.0, 0.01)
	assert_true(_sounds.is_whining())


func test_the_whine_winds_down_when_he_stops_rather_than_cutting_out() -> void:
	_tap()
	_sounds.set_generator_speed(FieldSounds.FULL_WHINE_SPEED)
	_sounds.update_whine(5.0)

	_sounds.set_generator_speed(0.0)
	_sounds.update_whine(0.1)
	assert_gt(_sounds.whine_level(), 0.0, "still winding down")
	assert_true(_sounds.is_whining())
	_sounds.update_whine(10.0)

	assert_eq(_sounds.whine_level(), 0.0)
	assert_false(_sounds.is_whining())


func test_the_whine_loops_without_a_click() -> void:
	var whine := FieldSounds.build_whine()

	assert_eq(whine.loop_mode, AudioStreamWAV.LOOP_FORWARD)
	assert_eq(whine.loop_end, whine.data.size() / 2)
	var largest_step := 0
	for byte in range(2, whine.data.size(), 2):
		var step := absi(whine.data.decode_s16(byte) - whine.data.decode_s16(byte - 2))
		largest_step = maxi(largest_step, step)
	var seam := absi(whine.data.decode_s16(0) - whine.data.decode_s16(whine.data.size() - 2))
	assert_lte(seam, largest_step, "the jump from the end back to the start")
