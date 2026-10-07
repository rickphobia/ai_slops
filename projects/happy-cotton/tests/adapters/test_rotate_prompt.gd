extends GutTest
## The rotate prompt shows only when the window is taller than it is wide.


func test_a_tall_window_is_portrait() -> void:
	assert_true(RotatePrompt.is_portrait(Vector2i(390, 844)))


func test_a_wide_window_is_not_portrait() -> void:
	assert_false(RotatePrompt.is_portrait(Vector2i(844, 390)))


func test_a_square_window_is_not_portrait() -> void:
	assert_false(RotatePrompt.is_portrait(Vector2i(600, 600)))
