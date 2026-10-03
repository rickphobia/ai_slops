class_name NoiseRings
extends MeshInstance3D
## Debug only: a ring on the floor for each noise the Piggy makes, as wide as it is loud
## (before walls and doors cut it down), fading out over a second and a half. Red when
## Mum heard it, white when she didn't.

const SHOW_SECONDS := 1.5
const SEGMENTS := 48
## Just above the floor, so the ring isn't hidden in it.
const LIFT := 0.05

var _rings: Array[Ring] = []
var _lines := ImmediateMesh.new()


class Ring:
	var noise: PiggyNoise
	var seconds_left: float = SHOW_SECONDS
	var heard: bool = false

	func _init(made: PiggyNoise) -> void:
		noise = made


func setup(night: Night) -> void:
	night.noise_made.connect(_on_noise_made)
	night.noise_heard.connect(_on_noise_heard)
	mesh = _lines
	var unshaded := StandardMaterial3D.new()
	unshaded.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	unshaded.vertex_color_use_as_albedo = true
	unshaded.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	unshaded.no_depth_test = true
	material_override = unshaded


func ring_count() -> int:
	return _rings.size()


func _process(delta: float) -> void:
	for ring in _rings:
		ring.seconds_left -= delta
	_rings = _rings.filter(func(ring: Ring) -> bool: return ring.seconds_left > 0.0)
	_lines.clear_surfaces()
	for ring in _rings:
		_draw_ring(ring)


func _on_noise_made(noise: PiggyNoise) -> void:
	_rings.append(Ring.new(noise))


## The heard signal follows the made one for the same noise, so mark the newest ring.
func _on_noise_heard(heard: HeardNoise) -> void:
	for index in range(_rings.size() - 1, -1, -1):
		if _rings[index].noise == heard.noise:
			_rings[index].heard = true
			return


func _draw_ring(ring: Ring) -> void:
	var noise := ring.noise
	var colour := Color.RED if ring.heard else Color.WHITE
	colour.a = ring.seconds_left / SHOW_SECONDS
	_lines.surface_begin(Mesh.PRIMITIVE_LINE_STRIP)
	for index in SEGMENTS + 1:
		var angle := TAU * index / SEGMENTS
		var offset := Vector3(cos(angle), 0.0, sin(angle)) * noise.loudness
		_lines.surface_set_color(colour)
		_lines.surface_add_vertex(noise.position + offset + Vector3.UP * LIFT)
	_lines.surface_end()
