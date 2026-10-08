extends GutTest
## The tuning table's Generator tier list: it must not be empty, and each tier needs a whole,
## positive price, a whole Quota rise of at least 1, and a growth multiplier that never falls
## from one tier to the next. Problems name the tier, counting from 1 as the store does.


func _good_table() -> Tuning:
	return FastTuning.table()


func test_an_empty_generator_tier_list_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers = []

	var expected: Array[String] = ["generator_tiers has no tiers"]
	assert_eq(tuning.problems(), expected)


func test_a_generator_tier_with_a_missing_value_is_reported_by_tier_and_field() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[1].growth_multiplier = NAN

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "generator_tiers[2].growth_multiplier")
	assert_string_contains(problems[0], "missing")


func test_a_generator_tier_price_that_is_not_positive_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0].price = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "generator_tiers[1].price")


func test_a_generator_tier_price_that_is_not_whole_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0].price = 10.5

	var expected: Array[String] = [
		"generator_tiers[1].price is 10.5, but it must be a whole number"
	]
	assert_eq(tuning.problems(), expected)


func test_a_generator_tier_quota_rise_below_one_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0].quota_rise = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "generator_tiers[1].quota_rise")


func test_a_generator_tier_quota_rise_that_is_not_whole_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0].quota_rise = 1.5

	var expected: Array[String] = [
		"generator_tiers[1].quota_rise is 1.5, but it must be a whole number"
	]
	assert_eq(tuning.problems(), expected)


func test_a_growth_multiplier_that_falls_from_one_tier_to_the_next_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[1].growth_multiplier = tuning.generator_tiers[0].growth_multiplier - 0.5

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "generator_tiers[2].growth_multiplier")
	assert_string_contains(problems[0], "at least")


func test_a_first_growth_multiplier_below_no_upgrade_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0].growth_multiplier = 0.5

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "generator_tiers[1].growth_multiplier")


func test_a_missing_generator_tier_is_reported() -> void:
	var tuning := _good_table()
	tuning.generator_tiers[0] = null

	var expected: Array[String] = ["generator_tiers[1] is missing"]
	assert_eq(tuning.problems(), expected)
