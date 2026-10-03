class_name Night
extends RefCounted
## One playthrough, from waking up in the bedroom to an ending.
## Pure rules: no scene tree, nodes, physics, rendering or audio. The adapters say which
## space the Piggy is in and when they reach the back door; the Night decides the rest.

const FIRST_SPACE: StringName = &"bedroom"

var space: StringName = FIRST_SPACE
var step: int = 0
var has_ended: bool = false

var _checkpoint: Checkpoint


## The Piggy wakes in the bedroom at this pose, which is also the first checkpoint.
func _init(wake_pose: PiggyPose) -> void:
	_checkpoint = Checkpoint.new(FIRST_SPACE, wake_pose)


func advance() -> void:
	step += 1


## Tells the Night which space the Piggy is in now. Moving into a different space takes
## a checkpoint at this pose. Returns true when a checkpoint was taken.
func enter_space(entered: StringName, pose: PiggyPose) -> bool:
	if has_ended or entered == space:
		return false
	space = entered
	_checkpoint = Checkpoint.new(entered, pose)
	return true


## Puts the night back to the last checkpoint. Returns where and how the Piggy must be
## put back; the caller moves them there.
func restore_checkpoint() -> PiggyPose:
	space = _checkpoint.space
	return _checkpoint.piggy_pose


func reach_back_door() -> void:
	has_ended = true
