class_name Checkpoint
extends RefCounted
## The saved state taken when the Piggy enters a space. Restoring it puts everything
## back to how it was then: the Piggy, their body and Mum.

var space: StringName
var piggy_pose: PiggyPose
var body: BodyState
var mum: FamilyMemberState


func _init(
	entered: StringName, pose: PiggyPose, body_state: BodyState, mum_state: FamilyMemberState
) -> void:
	space = entered
	piggy_pose = pose
	body = body_state
	mum = mum_state
