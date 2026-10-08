class_name RestHourView
extends RefCounted
## A read-only snapshot of the rest hour, the first Privilege, for The App to show. Changing the
## Farm never changes a view already handed out; ask the Farm for a new one.

## Labour Points a rest hour costs.
var price: int:
	get:
		return _price
## Seconds left of the rest hour; 0 when he isn't resting.
var seconds_left: float:
	get:
		return _seconds_left
## Whether a missed Quota has taken the rest hour away for this Shift.
var taken_away: bool:
	get:
		return _taken_away

var _price: int
var _seconds_left: float
var _taken_away: bool


func _init(rest_price: int, rest_left: float, rest_taken_away: bool) -> void:
	_price = rest_price
	_seconds_left = rest_left
	_taken_away = rest_taken_away
