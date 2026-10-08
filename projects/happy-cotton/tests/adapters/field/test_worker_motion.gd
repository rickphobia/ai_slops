extends GutTest
## The Worker model follows the rules' view of him: out to the Generator to run, slowing on
## his last lap, staggering into his breath, and back to his place in the field.

const WORKER_MODEL := preload("res://assets/quaternius-modular-men/farmer.glb")
const HOME := Vector3(-5.0, 0.0, 2.0)
const RUN_SPOT := Vector3(-7.0, 0.24, 2.0)
const RUN_FACING := PI / 2.0
## Long enough to walk from home to the Generator in one step.
const WALK_THERE := 10.0

var _body: Node3D
var _player: AnimationPlayer
var _motion: WorkerMotion


func before_each() -> void:
	_body = WORKER_MODEL.instantiate()
	_body.position = HOME
	add_child_autofree(_body)
	_player = _body.find_children("*", "AnimationPlayer", true, false)[0]
	_motion = WorkerMotion.new(_body, _player, RUN_SPOT, RUN_FACING)


func _view(activity: WorkerView.Activity, laps_left := 5) -> WorkerView:
	return WorkerView.new(activity, laps_left)


func test_he_stands_at_his_place_at_first() -> void:
	assert_eq(_player.current_animation, WorkerMotion.STANDING)


func test_he_walks_to_the_generator_then_runs_on_it() -> void:
	_motion.show(_view(WorkerView.Activity.RUNNING))

	_motion.update(0.5)
	assert_eq(_player.current_animation, WorkerMotion.WALKING)
	assert_almost_eq(_body.position.distance_to(HOME), WorkerMotion.WALK_SPEED * 0.5, 0.001)

	_motion.update(WALK_THERE)
	assert_eq(_body.position, RUN_SPOT)
	assert_almost_eq(_body.rotation.y, RUN_FACING, 0.001)
	assert_eq(_player.current_animation, WorkerMotion.RUNNING)


func test_he_slows_to_a_walk_on_his_last_lap() -> void:
	_motion.show(_view(WorkerView.Activity.RUNNING))
	_motion.update(WALK_THERE)

	_motion.show(_view(WorkerView.Activity.RUNNING, 1))

	assert_eq(_player.current_animation, WorkerMotion.WALKING)
	assert_eq(_body.position, RUN_SPOT, "he stays on the Generator")


func test_he_staggers_when_he_stops_to_breathe_then_stands_bent_over() -> void:
	_motion.show(_view(WorkerView.Activity.RUNNING, 1))
	_motion.update(WALK_THERE)

	_motion.show(_view(WorkerView.Activity.BREATHING))

	assert_eq(_player.current_animation, WorkerMotion.STAGGERING)
	assert_eq(Array(_player.get_queue()), [WorkerMotion.BREATHING])


func test_he_staggers_into_a_breath_that_began_while_he_walked_out() -> void:
	_motion.show(_view(WorkerView.Activity.RUNNING, 1))
	_motion.update(0.5)
	_motion.show(_view(WorkerView.Activity.BREATHING))

	_motion.update(WALK_THERE)

	assert_eq(_player.current_animation, WorkerMotion.STAGGERING)
	assert_eq(Array(_player.get_queue()), [WorkerMotion.BREATHING])


func test_he_runs_again_after_his_breath() -> void:
	_motion.show(_view(WorkerView.Activity.BREATHING))
	_motion.update(WALK_THERE)

	_motion.show(_view(WorkerView.Activity.RUNNING))

	assert_eq(_player.current_animation, WorkerMotion.RUNNING)


func test_he_walks_back_to_his_place_when_sent_to_the_field() -> void:
	_motion.show(_view(WorkerView.Activity.RUNNING))
	_motion.update(WALK_THERE)

	_motion.show(_view(WorkerView.Activity.IN_FIELD))
	_motion.update(0.5)
	assert_eq(_player.current_animation, WorkerMotion.WALKING)
	_motion.update(WALK_THERE)

	assert_eq(_body.position, HOME)
	assert_eq(_player.current_animation, WorkerMotion.STANDING)


func test_he_never_plays_a_fighting_animation() -> void:
	var used: Array[StringName] = [WorkerMotion.STAGGERING]
	used.append_array(WorkerMotion.LOOPING)
	for animation in used:
		for fighting: String in ["Punch", "Kick", "Sword", "Gun", "Shoot", "Death"]:
			assert_false(String(animation).contains(fighting), "%s is a fighting move" % animation)
