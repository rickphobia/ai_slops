class_name PointerGesture
extends RefCounted
## The fingers (or the mouse) on the field, in screen units, from the first press until the
## last release. Decides whether a release was a tap: only a single pointer that never moved
## further than the tap slop from where it was pressed. A drag or a pinch is never a tap, so
## moving the view never plants or picks.

## How far a pointer may move, in viewport units, and still count as a tap.
var tap_slop: float

var _positions: Dictionary[int, Vector2] = {}
var _pressed_at := Vector2.ZERO
## False once the gesture has moved too far or used a second pointer; stays false until
## every pointer is lifted.
var _may_tap := false


func _init(slop: float) -> void:
	tap_slop = slop


func press(pointer: int, position: Vector2) -> void:
	if _positions.is_empty():
		_pressed_at = position
		_may_tap = true
	else:
		_may_tap = false
	_positions[pointer] = position


func move(pointer: int, position: Vector2) -> void:
	if not _positions.has(pointer):
		return
	_positions[pointer] = position
	if position.distance_to(_pressed_at) > tap_slop:
		_may_tap = false


## Lifts a pointer; true when this release ends a tap.
func release(pointer: int) -> bool:
	if not _positions.has(pointer):
		return false
	_positions.erase(pointer)
	return _positions.is_empty() and _may_tap


## The system took the pointer away (a call, a gesture of the browser's own): never a tap.
func cancel(pointer: int) -> void:
	_positions.erase(pointer)
	_may_tap = false


func pointer_count() -> int:
	return _positions.size()


func is_pressed(pointer: int) -> bool:
	return _positions.has(pointer)


## The point between all pointers: the one pointer itself, or the middle of a pinch.
func midpoint() -> Vector2:
	if _positions.is_empty():
		return Vector2.ZERO
	var total := Vector2.ZERO
	for position: Vector2 in _positions.values():
		total += position
	return total / _positions.size()


## How far apart the first two pointers are; 0 with fewer than two.
func spread() -> float:
	if _positions.size() < 2:
		return 0.0
	var positions: Array[Vector2] = []
	positions.assign(_positions.values())
	return positions[0].distance_to(positions[1])
