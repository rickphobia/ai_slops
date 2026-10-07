extends GutTest
## Smoke test of the entry scene: it loads, logs the build version and accepts the shipped
## tuning table, and that a tap on the field reaches the Farm rules.

const MAIN_SCENE := preload("res://src/main.tscn")

var _lines: Array[String] = []


func before_each() -> void:
	_lines = []
	GameLog.reset()
	GameLog.sink = func(_level: GameLog.Level, line: String) -> void: _lines.append(line)


func after_each() -> void:
	GameLog.reset()


func test_the_entry_scene_logs_the_build_version_on_start() -> void:
	add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)

	assert_has(_lines, '[info] game started version="%s"' % BuildVersion.read())


func test_the_entry_scene_starts_with_the_shipped_tuning_table() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)

	var tuning: Tuning = main.call("tuning")
	assert_not_null(tuning)
	assert_false(_lines.any(func(line: String) -> bool: return line.begins_with("[error]")))


func test_tapping_an_empty_plot_plants_it_and_logs_at_debug_level() -> void:
	GameLog.minimum_level = GameLog.Level.DEBUG
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var field: Field = main.get_node("Field")

	field.plot_tapped.emit(2)

	assert_has(_lines, "[debug] plant plot=2")


func test_tapping_a_growing_plot_is_refused_by_the_rules_as_not_ripe() -> void:
	GameLog.minimum_level = GameLog.Level.DEBUG
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var field: Field = main.get_node("Field")
	field.plot_tapped.emit(0)
	_lines.clear()

	field.plot_tapped.emit(0)

	assert_eq(_lines, ['[debug] pick refused plot=0 reason=&"not_ripe"'] as Array[String])


func test_the_mascot_announces_the_first_shift_on_start() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var app: AppOverlay = main.get_node("AppOverlay")

	assert_string_contains(app.speech(), "Shift 1 begins!")


func test_the_end_of_a_shift_logs_the_quota_check_at_info_level() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var tuning: Tuning = main.call("tuning")

	main.call("_process", tuning.shift_seconds)

	var quota := roundi(tuning.first_quota)
	assert_has(_lines, "[info] quota checked shift=1 picked=0 quota=%d met=false" % quota)


func test_the_mascot_says_the_quota_result_and_the_next_shift_together() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var tuning: Tuning = main.call("tuning")
	var app: AppOverlay = main.get_node("AppOverlay")

	main.call("_process", tuning.shift_seconds)

	assert_string_contains(app.speech(), "The Quota was not met")
	assert_string_contains(app.speech(), "Shift 2 begins!")
