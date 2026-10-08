extends GutTest
## Smoke test of the entry scene: it loads, logs the build version and accepts the shipped
## tuning table, that a tap on the field reaches the Farm rules, and that offline time and
## Skip time are logged.

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


func test_a_missed_quota_logs_the_study_session_and_shows_the_room() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var tuning: Tuning = main.call("tuning")
	var app: AppOverlay = main.get_node("AppOverlay")

	main.call("_process", tuning.shift_seconds)

	var seconds := tuning.study_session_seconds
	var started := (
		"[info] study session started seconds=%s minutes=%d in_a_row=1"
		% [var_to_str(seconds), ceili(seconds / 60.0)]
	)
	assert_has(_lines, started)
	assert_true(app.in_study_room())

	main.call("_process", seconds)

	assert_has(_lines, "[info] study session ended in_a_row=1")
	assert_false(app.in_study_room())


func test_tapping_the_generator_sends_the_worker_and_lights_the_lamp() -> void:
	GameLog.minimum_level = GameLog.Level.DEBUG
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var field: Field = main.get_node("Field")
	var generator: Generator = field.get_node("Generator")

	field.generator_tapped.emit()

	assert_has(_lines, "[debug] run generator")
	assert_has(_lines, '[debug] worker activity="running"')
	assert_true(generator.is_lit())

	field.plot_tapped.emit(0)

	assert_has(_lines, '[debug] worker activity="in_field"')
	assert_false(generator.is_lit())


func test_there_is_no_skip_time_control_without_debug_mode() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)

	assert_eq(main.find_children("*", "SkipTimePanel", true, false).size(), 0)


func test_skip_time_runs_the_offline_resume_logs_it_and_shows_the_away_summary() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var app: AppOverlay = main.get_node("AppOverlay")

	main.call("_on_skip_requested", 3600.0)

	assert_has(_lines, "[info] skip time seconds=3600.0")
	assert_has(_lines, "[info] offline resume seconds=3600.0 ripened=0 study_seconds_served=0.0")
	assert_string_contains(app.speech(), "Welcome back!")


func test_offline_time_past_the_cap_is_logged_as_a_warning() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)
	var tuning: Tuning = main.call("tuning")
	var too_long := tuning.offline_cap_seconds * 2.0

	main.call("_resume_offline", too_long)

	var warning := (
		'[warning] offline time adjusted problem=&"offline_time_capped" seconds_away=%s'
		+ " seconds_counted=%s"
	)
	assert_has(_lines, warning % [var_to_str(too_long), var_to_str(tuning.offline_cap_seconds)])


func test_negative_offline_time_is_logged_as_a_warning() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(1)

	main.call("_resume_offline", -60.0)

	assert_has(
		_lines,
		(
			'[warning] offline time adjusted problem=&"negative_offline_time"'
			+ " seconds_away=-60.0 seconds_counted=0.0"
		)
	)
