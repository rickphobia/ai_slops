extends GutTest
## The house: which space a point is in, the back door, the named markers later tickets
## attach to, the walkable area Mum will path over, and doors that creak when pushed.

const HOUSE_SCENE := preload("res://src/adapters/house.tscn")
const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")
## Close enough to call a path finished: the walkable area stops short of walls.
const ARRIVED_WITHIN := 0.6

var _creaks: Array[float] = []


func _tuning() -> Tuning:
	var tuning := Tuning.new()
	tuning.walk_speed = 2.0
	tuning.mouse_sensitivity = 0.003
	tuning.door_creak_quietest_radius = 2.0
	tuning.door_creak_loudest_radius = 8.0
	tuning.door_creak_loudest_speed = 3.0
	return tuning


func _house() -> House:
	var house: House = add_child_autofree(HOUSE_SCENE.instantiate())
	house.setup(_tuning())
	_creaks = []
	house.door_creaked.connect(func(radius: float, _at: Vector3) -> void: _creaks.append(radius))
	return house


func _marker(house: House, path: String) -> Vector3:
	var marker: Marker3D = house.get_node("Markers/" + path)
	return marker.global_position


func test_the_piggy_wakes_in_the_bedroom() -> void:
	var house := _house()

	assert_eq(house.space_at(house.piggy_spawn().global_position), &"bedroom")


func test_the_mirror_is_in_the_hallway_and_the_bowls_and_bin_are_in_their_rooms() -> void:
	var house := _house()

	assert_eq(house.space_at(_marker(house, "GiveInSpots/BedroomBowl")), &"bedroom")
	assert_eq(house.space_at(_marker(house, "HallwayMirror")), &"hallway")
	assert_eq(house.space_at(_marker(house, "GiveInSpots/KitchenSlopBowl")), &"kitchen")
	assert_eq(house.space_at(_marker(house, "GiveInSpots/KitchenBin")), &"kitchen")


func test_every_marker_later_tickets_need_is_there() -> void:
	var house := _house()

	for path: String in [
		"PiggySpawn",
		"GiveInSpots/BedroomBowl",
		"GiveInSpots/KitchenSlopBowl",
		"GiveInSpots/KitchenBin",
		"HallwayMirror",
		"BackDoorGlass",
		"MumStart",
	]:
		assert_true(house.get_node_or_null("Markers/" + path) is Marker3D, path)
	assert_gt(house.get_node("Markers/MumRoute").get_child_count(), 1, "Mum's route has points")


func test_only_the_spot_in_front_of_the_back_door_ends_the_night() -> void:
	var house := _house()

	assert_true(house.is_at_back_door(house.back_door_exit()))
	assert_false(house.is_at_back_door(_marker(house, "GiveInSpots/KitchenBin")))
	assert_false(house.is_at_back_door(house.piggy_spawn().global_position))


func test_mum_can_walk_from_her_start_along_her_route_and_into_the_bedroom() -> void:
	var house := _house()
	var map := house.walkable().get_navigation_map()
	var stops: Array[Vector3] = [_marker(house, "MumStart")]
	for point: Marker3D in house.get_node("Markers/MumRoute").get_children():
		stops.append(point.global_position)
	stops.append(house.piggy_spawn().global_position)
	# The walkable area reaches the navigation map on a later physics frame, not a fixed one.
	await wait_until(
		func() -> bool:
			return NavigationServer3D.map_get_path(map, stops[0], stops[1], true).size() > 0,
		2.0
	)

	for index in range(1, stops.size()):
		var path := NavigationServer3D.map_get_path(map, stops[index - 1], stops[index], true)
		assert_gt(path.size(), 0, "path to stop %d" % index)
		if path.size() > 0:
			var end := path[path.size() - 1]
			assert_lt(
				Vector2(end.x, end.z).distance_to(Vector2(stops[index].x, stops[index].z)),
				ARRIVED_WITHIN
			)


func test_walking_into_a_door_opens_it_with_one_creak() -> void:
	var house := _house()
	var door: Door = house.get_node("BedroomDoor")
	var piggy := _piggy_facing_bedroom_door()

	Input.action_press("move_forward")
	await wait_physics_frames(60)
	Input.action_release("move_forward")

	assert_gt(door.open_degrees(), 20.0)
	assert_eq(_creaks.size(), 1)
	assert_lt(piggy.global_position.z, -4.0, "the Piggy got through")


func test_a_faster_push_creaks_louder() -> void:
	var house := _house()
	var slow_door: Door = house.get_node("BedroomDoor")
	var fast_door: Door = house.get_node("KitchenDoor")

	await wait_physics_frames(1)
	slow_door.push(Vector3(0.0, 0.0, -1.0), slow_door.global_position + Vector3(0.7, 1.0, 0.0))
	fast_door.push(Vector3(0.0, 0.0, -3.0), fast_door.global_position + Vector3(0.7, 1.0, 0.0))

	assert_eq(_creaks.size(), 2)
	assert_gt(_creaks[1], _creaks[0])


func after_each() -> void:
	Input.action_release("move_forward")


func _piggy_facing_bedroom_door() -> PiggyController:
	var piggy: PiggyController = PIGGY_SCENE.instantiate()
	piggy.setup(_tuning())
	add_child_autofree(piggy)
	piggy.place(PiggyPose.new(Vector3(0.2, 0.05, -3.2), 0.0, 0.0))
	return piggy


func test_the_fridge_hums_in_the_kitchen() -> void:
	var house := _house()

	assert_eq(house.space_at(house.fridge_hum().global_position), &"kitchen")


func test_every_door_creak_and_the_fridge_go_to_the_muffled_channel() -> void:
	var house := _house()

	# Two doors' creaks and the fridge.
	assert_eq(house.positional_sounds().size(), 3)
	assert_has(house.positional_sounds(), house.fridge_hum())
