class_name HouseDistances
extends DistanceProvider
## How a sound gets through the house: the path distance over the walkable area, and the
## closed doors and walls on the straight line between the two points (what the sound
## would have to pass through). The only part of hearing that uses Godot. Also whether
## Mum's torch has a clear view of the Piggy: the only part of her sight that uses Godot.

## Sounds are traced at about head height, so the floor and low furniture don't count as walls.
const EAR_HEIGHT := 1.0
## Mum holds her torch at about chest height; she looks for the Piggy's low body.
const TORCH_HEIGHT := 1.3
const PIGGY_BODY_HEIGHT := 0.4
## A ray that hits a barrier carries on from just past where it hit.
const PAST_HIT := 0.01
## A ray never counts more barriers than this (the house has far fewer between any two points).
const MOST_BARRIERS := 8

## Bodies that are not barriers: the Piggy's and Mum's own. Set by main.
var ignored: Array[RID] = []

var _world: World3D
var _map: RID


func _init(world: World3D, navigation_map: RID) -> void:
	_world = world
	_map = navigation_map


func sound_path(from: Vector3, to: Vector3) -> SoundPath:
	var path := NavigationServer3D.map_get_path(_map, from, to, true)
	# Before the walkable area reaches the map (the first frames) there is no path at all.
	if path.is_empty():
		return SoundPath.new(INF, 0)
	var distance := from.distance_to(path[0]) + path[path.size() - 1].distance_to(to)
	for index in range(1, path.size()):
		distance += path[index - 1].distance_to(path[index])
	return SoundPath.new(distance, _barriers_between(from, to))


## A ray from the torch to the Piggy's body; walls, closed doors and furniture block it.
func has_clear_view(from: Vector3, to: Vector3) -> bool:
	var query := PhysicsRayQueryParameters3D.create(
		from + Vector3.UP * TORCH_HEIGHT, to + Vector3.UP * PIGGY_BODY_HEIGHT
	)
	query.exclude = ignored
	return _world.direct_space_state.intersect_ray(query).is_empty()


## Rays ignore surfaces they start inside, so a ray carried on from just past a hit goes
## through that wall or door and stops at the next one: each is counted once.
func _barriers_between(from: Vector3, to: Vector3) -> int:
	var space := _world.direct_space_state
	var start := from + Vector3.UP * EAR_HEIGHT
	var end := to + Vector3.UP * EAR_HEIGHT
	var direction := (end - start).normalized()
	var count := 0
	while count < MOST_BARRIERS:
		var query := PhysicsRayQueryParameters3D.create(start, end)
		query.exclude = ignored
		var hit := space.intersect_ray(query)
		if hit.is_empty():
			break
		count += 1
		var hit_at: Vector3 = hit["position"]
		start = hit_at + direction * PAST_HIT
	return count
