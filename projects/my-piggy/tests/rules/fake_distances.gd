class_name FakeDistances
extends DistanceProvider
## A house for the tests: sounds travel in a straight line, through however many closed
## doors and walls the test says, and the view is clear unless the test blocks it.

var barriers: int = 0
var view_blocked: bool = false


func sound_path(from: Vector3, to: Vector3) -> SoundPath:
	return SoundPath.new(from.distance_to(to), barriers)


func walking_distance(from: Vector3, to: Vector3) -> float:
	return from.distance_to(to)


func has_clear_view(_from: Vector3, _to: Vector3) -> bool:
	return not view_blocked
