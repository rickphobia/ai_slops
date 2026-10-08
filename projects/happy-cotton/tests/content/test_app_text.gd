extends GutTest
## The App text: every key the rules emit has words, every source it cites is in the
## register, and every doublespeak term is tied to its source (spec ground rule 1).

const SAMPLE_VALUES := {
	"shift": 2,
	"picked": 7,
	"quota": 9,
	"minutes": 5,
	"in_a_row": 2,
	"ripened": 3,
	"withered": 2,
	"plots": 2,
	"points": 10,
	"study_minutes": 4,
	"exhaustion_recovered": 6,
	"price": 20,
}


func _register_ids() -> Array[String]:
	var ids: Array[String] = []
	for source in SourcesRegister.entries():
		ids.append(source.id)
	return ids


func test_the_shipped_text_covers_every_key_and_cites_only_registered_sources() -> void:
	var problems := AppText.problems(
		Farm.MESSAGE_KEYS, AppText.lines(), AppText.DOUBLESPEAK, _register_ids()
	)

	assert_eq(problems, [] as Array[String])


func test_every_line_fills_all_its_slots_from_the_rules_values() -> void:
	for key in Farm.MESSAGE_KEYS:
		var text := AppText.render(AppMessage.new(key, SAMPLE_VALUES))

		assert_false(text.is_empty(), "%s has text" % key)
		assert_false(text.contains("{"), "%s has no unfilled slot: %s" % [key, text])


func test_every_rest_hour_refusal_has_text_citing_only_registered_sources() -> void:
	var problems := AppText.problems(
		Farm.REST_HOUR_REFUSALS, AppText.rest_hour_refusals(), AppText.DOUBLESPEAK, _register_ids()
	)

	assert_eq(problems, [] as Array[String])


func test_a_refusal_fills_in_the_price_and_points() -> void:
	var text := AppText.render_rest_hour_refusal(
		Farm.NOT_ENOUGH_LABOUR_POINTS, {"price": 20, "points": 7}
	)

	assert_string_contains(text, "20 Labour Points")
	assert_string_contains(text, "You have 7")


func test_render_fills_in_the_values() -> void:
	var text := AppText.render(AppMessage.new(Farm.QUOTA_MISSED, SAMPLE_VALUES))

	assert_string_contains(text, "7 of 9")


func test_a_key_with_no_text_renders_as_nothing() -> void:
	assert_eq(AppText.render(AppMessage.new(&"no_such_key")), "")


func test_a_key_with_no_text_is_reported() -> void:
	var keys: Array[StringName] = [&"missing"]
	var no_lines: Dictionary[StringName, AppLine] = {}
	var no_terms: Dictionary[String, String] = {}

	var problems := AppText.problems(keys, no_lines, no_terms, [])

	assert_eq(problems, ["message key missing has no text"] as Array[String])


func test_a_line_citing_an_unknown_source_is_reported() -> void:
	var cited: Array[String] = ["nowhere"]
	var app_lines: Dictionary[StringName, AppLine] = {&"hello": AppLine.new("Hello", cited)}
	var no_terms: Dictionary[String, String] = {}

	var problems := AppText.problems([], app_lines, no_terms, ["aspi-2020"])

	assert_eq(problems, ["line hello cites unknown source nowhere"] as Array[String])


func test_a_term_tied_to_an_unknown_source_is_reported() -> void:
	var no_lines: Dictionary[StringName, AppLine] = {}
	var terms: Dictionary[String, String] = {"Harmony": "nowhere"}

	var problems := AppText.problems([], no_lines, terms, ["aspi-2020"])

	assert_eq(problems, ["term Harmony cites unknown source nowhere"] as Array[String])


func test_a_line_using_a_term_without_citing_its_source_is_reported() -> void:
	var app_lines: Dictionary[StringName, AppLine] = {&"tip": AppLine.new("Enjoy harmony!")}
	var terms: Dictionary[String, String] = {"Harmony": "aspi-2020"}

	var problems := AppText.problems([], app_lines, terms, ["aspi-2020"])

	var expected: Array[String] = ["line tip uses Harmony but doesn't cite aspi-2020"]
	assert_eq(problems, expected)
