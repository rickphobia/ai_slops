extends GutTest
## The wall clock turns the gap between two frames into offline time, with a fake clock.

var _now := 1000.0
var _clock: WallClock


func before_each() -> void:
	_now = 1000.0
	_clock = WallClock.new(func() -> float: return _now)


func test_the_first_frame_has_no_offline_time() -> void:
	assert_eq(_clock.offline_seconds(0.016), 0.0)


func test_ordinary_frames_have_no_offline_time() -> void:
	_clock.offline_seconds(0.016)
	_now += 0.016

	assert_eq(_clock.offline_seconds(0.016), 0.0)


func test_a_hidden_tab_counts_the_hidden_time_less_the_frame_step() -> void:
	_clock.offline_seconds(0.016)
	_now += 600.1

	assert_almost_eq(_clock.offline_seconds(0.1), 600.0, 0.0001)


func test_the_hidden_time_is_counted_once() -> void:
	_clock.offline_seconds(0.016)
	_now += 600.0
	_clock.offline_seconds(0.016)
	_now += 0.016

	assert_eq(_clock.offline_seconds(0.016), 0.0)


func test_a_short_stall_is_a_slow_frame_not_an_absence() -> void:
	_clock.offline_seconds(0.016)
	_now += 1.5

	assert_eq(_clock.offline_seconds(0.13), 0.0)


func test_a_step_longer_than_the_wall_time_is_not_negative_offline_time() -> void:
	_clock.offline_seconds(0.016)
	_now += 0.016

	assert_eq(_clock.offline_seconds(600.0), 0.0)


func test_a_clock_set_back_reports_negative_offline_time() -> void:
	_clock.offline_seconds(0.016)
	_now -= 3600.0

	assert_eq(_clock.offline_seconds(0.016), -3600.0)
