class_name PlaceholderSounds
extends RefCounted
## Synth stand-ins for the opening's breathing and heartbeat, door and house creaks, wind,
## the fridge hum and Mum's humming, lines and footsteps, made in code so there are no sound
## files to license. Real recordings can replace them later; record each one in CREDITS.md
## when it arrives.

const MIX_RATE := 22050
const BREATH_SECONDS := 4.0
const INHALE_SECONDS := 1.6
const HEARTBEAT_SECONDS := 0.85  # about 70 beats a minute
const HEART_PITCH_HZ := 48.0
const CREAK_SECONDS := 0.7
const WIND_SECONDS := 9.0
## Mains hum. A whole number of cycles fits the loop, so it loops without a click.
const HUM_PITCH_HZ := 50.0
const HUM_SECONDS := 1.0
## "This little piggy went to market": each note is (pitch in Hz, seconds).
const HUM_TUNE: Array[Vector2] = [
	Vector2(392.0, 0.35),
	Vector2(329.6, 0.35),
	Vector2(392.0, 0.35),
	Vector2(329.6, 0.35),
	Vector2(392.0, 0.35),
	Vector2(440.0, 0.35),
	Vector2(392.0, 0.7),
	Vector2(349.2, 0.35),
	Vector2(329.6, 0.35),
	Vector2(293.7, 0.35),
	Vector2(261.6, 1.0),
]
const HUM_PAUSE_SECONDS := 2.0
const SYLLABLE_SECONDS := 0.28
const SCREAM_SECONDS := 1.0


