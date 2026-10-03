extends GutTest
## A Night is one playthrough. Tests drive it only through its public interface.


func test_new_night_starts_in_the_bedroom() -> void:
	var night := Night.new()

	assert_eq(night.space, &"bedroom")


func test_each_step_of_the_night_is_counted() -> void:
	var night := Night.new()

	night.advance()
	night.advance()

	assert_eq(night.step, 2)
