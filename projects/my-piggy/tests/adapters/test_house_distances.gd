extends GutTest
## How far a sound travels through the real house, and through how many doors and walls;
## and whether the torch can see from one point to another. Also where Mum starts again
## after a catch in the real house, with the game's own tuning table.

const HOUSE_SCENE := preload("res://src/adapters/house.tscn")
const BEDROOM_MIDDLE := Vector3(0.0, 0.0, 0.0)
const BEDROOM_CORNER := Vector3(2.0, 0.0, 2.0)
const HALLWAY_MIDDLE := Vector3(0.0, 0.0, -10.0)
const KITCHEN_CORNER := Vector3(3.0, 0.0, -22.0)
## Where the Piggy stands when each space's checkpoint is taken: just through each doorway.
const SPACE_ENTRIES: Array[Vector3] = [
	Vector3(0.0, 0.0, -4.3),
	Vector3(0.0, 0.0, -16.3),
	Vector3(0.0, 0.0, -15.9),
	Vector3(0.0, 0.0, -3.9),
]
## No route point is this close to a checkpoint, so she never restarts on top of the Piggy.
const ROUTE_CLEAR_OF_ENTRIES := 3.0

var _distances: HouseDistances
var _house: House


func before_each() -> void:
	_house = add_child_autofree(HOUSE_SCENE.instantiate())
	_house.setup(NightTestTuning.table())
	var map := _house.walkable().get_navigation_map()
	_distances = HouseDistances.new(_house.get_world_3d(), map)
	# The walkable area reaches the navigation map on a later physics frame, not a fixed one.
	await wait_until(
		func() -> bool: return _distances.sound_path(BEDROOM_MIDDLE, HALLWAY_MIDDLE).distance < INF,
		2.0
	)


func test_within_one_room_a_sound_goes_straight_through_nothing() -> void:
	var path := _distances.sound_path(BEDROOM_MIDDLE, BEDROOM_CORNER)

	assert_eq(path.barriers, 0)
	# The walkable area keeps clear of furniture, so the path bends a little.
	assert_almost_eq(path.distance, BEDROOM_MIDDLE.distance_to(BEDROOM_CORNER), 1.0)


func test_the_closed_bedroom_door_is_between_the_bedroom_and_the_hallway() -> void:
	var path := _distances.sound_path(BEDROOM_MIDDLE, HALLWAY_MIDDLE)

	assert_eq(path.barriers, 1)


func test_from_the_bedroom_to_the_kitchen_the_path_goes_round_through_the_doors() -> void:
	var path := _distances.sound_path(BEDROOM_CORNER, KITCHEN_CORNER)

	assert_gt(path.distance, BEDROOM_CORNER.distance_to(KITCHEN_CORNER))
	assert_gte(path.barriers, 2, "walls and doors between two rooms apart")


func test_across_an_open_room_the_torch_has_a_clear_view() -> void:
	assert_true(_distances.has_clear_view(BEDROOM_MIDDLE, BEDROOM_CORNER))


func test_the_closed_bedroom_door_blocks_the_view_into_the_hallway() -> void:
	assert_false(_distances.has_clear_view(HALLWAY_MIDDLE, BEDROOM_MIDDLE))


func test_walking_distance_is_the_path_a_sound_takes() -> void:
	var walk := _distances.walking_distance(BEDROOM_CORNER, KITCHEN_CORNER)

	assert_eq(walk, _distances.sound_path(BEDROOM_CORNER, KITCHEN_CORNER).distance)


func test_no_point_of_mums_route_is_near_where_a_checkpoint_is_taken() -> void:
	for entry in _checkpoints():
		for point in _house.mum_route():
			var apart := Vector2(point.x, point.z).distance_to(Vector2(entry.x, entry.z))
			assert_gte(apart, ROUTE_CLEAR_OF_ENTRIES, "route point %s near %s" % [point, entry])


func test_after_a_catch_at_any_checkpoint_mum_starts_far_away_and_out_of_sight() -> void:
	var tuning := Tuning.load_file("res://data/tuning.tres")
	for entry in _checkpoints():
		var spot := RouteSpot.out_of_sight(_house.mum_route(), entry, tuning, _distances)

		var away := _distances.walking_distance(spot.position, entry)
		assert_gte(away, tuning.mum_restart_distance, "far enough from %s" % entry)
		assert_false(
			TorchSight.sees(spot.position, spot.facing, entry, tuning, _distances),
			"out of sight of %s" % entry
		)


func _checkpoints() -> Array[Vector3]:
	var all := SPACE_ENTRIES.duplicate()
	all.append(_house.piggy_spawn().global_position)
	return all
