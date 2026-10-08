extends GutTest
## The tuning table's tools tier list, checked as the Generator's is: it must not be empty, and
## each tier needs a whole, positive price and a whole Quota rise of at least 1. Its work share
## must be above 0 and never rise from one tier to the next, starting from no Upgrade (1).


func _good_table() -> Tuning:
	return FastTuning.table()


func test_an_empty_tools_tier_list_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers = []

	var expected: Array[String] = ["tools_tiers has no tiers"]
	assert_eq(tuning.problems(), expected)


func test_a_tools_tier_with_a_missing_value_is_reported_by_tier_and_field() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[1].work_share = NAN

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[2].work_share")
	assert_string_contains(problems[0], "missing")


func test_a_tools_tier_price_that_is_not_positive_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[0].price = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[1].price")


func test_a_tools_tier_quota_rise_that_is_not_whole_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[0].quota_rise = 1.5

	var expected: Array[String] = [
		"tools_tiers[1].quota_rise is 1.5, but it must be a whole number"
	]
	assert_eq(tuning.problems(), expected)


func test_a_tools_tier_quota_rise_below_one_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[0].quota_rise = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[1].quota_rise")


func test_a_work_share_that_rises_from_one_tier_to_the_next_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[1].work_share = tuning.tools_tiers[0].work_share + 0.1

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[2].work_share")
	assert_string_contains(problems[0], "at most")


func test_a_first_work_share_above_no_upgrade_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[0].work_share = 1.5

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[1].work_share")


func test_a_work_share_of_zero_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[1].work_share = 0.0

	var problems := tuning.problems()

	assert_eq(problems.size(), 1)
	assert_string_contains(problems[0], "tools_tiers[2].work_share")


func test_a_missing_tools_tier_is_reported() -> void:
	var tuning := _good_table()
	tuning.tools_tiers[0] = null

	var expected: Array[String] = ["tools_tiers[1] is missing"]
	assert_eq(tuning.problems(), expected)
