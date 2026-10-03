extends GutTest
## A door creaks louder the faster the Piggy pushes it. The loudness is a noise radius:
## how far away the creak can be heard before walls and doors muffle it.

const QUIETEST := 2.0
const LOUDEST := 8.0
const LOUDEST_SPEED := 3.0


func _tuning() -> Tuning:
	var tuning := Tuning.new()
	tuning.door_creak_quietest_radius = QUIETEST
	tuning.door_creak_loudest_radius = LOUDEST
	tuning.door_creak_loudest_speed = LOUDEST_SPEED
	return tuning


func test_a_barely_moving_push_makes_the_quietest_creak() -> void:
	assert_eq(DoorCreak.noise_radius(0.0, _tuning()), QUIETEST)


func test_a_push_at_the_loudest_speed_makes_the_loudest_creak() -> void:
	assert_eq(DoorCreak.noise_radius(LOUDEST_SPEED, _tuning()), LOUDEST)


func test_pushing_faster_than_the_loudest_speed_is_no_louder() -> void:
	assert_eq(DoorCreak.noise_radius(LOUDEST_SPEED * 3.0, _tuning()), LOUDEST)


func test_a_faster_push_creaks_louder_than_a_slower_one() -> void:
	var slow := DoorCreak.noise_radius(1.0, _tuning())
	var fast := DoorCreak.noise_radius(2.0, _tuning())

	assert_gt(slow, QUIETEST)
	assert_gt(fast, slow)
	assert_lt(fast, LOUDEST)
