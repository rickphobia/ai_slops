class_name FakeDistances
extends DistanceProvider
## A house for the tests: sounds travel in a straight line, through however many closed
## doors and walls the test says.

var barriers: int = 0


func sound_path(from: Vector3, to: Vector3) -> SoundPath:
	return SoundPath.new(from.distance_to(to), barriers)
