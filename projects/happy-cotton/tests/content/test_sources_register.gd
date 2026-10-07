extends GutTest
## The sources register: complete entries, unique ids, and the problems it reports.


func test_every_shipped_entry_has_all_its_fields_and_a_unique_id() -> void:
	assert_eq(SourcesRegister.problems(SourcesRegister.entries()), [] as Array[String])


func test_the_register_holds_the_six_starting_sources_from_the_spec() -> void:
	var ids: Array[String] = []
	for source in SourcesRegister.entries():
		ids.append(source.id)

	var expected: Array[String] = [
		"aspi-2020", "zenz-2020", "shu-2021", "ohchr-2022", "xpf-2022", "zenz-2019"
	]
	assert_eq(ids, expected)


func test_a_missing_field_is_reported_by_name() -> void:
	var source := Source.new("x", "A title", "", "2020", "https://example.org", "Nothing")

	assert_eq(source.problems(), ["source x has no author"] as Array[String])


func test_a_link_that_is_not_https_is_reported() -> void:
	var source := Source.new("x", "A title", "Someone", "2020", "http://example.org", "Nothing")

	var expected: Array[String] = ["source x link is not https: http://example.org"]
	assert_eq(source.problems(), expected)


func test_a_repeated_id_is_reported() -> void:
	var sources: Array[Source] = [
		Source.new("x", "One", "Someone", "2020", "https://example.org/1", "Nothing"),
		Source.new("x", "Two", "Someone", "2021", "https://example.org/2", "Nothing"),
	]

	var expected: Array[String] = ["source id x is used more than once"]
	assert_eq(SourcesRegister.problems(sources), expected)
