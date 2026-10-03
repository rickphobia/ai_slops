class_name AmbientBed
extends Node3D
## The quiet bed of sound under the whole night, with no music: wind outside, the fridge
## humming in the kitchen, and the house creaking now and then somewhere near the player.
## The hum and the creaks are 3D, so they go through the muffled channel when behind a wall.

# How the bed sounds, not how the game plays.
const WIND_DB := -20.0
const HUM_DB := -14.0
## The hum is only heard close to the fridge.
const HUM_RANGE := 9.0
const CREAK_DB := -10.0
const CREAK_RANGE := 14.0
## A creak comes every so often, at a random time in this range, in seconds.
const CREAK_GAP_SECONDS := Vector2(7.0, 20.0)
## How far from the player a creak comes from, in metres; up in the ceiling joists.
const CREAK_DISTANCE := Vector2(2.5, 7.0)
const CREAK_HEIGHT := 2.5
## Pitched down and varied so the house doesn't sound like a door.
const CREAK_PITCH := Vector2(0.45, 0.75)

var _listener: Node3D
var _random := RandomNumberGenerator.new()
var _until_creak: float = 0.0
var _wind: AudioStreamPlayer
var _hum: AudioStreamPlayer3D
var _creak: AudioStreamPlayer3D


## Fills in the fridge's hum player, places creaks around the listener, and hands the 3D
## sounds to the muffled channel. Call once, before start().
func setup(fridge_hum: AudioStreamPlayer3D, listener: Node3D, occlusion: SoundOcclusion) -> void:
	_listener = listener
	_hum = fridge_hum
	_hum.stream = PlaceholderSounds.fridge_hum()
	_hum.volume_db = HUM_DB
	_hum.max_distance = HUM_RANGE
	occlusion.register(_hum)

	_wind = AudioStreamPlayer.new()
	_wind.stream = PlaceholderSounds.wind()
	_wind.volume_db = WIND_DB
	add_child(_wind)

	_creak = AudioStreamPlayer3D.new()
	_creak.stream = PlaceholderSounds.creak()
	_creak.volume_db = CREAK_DB
	_creak.max_distance = CREAK_RANGE
	add_child(_creak)
	occlusion.register(_creak)
	_random.randomize()
	_until_creak = _random.randf_range(CREAK_GAP_SECONDS.x, CREAK_GAP_SECONDS.y)


func start() -> void:
	_wind.play()
	_hum.play()


func _process(delta: float) -> void:
	if _listener == null or not _wind.playing:
		return
	_until_creak -= delta
	if _until_creak > 0.0:
		return
	_until_creak = _random.randf_range(CREAK_GAP_SECONDS.x, CREAK_GAP_SECONDS.y)
	var direction := Vector3.FORWARD.rotated(Vector3.UP, _random.randf() * TAU)
	var at := (
		_listener.global_position
		+ direction * _random.randf_range(CREAK_DISTANCE.x, CREAK_DISTANCE.y)
	)
	_creak.global_position = Vector3(at.x, CREAK_HEIGHT, at.z)
	_creak.pitch_scale = _random.randf_range(CREAK_PITCH.x, CREAK_PITCH.y)
	_creak.play()
	GameLog.debug("House creaked at %s" % _creak.global_position)
