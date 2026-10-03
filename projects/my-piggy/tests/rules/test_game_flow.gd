extends GutTest
## What the player can do at each point: title screen, the opening in the dark, playing, paused.

const TEST_OPENING_SECONDS := 4.0


func _flow() -> GameFlow:
	return GameFlow.new(TEST_OPENING_SECONDS)


func test_the_game_opens_on_the_title_screen_without_control() -> void:
	var flow := _flow()

	assert_eq(flow.stage, GameFlow.Stage.TITLE)
	assert_false(flow.has_control())


func test_starting_plays_the_opening_in_the_dark_without_control() -> void:
	var flow := _flow()

	flow.start()

	assert_eq(flow.stage, GameFlow.Stage.OPENING)
	assert_false(flow.has_control())


func test_control_is_given_once_the_opening_has_run_its_length() -> void:
	var flow := _flow()
	flow.start()

	flow.advance(TEST_OPENING_SECONDS - 0.5)
	assert_false(flow.has_control(), "not yet")
	flow.advance(0.5)

	assert_eq(flow.stage, GameFlow.Stage.PLAYING)
	assert_true(flow.has_control())


func test_time_does_not_end_the_title_screen() -> void:
	var flow := _flow()

	flow.advance(TEST_OPENING_SECONDS * 10)

	assert_eq(flow.stage, GameFlow.Stage.TITLE)


func test_pausing_takes_control_away_and_resuming_gives_it_back() -> void:
	var flow := _flow()
	flow.start()
	flow.advance(TEST_OPENING_SECONDS)

	flow.pause()
	assert_eq(flow.stage, GameFlow.Stage.PAUSED)
	assert_false(flow.has_control())
	flow.resume()

	assert_true(flow.has_control())


func test_the_opening_cannot_be_paused() -> void:
	var flow := _flow()
	flow.start()

	flow.pause()

	assert_eq(flow.stage, GameFlow.Stage.OPENING)


func test_time_does_not_pass_while_paused() -> void:
	var flow := _flow()
	flow.start()
	flow.advance(TEST_OPENING_SECONDS)
	flow.pause()

	flow.advance(100.0)

	assert_eq(flow.stage, GameFlow.Stage.PAUSED)


func test_starting_twice_does_not_restart_the_opening() -> void:
	var flow := _flow()
	flow.start()
	flow.advance(TEST_OPENING_SECONDS - 0.5)

	flow.start()
	flow.advance(0.5)

	assert_true(flow.has_control())


func test_the_end_of_the_night_takes_control_away_for_good() -> void:
	var flow := _flow()
	flow.start()
	flow.advance(TEST_OPENING_SECONDS)

	flow.end()
	flow.pause()
	flow.resume()

	assert_eq(flow.stage, GameFlow.Stage.ENDED)
	assert_false(flow.has_control())
