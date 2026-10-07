extends GutTest
## The App overlay shows what it is given: the Quota, the Shift's time left, Labour Points and
## the Mascot's words.

var _overlay: AppOverlay


func before_each() -> void:
	_overlay = AppOverlay.new()
	add_child_autofree(_overlay)


func _label_texts() -> Array[String]:
	var texts: Array[String] = []
	for node in _overlay.find_children("*", "Label", true, false):
		texts.append((node as Label).text)
	return texts


func test_the_clock_reads_minutes_and_seconds_rounded_up() -> void:
	assert_eq(AppOverlay.clock_text(600.0), "10:00")
	assert_eq(AppOverlay.clock_text(59.2), "1:00")
	assert_eq(AppOverlay.clock_text(0.4), "0:01")
	assert_eq(AppOverlay.clock_text(0.0), "0:00")
	assert_eq(AppOverlay.clock_text(-3.0), "0:00")


func test_it_shows_the_quota_the_time_left_and_the_labour_points() -> void:
	_overlay.show_shift(ShiftView.new(2, 12, 5, 90.0), 30)

	var texts := _label_texts()
	assert_has(texts, "Quota 5 / 12")
	assert_has(texts, "Shift 2  ·  1:30 left")
	assert_has(texts, "30 Labour Points")


func test_the_mascot_says_what_it_is_given() -> void:
	_overlay.say("Shift 1 begins!")

	assert_eq(_overlay.speech(), "Shift 1 begins!")


func test_celebrating_does_not_fail_before_or_after_a_shift_is_shown() -> void:
	_overlay.celebrate()
	_overlay.show_shift(ShiftView.new(1, 3, 4, 10.0), 0)

	assert_has(_label_texts(), "Quota 4 / 3", "a surplus is shown, the bar just stays full")
