extends GutTest
## Mouse sensitivity and volume stay inside their ranges and are kept between visits.

const TEST_FILE := "user://test_player_settings.cfg"


func after_each() -> void:
	DirAccess.remove_absolute(TEST_FILE)


func test_a_first_visit_gets_the_defaults() -> void:
	var settings := PlayerSettings.load_file(TEST_FILE)

	assert_eq(settings.sensitivity_scale, PlayerSettings.DEFAULT_SENSITIVITY_SCALE)
	assert_eq(settings.volume, PlayerSettings.DEFAULT_VOLUME)


func test_settings_saved_on_one_visit_come_back_on_the_next() -> void:
	var first_visit := PlayerSettings.new()
	first_visit.set_sensitivity_scale(1.75)
	first_visit.set_volume(0.3)
	assert_eq(first_visit.save_file(TEST_FILE), OK)

	var next_visit := PlayerSettings.load_file(TEST_FILE)

	assert_almost_eq(next_visit.sensitivity_scale, 1.75, 0.0001)
	assert_almost_eq(next_visit.volume, 0.3, 0.0001)


func test_values_outside_the_range_are_held_at_its_edges() -> void:
	var settings := PlayerSettings.new()

	settings.set_sensitivity_scale(100.0)
	settings.set_volume(-1.0)

	assert_eq(settings.sensitivity_scale, PlayerSettings.MAX_SENSITIVITY_SCALE)
	assert_eq(settings.volume, 0.0)


func test_a_hand_edited_file_with_bad_values_is_held_to_the_range() -> void:
	var file := ConfigFile.new()
	file.set_value("player", "sensitivity_scale", -5.0)
	file.set_value("player", "volume", 9.0)
	file.save(TEST_FILE)

	var settings := PlayerSettings.load_file(TEST_FILE)

	assert_eq(settings.sensitivity_scale, PlayerSettings.MIN_SENSITIVITY_SCALE)
	assert_eq(settings.volume, 1.0)
