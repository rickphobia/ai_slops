extends GutTest
## The Piggy walks when the player holds a move key, at the speed from the tuning.

const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")
const TEST_WALK_SPEED := 2.0


func _spawn_piggy() -> PiggyController:
	var tuning := Tuning.new()
	tuning.walk_speed = TEST_WALK_SPEED
	tuning.mouse_sensitivity = 0.003
	var piggy: PiggyController = PIGGY_SCENE.instantiate()
	piggy.setup(tuning)
	add_child_autofree(piggy)
	return piggy


func after_each() -> void:
	Input.action_release("move_forward")


func test_piggy_stays_put_when_no_key_is_held() -> void:
	var piggy := _spawn_piggy()
	var start := piggy.global_position

	await wait_physics_frames(10)

	assert_almost_eq(piggy.global_position.x, start.x, 0.001)
	assert_almost_eq(piggy.global_position.z, start.z, 0.001)


func test_piggy_walks_forward_at_walk_speed_when_forward_is_held() -> void:
	var piggy := _spawn_piggy()
	var start := piggy.global_position

	Input.action_press("move_forward")
	await wait_physics_frames(30)
	var after := piggy.global_position

	var walked := start.distance_to(Vector3(after.x, start.y, after.z))
	var seconds := 30.0 / Engine.physics_ticks_per_second
	assert_gt(walked, 0.5 * TEST_WALK_SPEED * seconds)
	assert_lt(after.z, start.z, "forward is towards -Z")


func test_a_higher_sensitivity_turns_the_view_further_for_the_same_mouse_movement() -> void:
	var normal := _spawn_piggy()
	var fast := _spawn_piggy()
	fast.set_sensitivity_scale(2.0)

	normal.look(Vector2(10.0, 0.0))
	fast.look(Vector2(10.0, 0.0))

	assert_almost_eq(fast.rotation.y, normal.rotation.y * 2.0, 0.0001)
