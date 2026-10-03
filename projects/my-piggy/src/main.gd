extends Node
## Entry scene: loads and checks the tuning and the player's settings, starts the night,
## and wires the rules to the adapters: title screen, opening, house, Piggy, pause menu,
## end card, the PS1 look, the ambient sound and Mum (her body, and the house distances her
## hearing uses). Tells the Night which space the Piggy is
## in, what the player is doing and when they reach the back door, and passes what the
## body did on to the Piggy and its sounds. When Mum catches the Piggy it plays the capture
## scene, then restores the checkpoint.
## Owns the mouse (captured while playing, free otherwise). Kept thin: no game rules here.

const TUNING_PATH := "res://data/tuning.tres"
const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")
const MASTER_BUS := 0
## Layers from back to front: the black of the opening, then the menus.
const DARK_LAYER := 10
const MENU_LAYER := 20

var _tuning: Tuning
var _night: Night
var _flow: GameFlow
var _settings: PlayerSettings
var _house: House
var _piggy: PiggyController
var _mum: Mum
var _body_sounds: BodySounds
var _title: TitleScreen
var _pause_menu: PauseMenu
var _dark: ColorRect
var _occlusion: SoundOcclusion
var _ambient: AmbientBed
var _capture_layer: CanvasLayer
## ?debug=1 or -- --debug: the overlay, noise rings and the restore-checkpoint key.
var _debug: bool = false
var _opening_sounds: Array[AudioStreamPlayer] = []
## True once the mouse has really been captured since play (re)started. The browser takes
## the mouse back on Escape before the game sees the key, so losing a capture we had
## means "pause". A capture that hasn't arrived yet must not count as lost.
var _had_capture: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var tuning := Tuning.load_file(TUNING_PATH)
	_tuning = tuning
	if tuning == null:
		_stop_with(["Could not load the tuning table at %s" % TUNING_PATH])
		return
	var problems := tuning.problems()
	if not problems.is_empty():
		_stop_with(problems)
		return

	_settings = PlayerSettings.load_file(PlayerSettings.DEFAULT_PATH)
	_flow = GameFlow.new(tuning.opening_seconds)
	_house = $House
	_house.setup(tuning)
	_house.door_creaked.connect(_on_door_creaked)

	_piggy = PIGGY_SCENE.instantiate()
	_piggy.setup(tuning)
	_piggy.process_mode = Node.PROCESS_MODE_DISABLED
	var spawn := _house.piggy_spawn()
	add_child(_piggy)
	_piggy.place(PiggyPose.new(spawn.global_position, spawn.global_rotation.y, 0.0))
	_apply_settings()

	# The look and the sound: the PS1 screen pass, the muffled channel, the ambient bed.
	add_child(Ps1Screen.new())
	_occlusion = SoundOcclusion.new()
	_occlusion.listener = _piggy.ears()
	add_child(_occlusion)
	for sound in _house.positional_sounds():
		_occlusion.register(sound)
	_ambient = AmbientBed.new()
	add_child(_ambient)
	_ambient.setup(_house.fridge_hum(), _piggy.ears(), _occlusion)

	var distances := HouseDistances.new(
		_house.get_world_3d(), _house.walkable().get_navigation_map()
	)
	var mum_start := _house.mum_start().global_position
	_night = Night.new(_piggy.pose(), tuning, RandomNumberGenerator.new(), distances, mum_start)
	_night.noise_heard.connect(_on_noise_heard)
	_night.caught.connect(_on_caught)
	_night.mum.alert_changed.connect(_on_mum_alert_changed)
	_mum = Mum.new()
	_mum.setup(tuning, _night.mum, _house.mum_route(), RandomNumberGenerator.new())
	_mum.process_mode = Node.PROCESS_MODE_DISABLED
	_mum.said.connect(func(line: String) -> void: GameLog.debug('Mum: "%s"' % line))
	add_child(_mum)
	_mum.global_position = mum_start
	distances.ignored = [_piggy.get_rid(), _mum.get_rid()]
	for sound in _mum.sounds():
		_occlusion.register(sound)
	_body_sounds = BodySounds.new()
	_body_sounds.setup(tuning.give_in_seconds)
	add_child(_body_sounds)
	_update_log_context()
	GameLog.info("Night started: checkpoint taken")

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
	_debug = DebugOverlay.is_requested(DebugOverlay.page_query(), OS.get_cmdline_user_args())
	if _debug:
		var overlay := DebugOverlay.new()
		overlay.setup(_night)
		_add_layer(overlay, MENU_LAYER)
		var rings := NoiseRings.new()
		rings.setup(_night)
		add_child(rings)


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


func _physics_process(delta: float) -> void:
	if _flow == null or not _flow.has_control():
		return
	var suppress_held := Input.is_action_pressed("suppress")
	var events := _night.advance(
		delta, _piggy.is_trotting(), suppress_held, _piggy.global_position, _piggy.gait()
	)
	_update_log_context()
	for event in events:
		_on_body_event(event)
	_piggy.set_speed_factor(_night.body.speed_factor())
	_piggy.set_warning(_night.body.is_warning())
	_body_sounds.set_warning(_night.body.is_warning())
	_update_log_context()
	_follow_piggy()


