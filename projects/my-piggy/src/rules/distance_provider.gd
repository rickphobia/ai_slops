class_name DistanceProvider
extends RefCounted
## The one question hearing asks of the house: how does a sound get from here to there?
## The house adapter (HouseDistances) answers it with the walkable area; tests pass a fake.
## This base has no house, so nothing is ever in reach.


func sound_path(_from: Vector3, _to: Vector3) -> SoundPath:
	return SoundPath.new(INF, 0)
