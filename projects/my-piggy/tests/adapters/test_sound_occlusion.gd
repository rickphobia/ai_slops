extends GutTest
## Sounds behind a wall or closed door play through the muffled bus; sounds in the open
## play straight to Master.

var _listener: Node3D
var _occlusion: SoundOcclusion


func before_each() -> void:
	_listener = add_child_autofree(Node3D.new())
	_occlusion = add_child_autofree(SoundOcclusion.new())
	_occlusion.listener = _listener


func _sound_at(at: Vector3, parent: Node = self) -> AudioStreamPlayer3D:
	var player := AudioStreamPlayer3D.new()
	if parent == self:
		add_child_autofree(player)
	else:
		parent.add_child(player)
	player.global_position = at
	_occlusion.register(player)
	return player


func _wall_at(at: Vector3) -> StaticBody3D:
	var wall: StaticBody3D = add_child_autofree(StaticBody3D.new())
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(4.0, 3.0, 0.2)
	shape.shape = box
	wall.add_child(shape)
	wall.global_position = at
	return wall


func test_the_muffled_bus_cuts_the_highs_and_feeds_master() -> void:
	var bus := AudioServer.get_bus_index(SoundOcclusion.MUFFLED_BUS)

	assert_ne(bus, -1, "the bus layout has a Muffled bus")
	assert_eq(AudioServer.get_bus_send(bus), &"Master")
	assert_true(AudioServer.get_bus_effect(bus, 0) is AudioEffectLowPassFilter)


func test_a_sound_in_the_open_plays_straight() -> void:
	var player := _sound_at(Vector3(0, 0, -5))
	await wait_physics_frames(2)

	assert_eq(player.bus, SoundOcclusion.OPEN_BUS)


func test_a_sound_behind_a_wall_is_muffled() -> void:
	_wall_at(Vector3(0, 0, -2.5))
	var player := _sound_at(Vector3(0, 0, -5))
	await wait_physics_frames(2)

	assert_eq(player.bus, SoundOcclusion.MUFFLED_BUS)


func test_a_sound_comes_back_when_the_wall_goes() -> void:
	var wall := _wall_at(Vector3(0, 0, -2.5))
	var player := _sound_at(Vector3(0, 0, -5))
	await wait_physics_frames(2)
	wall.global_position = Vector3(10, 0, 0)
	await wait_physics_frames(2)

	assert_eq(player.bus, SoundOcclusion.OPEN_BUS)


func test_the_body_a_sound_belongs_to_does_not_muffle_it() -> void:
	# A door's creak sits on the door itself; the door must not hide its own creak.
	var door := _wall_at(Vector3(0, 0, -5))
	var player := _sound_at(Vector3(0, 0, -5), door)
	await wait_physics_frames(2)

	assert_eq(player.bus, SoundOcclusion.OPEN_BUS)


func test_a_freed_sound_is_forgotten() -> void:
	var player := _sound_at(Vector3(0, 0, -5))
	player.free()
	await wait_physics_frames(2)

	assert_eq(_occlusion.sound_count(), 0)
