extends GutTest
## The track's centre line: a rounded rectangle around the field, measured from the turnstile
## on its left side in the direction he runs (away from the camera first).

const HALF_SIZE := Vector2(7.0, 5.0)
const RADIUS := 1.0
const TURNSTILE_Z := 3.0

var _track: TrackPath


func before_each() -> void:
	_track = TrackPath.new(HALF_SIZE, RADIUS, TURNSTILE_Z)


func test_a_lap_is_the_straights_and_one_full_circle_of_corners() -> void:
	var straights := 2.0 * (12.0 + 8.0)
	assert_almost_eq(_track.length(), straights + TAU * RADIUS, 0.0001)


func test_it_starts_at_the_turnstile_heading_away_from_the_camera() -> void:
	assert_almost_eq(_track.point_at(0.0), Vector3(-7.0, 0.0, 3.0), Vector3.ONE * 0.0001)
	assert_almost_eq(_track.heading_at(0.0), Vector3(0.0, 0.0, -1.0), Vector3.ONE * 0.0001)


func test_it_runs_round_the_back_then_the_far_side() -> void:
	# 7 m up the left side and 0.5π m round the corner reach the back straight.
	var back_straight_start := 7.0 + PI / 2.0
	assert_almost_eq(
		_track.point_at(back_straight_start + 6.0), Vector3(0.0, 0.0, -5.0), Vector3.ONE * 0.0001
	)
	assert_almost_eq(
		_track.heading_at(back_straight_start + 6.0), Vector3(1.0, 0.0, 0.0), Vector3.ONE * 0.0001
	)
	var right_side_middle := back_straight_start + 12.0 + PI / 2.0 + 4.0
	assert_almost_eq(
		_track.point_at(right_side_middle), Vector3(7.0, 0.0, 0.0), Vector3.ONE * 0.0001
	)


func test_corners_are_round() -> void:
	var halfway_round := 7.0 + PI / 4.0
	var corner_centre := Vector3(-6.0, 0.0, -4.0)
	assert_almost_eq(_track.point_at(halfway_round).distance_to(corner_centre), RADIUS, 0.0001)


func test_a_lap_brings_him_back_to_the_turnstile() -> void:
	assert_almost_eq(_track.point_at(_track.length()), _track.point_at(0.0), Vector3.ONE * 0.0001)
	assert_almost_eq(
		_track.point_at(_track.length() + 2.0), _track.point_at(2.0), Vector3.ONE * 0.0001
	)
	assert_almost_eq(_track.point_at(-1.0), Vector3(-7.0, 0.0, 4.0), Vector3.ONE * 0.0001)


func test_it_reaches_the_given_half_size_and_no_further() -> void:
	var furthest := Vector2.ZERO
	for step in 200:
		var point := _track.point_at(_track.length() * step / 200.0)
		furthest = furthest.max(Vector2(absf(point.x), absf(point.z)))
	assert_almost_eq(furthest, HALF_SIZE, Vector2.ONE * 0.0001)
