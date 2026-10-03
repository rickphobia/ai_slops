extends GutTest
## Mum hunting by sound, driven through the Night with scripted noises and a fake house.
## Numbers come from NightTestTuning: snort 10 m, door 2–8 m, walk 3 m, trot 9 m, each
## closed door or wall halves a radius, Mum searches for 20 s.

const STEP := 0.1
const PIGGY_AT := Vector3.ZERO
const MUM_START := Vector3(0.0, 0.0, -8.0)
const DOOR := Vector3(0.0, 0.0, -2.0)
## Further than any of the Piggy's outbursts carries.
const OUT_OF_EARSHOT := Vector3(0.0, 0.0, -40.0)

var _distances: FakeDistances
var _heard: Array[HeardNoise] = []


func _night() -> Night:
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	_distances = FakeDistances.new()
	_heard = []
	var night := Night.new(
		PiggyPose.new(PIGGY_AT, 0.0, 0.0), NightTestTuning.table(), rng, _distances, MUM_START
	)
	night.noise_heard.connect(func(heard: HeardNoise) -> void: _heard.append(heard))
	return night


func _run(night: Night, seconds: float, gait := PiggyNoise.Gait.STILL) -> void:
	for index in roundi(seconds / STEP):
		night.advance(STEP, false, false, PIGGY_AT, gait)


func test_mum_starts_unaware() -> void:
	assert_eq(_night().mum.alert, FamilyBrain.Alert.UNAWARE)


func test_a_door_pushed_hard_near_mum_brings_her_to_look() -> void:
	var night := _night()

	night.door_creaked(8.0, DOOR)

	assert_eq(night.mum.alert, FamilyBrain.Alert.INVESTIGATING)
	assert_eq(night.mum.target, DOOR)
	assert_eq(_heard.size(), 1)
	assert_eq(_heard[0].noise.source, &"door")
	assert_almost_eq(_heard[0].distance, 6.0, 0.001)


func test_a_soft_door_push_out_of_range_goes_unheard() -> void:
	var night := _night()

	night.door_creaked(2.0, DOOR)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)
	assert_eq(_heard.size(), 0)


func test_a_closed_door_between_them_keeps_a_creak_from_her() -> void:
	var night := _night()
	_distances.barriers = 1

	night.door_creaked(8.0, DOOR)

	assert_eq(
		night.mum.alert, FamilyBrain.Alert.UNAWARE, "8 m through one door is 4 m; she is 6 m away"
	)


func test_an_outburst_she_is_in_range_of_brings_her_to_the_piggy() -> void:
	var night := _night()

	_run(night, 10.5)  # the urge peaks at 10 s: a snort (10 m) or louder

	assert_eq(night.mum.alert, FamilyBrain.Alert.INVESTIGATING)
	assert_eq(night.mum.target, PIGGY_AT)
	assert_ne(_heard[0].noise.source, &"footsteps")


func test_walking_is_heard_close_by_but_creeping_never() -> void:
	var night := _night()
	night.mum.position = Vector3(0.0, 0.0, -2.5)

	_run(night, 2.0, PiggyNoise.Gait.CREEP)
	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE, "creeping is silent")

	_run(night, 0.1, PiggyNoise.Gait.WALK)
	assert_eq(night.mum.alert, FamilyBrain.Alert.INVESTIGATING, "a walking footstep carries 3 m")
	assert_eq(_heard[0].noise.source, &"footsteps")


func test_trotting_is_heard_further_than_walking() -> void:
	var night := _night()
	night.mum.position = Vector3(0.0, 0.0, -6.0)

	_run(night, 2.0, PiggyNoise.Gait.WALK)
	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)

	_run(night, 0.1, PiggyNoise.Gait.TROT)
	assert_eq(night.mum.alert, FamilyBrain.Alert.INVESTIGATING)


func test_she_searches_where_she_arrives_then_goes_back_to_her_route() -> void:
	var night := _night()
	night.door_creaked(8.0, DOOR)

	night.mum.arrived()
	night.mum.position = OUT_OF_EARSHOT
	assert_eq(night.mum.alert, FamilyBrain.Alert.SEARCHING)
	_run(night, 19.5)
	assert_eq(night.mum.alert, FamilyBrain.Alert.SEARCHING, "still searching before 20 s")
	_run(night, 1.0)
	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_a_new_noise_while_searching_sends_her_to_it() -> void:
	var night := _night()
	night.door_creaked(8.0, DOOR)
	night.mum.arrived()
	night.mum.position = DOOR

	night.door_creaked(8.0, Vector3(0.0, 0.0, 1.0))

	assert_eq(night.mum.alert, FamilyBrain.Alert.INVESTIGATING)
	assert_eq(night.mum.target, Vector3(0.0, 0.0, 1.0))


func test_reaching_a_route_point_while_unaware_changes_nothing() -> void:
	var night := _night()

	night.mum.arrived()

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)


func test_each_alert_level_change_is_reported() -> void:
	var night := _night()
	var changes: Array[FamilyBrain.Alert] = []
	night.mum.alert_changed.connect(
		func(_from: FamilyBrain.Alert, to: FamilyBrain.Alert) -> void: changes.append(to)
	)

	night.door_creaked(8.0, DOOR)
	night.mum.arrived()
	night.mum.position = OUT_OF_EARSHOT
	_run(night, 21.0)

	assert_eq(
		changes,
		(
			[
				FamilyBrain.Alert.INVESTIGATING,
				FamilyBrain.Alert.SEARCHING,
				FamilyBrain.Alert.UNAWARE
			]
			as Array[FamilyBrain.Alert]
		)
	)


func test_after_the_night_ends_she_hears_nothing() -> void:
	var night := _night()
	night.reach_back_door()

	night.door_creaked(8.0, DOOR)

	assert_eq(night.mum.alert, FamilyBrain.Alert.UNAWARE)
