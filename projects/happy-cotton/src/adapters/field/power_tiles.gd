class_name PowerTiles
extends Node3D
## The power tiles paving the track, square tiles that turn the Worker's footsteps into
## electricity for the Generator, and the white lap line across the track where each lap ends.
## Each footstep lights the tile under that foot and the light fades out behind him, so his
## laps leave a short glowing trail. The tiles are the state's cheerful invention in the game,
## not how real power tiles are used (see the spec's content rules).
##
## Every tile is one instance of a single shared mesh (a MultiMesh), so the whole track draws
## in one call however many tiles it has. The MultiMesh never changes after it is built: the
## web build's Compatibility renderer doesn't redraw instance data changed later. A lit tile
## is instead a glow laid over it, from a small pool of glows, each its own draw call.

## Tiles are about this long and wide, in metres; they fit the track exactly, so a tile's
## true size is the nearest that divides the track's width and length evenly.
const TILE_SIZE := 0.8
## The gap between neighbouring tiles, in metres.
const GROUT := 0.06
const TILE_THICKNESS := 0.03
## How high above the ground the tiles' tops lie: just over the dirt track (TrackLook.LIFT).
const TILE_TOP := 0.03
## A foot this far from a tile's centre, as a share of its half size, still steps on it.
const NEAR_ENOUGH := 1.25
const TILE_COLOUR := Color(0.2, 0.21, 0.23)
const GLOW_COLOUR := Color(0.3, 0.75, 1.0)
const GLOW_ENERGY := 0.6
## How high a glow floats over its tile's top, in metres, so it never flickers into it.
const GLOW_LIFT := 0.003
## How many tiles can glow at once: more than his steps in FADE_SECONDS at a sprint. When all
## are in use, the dimmest one moves to the newest step.
const GLOWS := 8
## How long a lit tile takes to fade out, in seconds.
const FADE_SECONDS := 1.5
## With reduced motion, how long the tile under his latest step stays lit: about one stride,
## so the tiles go dark soon after he stops.
const INSTANT_HOLD_SECONDS := 0.5
const LAP_LINE_COLOUR := Color(0.95, 0.95, 0.92)
## How wide the lap line is, along the track, in metres.
const LAP_LINE_WIDTH := 0.12

## Reduced motion: a tile goes dark at once instead of fading, so only the tile under his
## latest step is lit, until INSTANT_HOLD_SECONDS pass or he steps again.
var instant_fade := false:
	set(on):
		instant_fade = on
		for glow in _glow_meshes.size():
			_show(glow)

## Each tile's half size across the track (x) and along it (z), and its place.
var _half_size: Vector2
var _transforms: Array[Transform3D] = []
## For each glow in the pool: its mesh, the tile it lies on (-1 for none), and how bright it
## is, from 1 (just stepped on) down to 0 (dark).
var _glow_meshes: Array[MeshInstance3D] = []
var _glow_tiles: Array[int] = []
var _glow_levels := PackedFloat32Array()


func _init(track: TrackPath, width: float) -> void:
	var across := maxi(1, roundi(width / TILE_SIZE))
	var along := maxi(1, roundi(track.length() / TILE_SIZE))
	var across_size := width / across
	var along_size := track.length() / along
	_half_size = Vector2(across_size, along_size) / 2.0
	for row in along:
		for column in across:
			var offset := (column + 0.5) * across_size - width / 2.0
			var start := _column_point(track, row * along_size, offset)
			var end := _column_point(track, (row + 1) * along_size, offset)
			# Each tile spans its column's stretch end to end, so neighbours meet even on a
			# corner, where a column right of the centre line (inside the turn, as he turns
			# right) runs shorter than one left of it.
			var stretch := Basis.from_scale(Vector3(1.0, 1.0, start.distance_to(end) / along_size))
			var centre := (start + end) / 2.0 + Vector3.UP * (TILE_TOP - TILE_THICKNESS / 2.0)
			_transforms.append(Transform3D(Basis.looking_at(end - start) * stretch, centre))
	var tile_size := Vector3(across_size - GROUT, TILE_THICKNESS, along_size - GROUT)
	_build_tiles(tile_size)
	_build_glows(Vector2(tile_size.x, tile_size.z))
	_build_lap_line(track, width)


## Moves the glows' fading on some seconds.
func update(delta: float) -> void:
	for glow in GLOWS:
		if _glow_levels[glow] > 0.0:
			var seconds := INSTANT_HOLD_SECONDS if instant_fade else FADE_SECONDS
			_glow_levels[glow] = maxf(_glow_levels[glow] - delta / seconds, 0.0)
			_show(glow)


