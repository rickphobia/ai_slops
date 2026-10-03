extends GutTest
## The rot sets: each space shows its rot stage in wall colour, lamp colour and props, and
## no stage changes how bright anything is.

const HOUSE_SCENE := preload("res://src/adapters/house.tscn")


func _house() -> House:
	var house: House = add_child_autofree(HOUSE_SCENE.instantiate())
	var tuning := NightTestTuning.table()
	house.setup(tuning)
	return house


func _night() -> Night:
	return Night.new(PiggyPose.new(Vector3.ZERO, 0.0, 0.0), NightTestTuning.table())


func _rot_sets(house: House, night: Night = _night()) -> RotSets:
	var rot_sets: RotSets = add_child_autofree(RotSets.new())
	rot_sets.setup(night, house)
	return rot_sets


func _albedo(house: House, space: StringName) -> Color:
	var floor_part: CSGBox3D = house.space_shell(space).get_child(0)
	var material: ShaderMaterial = floor_part.material
	return material.get_shader_parameter("albedo")


func test_a_colour_keeps_its_hue_at_the_brightness_of_another() -> void:
	var matched := RotSets.at_brightness_of(Color(0.8, 0.2, 0.2), Color(0.5, 0.5, 0.5))
	assert_almost_eq(matched.get_luminance(), 0.5, 0.001)
	assert_almost_eq(matched.r / matched.g, 4.0, 0.001)


func test_every_space_starts_cosy_with_only_its_cosy_props_showing() -> void:
	var house := _house()
	var rot_sets := _rot_sets(house)
	for space in house.spaces():
		assert_eq(rot_sets.shown(space), Hallucinations.Rot.COSY, space)
	var showing := rot_sets.get_children().filter(func(props: Node3D) -> bool: return props.visible)
	assert_eq(showing.size(), house.spaces().size())
	for props: Node3D in showing:
		assert_string_ends_with(props.name, "Cosy")


func test_rotting_changes_colours_but_not_how_bright_the_walls_and_lamps_are() -> void:
	var house := _house()
	var space := &"kitchen"
	var lamp := house.space_lamp(space)
	var lamp_energy := lamp.light_energy
	var lamp_at := lamp.global_position
	var lamp_brightness := lamp.light_color.get_luminance()
	var plaster_albedo := _albedo(house, space)
	var night := _night()
	var rot_sets := _rot_sets(house, night)
	var colours: Array[Color] = []

	for humanity: float in [100.0, 50.0, 10.0]:
		night.body.humanity = humanity
		await wait_physics_frames(1)
		colours.append(_albedo(house, space))
		assert_almost_eq(
			_albedo(house, space).get_luminance(), plaster_albedo.get_luminance(), 0.001
		)
		assert_almost_eq(lamp.light_color.get_luminance(), lamp_brightness, 0.001)
		assert_eq(lamp.light_energy, lamp_energy)
		assert_eq(lamp.global_position, lamp_at)

	assert_eq(rot_sets.shown(space), Hallucinations.Rot.GROTESQUE)
	assert_ne(colours[0], colours[1])
	assert_ne(colours[1], colours[2])
