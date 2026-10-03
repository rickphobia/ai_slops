class_name Checkpoint
extends RefCounted
## The saved state taken when the Piggy enters a space. Restoring it puts everything
## back to how it was then: the Piggy and their body. Mum is not kept: the Night puts her
## back on her route out of sight (RouteSpot), so a checkpoint taken mid-chase does not
## restart the chase.

var space: StringName
var piggy_pose: PiggyPose
var body: BodyState


func _init(entered: StringName, pose: PiggyPose, body_state: BodyState) -> void:
	space = entered
	piggy_pose = pose
	body = body_state
