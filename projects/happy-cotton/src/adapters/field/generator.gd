class_name Generator
extends Node3D
## The Generator beside the field, built from simple shapes: a treadmill whose belt runs along
## its x axis, a pump at its back with a pipe to the plots, and the loudspeaker pole it powers,
## with a light that glows while the Worker runs. The Worker runs facing +x, towards the field.
## It is the game's own invention, not documented practice (see the spec's content rules).

const METAL_COLOUR := Color(0.3, 0.3, 0.29)
const BELT_COLOUR := Color(0.12, 0.11, 0.1)
const PUMP_COLOUR := Color(0.4, 0.27, 0.18)
## The loudspeaker's lamp: amber when lit, dull when the Generator stops.
const LAMP_LIT_COLOUR := Color(1.0, 0.62, 0.22)
const LAMP_DARK_COLOUR := Color(0.22, 0.2, 0.18)
const LAMP_LIGHT_ENERGY := 1.6
## The top of the belt, where the Worker's feet go.
const BELT_TOP := 0.24
## How far a tap may land from the treadmill's centre, along it (x) and across it (y), in
## metres, and still count as a tap on the Generator. Covers the pump and the Worker on it.
const TAP_HALF_SIZE := Vector2(1.7, 0.9)
## Where the loudspeaker pole stands, from the treadmill's centre.
const POLE_SPOT := Vector3(-1.0, 0.0, -0.9)
const POLE_HEIGHT := 2.6
## How far the pipe to the plots reaches along +x, in metres.
@export var pipe_length := 2.4

var _lamp_material := StandardMaterial3D.new()
var _lamp_light := OmniLight3D.new()
var _lit := false


func _ready() -> void:
	var metal := _material(METAL_COLOUR)
	_add_box("Frame", Vector3(2.2, 0.2, 1.0), Vector3(0.0, 0.1, 0.0), metal)
	var belt_size := Vector3(2.0, 0.04, 0.8)
	_add_box("Belt", belt_size, Vector3(0.0, BELT_TOP - 0.02, 0.0), _material(BELT_COLOUR))
	for side: String in ["Left", "Right"]:
		var post_z := -0.45 if side == "Left" else 0.45
		_add_box("Post" + side, Vector3(0.06, 1.0, 0.06), Vector3(0.95, 0.7, post_z), metal)
	_add_box("Handrail", Vector3(0.06, 0.06, 0.96), Vector3(0.95, 1.2, 0.0), metal)
	var pump := _material(PUMP_COLOUR)
	_add_box("Pump", Vector3(0.5, 0.6, 0.6), Vector3(-1.35, 0.3, 0.0), pump)
	var pipe_centre := Vector3(1.1 + pipe_length / 2.0, 0.04, -0.6)
	_add_box("Pipe", Vector3(pipe_length, 0.08, 0.08), pipe_centre, pump)
	_build_loudspeaker(metal)
	set_lit(false)


## The lamp glows while the Generator turns and goes dark when it stops.
func set_lit(lit: bool) -> void:
	_lit = lit
	_lamp_material.albedo_color = LAMP_LIT_COLOUR if lit else LAMP_DARK_COLOUR
	_lamp_material.emission_enabled = lit
	_lamp_light.visible = lit


func is_lit() -> bool:
	return _lit


## Whether a point on the ground counts as a tap on the Generator.
func covers(ground_point: Vector3) -> bool:
	var local := to_local(ground_point)
	return absf(local.x) <= TAP_HALF_SIZE.x and absf(local.z) <= TAP_HALF_SIZE.y


## Where the Worker stands to run, in the parent's space.
func run_spot() -> Vector3:
	return transform * Vector3(0.15, BELT_TOP, 0.0)


## The Worker's turn about y while he runs, facing along the belt (+x). The Worker model
## faces +z, so a turn of a quarter circle points him along +x.
func run_facing() -> float:
	return rotation.y + PI / 2.0


func _build_loudspeaker(metal: StandardMaterial3D) -> void:
	var pole_mesh := CylinderMesh.new()
	pole_mesh.top_radius = 0.06
	pole_mesh.bottom_radius = 0.06
	pole_mesh.height = POLE_HEIGHT
	_add_mesh("Pole", pole_mesh, POLE_SPOT + Vector3(0.0, POLE_HEIGHT / 2.0, 0.0), metal)
	var horn_mesh := CylinderMesh.new()
	horn_mesh.top_radius = 0.25
	horn_mesh.bottom_radius = 0.06
	horn_mesh.height = 0.45
	var horn := _add_mesh(
		"Loudspeaker", horn_mesh, POLE_SPOT + Vector3(0.2, POLE_HEIGHT - 0.3, 0.0), metal
	)
	# A cylinder stands along y; a quarter turn about z points its wide mouth at the field.
	horn.rotation.z = -PI / 2.0
	var lamp_mesh := SphereMesh.new()
	lamp_mesh.radius = 0.1
	lamp_mesh.height = 0.2
	_lamp_material.emission = LAMP_LIT_COLOUR
	var lamp_spot := POLE_SPOT + Vector3(0.0, POLE_HEIGHT + 0.1, 0.0)
	_add_mesh("Lamp", lamp_mesh, lamp_spot, _lamp_material)
	_lamp_light.name = "LampLight"
	_lamp_light.light_color = LAMP_LIT_COLOUR
	_lamp_light.light_energy = LAMP_LIGHT_ENERGY
	_lamp_light.omni_range = 4.0
	_lamp_light.position = lamp_spot
	add_child(_lamp_light)


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
