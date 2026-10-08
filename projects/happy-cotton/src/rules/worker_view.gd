class_name WorkerView
extends RefCounted
## A read-only snapshot of what the Worker is doing and how worn down he is, for the field to
## show. Changing the Farm never changes a view already handed out; ask the Farm for a new one.

## In the field (planting, picking, or taken off the Generator by a Study Session), running
## on the Generator, stopped on it to breathe, or on a rest hour.
enum Activity { IN_FIELD, RUNNING, BREATHING, RESTING }

var activity: Activity:
	get:
		return _activity
## Laps he will run before he stops to breathe, counting the one he is on.
var laps_left: int:
	get:
		return _laps_left
## From 0 (rested) to Exhaustion.MOST (spent).
var exhaustion: float:
	get:
		return _exhaustion

var _activity: Activity
var _laps_left: int
var _exhaustion: float


func _init(worker_activity: Activity, worker_laps_left: int, worker_exhaustion := 0.0) -> void:
	_activity = worker_activity
	_laps_left = worker_laps_left
	_exhaustion = worker_exhaustion
