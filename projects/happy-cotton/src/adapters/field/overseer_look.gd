class_name OverseerLook
extends RefCounted
## The Overseer as he stands beside the Generator: a person in a plain uniform, not a
## caricature. The model's suit is recoloured to a drab uniform, its pistol is hidden (he
## carries no gun) and a whip built from simple shapes is put in his right hand. He stands at
## ease, blows his whistle when the Worker has stood too long, and cracks the whip. The whip
## and the Overseer's act are the owner's choice for the game (see the spec's content rules):
## shown as a crack and a flinch, never with blood, wounds or marks.

const STANDING := &"Idle_Neutral"
## A reach forward, calling the Worker back to it.
const WHISTLING := &"Interact"
## The arm's swing that cracks the whip.
const WHIPPING := &"Sword_Slash"
## The model's surfaces recoloured to the uniform, and the colour they take.
const UNIFORM_SURFACES: Array[String] = ["Suit", "Tie"]
const UNIFORM_COLOUR := Color(0.27, 0.29, 0.19)
const HAND_BONE := "Wrist.R"
const WHIP_COLOUR := Color(0.2, 0.13, 0.08)
## The handle runs forward from his fist (the hand bone's -x), the lash on from its end,
## curling down (the hand bone's +y runs along his fingers, down while his arm hangs).
const HANDLE_LENGTH := 0.3
const HANDLE_RADIUS := 0.03
const PALM_OFFSET := Vector3(0.0, 0.07, 0.0)
const LASH_SEGMENTS := 4
const LASH_SEGMENT_LENGTH := 0.28
const LASH_CURL_DEGREES := 22.0

var _player: AnimationPlayer


## `player` may be null if the model has none; he then stands still.
func _init(body: Node3D, player: AnimationPlayer) -> void:
	_player = player
	var pistol := body.find_child("Pistol", true, false) as Node3D
	if pistol != null:
		pistol.visible = false
	for mesh: MeshInstance3D in body.find_children("*", "MeshInstance3D", true, false):
		_dress_in_uniform(mesh)
	var skeletons := body.find_children("*", "Skeleton3D", true, false)
	if skeletons.is_empty():
		GameLog.warning("overseer has no skeleton for the whip")
	else:
		var hand := BoneAttachment3D.new()
		hand.bone_name = HAND_BONE
		(skeletons[0] as Skeleton3D).add_child(hand)
		hand.add_child(_build_whip())
	if _player != null:
		_player.get_animation(STANDING).loop_mode = Animation.LOOP_LINEAR
		_player.play(STANDING)


func blow_whistle() -> void:
	_act(WHISTLING)


func crack_whip() -> void:
	_act(WHIPPING)


func _act(animation: StringName) -> void:
	if _player == null:
		return
	_player.play(animation)
	_player.queue(STANDING)


func _dress_in_uniform(mesh: MeshInstance3D) -> void:
	for surface in mesh.mesh.get_surface_count():
		var original := mesh.mesh.surface_get_material(surface)
		if original == null or original.resource_name not in UNIFORM_SURFACES:
			continue
		var uniform := StandardMaterial3D.new()
		uniform.albedo_color = UNIFORM_COLOUR
		uniform.roughness = 1.0
		mesh.set_surface_override_material(surface, uniform)


func _build_whip() -> Node3D:
	var whip := Node3D.new()
	whip.name = "Whip"
	whip.position = PALM_OFFSET
	var leather := StandardMaterial3D.new()
	leather.albedo_color = WHIP_COLOUR
	leather.roughness = 1.0
	# Each piece is a cylinder laid along -x, its far end the next piece's start.
	var joint := Node3D.new()
	joint.position = Vector3(HANDLE_LENGTH * 0.2, 0.0, 0.0)
	whip.add_child(joint)
	joint.add_child(_whip_piece(HANDLE_LENGTH, HANDLE_RADIUS, HANDLE_RADIUS, leather))
	for segment in LASH_SEGMENTS:
		var next := Node3D.new()
		next.position = Vector3(-(HANDLE_LENGTH if segment == 0 else LASH_SEGMENT_LENGTH), 0, 0)
		next.rotation.z = deg_to_rad(LASH_CURL_DEGREES)
		joint.add_child(next)
		joint = next
		var thickness := HANDLE_RADIUS * 0.6 * (1.0 - 0.6 * segment / LASH_SEGMENTS)
		joint.add_child(_whip_piece(LASH_SEGMENT_LENGTH, thickness, thickness * 0.7, leather))
	return whip


## A length of whip from its joint along -x.
func _whip_piece(
	length: float, near_radius: float, far_radius: float, material: StandardMaterial3D
) -> MeshInstance3D:
	var cylinder := CylinderMesh.new()
	cylinder.height = length
	cylinder.bottom_radius = near_radius
	cylinder.top_radius = far_radius
	cylinder.radial_segments = 6
	cylinder.rings = 1
	cylinder.material = material
	var piece := MeshInstance3D.new()
	piece.mesh = cylinder
	# A cylinder stands along +y; a quarter turn about z lays its top towards -x.
	piece.rotation.z = PI / 2.0
	piece.position = Vector3(-length / 2.0, 0.0, 0.0)
	return piece
