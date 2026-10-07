class_name PlotGrid
extends RefCounted
## Where each plot sits on the ground, and which plot a point on the ground falls in.
## Plots are numbered row by row from the back left; the grid is centred on the origin.

var columns: int
var rows: int
## Distance between neighbouring plot centres, in metres.
var spacing: float
## Width of one square plot, in metres. Points in the gap between plots hit no plot.
var plot_size: float


func _init(grid_columns: int, grid_rows: int, centre_spacing: float, size: float) -> void:
	columns = grid_columns
	rows = grid_rows
	spacing = centre_spacing
	plot_size = size


func count() -> int:
	return columns * rows


func centre_of(index: int) -> Vector3:
	var column := index % columns
	var row := floori(float(index) / columns)
	return Vector3(_offset(column, columns), 0.0, _offset(row, rows))


## The plot under a point on the ground, or -1 when the point is outside every plot.
func index_at(point: Vector3) -> int:
	var column := roundi(point.x / spacing + (columns - 1) / 2.0)
	var row := roundi(point.z / spacing + (rows - 1) / 2.0)
	if column < 0 or column >= columns or row < 0 or row >= rows:
		return -1
	var index := row * columns + column
	var centre := centre_of(index)
	var half := plot_size / 2.0
	if absf(point.x - centre.x) > half or absf(point.z - centre.z) > half:
		return -1
	return index


func _offset(position: int, along: int) -> float:
	return (position - (along - 1) / 2.0) * spacing
