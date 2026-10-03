extends GutTest
## The Piggy's body, driven through the Night the way the game drives it: small steps of
## time with what the player is doing. Numbers come from NightTestTuning:
## urge rises 10/s at rest, 20/s trotting, warning at 70, peak at 100, 30 after an outburst.

const STEP := 0.1
const HERE := Vector3(1.0, 0.0, 2.0)
const BOWL := &"BedroomBowl"
const BIN := &"KitchenBin"


func _night() -> Night:
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	return Night.new(PiggyPose.new(Vector3.ZERO, 0.0, 0.0), NightTestTuning.table(), rng)


## Runs the night for `seconds` and returns every body event on the way.
func _run(
	night: Night, seconds: float, trotting: bool = false, suppress_held: bool = false
) -> Array[BodyEvent]:
	var events: Array[BodyEvent] = []
	for index in roundi(seconds / STEP):
		events.append_array(night.advance(STEP, trotting, suppress_held, HERE))
	return events


func _of_kind(events: Array[BodyEvent], kind: BodyEvent.Kind) -> Array[BodyEvent]:
	var found: Array[BodyEvent] = []
	for event in events:
		if event.kind == kind:
			found.append(event)
	return found


## Brings the urge to just below the peak without an outburst.
func _almost_peak(night: Night) -> void:
	_run(night, 9.9)


## Holds back one outburst briefly, then lets it out.
func _suppress_once(night: Night) -> void:
	_almost_peak(night)
	_run(night, 0.5, false, true)
	_run(night, 0.1)


func test_the_urge_builds_up_on_its_own_at_rest() -> void:
	var night := _night()

	_run(night, 2.0)

	assert_almost_eq(night.body.urge, 20.0, 0.01)


func test_the_urge_builds_faster_while_trotting() -> void:
	var night := _night()

	_run(night, 2.0, true)

	assert_almost_eq(night.body.urge, 40.0, 0.01)


func test_warning_signs_start_at_the_warning_threshold_and_not_before() -> void:
	var night := _night()

	var before := _run(night, 6.8)
	var after := _run(night, 0.4)

	assert_eq(_of_kind(before, BodyEvent.Kind.WARNING).size(), 0)
	assert_eq(_of_kind(after, BodyEvent.Kind.WARNING).size(), 1)
	assert_true(night.body.is_warning())


func test_doing_nothing_ends_in_an_outburst_at_the_peak_heard_where_the_piggy_is() -> void:
	var night := _night()

	var events := _run(night, 10.5)

	var outbursts := _of_kind(events, BodyEvent.Kind.OUTBURST)
	assert_eq(outbursts.size(), 1)
	var outburst := outbursts[0]
	assert_eq(outburst.position, HERE)
	assert_ne(outburst.outburst, BodyEvent.Outburst.NONE)
	assert_eq(outburst.loudness, night.body.outburst_radius(outburst.outburst))
	assert_gt(outburst.loudness, 0.0)
	assert_lt(night.body.urge, 70.0, "drops to 30, then builds again")


func test_holding_suppress_at_the_peak_delays_the_outburst_and_slows_the_piggy() -> void:
	var night := _night()
	_almost_peak(night)

	var events := _run(night, 2.0, false, true)

	assert_eq(_of_kind(events, BodyEvent.Kind.OUTBURST).size(), 0)
	assert_eq(_of_kind(events, BodyEvent.Kind.SUPPRESS_STARTED).size(), 1)
	assert_true(night.body.is_suppressing())
	assert_eq(night.body.speed_factor(), 0.25)
	assert_almost_eq(night.body.urge, 100.0, 0.01, "suppressing does not clear the urge")


func test_suppress_only_slows_the_piggy_while_it_holds_an_outburst_back() -> void:
	var night := _night()

	_run(night, 2.0, false, true)

	assert_false(night.body.is_suppressing())
	assert_eq(night.body.speed_factor(), 1.0)


func test_letting_go_of_suppress_lets_out_a_louder_outburst() -> void:
	var night := _night()
	_almost_peak(night)
	_run(night, 2.0, false, true)

	var events := _run(night, 0.1)

	var outburst := _of_kind(events, BodyEvent.Kind.OUTBURST)[0]
	var normal := night.body.outburst_radius(outburst.outburst)
	assert_almost_eq(outburst.loudness, normal * (1.0 + 0.2 * 2.0), normal * 0.05)


