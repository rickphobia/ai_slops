extends GutTest
## Player settings: defaults, and a stored value that is missing or makes no sense falls back
## to its default with a problem naming the field, so a bad settings file never stops the game.


func test_nothing_stored_gives_the_defaults_without_problems() -> void:
	var settings := PlayerSettings.from_save({})

	assert_eq(settings.text_scale, PlayerSettings.DEFAULT_TEXT_SCALE)
	assert_false(settings.reduced_motion)
	assert_eq(settings.volume, PlayerSettings.DEFAULT_VOLUME)
	assert_false(settings.muted)
	assert_eq(settings.problems, [] as Array[String], "a missing field is just a default")


func test_stored_settings_come_back_as_saved() -> void:
	var saved := PlayerSettings.new()
	saved.text_scale = 1.5
	saved.reduced_motion = true
	saved.volume = 0.25
	saved.muted = true

	var settings := PlayerSettings.from_save(saved.to_save())

	assert_eq(settings.text_scale, 1.5)
	assert_true(settings.reduced_motion)
	assert_eq(settings.volume, 0.25)
	assert_true(settings.muted)
	assert_eq(settings.problems, [] as Array[String])


func test_a_whole_number_from_json_is_read_as_a_number() -> void:
	var settings := PlayerSettings.from_save({"text_scale": 1, "volume": 0})

	assert_eq(settings.text_scale, 1.0)
	assert_eq(settings.volume, 0.0)
	assert_eq(settings.problems, [] as Array[String])


func test_a_text_size_not_on_offer_falls_back_and_is_named() -> void:
	var settings := PlayerSettings.from_save({"text_scale": 7.0})

	assert_eq(settings.text_scale, PlayerSettings.DEFAULT_TEXT_SCALE)
	assert_eq(settings.problems.size(), 1)
	assert_string_contains(settings.problems[0], "text_scale")


func test_a_volume_out_of_range_falls_back_and_is_named() -> void:
	var settings := PlayerSettings.from_save({"volume": 1.5})

	assert_eq(settings.volume, PlayerSettings.DEFAULT_VOLUME)
	assert_eq(settings.problems.size(), 1)
	assert_string_contains(settings.problems[0], "volume")


func test_a_value_of_the_wrong_type_falls_back_and_is_named() -> void:
	var settings := PlayerSettings.from_save({"reduced_motion": "yes", "muted": 1})

	assert_false(settings.reduced_motion)
	assert_false(settings.muted)
	assert_eq(settings.problems.size(), 2)
	assert_string_contains(settings.problems[0], "reduced_motion")
	assert_string_contains(settings.problems[1], "muted")


func test_something_that_is_not_a_dictionary_gives_the_defaults_with_a_problem() -> void:
	var settings := PlayerSettings.from_save([1, 2])

	assert_eq(settings.text_scale, PlayerSettings.DEFAULT_TEXT_SCALE)
	assert_eq(settings.problems.size(), 1)


func test_muted_or_zero_volume_is_silent() -> void:
	var settings := PlayerSettings.new()
	assert_false(settings.is_silent())
	settings.volume = 0.0
	assert_true(settings.is_silent())
	settings.volume = 0.5
	settings.muted = true
	assert_true(settings.is_silent())
