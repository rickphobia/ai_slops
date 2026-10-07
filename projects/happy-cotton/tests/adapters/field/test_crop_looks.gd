extends GutTest
## What the cotton plant looks like at each growth stage.

var _looks := CropLooks.new()


func _meshes_in(look: Node3D) -> Array[Node]:
	return look.find_children("*", "MeshInstance3D", true, false)


func test_empty_plot_has_no_plant() -> void:
	var look := _looks.build(PlotView.Stage.EMPTY)
	autofree(look)
	assert_eq(_meshes_in(look).size(), 0)


func test_every_growing_stage_shows_a_plant() -> void:
	var growing: Array[PlotView.Stage] = [
		PlotView.Stage.SEEDLING,
		PlotView.Stage.FLOWERING,
		PlotView.Stage.BOLL,
		PlotView.Stage.RIPE,
	]
	for stage in growing:
		var look := _looks.build(stage)
		autofree(look)
		assert_gt(_meshes_in(look).size(), 0, "stage %d" % stage)


func test_ripe_plant_carries_open_cotton() -> void:
	var look := _looks.build(PlotView.Stage.RIPE)
	autofree(look)
	var open_bolls := 0
	for mesh in _meshes_in(look):
		if (mesh as MeshInstance3D).mesh.surface_get_material(0) == _looks.cotton:
			open_bolls += 1
	assert_eq(open_bolls, CropLooks.BUD_SPOTS.size())
