class_name BodySounds
extends Node
## The sounds the Piggy's own body makes, heard from inside the head (not placed in 3D):
## heavy breathing and a pounding heart during the warning signs, a grunt when they start,
## snorts, squeals and lunges, and wet chewing (or, when the bowl shows snacks, crunching)
## while giving in. Driven by BodyEvents. The breathing and heartbeat come from the set
## Hallucinations picks by humanity: human, snouty or pig. Placeholder synth sounds.

## How much quieter the breathing is when the warning signs stop, in decibels.
const BREATHING_QUIET_DB := -80.0
const BREATHING_HEAVY_DB := 0.0

var _breathing := AudioStreamPlayer.new()
var _grunt := AudioStreamPlayer.new()
var _snort := AudioStreamPlayer.new()
var _squeal := AudioStreamPlayer.new()
var _heartbeat := AudioStreamPlayer.new()
var _chewing := AudioStreamPlayer.new()
var _crunching := AudioStreamPlayer.new()
var _eats_snacks: bool = false
var _breathing_set: Hallucinations.Breathing = Hallucinations.Breathing.HUMAN
## Per breathing set: [breathing, heartbeat] streams.
var _sets: Dictionary[Hallucinations.Breathing, Array] = {}


## Builds the sounds. `give_in_seconds` sets how long the chewing lasts.
func setup(give_in_seconds: float) -> void:
	var piggishness: Dictionary[Hallucinations.Breathing, float] = {
		Hallucinations.Breathing.HUMAN: 0.0,
		Hallucinations.Breathing.SNOUTY: 0.5,
		Hallucinations.Breathing.PIG: 1.0,
	}
	for breathing_set: Hallucinations.Breathing in piggishness:
		var amount := piggishness[breathing_set]
		_sets[breathing_set] = [
			PlaceholderSounds.breathing(2, amount), PlaceholderSounds.heartbeat(amount)
		]
	_breathing.pitch_scale = 1.6
	_heartbeat.pitch_scale = 1.5
	_use_set(_breathing_set)
	set_warning(false)
	_grunt.stream = PlaceholderSounds.grunt()
	_snort.stream = PlaceholderSounds.snort()
	_squeal.stream = PlaceholderSounds.squeal()
	_chewing.stream = PlaceholderSounds.chewing(give_in_seconds)
	_crunching.stream = PlaceholderSounds.crunching(give_in_seconds)
	for player: AudioStreamPlayer in _players():
		add_child(player)


## Switches breathing and heartbeat to this set; a playing sound carries on in the new one.
func set_breathing(breathing_set: Hallucinations.Breathing) -> void:
	if breathing_set == _breathing_set:
		return
	_breathing_set = breathing_set
	_use_set(breathing_set)
	var which: String = Hallucinations.Breathing.find_key(breathing_set)
	GameLog.debug("Breathing set: %s" % which.to_lower())


## Whether the next give-in eats snacks (crunching) or slop (wet chewing).
func set_eats_snacks(eats_snacks: bool) -> void:
	_eats_snacks = eats_snacks


## Heavy breathing and the heartbeat play only while the warning signs show.
func set_warning(is_warning: bool) -> void:
	for player: AudioStreamPlayer in [_breathing, _heartbeat]:
		if is_warning and not player.playing:
			player.play()
		player.volume_db = BREATHING_HEAVY_DB if is_warning else BREATHING_QUIET_DB


func react(event: BodyEvent) -> void:
	match event.kind:
		BodyEvent.Kind.WARNING:
			_grunt.play()
		BodyEvent.Kind.OUTBURST:
			_play_outburst(event.outburst)
		BodyEvent.Kind.GIVE_IN_STARTED:
			(_crunching if _eats_snacks else _chewing).play()


## Stops whatever the body was doing, for a checkpoint restore.
func stop_all() -> void:
	for player: AudioStreamPlayer in [_grunt, _snort, _squeal, _chewing, _crunching]:
		player.stop()
	set_warning(false)


func _use_set(breathing_set: Hallucinations.Breathing) -> void:
	var streams: Array = _sets[breathing_set]
	for pair: Array in [[_breathing, streams[0]], [_heartbeat, streams[1]]]:
		var player: AudioStreamPlayer = pair[0]
		var was_playing := player.playing
		player.stream = pair[1]
		if was_playing:
			player.play()


func _players() -> Array[AudioStreamPlayer]:
	return [_breathing, _heartbeat, _grunt, _snort, _squeal, _chewing, _crunching]


func _play_outburst(which: BodyEvent.Outburst) -> void:
	match which:
		BodyEvent.Outburst.SNORT:
			_snort.play()
		BodyEvent.Outburst.SQUEAL:
			_squeal.play()
		BodyEvent.Outburst.LUNGE:
			_grunt.play()
			_snort.play()
