extends GutTest
## Smoke test of the entry scene's wiring: title screen first, the click starts the opening,
## and the Piggy has no control until the eyes open. Then the house is wired to the Night:
## spaces take checkpoints, the back door ends the night, and getting caught by Mum plays
## the capture scene and restarts the space.

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


func _logged(ending: String) -> bool:
	return _lines.any(func(line: String) -> bool: return line.ends_with(ending))


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
	assert_true(_logged("Opening started"))


func test_spaces_take_checkpoints_and_the_back_door_ends_the_night() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)
	var title: TitleScreen = _find_one(main, "TitleScreen")
	title.start_clicked.emit()
	await wait_until(func() -> bool: return _logged("control given"), 30.0)
	var piggy: PiggyController = _find_one(main, "PiggyController")

	piggy.place(PiggyPose.new(Vector3(0.0, 0.05, -8.0), 1.0, 0.0))
	await wait_physics_frames(3)
	assert_true(_logged("Entered hallway: checkpoint taken"))

	var house: House = _find_one(main, "House")
	piggy.place(PiggyPose.new(house.back_door_exit(), 0.0, 0.0))
	await wait_physics_frames(3)
	assert_true(_logged("Reached the back door: night over"))
	assert_not_null(_find_one(main, "EndCard"))
	assert_eq(piggy.process_mode, Node.PROCESS_MODE_DISABLED)


func test_pressing_give_in_at_the_bedroom_bowl_starts_giving_in() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)
	var title: TitleScreen = _find_one(main, "TitleScreen")
	title.start_clicked.emit()
	await wait_until(func() -> bool: return _logged("control given"), 30.0)
	var piggy: PiggyController = _find_one(main, "PiggyController")
	var house: House = _find_one(main, "House")
	var bowl: Marker3D = house.get_node("Markers/GiveInSpots/BedroomBowl")

	piggy.place(PiggyPose.new(bowl.global_position + Vector3(0.5, 0.05, 0.0), 0.0, 0.0))
	await wait_physics_frames(2)
	var give_in := InputEventAction.new()
	give_in.action = "give_in"
	give_in.pressed = true
	Input.parse_input_event(give_in)
	await wait_physics_frames(2)

	assert_true(_logged("Giving in at BedroomBowl"))
	assert_lt(piggy.pose().pitch, -1.0, "head pressed into the bowl")


func test_walking_into_mums_torch_gets_the_piggy_caught_and_restarts_the_space() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)
	var title: TitleScreen = _find_one(main, "TitleScreen")
	title.start_clicked.emit()
	await wait_until(func() -> bool: return _logged("control given"), 30.0)
	var piggy: PiggyController = _find_one(main, "PiggyController")
	var mum: Mum = _find_one(main, "Mum")
	piggy.place(PiggyPose.new(Vector3(0.0, 0.05, -8.0), 1.0, 0.0))
	await wait_physics_frames(3)
	assert_true(_logged("Entered hallway: checkpoint taken"))
	var mum_at_checkpoint := mum.global_position

	# Let her walk on, then step right into her beam.
	await wait_seconds(0.5)
	var ahead := -mum.global_basis.z
	piggy.place(PiggyPose.new(mum.global_position + ahead * 0.8 + Vector3.UP * 0.05, 0.0, 0.0))
	await wait_until(func() -> bool: return _logged("Caught by Mum"), 1.0)
	assert_true(_logged("Caught by Mum"))
	assert_not_null(_find_one(main, "CaptureScene"))

	await wait_until(func() -> bool: return _logged("back to the start of hallway"), 3.0)
	assert_true(_logged("Checkpoint restored: back to the start of hallway"), "under 3 s")
	await wait_physics_frames(2)
	assert_null(_find_one(main, "CaptureScene"))
	assert_almost_eq(piggy.global_position.z, -8.0, 0.05)
	assert_eq(piggy.process_mode, Node.PROCESS_MODE_PAUSABLE, "the Piggy can move again")
	assert_lt(mum.global_position.distance_to(mum_at_checkpoint), 0.5, "Mum is back too")
	var errors := _lines.filter(func(line: String) -> bool: return line.begins_with("[error]"))
	assert_eq(errors, [], "no errors logged")


func test_the_restore_checkpoint_key_does_nothing_without_debug() -> void:
	var main: Node = add_child_autofree(MAIN_SCENE.instantiate())
	await wait_process_frames(2)
	var title: TitleScreen = _find_one(main, "TitleScreen")
	title.start_clicked.emit()
	await wait_until(func() -> bool: return _logged("control given"), 30.0)

	var restore := InputEventAction.new()
	restore.action = "debug_restore_checkpoint"
	restore.pressed = true
	Input.parse_input_event(restore)
	await wait_physics_frames(2)

	assert_false(_logged("Checkpoint restored: back to the start of bedroom"))