func test_suppressing_past_the_limit_forces_the_outburst_at_its_raised_loudness() -> void:
	var night := _night()
	_almost_peak(night)

	var events := _run(night, 7.0, false, true)

	var outbursts := _of_kind(events, BodyEvent.Kind.OUTBURST)
	assert_eq(outbursts.size(), 1)
	var normal := night.body.outburst_radius(outbursts[0].outburst)
	assert_almost_eq(outbursts[0].loudness, normal * (1.0 + 0.2 * 5.0), 0.01)


func test_each_suppressed_outburst_makes_the_urge_rise_faster_for_the_rest_of_the_space() -> void:
	var night := _night()
	_suppress_once(night)
	var after_outburst := night.body.urge

	_run(night, 1.0)

	assert_almost_eq(night.body.urge - after_outburst, 15.0, 0.01, "10/s raised by 50%")


func test_a_new_space_brings_the_urge_rise_rate_back_to_normal() -> void:
	var night := _night()
	_suppress_once(night)
	night.enter_space(&"hallway", PiggyPose.new(Vector3.ZERO, 0.0, 0.0))
	var before := night.body.urge

	_run(night, 1.0)

	assert_almost_eq(night.body.urge - before, 10.0, 0.01)


func test_giving_in_takes_a_while_then_clears_the_urge_quietly_and_costs_humanity() -> void:
	var night := _night()
	_run(night, 8.0)

	var started := night.give_in(BOWL, HERE)
	var during := _run(night, 2.5)
	assert_not_null(started)
	assert_true(night.body.is_giving_in())
	assert_eq(night.body.speed_factor(), 0.0)
	assert_eq(_of_kind(during, BodyEvent.Kind.GAVE_IN).size(), 0)
	assert_eq(night.body.humanity, 100.0)

	var after := _run(night, 0.6)

	var gave_in := _of_kind(after, BodyEvent.Kind.GAVE_IN)
	assert_eq(gave_in.size(), 1)
	assert_eq(gave_in[0].loudness, 2.0)
	assert_eq(gave_in[0].position, HERE)
	assert_eq(night.body.humanity, 88.0)
	assert_lt(night.body.urge, 10.0, "cleared to 0, then builds again")
	assert_false(night.body.is_giving_in())


func test_the_urge_does_not_build_while_giving_in() -> void:
	var night := _night()
	night.give_in(BOWL, HERE)

	_run(night, 2.0)

	assert_eq(night.body.urge, 0.0)


func test_a_give_in_spot_works_once_per_checkpoint() -> void:
	var night := _night()
	night.give_in(BOWL, HERE)
	_run(night, 3.5)

	assert_null(night.give_in(BOWL, HERE))
	assert_not_null(night.give_in(BIN, HERE))


func test_humanity_starts_full_never_rises_and_stops_at_zero() -> void:
	var night := _night()
	assert_eq(night.body.humanity, 100.0)
	var lowest := 100.0

	for spot: StringName in [&"a", &"b", &"c", &"d", &"e", &"f", &"g", &"h", &"i"]:
		night.give_in(spot, HERE)
		_run(night, 3.5)
		assert_lte(night.body.humanity, lowest)
		lowest = night.body.humanity

	assert_eq(night.body.humanity, 0.0)


func test_restoring_a_checkpoint_puts_the_body_back_as_it_entered_the_space() -> void:
	var night := _night()
	night.give_in(BOWL, HERE)
	_run(night, 5.5)
	night.enter_space(&"hallway", PiggyPose.new(Vector3.ZERO, 0.0, 0.0))
	var urge_at_entry := night.body.urge
	_suppress_once(night)
	night.give_in(BIN, HERE)
	_run(night, 3.5)

	night.restore_checkpoint()

	assert_almost_eq(night.body.urge, urge_at_entry, 0.01)
	assert_eq(night.body.humanity, 88.0)
	assert_null(night.give_in(BOWL, HERE), "used before the checkpoint: still used")
	assert_not_null(night.give_in(BIN, HERE), "used after it: usable again")


func test_restoring_puts_back_the_urge_rise_rate_of_the_checkpoint() -> void:
	var night := _night()
	_suppress_once(night)

	night.restore_checkpoint()
	_run(night, 1.0)

	assert_almost_eq(night.body.urge, 10.0, 0.01)


func test_restoring_while_giving_in_stops_it() -> void:
	var night := _night()
	night.give_in(BOWL, HERE)

	night.restore_checkpoint()

	assert_false(night.body.is_giving_in())


func test_the_body_stops_once_the_night_is_over() -> void:
	var night := _night()
	night.reach_back_door()

	_run(night, 2.0)

	assert_eq(night.body.urge, 0.0)
	assert_null(night.give_in(BOWL, HERE))
