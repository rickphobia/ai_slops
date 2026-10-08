extends GutTest
## The Overseer beside the Generator: a man in a plain uniform with a whip in his hand and no
## gun, who blows his whistle and cracks the whip when told to.

const OVERSEER_MODEL := preload("res://assets/quaternius-modular-men/suit.glb")

var _body: Node3D
var _player: AnimationPlayer
var _look: OverseerLook


func before_each() -> void:
	_body = OVERSEER_MODEL.instantiate()
	add_child_autofree(_body)
	_player = _body.find_children("*", "AnimationPlayer", true, false)[0]
	_look = OverseerLook.new(_body, _player)


func test_he_stands_at_ease_at_first() -> void:
	assert_eq(_player.current_animation, OverseerLook.STANDING)


func test_he_carries_no_gun() -> void:
	assert_false((_body.find_child("Pistol", true, false) as Node3D).visible)


func test_he_wears_a_plain_uniform() -> void:
	var body_mesh := _body.find_child("Suit_Body", true, false) as MeshInstance3D
	var colours: Array[Color] = []
	for surface in body_mesh.mesh.get_surface_count():
		var material := body_mesh.get_active_material(surface) as StandardMaterial3D
		colours.append(material.albedo_color)
	assert_has(colours, OverseerLook.UNIFORM_COLOUR)


func test_the_whip_is_in_his_right_hand() -> void:
	var whip := _body.find_child("Whip", true, false) as Node3D
	assert_not_null(whip)
	var hand := whip.get_parent() as BoneAttachment3D
	assert_eq(hand.bone_name, OverseerLook.HAND_BONE)


func test_he_blows_his_whistle_then_stands_at_ease_again() -> void:
	_look.blow_whistle()

	assert_eq(_player.current_animation, OverseerLook.WHISTLING)
	assert_eq(Array(_player.get_queue()), [OverseerLook.STANDING])


func test_he_cracks_the_whip_then_stands_at_ease_again() -> void:
	_look.crack_whip()

	assert_eq(_player.current_animation, OverseerLook.WHIPPING)
	assert_eq(Array(_player.get_queue()), [OverseerLook.STANDING])


func test_he_never_aims_a_gun_or_kicks() -> void:
	for animation: StringName in [
		OverseerLook.STANDING, OverseerLook.WHISTLING, OverseerLook.WHIPPING
	]:
		for move: String in ["Gun", "Shoot", "Kick", "Punch", "Death"]:
			assert_false(String(animation).contains(move), "%s is not his" % animation)
