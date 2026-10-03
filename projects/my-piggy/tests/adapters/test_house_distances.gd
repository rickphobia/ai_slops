extends GutTest
## How far a sound travels through the real house, and through how many doors and walls;
## and whether the torch can see from one point to another.

const HOUSE_SCENE := preload("res://src/adapters/house.tscn")
const BEDROOM_MIDDLE := Vector3(0.0, 0.0, 0.0)
const BEDROOM_CORNER := Vector3(2.0, 0.0, 2.0)
const HALLWAY_MIDDLE := Vector3(0.0, 0.0, -10.0)
const KITCHEN_CORNER := Vector3(3.0, 0.0, -22.0)

var _distances: HouseDistances


func before_each() -> void:
	var house: House = add_child_autofree(HOUSE_SCENE.instantiate())
	house.setup(NightTestTuning.table())
	var map := house.walkable().get_navigation_map()
	_distances = HouseDistances.new(house.get_world_3d(), map)
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
