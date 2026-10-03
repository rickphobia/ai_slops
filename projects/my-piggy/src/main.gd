extends Node
## Entry scene: loads and checks the tuning and the player's settings, starts the night,
## and wires the rules to the adapters: title screen, opening, Piggy, pause menu.
## Owns the mouse (captured while playing, free otherwise). Kept thin: no game rules here.

const TUNING_PATH := "res://data/tuning.tres"
const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")
const MASTER_BUS := 0
## Layers from back to front: the black of the opening, then the menus.
const DARK_LAYER := 10
const MENU_LAYER := 20

var _night: Night
var _flow: GameFlow
var _settings: PlayerSettings
var _piggy: PiggyController
var _title: TitleScreen
var _pause_menu: PauseMenu
var _dark: ColorRect
var _opening_sounds: Array[AudioStreamPlayer] = []
## True once the mouse has really been captured since play (re)started. The browser takes
## the mouse back on Escape before the game sees the key, so losing a capture we had
## means "pause". A capture that hasn't arrived yet must not count as lost.
var _had_capture: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var tuning := Tuning.load_file(TUNING_PATH)
	if tuning == null:
		_stop_with(["Could not load the tuning table at %s" % TUNING_PATH])
		return
	var problems := tuning.problems()
	if not problems.is_empty():
		_stop_with(problems)
		return

	_settings = PlayerSettings.load_file(PlayerSettings.DEFAULT_PATH)
	_flow = GameFlow.new(tuning.opening_seconds)
	_night = Night.new()
	_update_log_context()
	GameLog.info("Night started")

	_piggy = PIGGY_SCENE.instantiate()
	_piggy.setup(tuning)
	_piggy.process_mode = Node.PROCESS_MODE_DISABLED
	var room: Node3D = $GreyBoxRoom
	var spawn: Marker3D = room.get_node("SpawnPoint")
	add_child(_piggy)
	_piggy.global_position = spawn.global_position
	_apply_settings()

	_dark = ColorRect.new()
	_dark.color = Color.BLACK
	_dark.set_anchors_preset(Control.PRESET_FULL_RECT)
	_dark.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_add_layer(_dark, DARK_LAYER)
	for stream: AudioStreamWAV in [PlaceholderSounds.breathing(), PlaceholderSounds.heartbeat()]:
		var player := AudioStreamPlayer.new()
		player.stream = stream
		add_child(player)
		_opening_sounds.append(player)

	_title = TitleScreen.new()
	_title.start_clicked.connect(_on_start_clicked)
	_add_layer(_title, MENU_LAYER)
	_pause_menu = PauseMenu.new()
	_pause_menu.setup(_settings)
	_pause_menu.visible = false
	_pause_menu.resume_clicked.connect(_resume)
	_pause_menu.settings_changed.connect(_on_settings_changed)
	_add_layer(_pause_menu, MENU_LAYER)


func _process(delta: float) -> void:
	if _flow == null:
		return
	var was_opening := _flow.stage == GameFlow.Stage.OPENING
	_flow.advance(delta)
	if was_opening and _flow.has_control():
		_give_control()
	if _flow.stage == GameFlow.Stage.PLAYING:
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			_had_capture = true
		elif _had_capture:
			_pause()


func _physics_process(_delta: float) -> void:
	if _flow == null or not _flow.has_control():
		return
	_night.advance()
	_update_log_context()


func _unhandled_input(event: InputEvent) -> void:
	if _flow == null:
		return
	if event.is_action_pressed("ui_cancel"):
		if _flow.stage == GameFlow.Stage.PLAYING:
			_pause()
		elif _flow.stage == GameFlow.Stage.PAUSED:
			_resume()
		return
	# After Escape some browsers refuse to capture the mouse again for a moment, so a
	# resume can leave it free. Clicking the game takes it back.
	var click := event as InputEventMouseButton
	if click != null and click.pressed and _flow.stage == GameFlow.Stage.PLAYING:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _on_start_clicked() -> void:
	_flow.start()
	_title.queue_free()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	for player in _opening_sounds:
		player.play()
	GameLog.info("Opening started")


func _give_control() -> void:
	_dark.visible = false
	for player in _opening_sounds:
		player.stop()
	# Main keeps running while paused; the Piggy must not, so it can't inherit from main.
	_piggy.process_mode = Node.PROCESS_MODE_PAUSABLE
	GameLog.info("Eyes open: control given")


func _pause() -> void:
	_flow.pause()
	_had_capture = false
	get_tree().paused = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_pause_menu.visible = true
	GameLog.info("Paused")


func _resume() -> void:
	_flow.resume()
	get_tree().paused = false
	_pause_menu.visible = false
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	GameLog.info("Resumed")


func _on_settings_changed() -> void:
	_apply_settings()
	var result := _settings.save_file(PlayerSettings.DEFAULT_PATH)
	if result != OK:
		GameLog.warning(
			(
				"Could not save settings to %s: %s"
				% [PlayerSettings.DEFAULT_PATH, error_string(result)]
			)
		)


func _apply_settings() -> void:
	_piggy.set_sensitivity_scale(_settings.sensitivity_scale)
	AudioServer.set_bus_volume_db(MASTER_BUS, linear_to_db(_settings.volume))


func _add_layer(control: Control, layer_index: int) -> void:
	var layer := CanvasLayer.new()
	layer.layer = layer_index
	layer.add_child(control)
	add_child(layer)


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
