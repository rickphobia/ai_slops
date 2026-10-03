extends GutTest
## The tuning table must stop the game with a message that names the bad field.

const SHIPPED_TABLE := "res://data/tuning.tres"


func _good_table() -> Tuning:
	var tuning := Tuning.new()
	tuning.walk_speed = 2.0
	tuning.mouse_sensitivity = 0.003
	tuning.opening_seconds = 4.0
	return tuning


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
	tuning.walk_speed = 500.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "walk_speed")
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
