extends GutTest
## The rot, driven through the Night. Numbers come from NightTestTuning: giving in costs 12,
## soured below 70, grotesque below 40.

const STEP := 0.1
const HERE := Vector3(1.0, 0.0, 2.0)


func _run(night: Night, seconds: float) -> void:
	for index in roundi(seconds / STEP):
		night.advance(STEP, false, false, HERE)


func _night() -> Night:
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	return Night.new(PiggyPose.new(Vector3.ZERO, 0.0, 0.0), NightTestTuning.table(), rng)


func test_being_caught_puts_the_rot_back_to_the_checkpoints_stage() -> void:
	var night := _night()
	night.hallucinations.add_space(&"kitchen", night.body.humanity)
	for spot: StringName in [&"a", &"b", &"c"]:
		night.give_in(spot, HERE)
		_run(night, 3.5)
	night.enter_space(&"kitchen", PiggyPose.new(Vector3.ZERO, 0.0, 0.0))
	for spot: StringName in [&"d", &"e", &"f"]:
		night.give_in(spot, HERE)
		_run(night, 3.5)
	night.look_at_spaces([] as Array[StringName])
	assert_eq(night.hallucinations.rot(&"kitchen"), Hallucinations.Rot.GROTESQUE)

	night.restore_checkpoint()

	assert_eq(night.body.humanity, 64.0)
	assert_eq(night.hallucinations.rot(&"kitchen"), Hallucinations.Rot.SOURED)
