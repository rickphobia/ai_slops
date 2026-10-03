extends GutTest
## Every log line says which step of the night and which space it came from.

var _lines: Array[String] = []


func before_each() -> void:
	_lines = []
	GameLog.reset()
	GameLog.sink = func(_level: GameLog.Level, line: String) -> void: _lines.append(line)


func after_each() -> void:
	GameLog.reset()


func test_a_line_carries_the_level_the_step_and_the_space() -> void:
	GameLog.step = 42
	GameLog.space = "kitchen"

	GameLog.info("Mum heard a snort")

	assert_eq(_lines, ["[info] step=42 space=kitchen Mum heard a snort"] as Array[String])


func test_lines_below_the_minimum_level_are_dropped() -> void:
	GameLog.minimum_level = GameLog.Level.WARNING

	GameLog.debug("detail")
	GameLog.info("normal")
	GameLog.warning("odd")
	GameLog.error("failed")

	assert_eq(_lines.size(), 2)
	assert_string_contains(_lines[0], "[warning]")
	assert_string_contains(_lines[1], "[error]")


func test_debug_lines_show_when_the_minimum_level_is_debug() -> void:
	GameLog.minimum_level = GameLog.Level.DEBUG

	GameLog.debug("detail")

	assert_string_contains(_lines[0], "[debug]")


func test_a_new_game_log_starts_at_step_zero_in_no_space() -> void:
	assert_eq(GameLog.step, 0)
	assert_eq(GameLog.space, "none")
