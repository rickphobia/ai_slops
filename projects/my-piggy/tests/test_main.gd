extends GutTest
## Smoke test of the entry scene's wiring: title screen first, the click starts the opening,
## and the Piggy has no control until the eyes open.

const MAIN_SCENE := preload("res://src/main.tscn")

var _lines: Array[String] = []


func before_each() -> void:
	_lines = []
	GameLog.reset()
	GameLog.sink = func(_level: GameLog.Level, line: String) -> void: _lines.append(line)


func after_each() -> void:
	GameLog.reset()
	get_tree().paused = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _find_one(root: Node, type_name: String) -> Node:
	var found := root.find_children("*", type_name, true, false)
	return found[0] if found.size() == 1 else null


func test_the_game_opens_on_the_title_screen_with_the_piggy_still() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)

	assert_not_null(_find_one(main, "TitleScreen"))
	var piggy := _find_one(main, "PiggyController")
	assert_eq(piggy.process_mode, Node.PROCESS_MODE_DISABLED)


func test_clicking_the_title_screen_starts_the_opening() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)
	var title: TitleScreen = _find_one(main, "TitleScreen")

	title.start_clicked.emit()
	await wait_process_frames(2)

	assert_null(_find_one(main, "TitleScreen"), "title screen is gone")
	assert_true(_lines.any(func(line: String) -> bool: return line.ends_with("Opening started")))
