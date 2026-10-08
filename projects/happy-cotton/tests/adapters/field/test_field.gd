extends GutTest
## The field's time-left text, the world's colour draining as the Worker tires, the Overseer,
## and the power tiles lighting under his steps.

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


func test_the_overseer_stands_outside_the_track_by_the_generator() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)
	var overseer: Node3D = field.get_node("Overseer")
	var lap_line := (field.get_node("Generator") as Node3D).position

	assert_almost_eq(overseer.position.distance_to(lap_line), Field.OVERSEER_SPOT.length(), 0.01)


func test_the_whip_makes_the_overseer_crack_it_and_the_worker_stagger() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)
	var camera: Camera3D = field.get_node("Camera")
	var camera_before := camera.global_transform

	field.show_overseer(Farm.OVERSEER_WHIP)

	var overseer: AnimationPlayer = (
		field.get_node("Overseer").find_children("*", "AnimationPlayer", true, false)[0]
	)
	var worker: AnimationPlayer = (
		field.get_node("Worker").find_children("*", "AnimationPlayer", true, false)[0]
	)
	assert_eq(overseer.current_animation, OverseerLook.WHIPPING)
	assert_eq(worker.current_animation, WorkerMotion.STAGGERING)
	assert_eq(camera.global_transform, camera_before, "the camera does not move in")


func test_the_whistle_makes_the_overseer_blow_it() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)

	field.show_overseer(Farm.OVERSEER_WHISTLE)

	var overseer: AnimationPlayer = (
		field.get_node("Overseer").find_children("*", "AnimationPlayer", true, false)[0]
	)
	assert_eq(overseer.current_animation, OverseerLook.WHISTLING)


func test_the_lap_line_is_at_the_generator() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)
	var line: Node3D = field.get_node("PowerTiles/LapLine")
	var generator: Node3D = field.get_node("Generator")

	assert_almost_eq(line.position.x, generator.position.x, 0.001)
	assert_almost_eq(line.position.z, generator.position.z, 0.001)


func test_a_step_while_he_runs_lights_its_tile_and_pulses_the_lamp() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)
	var tiles: PowerTiles = field.get_node("PowerTiles")
	var generator: Generator = field.get_node("Generator")
	field.show_worker(WorkerView.new(WorkerView.Activity.RUNNING, 5))

	field._on_worker_stepped(field.track().point_at(3.0))

	assert_eq(tiles.lit_count(), 1)
	assert_true(generator.is_pulsing())


func test_reduced_motion_stops_the_trail_fading_and_the_lamp_pulsing() -> void:
	var field: Field = FIELD_SCENE.instantiate()
	add_child_autofree(field)
	var tiles: PowerTiles = field.get_node("PowerTiles")
	var generator: Generator = field.get_node("Generator")

	field.set_reduced_motion(true)

	assert_true(tiles.instant_fade)
	assert_true(generator.skip_pulse)
