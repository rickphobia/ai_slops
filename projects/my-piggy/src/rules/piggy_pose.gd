class_name PiggyPose
extends RefCounted
## Where the Piggy is and which way they face: what a checkpoint puts back.
## Plain values, no scene tree. Treat it as read-only once made.

var position: Vector3
## Turn left/right around the vertical axis, in radians.
var yaw: float
## Look up/down, in radians.
var pitch: float


func _init(at_position: Vector3, at_yaw: float, at_pitch: float) -> void:
	position = at_position
	yaw = at_yaw
	pitch = at_pitch
