class_name TrackLook
extends RefCounted
## Builds the dirt track the Worker runs on: a flat band along the track's centre line, laid
## just above the ground, in trodden earth darker than the dust around it.

const TRACK_COLOUR := Color(0.36, 0.29, 0.23)
const DUST_TEXTURE := preload("res://assets/polyhaven/dry_ground_01_diff_1k.jpg")
## How high above the ground the band lies, so it never flickers into it.
const LIFT := 0.01
## The band follows the centre line in pieces about this long, in metres.
const PIECE_LENGTH := 0.25
## The texture repeats every this many metres.
const TEXTURE_METRES := 4.0


static func build(track: TrackPath, width: float) -> MeshInstance3D:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	surface.set_normal(Vector3.UP)
	var pieces := ceili(track.length() / PIECE_LENGTH)
	for piece in pieces + 1:
		var along := track.length() * piece / pieces
		var centre := track.point_at(along) + Vector3.UP * LIFT
		var outward := track.heading_at(along).cross(Vector3.UP) * (-width / 2.0)
		var u := along / TEXTURE_METRES
		surface.set_uv(Vector2(u, 0.0))
		surface.add_vertex(centre + outward)
		surface.set_uv(Vector2(u, width / TEXTURE_METRES))
		surface.add_vertex(centre - outward)
	for piece in pieces:
		var outer := piece * 2
		# Two triangles per piece, wound to face up.
		for corner: int in [outer, outer + 2, outer + 1, outer + 1, outer + 2, outer + 3]:
			surface.add_index(corner)
	var material := StandardMaterial3D.new()
	material.albedo_color = TRACK_COLOUR
	material.albedo_texture = DUST_TEXTURE
	material.roughness = 1.0
	surface.set_material(material)
	var band := MeshInstance3D.new()
	band.name = "Track"
	band.mesh = surface.commit()
	return band
