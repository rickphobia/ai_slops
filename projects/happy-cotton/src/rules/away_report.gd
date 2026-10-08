class_name AwayReport
extends RefCounted
## What one return from offline time did, for the entrypoint to log. The App's away summary
## comes out of Farm.take_messages() as usual; this adds what only the log needs.

## Seconds offline as the clock reported them, before the rules made them safe.
var seconds_away: float:
	get:
		return _seconds_away
## Seconds the rules counted: never below 0 and never above the tuning's offline cap.
var seconds_counted: float:
	get:
		return _seconds_counted
## &"" when the clock's time was used as given; otherwise Farm.NEGATIVE_OFFLINE_TIME or
## Farm.OFFLINE_TIME_CAPPED.
var clock_problem: StringName:
	get:
		return _clock_problem
## Plots that ripened while away.
var ripened: int:
	get:
		return _ripened
## Seconds of Study Session served while away.
var study_seconds_served: float:
	get:
		return _study_seconds_served

var _seconds_away: float
var _seconds_counted: float
var _clock_problem: StringName
var _ripened: int
var _study_seconds_served: float


func _init(
	away: float, counted: float, problem: StringName, ripened_plots: int, study_served: float
) -> void:
	_seconds_away = away
	_seconds_counted = counted
	_clock_problem = problem
	_ripened = ripened_plots
	_study_seconds_served = study_served
