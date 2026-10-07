extends GutTest
## Every log line carries its level, the event and its fields as key=value.

var _lines: Array[String] = []


func before_each() -> void:
	_lines = []
	GameLog.reset()
	GameLog.sink = func(_level: GameLog.Level, line: String) -> void: _lines.append(line)


func after_each() -> void:
	GameLog.reset()


func test_a_line_carries_the_level_the_event_and_the_fields_in_order() -> void:
	GameLog.info("quota checked", {"shift": 3, "picked": 12, "met": true})

	assert_eq(_lines, ["[info] quota checked shift=3 picked=12 met=true"] as Array[String])


func test_text_fields_are_quoted_so_spaces_stay_inside_the_field() -> void:
	GameLog.warning("odd clock", {"note": "went back 5 s"})

	assert_eq(_lines, ['[warning] odd clock note="went back 5 s"'] as Array[String])


func test_a_line_without_fields_is_just_the_level_and_the_event() -> void:
	GameLog.error("save failed")

	assert_eq(_lines, ["[error] save failed"] as Array[String])


func test_lines_below_the_minimum_level_are_dropped() -> void:
	GameLog.minimum_level = GameLog.Level.WARNING

	GameLog.debug("detail")
	GameLog.info("normal")
	GameLog.warning("odd")
	GameLog.error("failed")

	assert_eq(_lines, ["[warning] odd", "[error] failed"] as Array[String])


func test_debug_lines_show_when_the_minimum_level_is_debug() -> void:
	GameLog.minimum_level = GameLog.Level.DEBUG

	GameLog.debug("detail")

	assert_eq(_lines, ["[debug] detail"] as Array[String])
