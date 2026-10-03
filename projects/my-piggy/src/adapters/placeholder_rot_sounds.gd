class_name PlaceholderRotSounds
extends RefCounted
## Synth stand-ins for the rot's sounds in each space, one loop per stage, until real
## recordings exist: a ticking clock and a TV murmuring through a wall (cosy), flies and a
## slow drip (soured), dripping and wet breathing in the walls (grotesque).

const MIX_RATE := PlaceholderSounds.MIX_RATE
## Every loop is this long, a whole number of clock ticks and breaths, so it loops cleanly.
const LOOP_SECONDS := 4.0
const TICK_SECONDS := 1.0
const DRIP_SECONDS := 2.0
const WET_BREATH_SECONDS := 4.0


static func homely() -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 21
	var samples := _silence()
	var murmur := 0.0
	for index in samples.size():
		var seconds := float(index) / MIX_RATE
		var since_tick := fmod(seconds, TICK_SECONDS)
		var tick := noise.randf_range(-1.0, 1.0) * exp(-since_tick * 400.0) * 0.6
		# The TV: low, muffled speech-like noise that comes and goes in syllables.
		murmur += 0.03 * (noise.randf_range(-1.0, 1.0) - murmur)
		var syllables := 0.5 + 0.5 * sin(TAU * 3.0 * seconds) * sin(TAU * 0.5 * seconds)
		samples[index] = tick + murmur * 3.0 * syllables
	return PlaceholderSounds.to_stream(samples)


static func souring() -> AudioStreamWAV:
	var samples := _silence()
	var phase := 0.0
	for index in samples.size():
		var seconds := float(index) / MIX_RATE
		# One fly, wandering a whole number of times per loop so the pitch doesn't jump.
		phase += (200.0 + 30.0 * sin(TAU * 0.75 * seconds)) / MIX_RATE
		samples[index] = sin(TAU * phase) * 0.08 + _drip(seconds) * 0.5
	return PlaceholderSounds.to_stream(samples)


static func wet() -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 23
	var samples := _silence()
	var smoothed := 0.0
	for index in samples.size():
		var seconds := float(index) / MIX_RATE
		smoothed += 0.05 * (noise.randf_range(-1.0, 1.0) - smoothed)
		var breath := pow(sin(PI * seconds / WET_BREATH_SECONDS), 2.0)
		var gurgle := 0.6 + 0.4 * sin(TAU * 9.0 * seconds)
		samples[index] = smoothed * 4.0 * breath * gurgle + _drip(seconds) * 0.7
	return PlaceholderSounds.to_stream(samples)


static func _silence() -> PackedFloat32Array:
	var samples := PackedFloat32Array()
	samples.resize(int(LOOP_SECONDS * MIX_RATE))
	return samples


## A drop landing: a short pitch that falls fast, once every DRIP_SECONDS.
static func _drip(seconds: float) -> float:
	var since := fmod(seconds, DRIP_SECONDS)
	return sin(TAU * (900.0 - 4000.0 * since) * since) * exp(-since * 40.0)
