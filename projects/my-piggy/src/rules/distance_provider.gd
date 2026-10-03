class_name DistanceProvider
extends RefCounted
## The questions hearing and sight ask of the house: how does a sound get from here to
## there, and is anything in the way between two points? The house adapter
## (HouseDistances) answers them with the walkable area and physics; tests pass a fake.
## This base has no house, so nothing is ever in reach or in view.


func sound_path(_from: Vector3, _to: Vector3) -> SoundPath:
	return SoundPath.new(INF, 0)


## True when nothing solid (walls, closed doors, furniture) is between the two points.
func has_clear_view(_from: Vector3, _to: Vector3) -> bool:
	return false