## Lights the tile under a foot. False when the foot isn't on a tile.
func light_at(foot: Vector3) -> bool:
	var tile := tile_at(foot)
	if tile < 0:
		return false
	if instant_fade:
		for glow in GLOWS:
			_glow_levels[glow] = 0.0
			_show(glow)
	var chosen := _glow_tiles.find(tile)
	if chosen < 0:
		chosen = _dimmest_glow()
	_glow_tiles[chosen] = tile
	_glow_levels[chosen] = 1.0
	_glow_meshes[chosen].transform = _transforms[tile].translated(
		Vector3.UP * (TILE_THICKNESS / 2.0 + GLOW_LIFT)
	)
	_show(chosen)
	return true


## The tile under a point on the ground, or -1 when it isn't on the track. A foot in the
## grout, or in the small wedge between two tiles on a corner, counts as on the nearest one.
func tile_at(point: Vector3) -> int:
	var nearest := -1
	var nearest_reach := NEAR_ENOUGH
	for index in _transforms.size():
		var local := _transforms[index].affine_inverse() * point
		# How far out from its centre the point is, as a share of the tile's half size.
		var reach := maxf(absf(local.x) / _half_size.x, absf(local.z) / _half_size.y)
		if reach <= nearest_reach:
			nearest = index
			nearest_reach = reach
	return nearest


func tile_count() -> int:
	return _transforms.size()


## How many tiles are lit, however faintly.
func lit_count() -> int:
	var lit := 0
	for level in _glow_levels:
		lit += 1 if level > 0.0 else 0
	return lit


## How brightly a tile is drawn, from 0 (dark) to 1.
func glow_shown(tile: int) -> float:
	var glow := _glow_tiles.find(tile)
	return 0.0 if glow < 0 else _shown_level(glow)


func _process(delta: float) -> void:
	update(delta)


## A point on the ground some distance past the lap line, `offset` metres to his right.
static func _column_point(track: TrackPath, distance: float, offset: float) -> Vector3:
	return track.point_at(distance) + track.heading_at(distance).cross(Vector3.UP) * offset


func _dimmest_glow() -> int:
	var dimmest := 0
	for glow in GLOWS:
		if _glow_levels[glow] < _glow_levels[dimmest]:
			dimmest = glow
	return dimmest


func _shown_level(glow: int) -> float:
	var level := _glow_levels[glow]
	return 1.0 if instant_fade and level > 0.0 else level


func _show(glow: int) -> void:
	var level := _shown_level(glow)
	var mesh := _glow_meshes[glow]
	mesh.visible = level > 0.0
	var material := mesh.material_override as StandardMaterial3D
	material.albedo_color.a = level


func _build_tiles(size: Vector3) -> void:
	var material := StandardMaterial3D.new()
	material.albedo_color = TILE_COLOUR
	material.roughness = 0.7
	var tile := BoxMesh.new()
	tile.size = size
	tile.material = material
	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.mesh = tile
	multimesh.instance_count = _transforms.size()
	for index in _transforms.size():
		multimesh.set_instance_transform(index, _transforms[index])
	var tiles := MultiMeshInstance3D.new()
	tiles.name = "Tiles"
	tiles.multimesh = multimesh
	add_child(tiles)


func _build_glows(size: Vector2) -> void:
	var plane := PlaneMesh.new()
	plane.size = size
	for glow in GLOWS:
		# Each glow fades on its own, so each has its own material.
		var material := StandardMaterial3D.new()
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		material.albedo_color = GLOW_COLOUR
		material.emission_enabled = true
		material.emission = GLOW_COLOUR
		material.emission_energy_multiplier = GLOW_ENERGY
		var mesh := MeshInstance3D.new()
		mesh.name = "Glow%d" % glow
		mesh.mesh = plane
		mesh.material_override = material
		mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(mesh)
		_glow_meshes.append(mesh)
		_glow_tiles.append(-1)
		_glow_levels.append(0.0)
		_show(glow)


func _build_lap_line(track: TrackPath, width: float) -> void:
	var line := BoxMesh.new()
	line.size = Vector3(width, 0.005, LAP_LINE_WIDTH)
	var material := StandardMaterial3D.new()
	material.albedo_color = LAP_LINE_COLOUR
	material.roughness = 1.0
	line.material = material
	var instance := MeshInstance3D.new()
	instance.name = "LapLine"
	instance.mesh = line
	instance.basis = Basis.looking_at(track.heading_at(0.0))
	instance.position = track.point_at(0.0) + Vector3.UP * TILE_TOP
	add_child(instance)
