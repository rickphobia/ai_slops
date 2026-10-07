extends Node
## Entry scene: logs which build is running, loads and checks the tuning table, creates the
## Farm rules and wires them to the field. Kept thin: no game rules here.

const TUNING_PATH := "res://data/tuning.tres"

var _tuning: Tuning
var _farm: Farm

@onready var _field: Field = $Field


func _ready() -> void:
	GameLog.info("game started", {"version": BuildVersion.read()})
	var tuning := Tuning.load_file(TUNING_PATH)
	if tuning == null:
		_stop_with(["Could not load the tuning table at %s" % TUNING_PATH])
		return
	var problems := tuning.problems()
	if not problems.is_empty():
		_stop_with(problems)
		return
	_tuning = tuning
	GameLog.info("tuning loaded", {"path": TUNING_PATH})
	_farm = Farm.new(_tuning, _field.plot_count())
	_field.plot_tapped.connect(_on_plot_tapped)
	_field.show_plots(_farm.plots())


## The tuning table that passed the startup check, or null if the game stopped.
func tuning() -> Tuning:
	return _tuning


## Crops grow in real time while the game runs. A hidden browser tab stops frames, so it
## doesn't count as online play.
func _process(delta: float) -> void:
	if _farm == null:
		return
	_farm.advance(delta)
	_field.show_plots(_farm.plots())


## A tap plants an empty plot, picks a ripe one, and shows the time left on a growing one.
func _on_plot_tapped(index: int) -> void:
	var plot := _farm.plot(index)
	match plot.stage:
		PlotView.Stage.EMPTY:
			_log_command("plant", index, _farm.plant(index))
		PlotView.Stage.RIPE:
			_log_command("pick", index, _farm.pick(index))
		_:
			_field.show_time_left(index, plot.seconds_left)
	_field.show_plots(_farm.plots())


func _log_command(command: String, index: int, result: CommandResult) -> void:
	if result.happened:
		GameLog.debug(command, {"plot": index})
	else:
		GameLog.debug(command + " refused", {"plot": index, "reason": result.reason})


## Stops the game with the problems on screen and in the log. A headless run exits with a
## failing code, so a bad table can't slip through a scripted run unnoticed.
func _stop_with(problems: Array[String]) -> void:
	for problem in problems:
		GameLog.error("cannot start", {"problem": problem})
	var label := Label.new()
	label.text = "Cannot start Happy Cotton:\n" + "\n".join(problems)
	var layer := CanvasLayer.new()
	layer.add_child(label)
	add_child(layer)
	if DisplayServer.get_name() == "headless":
		get_tree().quit(1)
