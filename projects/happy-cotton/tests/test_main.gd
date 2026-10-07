extends GutTest
## Smoke test of the entry scene: it loads, logs the build version and accepts the shipped
## tuning table.

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
