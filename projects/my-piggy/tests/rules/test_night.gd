extends GutTest
## A Night is one playthrough. Tests drive it only through its public interface.

const WAKE_POSE_POSITION := Vector3(0.0, 0.0, 2.0)


func _pose(position: Vector3, yaw: float = 0.0, pitch: float = 0.0) -> PiggyPose:
	return PiggyPose.new(position, yaw, pitch)


func _night() -> Night:
	return Night.new(_pose(WAKE_POSE_POSITION), NightTestTuning.table())


func test_new_night_starts_in_the_bedroom() -> void:
	assert_eq(_night().space, &"bedroom")


func test_each_step_of_the_night_is_counted() -> void:
	var night := _night()

	night.advance(0.1, false, false, Vector3.ZERO)
	night.advance(0.1, false, false, Vector3.ZERO)

	assert_eq(night.step, 2)


func test_entering_a_new_space_takes_a_checkpoint() -> void:
	var night := _night()

	var took_checkpoint := night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -5.0)))

	assert_true(took_checkpoint)
	assert_eq(night.space, &"hallway")


func test_moving_about_inside_the_same_space_takes_no_checkpoint() -> void:
	var night := _night()
	night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -5.0)))

	var took_checkpoint := night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -9.0)))

	assert_false(took_checkpoint)


func test_restoring_puts_the_piggy_back_where_and_how_they_entered_the_space() -> void:
	var night := _night()
	night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -5.0), 0.5, -0.2))
	night.enter_space(&"hallway", _pose(Vector3(0.3, 0.0, -11.0), 2.0, 0.4))

	var restored := night.restore_checkpoint()

	assert_eq(restored.position, Vector3(0.0, 0.0, -5.0))
	assert_eq(restored.yaw, 0.5)
	assert_eq(restored.pitch, -0.2)
	assert_eq(night.space, &"hallway")


func test_restoring_before_leaving_the_bedroom_puts_the_piggy_back_where_they_woke() -> void:
	var restored := _night().restore_checkpoint()

	assert_eq(restored.position, WAKE_POSE_POSITION)


func test_going_back_into_an_earlier_space_takes_a_fresh_checkpoint_there() -> void:
	var night := _night()
	night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -5.0)))

	var took_checkpoint := night.enter_space(&"bedroom", _pose(Vector3(0.0, 0.0, -3.9)))
	var restored := night.restore_checkpoint()

	assert_true(took_checkpoint)
	assert_eq(restored.position, Vector3(0.0, 0.0, -3.9))
	assert_eq(night.space, &"bedroom")


func test_a_night_is_not_over_until_the_piggy_reaches_the_back_door() -> void:
	var night := _night()
	night.enter_space(&"kitchen", _pose(Vector3(0.0, 0.0, -17.0)))

	assert_false(night.has_ended)
	night.reach_back_door()
	assert_true(night.has_ended)


func test_once_the_night_is_over_entering_a_space_does_nothing() -> void:
	var night := _night()
	night.enter_space(&"kitchen", _pose(Vector3(0.0, 0.0, -17.0)))
	night.reach_back_door()

	var took_checkpoint := night.enter_space(&"hallway", _pose(Vector3(0.0, 0.0, -15.0)))

	assert_false(took_checkpoint)
	assert_eq(night.space, &"kitchen")
