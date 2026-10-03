extends GutTest
## The Piggy walks when the player holds a move key, at the speed from the tuning, creeps
## and trots, and the body slows, throws and holds them.

const PIGGY_SCENE := preload("res://src/adapters/piggy.tscn")
const TEST_WALK_SPEED := 2.0


func _spawn_piggy() -> PiggyController:
	var tuning := NightTestTuning.table()
	tuning.walk_speed = TEST_WALK_SPEED
	var piggy: PiggyController = PIGGY_SCENE.instantiate()
	piggy.setup(tuning)
	add_child_autofree(piggy)
	return piggy


func after_each() -> void:
	for action: StringName in [&"move_forward", &"creep", &"trot"]:
		Input.action_release(action)


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


## How far a Piggy walks forward in 30 physics steps, holding the given extra action.
func _distance_walked(piggy: PiggyController, extra_action: StringName = &"") -> float:
	var start := piggy.global_position
	if extra_action != &"":
		Input.action_press(extra_action)
	Input.action_press("move_forward")
	await wait_physics_frames(30)
	var after := piggy.global_position
	return start.distance_to(Vector3(after.x, start.y, after.z))


func test_trotting_is_faster_than_walking_and_creeping_slower() -> void:
	var walked: float = await _distance_walked(_spawn_piggy())
	after_each()
	var trotted: float = await _distance_walked(_spawn_piggy(), &"trot")
	after_each()
	var crept: float = await _distance_walked(_spawn_piggy(), &"creep")

	assert_gt(trotted, walked * 1.2)
	assert_lt(crept, walked * 0.8)


func test_the_piggy_trots_only_while_moving_with_trot_held() -> void:
	var piggy := _spawn_piggy()
	Input.action_press("trot")
	assert_false(piggy.is_trotting())

	Input.action_press("move_forward")

	assert_true(piggy.is_trotting())


func test_the_body_slowing_the_piggy_slows_their_walk() -> void:
	var normal: float = await _distance_walked(_spawn_piggy())
	after_each()
	var slowed_piggy := _spawn_piggy()
	slowed_piggy.set_speed_factor(0.25)
	var slowed: float = await _distance_walked(slowed_piggy)

	assert_lt(slowed, normal * 0.5)


func test_a_lunge_throws_the_piggy_forward() -> void:
	var piggy := _spawn_piggy()
	var start := piggy.global_position

	piggy.lunge()

	assert_lt(piggy.global_position.z, start.z - 0.5, "forward is towards -Z")


func test_while_giving_in_the_head_is_down_and_the_player_cannot_look_away() -> void:
	var piggy := _spawn_piggy()
	piggy.start_give_in(piggy.global_position + Vector3(1.0, 0.0, 0.0), 3.0)
	var facing := piggy.pose()

	piggy.look(Vector2(200.0, -200.0))

	assert_lt(facing.pitch, -1.0, "looking down into the bowl")
	assert_almost_eq(piggy.rotation.y, facing.yaw, 0.0001)
	assert_almost_eq(piggy.pose().pitch, facing.pitch, 0.0001)


func test_creeping_with_trot_also_held_is_not_trotting() -> void:
	var piggy := _spawn_piggy()
	Input.action_press("move_forward")
	Input.action_press("trot")
	Input.action_press("creep")

	assert_false(piggy.is_trotting())
