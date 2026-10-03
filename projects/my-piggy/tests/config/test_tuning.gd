extends GutTest
## The tuning table must stop the game with a message that names the bad field.

const SHIPPED_TABLE := "res://data/tuning.tres"


func _good_table() -> Tuning:
	return NightTestTuning.table()


func test_a_complete_table_has_no_problems() -> void:
	assert_eq(_good_table().problems(), [] as Array[String])


func test_a_missing_value_is_reported_by_field_name() -> void:
	var tuning := _good_table()
	tuning.mouse_sensitivity = NAN

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "mouse_sensitivity")
	assert_string_contains(problems[0], "missing")


func test_a_value_that_is_too_high_is_reported_by_field_name() -> void:
	var tuning := _good_table()
	tuning.opening_seconds = 500.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "opening_seconds")
	assert_string_contains(problems[0], "500")


func test_a_value_that_is_too_low_is_reported_by_field_name() -> void:
	var tuning := _good_table()
	tuning.mouse_sensitivity = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "mouse_sensitivity")


func test_every_bad_field_is_reported_at_once() -> void:
	assert_eq(Tuning.new().problems().size(), Tuning.LIMITS.size())


func test_a_file_that_does_not_exist_loads_as_nothing() -> void:
	assert_null(Tuning.load_file("res://data/does_not_exist.tres"))


func test_the_shipped_table_loads_and_has_no_problems() -> void:
	var tuning := Tuning.load_file(SHIPPED_TABLE)

	assert_not_null(tuning)
	assert_eq(tuning.problems(), [] as Array[String])


func test_a_door_creak_whose_loudest_is_below_its_quietest_is_reported() -> void:
	var tuning := _good_table()
	tuning.door_creak_loudest_radius = 1.5

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "door_creak_loudest_radius")


func test_speeds_out_of_order_are_reported() -> void:
	var tuning := _good_table()
	tuning.creep_speed = tuning.walk_speed + 0.5

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "creep_speed")


func test_an_urge_after_outburst_at_or_above_the_warning_is_reported() -> void:
	var tuning := _good_table()
	tuning.urge_after_outburst = tuning.urge_warning

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "urge_after_outburst")


func test_the_grotesque_threshold_must_not_be_above_the_soured_one() -> void:
	var tuning := _good_table()
	tuning.rot_grotesque_below_humanity = 80.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "rot_grotesque_below_humanity")
