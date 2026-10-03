class_name BodyState
extends RefCounted
## The body's part of a checkpoint: what restoring puts back. Read-only once made.

var urge: float
var humanity: float
## The urge rise rate multiplier from suppressed outbursts (1.0 means none yet).
var rise_multiplier: float
var used_spots: Array[StringName]


func _init(
	at_urge: float, at_humanity: float, at_rise_multiplier: float, spots: Array[StringName]
) -> void:
	urge = at_urge
	humanity = at_humanity
	rise_multiplier = at_rise_multiplier
	used_spots = spots.duplicate()
