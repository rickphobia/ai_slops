class_name ToolRack
extends Node3D
## The Worker's tools on a wooden rack by the Generator, built from simple shapes: a hoe and a
## picking basket. Each tools Upgrade tier bought swaps the hoe's worn wooden blade for a
## brighter metal one and hangs one more sickle on the rack, so the purchase shows in the field.

const WOOD_COLOUR := Color(0.42, 0.3, 0.18)
const BASKET_COLOUR := Color(0.7, 0.58, 0.36)
## The hoe blade at each tools tier, from none; tiers past the list keep the last.
const BLADE_COLOURS: Array[Color] = [
	Color(0.5, 0.36, 0.22),
	Color(0.45, 0.42, 0.4),
	Color(0.68, 0.68, 0.7),
	Color(0.85, 0.1, 0.1),
]
const SICKLE_COLOUR := Color(0.75, 0.75, 0.78)
const RACK_WIDTH := 1.2
const RACK_HEIGHT := 1.1
## How far apart the sickles hang along the rack's bar.
const SICKLE_STEP := 0.25

var _blade_material: StandardMaterial3D
var _tier := 0


func _ready() -> void:
	var wood := _material(WOOD_COLOUR)
	for side: float in [-1.0, 1.0]:
		var post_spot := Vector3(side * RACK_WIDTH / 2.0, RACK_HEIGHT / 2.0, 0.0)
		_add_box("Post", Vector3(0.08, RACK_HEIGHT, 0.08), post_spot, wood)
	_add_box("Bar", Vector3(RACK_WIDTH, 0.06, 0.06), Vector3(0.0, RACK_HEIGHT, 0.0), wood)
	# The hoe leans on the rack: a handle with its blade at the foot.
	var handle := _add_box("HoeHandle", Vector3(0.05, 1.3, 0.05), Vector3(-0.3, 0.65, 0.12), wood)
	handle.rotation.x = -0.25
	_blade_material = _material(BLADE_COLOURS[0])
	_add_box("HoeBlade", Vector3(0.3, 0.06, 0.18), Vector3(-0.3, 0.05, 0.3), _blade_material)
	var basket := CylinderMesh.new()
	basket.top_radius = 0.25
	basket.bottom_radius = 0.18
	basket.height = 0.35
	_add_mesh("Basket", basket, Vector3(0.3, 0.175, 0.25), _material(BASKET_COLOUR))


## Shows the tools Upgrade tier owned, from 0 (none): the hoe blade's metal, and one sickle
## hung on the rack for each tier.
func show_tier(tier: int) -> void:
	if tier == _tier:
		return
	_tier = tier
	_blade_material.albedo_color = BLADE_COLOURS[mini(tier, BLADE_COLOURS.size() - 1)]
	for sickle in find_children("Sickle*", "MeshInstance3D", false, false):
		remove_child(sickle)
		sickle.queue_free()
	var steel := _material(SICKLE_COLOUR)
	for index in tier:
		var spot := Vector3(-RACK_WIDTH / 2.0 + SICKLE_STEP * (index + 1), RACK_HEIGHT - 0.2, 0.0)
		_add_box("Sickle%d" % index, Vector3(0.04, 0.35, 0.12), spot, steel)


func tier() -> int:
	return _tier


func blade_colour() -> Color:
	return _blade_material.albedo_color


func _add_box(
	part: String, size: Vector3, centre: Vector3, material: StandardMaterial3D
) -> MeshInstance3D:
	var box := BoxMesh.new()
	box.size = size
	return _add_mesh(part, box, centre, material)


func _add_mesh(
	part: String, mesh: PrimitiveMesh, centre: Vector3, material: StandardMaterial3D
) -> MeshInstance3D:
	mesh.material = material
	var instance := MeshInstance3D.new()
	instance.name = part
	instance.mesh = mesh
	instance.position = centre
	add_child(instance)
	return instance


func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	material.roughness = 1.0
	return material
