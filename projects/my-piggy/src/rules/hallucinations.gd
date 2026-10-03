class_name Hallucinations
extends RefCounted
## What the game shows and plays that isn't real, chosen by humanity. Pure rules.
## A lying object (a slop bowl, the mirror, the back-door glass) only changes what it
## shows while the Piggy isn't looking at it, so the player is never sure it changed.
## The one exception is the mirror's flicker: the old body it shows at high humanity gives
## way to the pig after mirror_old_body_seconds of looking. That flicker is the truth
## arriving, not a new lie.
## Each space of the house rots the same way: its rot stage only changes while the Piggy
## can't see into it, except when a checkpoint is restored (put_rot_back).

enum Kind { SLOP_BOWL, MIRROR, DOOR_GLASS }
enum Shows { SLOP, SNACKS, OLD_BODY, PIG_BODY }
enum Breathing { HUMAN, SNOUTY, PIG }
enum Ending { HUMAN, PIG }
enum Rot { COSY, SOURED, GROTESQUE }

var _tuning: Tuning
## Per object name: its Kind, what it shows, and how long it has been in view.
var _kinds: Dictionary[StringName, Kind] = {}
var _shows: Dictionary[StringName, Shows] = {}
var _seconds_in_view: Dictionary[StringName, float] = {}
## Per space name: its rot stage.
var _rot: Dictionary[StringName, Rot] = {}


func _init(tuning: Tuning) -> void:
	_tuning = tuning


## Adds a lying object, showing what it would at this humanity.
func add(object: StringName, kind: Kind, humanity: float) -> void:
	_kinds[object] = kind
	_shows[object] = _lie_for(kind, humanity)
	_seconds_in_view[object] = 0.0


## Moves on by `delta` seconds. `in_view` names the objects the Piggy can see right now;
## every other object is out of view and may change.
func advance(delta: float, humanity: float, in_view: Array[StringName]) -> void:
	for object: StringName in _kinds:
		if not in_view.has(object):
			_shows[object] = _lie_for(_kinds[object], humanity)
			_seconds_in_view[object] = 0.0
			continue
		_seconds_in_view[object] += delta
		var flickers := _kinds[object] == Kind.MIRROR and _shows[object] == Shows.OLD_BODY
		if flickers and _seconds_in_view[object] >= _tuning.mirror_old_body_seconds:
			_shows[object] = Shows.PIG_BODY


## Adds a space of the house, rotted as far as this humanity says.
func add_space(space: StringName, humanity: float) -> void:
	_rot[space] = rot_for(humanity)


## `in_view` names the spaces the Piggy can see into right now; every other space takes
## the rot stage of this humanity.
func look_at_spaces(humanity: float, in_view: Array[StringName]) -> void:
	for space: StringName in _rot:
		if not in_view.has(space):
			_rot[space] = rot_for(humanity)


## Every space takes the rot stage of this humanity, seen or not. For a restored checkpoint:
## the capture scene has just hidden the house, so nothing changes in plain view.
func put_rot_back(humanity: float) -> void:
	for space: StringName in _rot:
		_rot[space] = rot_for(humanity)


func rot(space: StringName) -> Rot:
	return _rot[space]


## The spaces added so far, in the order they were added.
func spaces() -> Array[StringName]:
	return _rot.keys()


func rot_for(humanity: float) -> Rot:
	if humanity < _tuning.rot_grotesque_below_humanity:
		return Rot.GROTESQUE
	if humanity < _tuning.rot_soured_below_humanity:
		return Rot.SOURED
	return Rot.COSY


func shows(object: StringName) -> Shows:
	return _shows[object]


## How strong pig vision is: 0 at full humanity, 1 at pig_vision_full_at_humanity and below.
func pig_vision(humanity: float) -> float:
	var full_at := _tuning.pig_vision_full_at_humanity
	return clampf((100.0 - humanity) / (100.0 - full_at), 0.0, 1.0)


## Which set the Piggy's breathing and heartbeat play from.
func breathing(humanity: float) -> Breathing:
	if humanity < _tuning.pig_breathing_below_humanity:
		return Breathing.PIG
	if humanity < _tuning.snouty_breathing_below_humanity:
		return Breathing.SNOUTY
	return Breathing.HUMAN


## Which end card the night ends on: human while reflections still show the old body.
func ending(humanity: float) -> Ending:
	if humanity < _tuning.mirror_pig_only_below_humanity:
		return Ending.PIG
	return Ending.HUMAN


func _lie_for(kind: Kind, humanity: float) -> Shows:
	if kind == Kind.SLOP_BOWL:
		return Shows.SNACKS if humanity < _tuning.snacks_below_humanity else Shows.SLOP
	return Shows.OLD_BODY if ending(humanity) == Ending.HUMAN else Shows.PIG_BODY
