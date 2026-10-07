class_name WorkerView
extends RefCounted
## A read-only snapshot of what the Worker is doing, for the field to show. Changing the Farm
## never changes a view already handed out; ask the Farm for a new one.

## In the field (planting, picking, or taken off the Generator by a Study Session), running
## on the Generator, or stopped on it to breathe.
enum Activity { IN_FIELD, RUNNING, BREATHING }

var activity: Activity:
	get:
		return _activity
## Laps he will run before he stops to breathe, counting the one he is on.
var laps_left: int:
	get:
		return _laps_left

var _activity: Activity
var _laps_left: int


func _init(worker_activity: Activity, worker_laps_left: int) -> void:
	_activity = worker_activity
	_laps_left = worker_laps_left
