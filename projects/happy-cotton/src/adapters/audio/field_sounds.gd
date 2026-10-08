class_name FieldSounds
extends Node
## The field's sounds: the Worker's footsteps on the track, the turnstile turning as he
## pushes through it, the Generator's whine, which rises with his speed and winds down when he
## stops, and the Overseer's whistle and whip crack. All play through one bus, BUS (in
## default_bus_layout.tres), which sends to Master, where the player's volume and mute apply
## (SettingsEffects.apply_volume). Browsers block sound until the page is touched, so
## nothing plays before the player's first tap or click.

const BUS := &"Field"
const FOOTSTEPS: Array[AudioStream] = [
	preload("res://assets/kenney-impact-sounds/footstep_grass_000.ogg"),
	preload("res://assets/kenney-impact-sounds/footstep_grass_001.ogg"),
	preload("res://assets/kenney-impact-sounds/footstep_grass_002.ogg"),
]
const TURNSTILE := preload("res://assets/kenney-impact-sounds/impactMetal_light_000.ogg")
const WHISTLE := preload("res://assets/bigsoundbank/whistle.ogg")
const WHIP_CRACK := preload("res://assets/bigsoundbank/whip_crack.ogg")
## The loudness of each sound, in decibels.
const FOOTSTEP_DB := -8.0
const TURNSTILE_DB := -10.0
const WHISTLE_DB := -4.0
const WHIP_CRACK_DB := -2.0
const WHINE_DB := -16.0
## His speed along the track, in metres a second, at which the whine is at its highest.
const FULL_WHINE_SPEED := 3.5
## The whine's pitch as a share of its own, from barely turning to full speed.
const LOWEST_WHINE_PITCH := 0.5
const HIGHEST_WHINE_PITCH := 1.15
## How fast the whine follows his speed, as a share of full a second: it spins up quickly and
## winds down slowly, like a flywheel.
const SPIN_UP_PER_SECOND := 2.0
const WIND_DOWN_PER_SECOND := 0.5
## The whine is a hum made in code: whole-hertz partials, so a one-second loop has no click.
const WHINE_RATE := 22050
const WHINE_PARTIALS: Dictionary[int, float] = {180: 0.45, 360: 0.3, 540: 0.15, 1260: 0.1}

var _unlocked := false
var _played := 0
var _whine_target := 0.0
var _whine_level := 0.0
var _whining := false
var _footsteps := _add_player("Footsteps", FOOTSTEP_DB)
var _turnstile := _add_player("Turnstile", TURNSTILE_DB)
var _whistle := _add_player("Whistle", WHISTLE_DB)
var _whip_crack := _add_player("WhipCrack", WHIP_CRACK_DB)
var _whine := _add_player("Whine", WHINE_DB)


func _init() -> void:
	var steps := AudioStreamRandomizer.new()
	for footstep in FOOTSTEPS:
		steps.add_stream(-1, footstep)
	# Up to 10% higher or lower each step, so the same three steps don't sound looped.
	steps.random_pitch = 1.1
	_footsteps.stream = steps
	_turnstile.stream = TURNSTILE
	_whistle.stream = WHISTLE
	_whip_crack.stream = WHIP_CRACK
	_whine.stream = build_whine()


func _process(delta: float) -> void:
	update_whine(delta)


## The first press of a finger, mouse button or key lets sound play from then on.
func _input(event: InputEvent) -> void:
	if _unlocked:
		return
	var pressed := (
		(event is InputEventScreenTouch or event is InputEventMouseButton or event is InputEventKey)
		and event.is_pressed()
	)
	if pressed:
		_unlocked = true
		GameLog.info("sound unlocked")


func footstep() -> void:
	_play(_footsteps)


func turnstile() -> void:
	_play(_turnstile)


func whistle() -> void:
	_play(_whistle)


func whip_crack() -> void:
	_play(_whip_crack)


## How fast the Worker is running along the track, in metres a second; 0 when he isn't.
func set_generator_speed(speed: float) -> void:
	_whine_target = clampf(speed / FULL_WHINE_SPEED, 0.0, 1.0)


## Moves the whine some seconds towards the Worker's speed: louder and higher as he runs
## faster, falling away when he stops.
func update_whine(delta: float) -> void:
	var rate := SPIN_UP_PER_SECOND if _whine_target > _whine_level else WIND_DOWN_PER_SECOND
	_whine_level = move_toward(_whine_level, _whine_target, rate * delta)
	var should_whine := _unlocked and _whine_level > 0.0
	if should_whine != _whining:
		_whining = should_whine
		if _whining:
			_whine.play()
		else:
			_whine.stop()
	if _whining:
		_whine.pitch_scale = lerpf(LOWEST_WHINE_PITCH, HIGHEST_WHINE_PITCH, _whine_level)
		_whine.volume_db = WHINE_DB + linear_to_db(_whine_level)


## From 0 (still) to 1 (full speed).
func whine_level() -> float:
	return _whine_level


func is_whining() -> bool:
	return _whining


## How many one-off sounds (steps, turnstile turns, whistles, cracks) have played; for tests
## and debugging.
func sounds_played() -> int:
	return _played


## One second of the Generator's hum, looping.
static func build_whine() -> AudioStreamWAV:
	var samples := PackedByteArray()
	samples.resize(WHINE_RATE * 2)
	for index in WHINE_RATE:
		var time := float(index) / WHINE_RATE
		var value := 0.0
		for hertz: int in WHINE_PARTIALS:
			value += WHINE_PARTIALS[hertz] * sin(TAU * hertz * time)
		# The partials sum to at most 1; 0.8 of full scale leaves headroom against clipping.
		samples.encode_s16(index * 2, roundi(value * 0.8 * 32767.0))
	var whine := AudioStreamWAV.new()
	whine.format = AudioStreamWAV.FORMAT_16_BITS
	whine.mix_rate = WHINE_RATE
	whine.data = samples
	whine.loop_mode = AudioStreamWAV.LOOP_FORWARD
	whine.loop_end = WHINE_RATE
	return whine


func _play(player: AudioStreamPlayer) -> void:
	if not _unlocked:
		return
	_played += 1
	player.play()


func _add_player(part: String, volume_db: float) -> AudioStreamPlayer:
	var player := AudioStreamPlayer.new()
	player.name = part
	player.bus = BUS
	player.volume_db = volume_db
	add_child(player)
	return player