func _unhandled_input(event: InputEvent) -> void:
	if _flow == null:
		return
	if event.is_action_pressed("ui_cancel"):
		if _flow.stage == GameFlow.Stage.PLAYING:
			_pause()
		elif _flow.stage == GameFlow.Stage.PAUSED:
			_resume()
		return
	if (
		_debug
		and event.is_action_pressed("debug_restore_checkpoint")
		and _flow.has_control()
		and not _night.is_caught
	):
		_restore_checkpoint()
		return
	if event.is_action_pressed("give_in") and _flow.has_control():
		_try_give_in()
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
	_ambient.start()
	GameLog.info("Opening started")


func _give_control() -> void:
	_dark.visible = false
	for player in _opening_sounds:
		player.stop()
	# Main keeps running while paused; the Piggy must not, so it can't inherit from main.
	_piggy.process_mode = Node.PROCESS_MODE_PAUSABLE
	_mum.process_mode = Node.PROCESS_MODE_PAUSABLE
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


## Tells the Night where the Piggy is: a new space takes a checkpoint, the back door ends it.
func _follow_piggy() -> void:
	var at := _piggy.global_position
	if _house.is_at_back_door(at):
		_end_night()
		return
	var space := _house.space_at(at)
	if space != House.NO_SPACE and _night.enter_space(space, _piggy.pose()):
		_update_log_context()
		GameLog.info("Entered %s: checkpoint taken" % space)


func _restore_checkpoint() -> void:
	_piggy.place(_night.restore_checkpoint())
	_mum.place(_night.mum.position)
	_body_sounds.stop_all()
	_update_log_context()
	GameLog.info("Checkpoint restored: back to the start of %s" % _night.space)


## Freezes the Piggy and Mum and plays the capture scene; the restore comes when it ends.
func _on_caught() -> void:
	GameLog.info("Caught by Mum")
	_piggy.process_mode = Node.PROCESS_MODE_DISABLED
	_mum.process_mode = Node.PROCESS_MODE_DISABLED
	_body_sounds.stop_all()
	var scene := CaptureScene.new()
	scene.finished.connect(_restart_after_capture)
	_capture_layer = CanvasLayer.new()
	_capture_layer.layer = DARK_LAYER
	# Main keeps running while paused; the scene must pause with the game.
	_capture_layer.process_mode = Node.PROCESS_MODE_PAUSABLE
	_capture_layer.add_child(scene)
	add_child(_capture_layer)


func _restart_after_capture() -> void:
	_capture_layer.queue_free()
	_capture_layer = null
	_restore_checkpoint()
	_piggy.process_mode = Node.PROCESS_MODE_PAUSABLE
	_mum.process_mode = Node.PROCESS_MODE_PAUSABLE


func _end_night() -> void:
	_night.reach_back_door()
	_flow.end()
	_piggy.process_mode = Node.PROCESS_MODE_DISABLED
	_mum.process_mode = Node.PROCESS_MODE_DISABLED
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_add_layer(EndCard.new(), MENU_LAYER)
	GameLog.info("Reached the back door: night over")


## Gives in at the give-in spot the Piggy is next to, if there is one they haven't used.
func _try_give_in() -> void:
	var at := _piggy.global_position
	var spot := _house.give_in_spot_near(at, _tuning.give_in_reach)
	if spot == null:
		return
	var started := _night.give_in(spot.name, at)
	if started == null:
		GameLog.debug("Give-in spot %s already used since the checkpoint" % spot.name)
		return
	_piggy.start_give_in(spot.global_position, _tuning.give_in_seconds)
	_on_body_event(started)
	GameLog.info("Giving in at %s" % spot.name)


## Shows and plays what the body did. The Night has already turned it into a noise for Mum.
func _on_body_event(event: BodyEvent) -> void:
	_body_sounds.react(event)
	match event.kind:
		BodyEvent.Kind.WARNING:
			GameLog.debug("Urge warning signs started")
		BodyEvent.Kind.SUPPRESS_STARTED:
			GameLog.debug("Suppressing an outburst")
		BodyEvent.Kind.OUTBURST:
			_piggy.jerk_camera()
			if event.outburst == BodyEvent.Outburst.LUNGE:
				_piggy.lunge()
			var which: String = BodyEvent.Outburst.find_key(event.outburst)
			GameLog.info("Outburst: %s, noise radius %.1f m" % [which.to_lower(), event.loudness])
		BodyEvent.Kind.GAVE_IN:
			GameLog.info("Gave in: urge cleared")


## Only the Piggy's door pushes are noises Mum hunts; she doesn't come to look at her own.
func _on_door_creaked(noise_radius: float, at: Vector3, pushed_by: Node3D) -> void:
	GameLog.debug("Door creaked at %s: noise radius %.1f m" % [at, noise_radius])
	if pushed_by == _piggy:
		_night.door_creaked(noise_radius, at)


func _on_noise_heard(heard: HeardNoise) -> void:
	GameLog.info(
		(
			"Mum heard %s: loudness %.1f m, %.1f m away through %d doors/walls"
			% [heard.noise.source, heard.noise.loudness, heard.distance, heard.barriers]
		)
	)


func _on_mum_alert_changed(from: FamilyBrain.Alert, to: FamilyBrain.Alert) -> void:
	GameLog.info(
		"Mum's alert level: %s -> %s" % [FamilyBrain.alert_name(from), FamilyBrain.alert_name(to)]
	)


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
