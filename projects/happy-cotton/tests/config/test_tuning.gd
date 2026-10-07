extends GutTest
## The tuning table must stop the game with a message that names the bad field.

const SHIPPED_TABLE := "res://data/tuning.tres"


func _good_table() -> Tuning:
	return FastTuning.table()


func test_a_complete_table_has_no_problems() -> void:
	assert_eq(_good_table().problems(), [] as Array[String])


func test_a_missing_value_is_reported_by_field_name() -> void:
	var tuning := _good_table()
	tuning.grow_seconds = NAN

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "grow_seconds")
	assert_string_contains(problems[0], "missing")


func test_a_value_that_is_too_high_is_reported_with_the_value() -> void:
	var tuning := _good_table()
	tuning.grow_seconds = 999999.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "grow_seconds")
	assert_string_contains(problems[0], "999999")


func test_a_value_that_is_too_low_is_reported_by_field_name() -> void:
	var tuning := _good_table()
	tuning.grow_seconds = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "grow_seconds")


func test_a_count_that_is_not_a_whole_number_is_reported() -> void:
	var tuning := _good_table()
	tuning.first_quota = 2.5

	var expected: Array[String] = ["first_quota is 2.5, but it must be a whole number"]
	assert_eq(tuning.problems(), expected)


func test_a_quota_that_does_not_rise_is_reported() -> void:
	var tuning := _good_table()
	tuning.quota_rise = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "quota_rise")


func test_a_study_session_cap_below_the_first_length_is_reported() -> void:
	var tuning := _good_table()
	tuning.study_session_cap_seconds = tuning.study_session_seconds - 1.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "study_session_cap_seconds")


func test_every_missing_field_is_reported_at_once() -> void:
	assert_eq(Tuning.new().problems().size(), Tuning.LIMITS.size())


func test_a_file_that_does_not_exist_loads_as_nothing() -> void:
	assert_null(Tuning.load_file("res://data/does_not_exist.tres"))


func test_the_shipped_table_loads_and_has_no_problems() -> void:
	var tuning := Tuning.load_file(SHIPPED_TABLE)

	assert_not_null(tuning)
	assert_eq(tuning.problems(), [] as Array[String])
