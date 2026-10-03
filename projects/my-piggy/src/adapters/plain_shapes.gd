class_name PlainShapes
extends RefCounted
## Plain coloured shapes for objects whose custom models don't exist yet.


## A mesh in one flat colour, placed at `at`.
static func piece(mesh: PrimitiveMesh, colour: Color, at: Vector3) -> MeshInstance3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	mesh.material = material
	var placed := MeshInstance3D.new()
	placed.mesh = mesh
	placed.position = at
	return placed
