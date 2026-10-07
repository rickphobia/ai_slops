extends Node
## Entry scene: logs which build is running, loads and checks the tuning table, creates the
## Farm rules and wires them to the field and The App. Kept thin: no game rules here.

const TUNING_PATH := "res://data/tuning.tres"

var _tuning: Tuning
var _farm: Farm

@onready var _field: Field = $Field
@onready var _app: AppOverlay = $AppOverlay


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
	_show_app()


## The tuning table that passed the startup check, or null if the game stopped.
func tuning() -> Tuning:
	return _tuning


## Crops grow in real time while the game runs. A hidden browser tab stops frames, and Godot
## caps one frame's delta (about 0.13 s), so the hidden time doesn't count as online play.
func _process(delta: float) -> void:
	if _farm == null:
		return
	_farm.advance(delta)
	_field.show_plots(_farm.plots())
	_show_app()


## A tap on an empty plot plants it; on any other plot it tries to pick. The rules decide
## whether that happens; an unripe plot shows its time left instead.
func _on_plot_tapped(index: int) -> void:
	if _farm.plot(index).stage == PlotView.Stage.EMPTY:
		_log_command("plant", index, _farm.plant(index))
	else:
		var result := _farm.pick(index)
		_log_command("pick", index, result)
		if result.reason == Farm.NOT_RIPE:
			_field.show_time_left(index, _farm.plot(index).seconds_left)
	_field.show_plots(_farm.plots())


## Passes the rules' App messages to the Mascot, celebrates a met Quota, and refreshes the bar.
## A Shift's end and the next Shift's start arrive together, so the Mascot says all of a
## frame's lines at once; otherwise the praise would be replaced before anyone could read it.
func _show_app() -> void:
	var lines: Array[String] = []
	for message in _farm.take_messages():
		if message.key == Farm.QUOTA_MET or message.key == Farm.QUOTA_MISSED:
			var fields := message.values
			fields["met"] = message.key == Farm.QUOTA_MET
			GameLog.info("quota checked", fields)
		var text := AppText.render(message)
		if text.is_empty():
			GameLog.warning("app message has no text", {"key": message.key})
		else:
			lines.append(text)
		if message.key == Farm.QUOTA_MET:
			_app.celebrate()
	if not lines.is_empty():
		_app.say("\n".join(lines))
	_app.show_shift(_farm.shift(), _farm.labour_points())


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
