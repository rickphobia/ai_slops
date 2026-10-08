class_name Generator
extends Node3D
## The Generator at the corner of the track, built from simple shapes: a turnstile across the
## track that the Worker pushes through once a lap, a shaft from it to the pump beside the
## track, a pipe from the pump to the plots, and the loudspeaker pole it powers, with a lamp
## that glows while he runs. Its origin is the middle of the track at the turnstile; the track
## runs along its z axis (he runs towards -z) and the machine stands outside it, towards -x.
## It is the game's own invention, not documented practice (see the spec's content rules).

const METAL_COLOUR := Color(0.3, 0.3, 0.29)
const PUMP_COLOUR := Color(0.4, 0.27, 0.18)
## The loudspeaker's lamp: amber when lit, dull when the Generator stops.
const LAMP_LIT_COLOUR := Color(1.0, 0.62, 0.22)
const LAMP_DARK_COLOUR := Color(0.22, 0.2, 0.18)
const LAMP_LIGHT_ENERGY := 1.6
## The turnstile's post stands at the track's outer edge; its arms reach right across it.
const TURNSTILE_POST_X := -0.85
const TURNSTILE_ARM_HEIGHT := 0.9
const TURNSTILE_ARM_LENGTH := 1.6
## How fast the turnstile turns its quarter turn when pushed, in radians a second.
const TURNSTILE_TURN_SPEED := 5.0
## Where the pump stands, from the turnstile.
const PUMP_SPOT := Vector3(-2.1, 0.0, 0.9)
## Where the loudspeaker pole stands, from the turnstile.
const POLE_SPOT := Vector3(-2.3, 0.0, -0.3)
const POLE_HEIGHT := 2.6
## The pipe runs from the pump along +x to the nearest plots, ending this far from the
## turnstile, and this far in front of it (+z) or behind (-z).
const PIPE_END_X := 2.9
const PIPE_Z := -0.9
## How far a tap may land from the turnstile, outwards (-x) and inwards (+x) across the track
## and either way along it (z), in metres, and still count as a tap on the Generator.
const TAP_OUTWARDS := 3.0
const TAP_INWARDS := 1.0
const TAP_ALONG := 1.6

var _lamp_material := StandardMaterial3D.new()
var _lamp_light := OmniLight3D.new()
var _lit := false
var _turnstile_arms := Node3D.new()
## Quarter turns the turnstile has been pushed; its arms turn to catch up.
var _turnstile_turns := 0


func _ready() -> void:
	var metal := _material(METAL_COLOUR)
	_build_turnstile(metal)
	var pump := _material(PUMP_COLOUR)
	_add_box("Pump", Vector3(0.8, 0.8, 0.8), PUMP_SPOT + Vector3(0.0, 0.4, 0.0), pump)
	var flywheel_mesh := CylinderMesh.new()
	flywheel_mesh.top_radius = 0.45
	flywheel_mesh.bottom_radius = 0.45
	flywheel_mesh.height = 0.1
	var flywheel := _add_mesh(
		"Flywheel", flywheel_mesh, PUMP_SPOT + Vector3(0.0, 0.55, -0.48), metal
	)
	flywheel.rotation.x = PI / 2.0
	# The shaft runs under the track from the turnstile's post to the pump.
	var shaft_start := Vector3(TURNSTILE_POST_X, 0.03, 0.0)
	var shaft_end := PUMP_SPOT + Vector3(0.0, 0.03, -0.4)
	var shaft := _add_box(
		"Shaft",
		Vector3(0.06, 0.06, shaft_start.distance_to(shaft_end)),
		(shaft_start + shaft_end) / 2.0,
		metal
	)
	shaft.basis = Basis.looking_at(shaft_end - shaft_start)
	var pipe_start_x := PUMP_SPOT.x + 0.4
	var pipe_length := PIPE_END_X - pipe_start_x
	var pipe_centre := Vector3(pipe_start_x + pipe_length / 2.0, 0.04, PIPE_Z)
	_add_box("Pipe", Vector3(pipe_length, 0.08, 0.08), pipe_centre, pump)
	_add_box("PipeRiser", Vector3(0.08, 0.6, 0.08), Vector3(pipe_start_x, 0.3, PIPE_Z), pump)
	_build_loudspeaker(metal)
	set_lit(false)


func _process(delta: float) -> void:
	_turnstile_arms.rotation.y = move_toward(
		_turnstile_arms.rotation.y, turnstile_turn(), TURNSTILE_TURN_SPEED * delta
	)


## The lamp glows while the Generator turns and goes dark when it stops.
func set_lit(lit: bool) -> void:
	_lit = lit
	_lamp_material.albedo_color = LAMP_LIT_COLOUR if lit else LAMP_DARK_COLOUR
	_lamp_material.emission_enabled = lit
	_lamp_light.visible = lit


func is_lit() -> bool:
	return _lit


## Turns the turnstile a quarter turn, as he pushes through it.
func push_turnstile() -> void:
	_turnstile_turns += 1


## The turn the turnstile's arms are heading for, in radians: a quarter turn per push.
func turnstile_turn() -> float:
	return _turnstile_turns * PI / 2.0


## Whether a point on the ground counts as a tap on the Generator.
func covers(ground_point: Vector3) -> bool:
	var local := to_local(ground_point)
	return local.x >= -TAP_OUTWARDS and local.x <= TAP_INWARDS and absf(local.z) <= TAP_ALONG


func _build_turnstile(metal: StandardMaterial3D) -> void:
	var post_mesh := CylinderMesh.new()
	post_mesh.top_radius = 0.07
	post_mesh.bottom_radius = 0.07
	post_mesh.height = 1.2
	_add_mesh("TurnstilePost", post_mesh, Vector3(TURNSTILE_POST_X, 0.6, 0.0), metal)
	_turnstile_arms.name = "TurnstileArms"
	_turnstile_arms.position = Vector3(TURNSTILE_POST_X, TURNSTILE_ARM_HEIGHT, 0.0)
	add_child(_turnstile_arms)
	for arm in 4:
		var bar := BoxMesh.new()
		bar.size = Vector3(TURNSTILE_ARM_LENGTH, 0.05, 0.05)
		bar.material = metal
		var instance := MeshInstance3D.new()
		instance.mesh = bar
		var pointing := Vector3.RIGHT.rotated(Vector3.UP, arm * PI / 2.0)
		instance.position = pointing * TURNSTILE_ARM_LENGTH / 2.0
		instance.rotation.y = arm * PI / 2.0
		_turnstile_arms.add_child(instance)


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
