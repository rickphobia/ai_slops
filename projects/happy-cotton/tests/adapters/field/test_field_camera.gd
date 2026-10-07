extends GutTest
## Where the field's camera may look, and how near or far it may be.

## The field reaches 6 m either side of its centre across, 5 m front to back.
const FIELD_HALF_SIZE := Vector2(6.0, 5.0)

var _camera: FieldCamera


func before_each() -> void:
	_camera = FieldCamera.new(Vector2(0.0, 0.5), 8.0, FIELD_HALF_SIZE)


func test_panning_moves_the_point_looked_at() -> void:
	_camera.pan(Vector2(2.0, -1.0))
	assert_eq(_camera.focus, Vector2(2.0, -0.5))


func test_panning_stops_at_the_field_edge() -> void:
	_camera.pan(Vector2(100.0, -100.0))
	assert_eq(_camera.focus, Vector2(6.0, -5.0))
	_camera.pan(Vector2(-100.0, 100.0))
	assert_eq(_camera.focus, Vector2(-6.0, 5.0))


func test_zooming_in_stops_at_the_near_limit() -> void:
	_camera.zoom_by(0.01)
	assert_eq(_camera.distance, FieldCamera.NEAR_DISTANCE)


func test_zooming_out_stops_at_the_far_limit() -> void:
	_camera.zoom_by(100.0)
	assert_eq(_camera.distance, FieldCamera.FAR_DISTANCE)


func test_zooming_scales_the_distance_between_the_limits() -> void:
	_camera.zoom_by(1.25)
	assert_almost_eq(_camera.distance, 10.0, 0.0001)


func test_a_start_outside_the_limits_is_pulled_back_in() -> void:
	var far_off := FieldCamera.new(Vector2(50.0, 0.0), 1000.0, FIELD_HALF_SIZE)
	assert_eq(far_off.focus, Vector2(6.0, 0.0))
	assert_eq(far_off.distance, FieldCamera.FAR_DISTANCE)


func test_the_camera_sits_back_along_its_fixed_angle() -> void:
	var back := Vector3(0.0, 1.0, 1.0).normalized()
	var position := _camera.position_along(back)
	assert_almost_eq(position, Vector3(0.0, 0.0, 0.5) + back * 8.0, Vector3.ONE * 0.0001)


func test_the_limits_keep_near_closer_than_far() -> void:
	assert_lt(FieldCamera.NEAR_DISTANCE, FieldCamera.FAR_DISTANCE)
