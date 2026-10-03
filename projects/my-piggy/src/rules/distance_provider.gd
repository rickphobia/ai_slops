class_name DistanceProvider
extends RefCounted
## The questions hearing and sight ask of the house: how does a sound get from here to
## there, how far is it on foot, and is anything in the way between two points? The house adapter
## (HouseDistances) answers them with the walkable area and physics; tests pass a fake.
## This base has no house, so nothing is ever in reach or in view.


func sound_path(_from: Vector3, _to: Vector3) -> SoundPath:
	return SoundPath.new(INF, 0)


## How far it is to walk from one point to the other over the walkable area, in metres;
## INF when there is no way through.
func walking_distance(_from: Vector3, _to: Vector3) -> float:
	return INF


## True when nothing solid (walls, closed doors, furniture) is between the two points.
func has_clear_view(_from: Vector3, _to: Vector3) -> bool:
	return false
