extends GutTest
## The field's time-left text, and the world's colour draining as the Worker tires.

const FIELD_SCENE := preload("res://src/adapters/field/field.tscn")


func test_time_left_shows_minutes_and_seconds() -> void:
	assert_eq(Field.time_left_text(125.0), "2:05 left")


func test_time_left_rounds_part_seconds_up() -> void:
	assert_eq(Field.time_left_text(0.2), "0:01 left")
	assert_eq(Field.time_left_text(179.5), "3:00 left")


func test_colour_drains_evenly_from_the_scenes_own_to_nearly_grey() -> void:
	assert_eq(Field.saturation_for(0.0, 0.8), 0.8)
	assert_almost_eq(
		Field.saturation_for(Exhaustion.MOST / 2.0, 0.8),
		(0.8 + Field.DRAINED_SATURATION) / 2.0,
		0.001
	)
	assert_almost_eq(Field.saturation_for(Exhaustion.MOST, 0.8), Field.DRAINED_SATURATION, 0.001)


func test_an_exhausted_worker_drains_this_fields_colour_only() -> void:
	var tired: Field = FIELD_SCENE.instantiate()
	var rested: Field = FIELD_SCENE.instantiate()
	add_child_autofree(tired)
	add_child_autofree(rested)
	var haze: WorldEnvironment = rested.get_node("Haze")
	var full := haze.environment.adjustment_saturation

	tired.show_worker(WorkerView.new(WorkerView.Activity.IN_FIELD, 5, Exhaustion.MOST))

	var tired_haze: WorldEnvironment = tired.get_node("Haze")
	assert_almost_eq(tired_haze.environment.adjustment_saturation, Field.DRAINED_SATURATION, 0.001)
	assert_eq(haze.environment.adjustment_saturation, full)
