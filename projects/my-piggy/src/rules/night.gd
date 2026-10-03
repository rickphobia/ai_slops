class_name Night
extends RefCounted
## One playthrough, from waking up in the bedroom to an ending.
## Pure rules: no scene tree, nodes, physics, rendering or audio. The adapters say which
## space the Piggy is in, what the player is doing and when they reach the back door;
## the Night decides the rest.

const FIRST_SPACE: StringName = &"bedroom"

var space: StringName = FIRST_SPACE
var step: int = 0
var has_ended: bool = false
## The Piggy's body: urge and the hidden humanity. Read it; change it through the Night.
var body: Body

var _checkpoint: Checkpoint


## The Piggy wakes in the bedroom at this pose, which is also the first checkpoint.
## The rng decides which outbursts come; tests pass a seeded one.
func _init(
	wake_pose: PiggyPose, tuning: Tuning, rng: RandomNumberGenerator = RandomNumberGenerator.new()
) -> void:
	body = Body.new(tuning, rng)
	_checkpoint = Checkpoint.new(FIRST_SPACE, wake_pose, body.state())


## Moves the night on by one step of `delta` seconds. Returns what the body did.
func advance(delta: float, trotting: bool, suppress_held: bool, at: Vector3) -> Array[BodyEvent]:
	step += 1
	if has_ended:
		return [] as Array[BodyEvent]
	return body.advance(delta, trotting, suppress_held, at)


## Starts giving in at a give-in spot. Returns the event, or null if the spot was used
## since the last checkpoint or the Piggy is already giving in.
func give_in(spot: StringName, at: Vector3) -> BodyEvent:
	if has_ended:
		return null
	return body.give_in(spot, at)


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
