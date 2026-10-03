extends GutTest
## The lying objects in a scene: a slop bowl the camera looks at keeps showing slop when
## humanity drops, and turns into snacks once the camera looks away. Numbers come from
## NightTestTuning (snacks below 70, each give-in costs 12).

var _night: Night
var _eyes: Camera3D
var _objects: LyingObjects


func before_each() -> void:
	_night = Night.new(PiggyPose.new(Vector3.ZERO, 0.0, 0.0), NightTestTuning.table())
	var room: Node3D = add_child_autofree(Node3D.new())
	_eyes = Camera3D.new()
	room.add_child(_eyes)
	var bowl := _marker(room, &"KitchenSlopBowl", Vector3(0.0, -1.0, -3.0))
	var mirror := _marker(room, &"HallwayMirror", Vector3(0.0, 0.0, 5.0))
	var glass := _marker(room, &"BackDoorGlass", Vector3(5.0, 0.0, 5.0))
	_objects = LyingObjects.new()
	room.add_child(_objects)
	_objects.setup(_night, [bowl] as Array[Marker3D], mirror, glass)
	_objects.eyes = _eyes


func _marker(room: Node3D, marker_name: StringName, at: Vector3) -> Marker3D:
	var marker := Marker3D.new()
	marker.name = marker_name
	marker.position = at
	room.add_child(marker)
	return marker


func _give_in_three_times() -> void:
	for spot: StringName in [&"a", &"b", &"c"]:
		_night.give_in(spot, Vector3.ZERO)
		for index in 35:
			_night.advance(0.1, false, false, Vector3.ZERO)


func test_a_bowl_in_view_stays_slop_until_the_camera_looks_away() -> void:
	await wait_physics_frames(2)
	assert_eq(_objects.showing(&"KitchenSlopBowl"), Hallucinations.Shows.SLOP)

	_give_in_three_times()
	await wait_physics_frames(2)
	assert_eq(_objects.showing(&"KitchenSlopBowl"), Hallucinations.Shows.SLOP, "in view")

	_eyes.rotation.y = PI
	await wait_physics_frames(2)
	assert_eq(_objects.showing(&"KitchenSlopBowl"), Hallucinations.Shows.SNACKS)


func test_the_end_card_says_something_different_for_each_ending() -> void:
	var human: EndCard = add_child_autofree(EndCard.new(Hallucinations.Ending.HUMAN))
	var pig: EndCard = add_child_autofree(EndCard.new(Hallucinations.Ending.PIG))
	await wait_process_frames(1)

	var human_text := _all_text(human)
	var pig_text := _all_text(pig)

	assert_ne(human_text, pig_text)
	assert_string_contains(human_text, "looked like yourself")
	assert_string_contains(pig_text, "what you are now")


func _all_text(card: Control) -> String:
	var text := ""
	for label: Label in card.find_children("*", "Label", true, false):
		text += label.text + "\n"
	return text
