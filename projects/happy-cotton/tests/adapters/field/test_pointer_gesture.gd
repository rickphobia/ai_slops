extends GutTest
## Telling a tap from a drag or a pinch, so moving the view never plants or picks.

const FINGER := 0
const SECOND_FINGER := 1

var _gesture: PointerGesture


func before_each() -> void:
	_gesture = PointerGesture.new(10.0)


func test_a_press_and_release_in_place_is_a_tap() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	assert_true(_gesture.release(FINGER))


func test_a_small_wobble_is_still_a_tap() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.move(FINGER, Vector2(106, 104))
	assert_true(_gesture.release(FINGER))


func test_a_drag_is_not_a_tap() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.move(FINGER, Vector2(140, 100))
	assert_false(_gesture.release(FINGER))


func test_a_drag_that_comes_back_is_still_not_a_tap() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.move(FINGER, Vector2(140, 100))
	_gesture.move(FINGER, Vector2(100, 100))
	assert_false(_gesture.release(FINGER))


func test_a_pinch_never_taps_even_if_the_fingers_barely_moved() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.press(SECOND_FINGER, Vector2(200, 100))
	assert_false(_gesture.release(SECOND_FINGER))
	assert_false(_gesture.release(FINGER))


func test_the_next_press_after_a_drag_can_tap_again() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.move(FINGER, Vector2(300, 100))
	_gesture.release(FINGER)
	_gesture.press(FINGER, Vector2(300, 100))
	assert_true(_gesture.release(FINGER))


func test_releasing_a_pointer_that_was_never_pressed_is_not_a_tap() -> void:
	assert_false(_gesture.release(FINGER))


func test_a_cancelled_press_is_not_a_tap() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.cancel(FINGER)
	assert_false(_gesture.release(FINGER))
	assert_eq(_gesture.pointer_count(), 0)


func test_one_pointer_is_its_own_midpoint() -> void:
	_gesture.press(FINGER, Vector2(100, 50))
	assert_eq(_gesture.midpoint(), Vector2(100, 50))
	assert_eq(_gesture.spread(), 0.0)


func test_two_fingers_have_a_midpoint_and_a_spread() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.press(SECOND_FINGER, Vector2(200, 100))
	assert_eq(_gesture.midpoint(), Vector2(150, 100))
	assert_eq(_gesture.spread(), 100.0)


func test_moving_an_unknown_pointer_changes_nothing() -> void:
	_gesture.press(FINGER, Vector2(100, 100))
	_gesture.move(SECOND_FINGER, Vector2(500, 500))
	assert_eq(_gesture.pointer_count(), 1)
	assert_true(_gesture.release(FINGER))
