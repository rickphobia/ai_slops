class_name Night
extends RefCounted
## One playthrough, from waking up in the bedroom to an ending.
## Pure rules: no scene tree, nodes, physics, rendering or audio. The adapters say which
## space the Piggy is in, what the player is doing and when they reach the back door;
## the Night decides the rest. Every noise the Piggy makes goes to Mum, who hears it if
## it reaches her through the house (asked of the DistanceProvider).

## The Piggy made a noise, heard or not (the debug overlay draws it).
signal noise_made(noise: PiggyNoise)
## Mum heard a noise and is coming to look.
signal noise_heard(heard: HeardNoise)

const FIRST_SPACE: StringName = &"bedroom"

var space: StringName = FIRST_SPACE
var step: int = 0
var has_ended: bool = false
## The Piggy's body: urge and the hidden humanity. Read it; change it through the Night.
var body: Body
## Mum's alert level and where she is headed. Her actor moves her and reports back to it.
var mum: FamilyBrain
## What the lying objects show, pig vision and the breathing set, all by the body's humanity.
var hallucinations: Hallucinations

var _checkpoint: Checkpoint
var _tuning: Tuning
var _distances: DistanceProvider
var _footstep_seconds_left: float = 0.0


## The Piggy wakes in the bedroom at this pose, which is also the first checkpoint.
## The rng decides which outbursts come; tests pass a seeded one. `distances` answers how a
## noise reaches Mum; without one she hears nothing. Mum starts at `mum_start`.
func _init(
	wake_pose: PiggyPose,
	tuning: Tuning,
	rng: RandomNumberGenerator = RandomNumberGenerator.new(),
	distances: DistanceProvider = DistanceProvider.new(),
	mum_start: Vector3 = Vector3.ZERO,
) -> void:
	_tuning = tuning
	_distances = distances
	body = Body.new(tuning, rng)
	mum = FamilyBrain.new(tuning.mum_search_seconds, mum_start)
	hallucinations = Hallucinations.new(tuning)
	_checkpoint = Checkpoint.new(FIRST_SPACE, wake_pose, body.state())


## Moves the night on by one step of `delta` seconds, with the Piggy at `at` moving at
## `gait`. Returns what the body did; its noises and footsteps go to Mum.
func advance(
	delta: float, trotting: bool, suppress_held: bool, at: Vector3, gait := PiggyNoise.Gait.STILL
) -> Array[BodyEvent]:
	step += 1
	if has_ended:
		return [] as Array[BodyEvent]
	mum.advance(delta)
	var events := body.advance(delta, trotting, suppress_held, at)
	for event in events:
		_make_noise(PiggyNoise.from_body_event(event))
	_step_feet(delta, gait, at)
	return events


## The Piggy pushed a door that creaked this loud (a noise radius, metres).
func door_creaked(radius: float, at: Vector3) -> void:
	if not has_ended:
		_make_noise(PiggyNoise.from_door(radius, at))


## Starts giving in at a give-in spot. Returns the event, or null if the spot was used
## since the last checkpoint or the Piggy is already giving in.
func give_in(spot: StringName, at: Vector3) -> BodyEvent:
	if has_ended:
		return null
	var started := body.give_in(spot, at)
	if started != null:
		_make_noise(PiggyNoise.from_body_event(started))
	return started


## Tells the Night which space the Piggy is in now. Moving into a different space takes
## a checkpoint at this pose. Returns true when a checkpoint was taken.
func enter_space(entered: StringName, pose: PiggyPose) -> bool:
	if has_ended or entered == space:
		return false
	space = entered
	body.reset_rise_rate()
	_checkpoint = Checkpoint.new(entered, pose, body.state())
	return true


## Puts the night back to the last checkpoint. Returns where and how the Piggy must be
## put back; the caller moves them there.
func restore_checkpoint() -> PiggyPose:
	space = _checkpoint.space
	body.restore(_checkpoint.body)
	return _checkpoint.piggy_pose


func reach_back_door() -> void:
	has_ended = true


## Which end card the night ends on, by humanity now.
func ending() -> Hallucinations.Ending:
	return hallucinations.ending(body.humanity)


## The Piggy can see the lying objects named in `in_view` for `delta` seconds; the rest
## may change what they show.
func look(delta: float, in_view: Array[StringName]) -> void:
	hallucinations.advance(delta, body.humanity, in_view)


## A footstep every footstep_seconds while moving; the first comes as soon as they move.
func _step_feet(delta: float, gait: PiggyNoise.Gait, at: Vector3) -> void:
	if gait == PiggyNoise.Gait.STILL:
		_footstep_seconds_left = 0.0
		return
	_footstep_seconds_left -= delta
	if _footstep_seconds_left > 0.0:
		return
	_footstep_seconds_left += _tuning.footstep_seconds
	_make_noise(PiggyNoise.footstep(gait, at, _tuning))


func _make_noise(noise: PiggyNoise) -> void:
	if noise == null:
		return
	noise_made.emit(noise)
	var heard := noise.heard_at(mum.position, _distances, _tuning.noise_cut_per_barrier)
	if heard != null:
		noise_heard.emit(heard)
		mum.hear(noise.position)
