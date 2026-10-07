extends GutTest
## The field's time-left text.


func test_time_left_shows_minutes_and_seconds() -> void:
	assert_eq(Field.time_left_text(125.0), "2:05 left")


func test_time_left_rounds_part_seconds_up() -> void:
	assert_eq(Field.time_left_text(0.2), "0:01 left")
	assert_eq(Field.time_left_text(179.5), "3:00 left")