## Slow breathing: soft noise swelling in, then a longer breath out. `piggishness` (0–1)
## adds a wet, fluttering snout and a low grunt under the breath, for low humanity.
static func breathing(seed: int = 1, piggishness: float = 0.0) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = seed
	var count := int(BREATH_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	var phase := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		# A one-pole low-pass takes the hiss off white noise, which reads as air.
		smoothed += 0.08 * (noise.randf_range(-1.0, 1.0) - smoothed)
		var flutter := 1.0 - piggishness * 0.6 * (0.5 + 0.5 * sin(TAU * 30.0 * seconds))
		phase += 85.0 / MIX_RATE
		var grunt := (2.0 * fmod(phase, 1.0) - 1.0) * 0.25 * piggishness
		samples[index] = (smoothed * 2.5 * flutter + grunt) * _breath_envelope(seconds)
	return _to_stream(samples)


## One heartbeat: a low thump ("lub") and a softer one ("dub") just after. `piggishness`
## (0–1) makes it lower and wetter.
static func heartbeat(piggishness: float = 0.0) -> AudioStreamWAV:
	var count := int(HEARTBEAT_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var pitch := HEART_PITCH_HZ * (1.0 - 0.3 * piggishness)
	var noise := RandomNumberGenerator.new()
	noise.seed = 4
	for index in count:
		var seconds := float(index) / MIX_RATE
		var beat := _thump(seconds, 0.0, 0.9, pitch) + _thump(seconds, 0.22, 0.6, pitch)
		samples[index] = beat * (1.0 + piggishness * noise.randf_range(-0.5, 0.5))
	return _to_stream(samples)


## One door creak, played once: a rough, wavering low saw, like a dry hinge.
static func creak() -> AudioStreamWAV:
	var count := int(CREAK_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var phase := 0.0
	var smoothed := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		phase += (140.0 + 60.0 * sin(TAU * 2.3 * seconds)) / MIX_RATE
		smoothed += 0.3 * ((2.0 * fmod(phase, 1.0) - 1.0) - smoothed)
		samples[index] = smoothed * 0.8 * sin(PI * seconds / CREAK_SECONDS)
	return _to_stream(samples, false)


## A low grunt: a rough, falling buzz in the throat.
static func grunt() -> AudioStreamWAV:
	return _buzz(0.5, 110.0, 70.0, 0.15, 0.7)


## A snort: a short blast of air through the nose.
static func snort() -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 3
	var count := int(0.35 * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		smoothed += 0.25 * (noise.randf_range(-1.0, 1.0) - smoothed)
		var flutter := 0.6 + 0.4 * sin(TAU * 38.0 * seconds)
		samples[index] = smoothed * 2.0 * flutter * exp(-seconds * 7.0)
	return _to_stream(samples, false)


## A squeal: a high, rising, harsh shriek.
static func squeal() -> AudioStreamWAV:
	return _buzz(0.9, 700.0, 1300.0, 0.5, 0.6)


## Wet chewing for the length of a give-in: soft smacks a few times a second.
static func chewing(seconds: float) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 5
	var count := int(seconds * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	for index in count:
		var time := float(index) / MIX_RATE
		smoothed += 0.4 * (noise.randf_range(-1.0, 1.0) - smoothed)
		var since_smack := fmod(time, 0.32)
		samples[index] = smoothed * exp(-since_smack * 25.0) * 0.9
	return _to_stream(samples, false)


## Crunching snacks for the length of a give-in: short, dry, bright cracks.
static func crunching(seconds: float) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 6
	var count := int(seconds * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	for index in count:
		var time := float(index) / MIX_RATE
		var since_bite := fmod(time, 0.24)
		samples[index] = noise.randf_range(-1.0, 1.0) * exp(-since_bite * 60.0) * 0.7
	return _to_stream(samples, false)


## Flies over rotten slop, looped: two thin, wandering buzzes.
static func flies() -> AudioStreamWAV:
	var count := int(2.0 * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var phases := PackedFloat64Array([0.0, 0.0])
	for index in count:
		var seconds := float(index) / MIX_RATE
		var sample := 0.0
		for fly in 2:
			# Whole cycles of the wander per loop, so it loops without a jump in pitch.
			var pitch := 210.0 + 40.0 * fly + 25.0 * sin(TAU * (1.5 + fly) * seconds)
			phases[fly] += pitch / MIX_RATE
			sample += sin(TAU * phases[fly]) * 0.12
		samples[index] = sample
	return _to_stream(samples)


## A saw wave gliding from one pitch to another, roughened with noise, faded in and out.
static func _buzz(
	seconds: float, from_hz: float, to_hz: float, roughness: float, loudness: float
) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 9
	var count := int(seconds * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var phase := 0.0
	for index in count:
		var progress := float(index) / count
		phase += lerpf(from_hz, to_hz, progress) / MIX_RATE
		var saw := 2.0 * fmod(phase, 1.0) - 1.0
		var rough := saw + noise.randf_range(-roughness, roughness)
		samples[index] = rough * loudness * sin(PI * progress)
	return _to_stream(samples, false)


## Mum's scream when she catches the Piggy: a long, rough shriek that climbs.
static func scream() -> AudioStreamWAV:
	return _buzz(SCREAM_SECONDS, 650.0, 1100.0, 0.6, 0.9)


## Mum humming "This Little Piggy", looped: a soft, closed-mouth voice with a slow vibrato,
## then a pause before it starts again.
static func humming() -> AudioStreamWAV:
	var samples := PackedFloat32Array()
	var phase := 0.0
	for note: Vector2 in HUM_TUNE:
		var count := int(note.y * MIX_RATE)
		for index in count:
			var seconds := float(index) / MIX_RATE
			var hz := note.x * (1.0 + 0.012 * sin(TAU * 5.0 * seconds))
			phase += hz / MIX_RATE
			var voice := 0.6 * sin(TAU * phase) + 0.25 * sin(2.0 * TAU * phase)
			var envelope := minf(seconds / 0.06, 1.0) * minf((note.y - seconds) / 0.08, 1.0)
			samples.append(voice * 0.5 * maxf(envelope, 0.0))
	for index in int(HUM_PAUSE_SECONDS * MIX_RATE):
		samples.append(0.0)
	return _to_stream(samples)


## One of Mum's lines, as a murmur with one rise and fall per syllable until real recordings
## exist. `syllables` sets its length; `pitch_hz` how high her voice is.
static func spoken_line(syllables: int, pitch_hz: float) -> AudioStreamWAV:
	var count := int(syllables * SYLLABLE_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var phase := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		var in_syllable := fmod(seconds, SYLLABLE_SECONDS) / SYLLABLE_SECONDS
		# Falls over the line like a sentence, with a lilt on each syllable.
		var hz := pitch_hz * (1.1 - 0.2 * seconds / (syllables * SYLLABLE_SECONDS))
		hz *= 1.0 + 0.06 * sin(PI * in_syllable)
		phase += hz / MIX_RATE
		var saw := 2.0 * fmod(phase, 1.0) - 1.0
		var vowel := 0.5 * sin(TAU * phase) + 0.2 * saw
		samples[index] = vowel * 0.7 * sin(PI * in_syllable)
	return _to_stream(samples, false)


## One footstep on a wooden floor: a short, low knock.
static func footstep() -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = 11
	var count := int(0.18 * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		smoothed += 0.15 * (noise.randf_range(-1.0, 1.0) - smoothed)
		var knock := sin(TAU * 90.0 * seconds) * 0.6 + smoothed * 1.5
		samples[index] = knock * exp(-seconds * 30.0)
	return _to_stream(samples, false)


## Wind outside, looped: low rumbling noise that rises and falls in one slow gust.
static func wind(seed: int = 2) -> AudioStreamWAV:
	var noise := RandomNumberGenerator.new()
	noise.seed = seed
	var count := int(WIND_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	var smoothed := 0.0
	for index in count:
		var seconds := float(index) / MIX_RATE
		smoothed += 0.02 * (noise.randf_range(-1.0, 1.0) - smoothed)
		# Starts and ends at the same level, so the loop point doesn't jump.
		var gust := 0.4 + 0.6 * pow(sin(PI * seconds / WIND_SECONDS), 2.0)
		samples[index] = smoothed * 6.0 * gust
	return _to_stream(samples)


## A fridge's hum, looped: the mains note and two quieter overtones.
static func fridge_hum() -> AudioStreamWAV:
	var count := int(HUM_SECONDS * MIX_RATE)
	var samples := PackedFloat32Array()
	samples.resize(count)
	for index in count:
		var cycle := TAU * HUM_PITCH_HZ * float(index) / MIX_RATE
		samples[index] = 0.5 * sin(cycle) + 0.25 * sin(2.0 * cycle) + 0.12 * sin(3.0 * cycle)
	return _to_stream(samples)


static func _breath_envelope(seconds: float) -> float:
	if seconds < INHALE_SECONDS:
		return sin(PI * seconds / INHALE_SECONDS) * 0.6
	var out_seconds := BREATH_SECONDS - INHALE_SECONDS
	return sin(PI * (seconds - INHALE_SECONDS) / out_seconds)


static func _thump(
	seconds: float, start: float, loudness: float, pitch_hz: float = HEART_PITCH_HZ
) -> float:
	var since := seconds - start
	if since < 0.0:
		return 0.0
	return sin(TAU * pitch_hz * since) * exp(-since * 18.0) * loudness


static func _to_stream(samples: PackedFloat32Array, loops: bool = true) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for index in samples.size():
		bytes.encode_s16(index * 2, int(clampf(samples[index], -1.0, 1.0) * 32767.0))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = MIX_RATE
	stream.stereo = false
	stream.data = bytes
	if loops:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		stream.loop_end = samples.size()
	return stream
