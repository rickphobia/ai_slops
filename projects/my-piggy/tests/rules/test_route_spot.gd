extends GutTest
## Where Mum starts again after a catch: on her route, far enough away on foot and not
## seeing the Piggy. Fake house, NightTestTuning: torch 60° to 10 m, restart 8 m away.

const PIGGY_AT := Vector3.ZERO

var _distances := FakeDistances.new()


func _spot(route: Array[Vector3]) -> RouteSpot:
	return RouteSpot.out_of_sight(route, PIGGY_AT, NightTestTuning.table(), _distances)


func test_the_first_route_point_far_enough_and_facing_away_is_taken() -> void:
	var spot := _spot([Vector3(0.0, 0.0, -9.0), Vector3(0.0, 0.0, -14.0)])

	assert_eq(spot.position, Vector3(0.0, 0.0, -9.0))
	assert_eq(spot.facing, Vector3(0.0, 0.0, -1.0), "toward the next point")
	assert_eq(spot.next_point, 1)


func test_too_close_points_are_passed_over_for_a_spot_further_along_the_route() -> void:
	var spot := _spot([Vector3(0.0, 0.0, -3.0), Vector3(0.0, 0.0, -13.0)])

	assert_almost_eq(spot.position.z, -8.0, 0.01, "the first spot 8 m away")
	assert_eq(spot.next_point, 1)


func test_a_spot_where_her_torch_would_show_the_piggy_is_passed_over() -> void:
	# At -9 she would walk toward the Piggy with them in her beam.
	var spot := _spot([Vector3(0.0, 0.0, -9.0), Vector3(0.0, 0.0, -6.0), Vector3(0.0, 0.0, -20.0)])

	assert_eq(spot.facing, Vector3(0.0, 0.0, -1.0), "walking away from the Piggy")
	assert_eq(spot.next_point, 2)
	assert_lte(spot.position.z, -8.0)


func test_with_a_wall_in_the_way_a_spot_facing_the_piggy_will_do() -> void:
	_distances.view_blocked = true

	var spot := _spot([Vector3(0.0, 0.0, -9.0), Vector3(0.0, 0.0, -6.0)])

	assert_eq(spot.position, Vector3(0.0, 0.0, -9.0))


func test_on_a_route_too_short_she_starts_as_far_as_it_goes() -> void:
	var spot := _spot([Vector3(0.0, 0.0, -6.0), Vector3(-2.0, 0.0, -6.0)])

	assert_eq(spot.position, Vector3(-2.0, 0.0, -6.0))
