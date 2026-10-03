extends GutTest
## Noises: how loud each thing the Piggy does is, and who hears it. Numbers come from
## NightTestTuning: walk 3 m, trot 9 m, creep silent.

const HERE := Vector3(1.0, 0.0, 2.0)


func test_a_noise_is_heard_within_its_radius_and_not_beyond() -> void:
	var noise := PiggyNoise.new(&"snort", HERE, 10.0)
	var distances := FakeDistances.new()

	var near := noise.heard_at(HERE + Vector3(9.0, 0.0, 0.0), distances, 0.5)
	var far := noise.heard_at(HERE + Vector3(11.0, 0.0, 0.0), distances, 0.5)

	assert_not_null(near)
	assert_almost_eq(near.distance, 9.0, 0.001)
	assert_null(far)


func test_each_closed_door_or_wall_cuts_the_range_by_the_tuned_amount() -> void:
	var noise := PiggyNoise.new(&"squeal", HERE, 20.0)
	var distances := FakeDistances.new()
	distances.barriers = 2

	assert_almost_eq(noise.reach_through(1, 0.4), 12.0, 0.001)
	assert_almost_eq(noise.reach_through(2, 0.5), 5.0, 0.001)
	assert_null(
		noise.heard_at(HERE + Vector3(0.0, 0.0, 6.0), distances, 0.5),
		"20 m through two halving barriers is 5 m"
	)
	assert_eq(noise.heard_at(HERE + Vector3(0.0, 0.0, 4.0), distances, 0.5).barriers, 2)


func test_nothing_is_heard_without_a_house() -> void:
	var noise := PiggyNoise.new(&"squeal", HERE, 20.0)

	assert_null(noise.heard_at(HERE, DistanceProvider.new(), 0.5))


func test_footsteps_are_louder_the_faster_the_piggy_goes_and_creeping_is_silent() -> void:
	var tuning := NightTestTuning.table()

	assert_null(PiggyNoise.footstep(PiggyNoise.Gait.STILL, HERE, tuning))
	assert_null(PiggyNoise.footstep(PiggyNoise.Gait.CREEP, HERE, tuning))
	assert_eq(PiggyNoise.footstep(PiggyNoise.Gait.WALK, HERE, tuning).loudness, 3.0)
	assert_eq(PiggyNoise.footstep(PiggyNoise.Gait.TROT, HERE, tuning).loudness, 9.0)


func test_an_outburst_is_a_noise_named_after_it_and_a_warning_is_silent() -> void:
	var squeal := BodyEvent.new(BodyEvent.Kind.OUTBURST, HERE, 20.0, BodyEvent.Outburst.SQUEAL)
	var warning := BodyEvent.new(BodyEvent.Kind.WARNING, HERE)

	var noise := PiggyNoise.from_body_event(squeal)

	assert_eq(noise.source, &"squeal")
	assert_eq(noise.position, HERE)
	assert_eq(noise.loudness, 20.0)
	assert_null(PiggyNoise.from_body_event(warning))
