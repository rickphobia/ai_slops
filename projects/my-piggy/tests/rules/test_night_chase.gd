extends GutTest
## Mum seeing, chasing and catching the Piggy, and being caught putting everything back to
## the checkpoint, driven through the Night with a fake house. Numbers come from
## NightTestTuning: a 60° torch beam reaching 10 m, caught within 1 m, Mum searches 20 s.

const STEP := 0.1
const PIGGY_AT := Vector3.ZERO
## Mum 6 m away, facing the Piggy unless a test turns her.
const MUM_START := Vector3(0.0, 0.0, -6.0)
const TOWARD_PIGGY := Vector3(0.0, 0.0, 1.0)

var _distances: FakeDistances
var _caught_count: int = 0


func _night() -> Night:
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	_distances = FakeDistances.new()
	_caught_count = 0
	var night := Night.new(
		PiggyPose.new(PIGGY_AT, 0.0, 0.0), NightTestTuning.table(), rng, _distances, MUM_START
	)
	night.mum.facing = TOWARD_PIGGY
	night.caught.connect(func() -> void: _caught_count += 1)
	return night


func _still(night: Night, seconds: float, at := PIGGY_AT) -> void:
	for index in roundi(seconds / STEP):
		night.advance(STEP, false, false, at)


func test_in_her_beam_with_a_clear_view_she_sees_and_chases() -> void:
	var night := _night()

	_still(night, STEP)

	assert_eq(night.mum.alert, FamilyBrain.Alert.CHASING)
	assert_eq(night.mum.target, PIGGY_AT)


func test_behind_her_she_does_not_see() -> void:
	var night := _night()
	night.mum.facing = -TOWARD_PIGGY

	_still(night, STEP)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_outside_the_edge_of_the_beam_she_does_not_see() -> void:
	var night := _night()
	# 40° off to the side: past the 30° half of a 60° beam.
	night.mum.facing = TOWARD_PIGGY.rotated(Vector3.UP, deg_to_rad(40.0))

	_still(night, STEP)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_beyond_the_torch_range_the_dark_hides_the_piggy() -> void:
	var night := _night()
	night.mum.position = Vector3(0.0, 0.0, -11.0)

	_still(night, STEP)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_furniture_in_the_way_hides_the_piggy() -> void:
	var night := _night()
	_distances.view_blocked = true

	_still(night, STEP)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_a_chase_follows_the_piggy_while_she_can_see_them() -> void:
	var night := _night()
	_still(night, STEP)

	_still(night, STEP, Vector3(1.0, 0.0, 0.0))

	assert_eq(night.mum.target, Vector3(1.0, 0.0, 0.0))


func test_breaking_line_of_sight_sends_her_searching_the_last_seen_spot() -> void:
	var night := _night()
	_still(night, STEP)

	_distances.view_blocked = true
	_still(night, STEP, Vector3(2.0, 0.0, 0.0))

	assert_eq(night.mum.alert, FamilyBrain.Alert.SEARCHING)
	assert_eq(night.mum.target, PIGGY_AT, "where she last saw them, not where they went")


func test_staying_hidden_and_quiet_loses_her_after_the_search() -> void:
	var night := _night()
	_still(night, STEP)
	_distances.view_blocked = true
	_still(night, STEP)
	# Far enough that the Piggy's next outburst doesn't reach her: quiet.
	night.mum.position = Vector3(0.0, 0.0, -40.0)

	_still(night, 20.0)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_noises_do_not_pull_her_off_a_chase() -> void:
	var night := _night()
	_still(night, STEP)

	night.door_creaked(8.0, Vector3(0.0, 0.0, -4.0))

	assert_eq(night.mum.alert, FamilyBrain.Alert.CHASING)
	assert_eq(night.mum.target, PIGGY_AT)


func test_reaching_the_piggy_while_chasing_catches_them() -> void:
	var night := _night()
	_still(night, STEP)
	assert_eq(_caught_count, 0, "6 m away is not caught")

	night.mum.position = Vector3(0.0, 0.0, -0.9)
	_still(night, STEP)

	assert_true(night.is_caught)
	assert_eq(_caught_count, 1)


func test_close_but_unaware_is_not_caught() -> void:
	var night := _night()
	night.mum.facing = -TOWARD_PIGGY
	night.mum.position = Vector3(0.0, 0.0, -0.9)

	_still(night, STEP)

	assert_false(night.is_caught)


func test_once_caught_the_night_waits_for_the_restore() -> void:
	var night := _night()
	night.mum.position = Vector3(0.0, 0.0, -0.9)
	_still(night, STEP)

	_still(night, 1.0)
	assert_eq(_caught_count, 1, "caught once, not every step")
	assert_eq(night.body.urge, 1.0, "the urge rose for one step, then stopped")


func test_being_caught_restores_the_checkpoint() -> void:
	var night := _night()
	night.mum.facing = -TOWARD_PIGGY
	var hallway_door := PiggyPose.new(Vector3(0.0, 0.0, 3.0), 1.0, 0.0)
	_still(night, 2.0)
	night.enter_space(&"hallway", hallway_door)
	var urge_at_checkpoint := night.body.urge

	# After the checkpoint: use the bowl, get seen and chased down somewhere else.
	night.give_in(&"bowl", PIGGY_AT)
	_still(night, 4.0)
	night.mum.position = Vector3(5.0, 0.0, 5.0)
	night.mum.facing = Vector3(-1.0, 0.0, -1.0)
	_still(night, STEP, Vector3(4.5, 0.0, 4.5))
	assert_true(night.is_caught)

	var pose := night.restore_checkpoint()

	assert_false(night.is_caught)
	assert_eq(night.space, &"hallway")
	assert_eq(pose.position, hallway_door.position)
	assert_eq(night.body.urge, urge_at_checkpoint)
	assert_eq(night.body.humanity, 100.0)
	assert_not_null(night.give_in(&"bowl", PIGGY_AT), "the bowl can be used again")
	assert_eq(night.mum.position, MUM_START)
	assert_eq(night.mum.facing, -TOWARD_PIGGY)
	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)
