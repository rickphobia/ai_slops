class_name Checkpoint
extends RefCounted
## The saved state taken when the Piggy enters a space. Restoring it puts everything
## back to how it was then. Later tickets add the body (urge, humanity) and Mum.

var space: StringName
var piggy_pose: PiggyPose


func _init(entered: StringName, pose: PiggyPose) -> void:
	space = entered
	piggy_pose = pose
