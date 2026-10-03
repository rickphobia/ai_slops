class_name Reflection
extends Node3D
## A mirror or dark window and the Piggy's body seen in it: the old human body (upright, in
## a shirt) or the pig body (on all fours) under the same human head. Placeholder shapes,
## not a real reflection, until the custom models exist. Faces +Z, into the room.
## Going from the old body to the pig flickers between the two for a moment.

const FLICKER_SECONDS := 0.35
const FLICKER_RATE := 18.0
const SKIN := Color(0.85, 0.66, 0.55)
const SHIRT := Color(0.25, 0.35, 0.55)
const PIG_PINK := Color(0.9, 0.55, 0.6)
const GLASS := Color(0.08, 0.1, 0.12)

var _old_body := Node3D.new()
var _pig_body := Node3D.new()
var _showing: Hallucinations.Shows = Hallucinations.Shows.OLD_BODY
var _flicker_left: float = 0.0


func _ready() -> void:
	var glass := QuadMesh.new()
	glass.size = Vector2(0.7, 1.3)
	add_child(_piece(glass, GLASS, Vector3(0.0, 0.0, 0.01)))

	var torso := CapsuleMesh.new()
	torso.radius = 0.12
	torso.height = 0.6
	_old_body.add_child(_piece(torso, SHIRT, Vector3(0.0, -0.2, 0.05)))
	_old_body.add_child(_piece(_head(), SKIN, Vector3(0.0, 0.25, 0.05)))

	var belly := CapsuleMesh.new()
	belly.radius = 0.15
	belly.height = 0.55
	var pig := _piece(belly, PIG_PINK, Vector3(0.05, -0.35, 0.05))
	pig.rotation.z = PI / 2.0
	_pig_body.add_child(pig)
	_pig_body.add_child(_piece(_head(), SKIN, Vector3(-0.25, -0.2, 0.05)))

	add_child(_old_body)
	add_child(_pig_body)
	_show_body(_showing)


func show_as(shows: Hallucinations.Shows) -> void:
	if shows == _showing:
		return
	if _showing == Hallucinations.Shows.OLD_BODY and shows == Hallucinations.Shows.PIG_BODY:
		_flicker_left = FLICKER_SECONDS
	_showing = shows
	_show_body(shows)


func showing() -> Hallucinations.Shows:
	return _showing


func _process(delta: float) -> void:
	if _flicker_left <= 0.0:
		return
	_flicker_left -= delta
	if _flicker_left <= 0.0:
		_show_body(_showing)
		return
	var old_frame := int(_flicker_left * FLICKER_RATE) % 2 == 0
	_show_body(Hallucinations.Shows.OLD_BODY if old_frame else Hallucinations.Shows.PIG_BODY)


func _show_body(shows: Hallucinations.Shows) -> void:
	_old_body.visible = shows == Hallucinations.Shows.OLD_BODY
	_pig_body.visible = shows == Hallucinations.Shows.PIG_BODY


static func _head() -> SphereMesh:
	var head := SphereMesh.new()
	head.radius = 0.1
	head.height = 0.22
	return head


static func _piece(mesh: PrimitiveMesh, colour: Color, at: Vector3) -> MeshInstance3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	mesh.material = material
	var piece := MeshInstance3D.new()
	piece.mesh = mesh
	piece.position = at
	return piece
