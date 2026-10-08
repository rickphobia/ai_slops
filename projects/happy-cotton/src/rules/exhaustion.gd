class_name Exhaustion
extends RefCounted
## How worn down the Worker is, from 0 (rested) to MOST (spent), and the floor rest can never
## take it below. Work adds to it, rest takes it away down to the floor, and the floor only
## rises. It also answers what Exhaustion does to him: slow field work, dropped cotton and
## fewer laps before he stops to breathe, all at the tuning table's thresholds. Farm owns this
## and decides when; tested through Farm, not on its own.

const MOST := 100.0

var _tuning: Tuning
var _level := 0.0
var _floor := 0.0


func _init(tuning: Tuning) -> void:
	_tuning = tuning


func level() -> float:
	return _level


func floor_level() -> float:
	return _floor


func add(amount: float) -> void:
	_level = minf(MOST, _level + amount)


## Lowers Exhaustion by up to `amount`, never below the floor. Returns how much it fell.
func recover(amount: float) -> float:
	var before := _level
	_level = maxf(_floor, _level - amount)
	return before - _level


## The floor never falls, and Exhaustion below it is lifted to it.
func raise_floor(amount: float) -> void:
	_floor = minf(MOST, _floor + amount)
	_level = maxf(_level, _floor)


func to_save() -> Dictionary:
	return {"level": _level, "floor": _floor}


## Takes Exhaustion and its floor from a save, each held to MOST, and never below the floor.
func restore(reader: SaveReader) -> void:
	_floor = minf(MOST, reader.number("floor"))
	_level = clampf(reader.number("level"), _floor, MOST)


func slows_work() -> bool:
	return _level > _tuning.slow_exhaustion


func can_drop_cotton() -> bool:
	return _level > _tuning.mistake_exhaustion


## Laps he can run before he stops to breathe, falling in step with Exhaustion from the
## tuning's laps_before_breath to its fewest.
func laps_before_breath() -> int:
	return roundi(
		lerpf(_tuning.laps_before_breath, _tuning.fewest_laps_before_breath, _level / MOST)
	)
