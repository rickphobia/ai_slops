class_name Generator
extends Node3D
## The Generator at the corner of the track, built from simple shapes: cables from under the
## power tiles (PowerTiles) to the machine beside the track, which gathers their power and
## pumps water through a pipe to the plots, and the loudspeaker pole it powers, with a lamp
## that glows while he runs and pulses faintly with his steps. Its origin is the middle of the
## track on the lap line; the track runs along its z axis (he runs towards -z) and the machine
## stands outside it, towards -x. It is the game's own invention, not documented practice
## (see the spec's content rules).
## Each Upgrade tier bought repaints the machine a brighter state red and adds a coil on top,
## so the purchase shows in the field.

const METAL_COLOUR := Color(0.3, 0.3, 0.29)
const PUMP_COLOUR := Color(0.4, 0.27, 0.18)
## The loudspeaker's lamp: amber when lit, dull when the Generator stops.
const LAMP_LIT_COLOUR := Color(1.0, 0.62, 0.22)
const LAMP_DARK_COLOUR := Color(0.22, 0.2, 0.18)
const LAMP_LIGHT_ENERGY := 1.6
const CABLE_COLOUR := Color(0.12, 0.12, 0.12)
## The machine's paint at each Upgrade tier, from none; tiers past the list keep the last.
const TIER_COLOURS: Array[Color] = [
	PUMP_COLOUR,
	Color(0.55, 0.22, 0.16),
	Color(0.7, 0.16, 0.14),
	Color(0.85, 0.1, 0.1),
]
const COIL_COLOUR := Color(0.72, 0.5, 0.2)
const COIL_SIZE := Vector3(0.6, 0.12, 0.6)
## Each step brightens the lamp by up to this share, fading back over PULSE_SECONDS.
const PULSE_STRENGTH := 0.3
const PULSE_SECONDS := 0.3
## How far the track reaches either side of the lap line's middle (x), in metres.
const TRACK_EDGE_X := 0.8
## The cables come out from under the track's outer edge at these places along it (z), and
## run to the machine. They lie flat, no higher than the tiles, so he never trips on them.
const CABLE_ALONG: Array[float] = [-0.5, 0.0, 0.5]
const CABLE_THICKNESS := 0.024
## Where the pump stands, from the lap line.
const PUMP_SPOT := Vector3(-2.1, 0.0, 0.9)
## Where the loudspeaker pole stands, from the lap line.
const POLE_SPOT := Vector3(-2.3, 0.0, -0.3)
const POLE_HEIGHT := 2.6
## The pipe runs from the pump along +x to the nearest plots, ending this far from the
## lap line, and this far in front of it (+z) or behind (-z).
const PIPE_END_X := 2.9
const PIPE_Z := -0.9
## How far a tap may land from the lap line, outwards (-x) and inwards (+x) across the track
## and either way along it (z), in metres, and still count as a tap on the Generator.
const TAP_OUTWARDS := 3.0
const TAP_INWARDS := 1.0
const TAP_ALONG := 1.6

## Reduced motion: the lamp glows steadily, without pulsing.
var skip_pulse := false

var _lamp_material := StandardMaterial3D.new()
var _machine_material: StandardMaterial3D
var _tier := 0
var _lamp_light := OmniLight3D.new()
var _lit := false
## From 1 (a step just landed) down to 0 (steady).
var _pulse := 0.0


func _ready() -> void:
	var metal := _material(METAL_COLOUR)
	var pump := _material(PUMP_COLOUR)
	_machine_material = _material(PUMP_COLOUR)
	_add_box("Pump", Vector3(0.8, 0.8, 0.8), PUMP_SPOT + Vector3(0.0, 0.4, 0.0), _machine_material)
	_build_cables()
	var pipe_start_x := PUMP_SPOT.x + 0.4
	var pipe_length := PIPE_END_X - pipe_start_x
	var pipe_centre := Vector3(pipe_start_x + pipe_length / 2.0, 0.04, PIPE_Z)
	_add_box("Pipe", Vector3(pipe_length, 0.08, 0.08), pipe_centre, pump)
	_add_box("PipeRiser", Vector3(0.08, 0.6, 0.08), Vector3(pipe_start_x, 0.3, PIPE_Z), pump)
	_build_loudspeaker(metal)
	set_lit(false)


func _process(delta: float) -> void:
	if _pulse > 0.0:
		_pulse = maxf(_pulse - delta / PULSE_SECONDS, 0.0)
		_show_pulse()


## The lamp glows while the Generator turns and goes dark when it stops.
func set_lit(lit: bool) -> void:
	_lit = lit
	_lamp_material.albedo_color = LAMP_LIT_COLOUR if lit else LAMP_DARK_COLOUR
	_lamp_material.emission_enabled = lit
	_lamp_light.visible = lit
	_pulse = 0.0
	_show_pulse()


func is_lit() -> bool:
	return _lit


## Shows the Generator Upgrade tier owned, from 0 (none): the machine's paint, and one coil
## stacked on top for each tier.
func show_tier(tier: int) -> void:
	if tier == _tier:
		return
	_tier = tier
	_machine_material.albedo_color = TIER_COLOURS[mini(tier, TIER_COLOURS.size() - 1)]
	for coil in find_children("Coil*", "MeshInstance3D", false, false):
		remove_child(coil)
		coil.queue_free()
	var coil_material := _material(COIL_COLOUR)
	for index in tier:
		var height := 0.8 + COIL_SIZE.y * (index + 0.5)
		_add_box("Coil%d" % index, COIL_SIZE, PUMP_SPOT + Vector3(0.0, height, 0.0), coil_material)


func tier() -> int:
	return _tier


func machine_colour() -> Color:
	return _machine_material.albedo_color


## A step on a power tile: the lit lamp brightens faintly, then settles.
func pulse() -> void:
	if _lit and not skip_pulse:
		_pulse = 1.0
		_show_pulse()


func is_pulsing() -> bool:
	return _pulse > 0.0


## Whether a point on the ground counts as a tap on the Generator.
func covers(ground_point: Vector3) -> bool:
	var local := to_local(ground_point)
	return local.x >= -TAP_OUTWARDS and local.x <= TAP_INWARDS and absf(local.z) <= TAP_ALONG


func _build_cables() -> void:
	var rubber := _material(CABLE_COLOUR)
	for index in CABLE_ALONG.size():
		var start := Vector3(-TRACK_EDGE_X + 0.1, CABLE_THICKNESS / 2.0, CABLE_ALONG[index])
		# They meet the machine's side facing the track, side by side.
		var end_z := PUMP_SPOT.z + (index - 1) * 0.2
		var end := Vector3(PUMP_SPOT.x + 0.4, CABLE_THICKNESS / 2.0, end_z)
		var cable := _add_box(
			"Cable%d" % index,
			Vector3(CABLE_THICKNESS, CABLE_THICKNESS, start.distance_to(end)),
			(start + end) / 2.0,
			rubber
		)
		cable.basis = Basis.looking_at(end - start)


func _show_pulse() -> void:
	var brightness := 1.0 + PULSE_STRENGTH * _pulse
	_lamp_light.light_energy = LAMP_LIGHT_ENERGY * brightness
	_lamp_material.emission_energy_multiplier = brightness


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
