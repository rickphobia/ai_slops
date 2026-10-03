class_name BodySounds
extends Node
## The sounds the Piggy's own body makes, heard from inside the head (not placed in 3D):
## heavy breathing during the warning signs, a grunt when they start, snorts, squeals and
## lunges, and wet chewing while giving in. Driven by BodyEvents. Placeholder synth sounds
## until ticket 05.

## How much quieter the breathing is when the warning signs stop, in decibels.
const BREATHING_QUIET_DB := -80.0
const BREATHING_HEAVY_DB := 0.0

var _breathing := AudioStreamPlayer.new()
var _grunt := AudioStreamPlayer.new()
var _snort := AudioStreamPlayer.new()
var _squeal := AudioStreamPlayer.new()
var _chewing := AudioStreamPlayer.new()


## Builds the sounds. `give_in_seconds` sets how long the chewing lasts.
func setup(give_in_seconds: float) -> void:
	_breathing.stream = PlaceholderSounds.breathing(2)
	_breathing.pitch_scale = 1.6
	_breathing.volume_db = BREATHING_QUIET_DB
	_grunt.stream = PlaceholderSounds.grunt()
	_snort.stream = PlaceholderSounds.snort()
	_squeal.stream = PlaceholderSounds.squeal()
	_chewing.stream = PlaceholderSounds.chewing(give_in_seconds)
	for player: AudioStreamPlayer in [_breathing, _grunt, _snort, _squeal, _chewing]:
		add_child(player)


## Heavy breathing plays only while the warning signs show.
func set_warning(is_warning: bool) -> void:
	if is_warning and not _breathing.playing:
		_breathing.play()
	_breathing.volume_db = BREATHING_HEAVY_DB if is_warning else BREATHING_QUIET_DB


func react(event: BodyEvent) -> void:
	match event.kind:
		BodyEvent.Kind.WARNING:
			_grunt.play()
		BodyEvent.Kind.OUTBURST:
			_play_outburst(event.outburst)
		BodyEvent.Kind.GIVE_IN_STARTED:
			_chewing.play()


## Stops whatever the body was doing, for a checkpoint restore.
func stop_all() -> void:
	for player: AudioStreamPlayer in [_grunt, _snort, _squeal, _chewing]:
		player.stop()
	set_warning(false)


func _play_outburst(which: BodyEvent.Outburst) -> void:
	match which:
		BodyEvent.Outburst.SNORT:
			_snort.play()
		BodyEvent.Outburst.SQUEAL:
			_squeal.play()
		BodyEvent.Outburst.LUNGE:
			_grunt.play()
			_snort.play()
