class_name ShiftView
extends RefCounted
## A read-only snapshot of the current Shift, for The App to show. Changing the Farm never
## changes a view already handed out; ask the Farm for a new one.

## Counts from 1.
var number: int:
	get:
		return _number
var quota: int:
	get:
		return _quota
## Cotton picked so far this Shift.
var picked: int:
	get:
		return _picked
## Seconds of online play until the Quota is checked.
var seconds_left: float:
	get:
		return _seconds_left

var _number: int
var _quota: int
var _picked: int
var _seconds_left: float


func _init(shift_number: int, shift_quota: int, shift_picked: int, shift_left: float) -> void:
	_number = shift_number
	_quota = shift_quota
	_picked = shift_picked
	_seconds_left = shift_left
