extends Node
## Entry scene: loads and checks the tuning, starts the night, wires the rules to the
## adapters. Kept thin: no game rules live here.

const TUNING_PATH := "res://data/tuning.tres"
const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")

var _night: Night


func _ready() -> void:
	var tuning := Tuning.load_file(TUNING_PATH)
	if tuning == null:
		_stop_with(["Could not load the tuning table at %s" % TUNING_PATH])
		return
	var problems := tuning.problems()
	if not problems.is_empty():
		_stop_with(problems)
		return

	_night = Night.new()
	_update_log_context()
	GameLog.info("Night started")

	var piggy: PiggyController = PIGGY_SCENE.instantiate()
	piggy.setup(tuning)
	var room: Node3D = $GreyBoxRoom
	var spawn: Marker3D = room.get_node("SpawnPoint")
	add_child(piggy)
	piggy.global_position = spawn.global_position


func _physics_process(_delta: float) -> void:
	if _night == null:
		return
	_night.advance()
	_update_log_context()


func _update_log_context() -> void:
	GameLog.step = _night.step
	GameLog.space = String(_night.space)


## A bad tuning table must not start a half-working game: say what is wrong and stop.
func _stop_with(problems: Array[String]) -> void:
	for problem in problems:
		GameLog.error("Cannot start: %s" % problem)
	var label := Label.new()
	label.text = "Cannot start My Piggy:\n" + "\n".join(problems)
	var layer := CanvasLayer.new()
	layer.add_child(label)
	add_child(layer)
	if DisplayServer.get_name() == "headless":
		get_tree().quit(1)
