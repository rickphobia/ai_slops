class_name PlaceholderSounds
extends RefCounted
## Synth stand-ins for the opening's breathing and heartbeat, made in code so there are no
## sound files to license. Each is one seamless loop. Ticket 05 replaces them with real ones.

const MIX_RATE := 22050
const BREATH_SECONDS := 4.0
const INHALE_SECONDS := 1.6
const HEARTBEAT_SECONDS := 0.85  # about 70 beats a minute
const HEART_PITCH_HZ := 48.0


## Slow breathing: soft noise swelling in, then a longer breath out.
static func breathing(seed: int = 1) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = seed
	var count := int(BREATH_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		# A one-pole low-pass takes the hiss off white noise, which reads as air.
		smoothed += 0.08 * (noise.randf_range(-1.0, 1.0) - smoothed)
		samples[index] = smoothed * 2.5 * _breath_envelope(seconds)
	return _to_stream(samples)


## One heartbeat: a low thump ("lub") and a softer one ("dub") just after.
static func heartbeat() -> AudioStreamWAV:
	var count := int(HEARTBEAT_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	for index in count:
		var seconds := float(index) / MIX_RATE
		samples[index] = _thump(seconds, 0.0, 0.9) + _thump(seconds, 0.22, 0.6)
	return _to_stream(samples)


static func _breath_envelope(seconds: float) -> float:
	if seconds < INHALE_SECONDS:
		return sin(PI * seconds / INHALE_SECONDS) * 0.6
	var out_seconds := BREATH_SECONDS - INHALE_SECONDS
	return sin(PI * (seconds - INHALE_SECONDS) / out_seconds)


static func _thump(seconds: float, start: float, loudness: float) -> float:
	var since := seconds - start
	if since < 0.0:
		return 0.0
	return sin(TAU * HEART_PITCH_HZ * since) * exp(-since * 18.0) * loudness


static func _to_stream(samples: PackedFloat32Array) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for index in samples.size():
		bytes.encode_s16(index * 2, int(clampf(samples[index], -1.0, 1.0) * 32767.0))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = MIX_RATE
	stream.stereo = false
	stream.data = bytes
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_end = samples.size()
	return stream
