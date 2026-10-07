extends GutTest
## Turning a tapped point on the ground into the plot under it.

var _grid := PlotGrid.new(4, 3, 2.0, 1.6)


func test_the_grid_counts_every_plot() -> void:
	assert_eq(_grid.count(), 12)


func test_the_grid_is_centred_on_the_origin() -> void:
	assert_eq(_grid.centre_of(0), Vector3(-3.0, 0.0, -2.0))
	assert_eq(_grid.centre_of(11), Vector3(3.0, 0.0, 2.0))


func test_every_plot_centre_finds_its_own_plot() -> void:
	for index in _grid.count():
		assert_eq(_grid.index_at(_grid.centre_of(index)), index)


func test_a_point_near_a_plot_edge_still_finds_it() -> void:
	assert_eq(_grid.index_at(_grid.centre_of(5) + Vector3(0.79, 0.0, -0.79)), 5)


func test_the_gap_between_plots_hits_no_plot() -> void:
	assert_eq(_grid.index_at(_grid.centre_of(5) + Vector3(0.9, 0.0, 0.0)), -1)


func test_a_point_off_the_grid_hits_no_plot() -> void:
	assert_eq(_grid.index_at(Vector3(20.0, 0.0, 0.0)), -1)
	assert_eq(_grid.index_at(Vector3(0.0, 0.0, -20.0)), -1)
