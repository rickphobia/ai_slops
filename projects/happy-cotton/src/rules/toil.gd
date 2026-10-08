class_name Toil
extends RefCounted
## The Worker on the Generator: whether he is on it, how far into his run he is, and his breath
## when he stops. Running adds Exhaustion lap by lap, and how many laps a run lasts is set by
## his Exhaustion when it starts, so a tired Worker stops sooner. His breath ends with the
## Overseer: a whistle after a set time, then the whip after a further set time, and he runs
## again. Farm owns this and decides when time passes and when he is sent or brought back;
## tested through Farm, not on its own.

## What pass_time() returns: the Overseer blew his whistle at the Worker stopped to breathe,
## used the whip (and the Worker runs again), or did nothing.
const WHISTLE := &"overseer_whistle"
const WHIP := &"overseer_whip"
const NO_EVENT := &""

var _tuning: Tuning
var _exhaustion: Exhaustion
var _on_generator := false
## Seconds run since his last breath or rest. Leaving the Generator doesn't reset this.
var _run_since_breath := 0.0
## Seconds left of his breath; while above 0 on the Generator, he stands and crops halt. The
## whistle comes when it falls to whip_after_seconds, the whip when it reaches 0.
var _breath_left := 0.0
## Laps this run lasts, set when it starts.
var _laps_this_run: int
## Laps finished since take_laps_run() last emptied the count: the electricity Bill's laps.
var _laps_run := 0


func _init(tuning: Tuning, exhaustion: Exhaustion) -> void:
	_tuning = tuning
	_exhaustion = exhaustion
	_laps_this_run = exhaustion.laps_before_breath()


func send() -> void:
	_on_generator = true


func bring_back() -> void:
	_on_generator = false


## A rest is a real break: his next run starts fresh, as long as his Exhaustion now allows.
func rested() -> void:
	_run_since_breath = 0.0
	_breath_left = 0.0
	_laps_this_run = _exhaustion.laps_before_breath()


func to_save() -> Dictionary:
	return {
		"on_generator": _on_generator,
		"run_since_breath": _run_since_breath,
		"breath_left": _breath_left,
		"laps_this_run": _laps_this_run,
		"laps_run": _laps_run,
	}


## Takes his place and run from a save. The run and breath are held to what the tuning table
## allows now, in case it shortened them since the save was written. A save from before the
## Bills (`has_laps_run` false) restores with no laps counted.
func restore(reader: SaveReader, has_laps_run: bool) -> void:
	_on_generator = reader.flag("on_generator")
	_laps_this_run = reader.whole("laps_this_run", 1)
	_run_since_breath = minf(reader.number("run_since_breath"), _run_seconds())
	_breath_left = minf(reader.number("breath_left"), _breath_seconds())
	if has_laps_run:
		_laps_run = reader.whole("laps_run")


## The laps he has finished since the last call, and starts counting again from zero.
func take_laps_run() -> int:
	var laps := _laps_run
	_laps_run = 0
	return laps


func is_running() -> bool:
	return _on_generator and _breath_left <= 0.0


func is_breathing() -> bool:
	return _on_generator and _breath_left > 0.0


## Laps he will run before he stops to breathe, counting the one he is on.
func laps_left() -> int:
	return _laps_this_run - floori(_run_since_breath / _tuning.lap_seconds)


## How far through his current lap he is, from 0 up to (not including) 1.
func lap_progress() -> float:
	return fmod(_run_since_breath, _tuning.lap_seconds) / _tuning.lap_seconds


## Seconds until he stops to breathe, the Overseer whistles, or the whip sends him running
## again; INF while he is off the Generator.
func seconds_until_turn() -> float:
	if not _on_generator:
		return INF
	if _breath_left > _tuning.whip_after_seconds:
		return _breath_left - _tuning.whip_after_seconds
	if _breath_left > 0.0:
		return _breath_left
	return _run_seconds() - _run_since_breath


## Some seconds of his time outside a Study Session, never past the next turn. The crops'
## growth for them is the caller's. Returns WHISTLE or WHIP if the
## Overseer acted at the end of them, NO_EVENT otherwise. The whip changes no numbers.
func pass_time(seconds: float) -> StringName:
	if not _on_generator:
		return NO_EVENT
	if _breath_left > 0.0:
		var whistle_due := _breath_left - _tuning.whip_after_seconds
		if whistle_due > 0.0:
			if seconds >= whistle_due:
				_breath_left = _tuning.whip_after_seconds
				return WHISTLE
			_breath_left -= seconds
			return NO_EVENT
		if seconds >= _breath_left:
			_breath_left = 0.0
			return WHIP
		_breath_left -= seconds
		return NO_EVENT
	_exhaustion.add(_tuning.exhaustion_per_lap * seconds / _tuning.lap_seconds)
	var laps_before := floori(_run_since_breath / _tuning.lap_seconds)
	if seconds >= _run_seconds() - _run_since_breath:
		_laps_run += _laps_this_run - laps_before
		_run_since_breath = 0.0
		_breath_left = _breath_seconds()
		_laps_this_run = _exhaustion.laps_before_breath()
	else:
		_run_since_breath += seconds
		_laps_run += floori(_run_since_breath / _tuning.lap_seconds) - laps_before
	return NO_EVENT


## His whole breath: until the whistle, then until the whip.
func _breath_seconds() -> float:
	return _tuning.whistle_after_seconds + _tuning.whip_after_seconds


func _run_seconds() -> float:
	return _tuning.lap_seconds * _laps_this_run
