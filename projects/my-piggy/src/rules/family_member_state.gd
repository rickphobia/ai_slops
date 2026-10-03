class_name FamilyMemberState
extends RefCounted
## A family member's part of a checkpoint: what restoring puts back. Read-only once made.

var alert: FamilyBrain.Alert
var target: Vector3
var position: Vector3
var facing: Vector3
var search_seconds_left: float


func _init(
	at_alert: FamilyBrain.Alert,
	at_target: Vector3,
	at_position: Vector3,
	at_facing: Vector3,
	seconds_left: float,
) -> void:
	alert = at_alert
	target = at_target
	position = at_position
	facing = at_facing
	search_seconds_left = seconds_left
