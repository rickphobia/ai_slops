extends GutTest
## What the lying objects show, how strong pig vision is and which breathing plays, by
## humanity. Numbers come from NightTestTuning: snacks below 70, the mirror shows only the
## pig below 55, the old body shows for 1 s before the flicker, pig vision is full by 20,
## snouty breathing below 85, pig breathing below 40.

const BOWL := &"KitchenSlopBowl"
const MIRROR := &"HallwayMirror"
const GLASS := &"BackDoorGlass"


func _hallucinations(humanity: float = 100.0) -> Hallucinations:
	var hallucinations := Hallucinations.new(NightTestTuning.table())
	hallucinations.add(BOWL, Hallucinations.Kind.SLOP_BOWL, humanity)
	hallucinations.add(MIRROR, Hallucinations.Kind.MIRROR, humanity)
	hallucinations.add(GLASS, Hallucinations.Kind.DOOR_GLASS, humanity)
	return hallucinations


func _look_away(hallucinations: Hallucinations, humanity: float) -> void:
	hallucinations.advance(0.1, humanity, [] as Array[StringName])


func _look_at(
	hallucinations: Hallucinations, object: StringName, humanity: float, seconds := 0.1
) -> void:
	hallucinations.advance(seconds, humanity, [object] as Array[StringName])


func test_slop_looks_like_slop_at_the_threshold_and_like_snacks_just_below() -> void:
	var hallucinations := _hallucinations()

	_look_away(hallucinations, 70.0)
	assert_eq(hallucinations.shows(BOWL), Hallucinations.Shows.SLOP)

	_look_away(hallucinations, 69.9)
	assert_eq(hallucinations.shows(BOWL), Hallucinations.Shows.SNACKS)


func test_slop_never_turns_into_snacks_while_the_piggy_looks_at_it() -> void:
	var hallucinations := _hallucinations()
	_look_at(hallucinations, BOWL, 100.0)

	_look_at(hallucinations, BOWL, 10.0, 30.0)
	assert_eq(hallucinations.shows(BOWL), Hallucinations.Shows.SLOP)

	_look_away(hallucinations, 10.0)
	assert_eq(hallucinations.shows(BOWL), Hallucinations.Shows.SNACKS)


func test_snacks_never_turn_back_into_slop_while_the_piggy_looks_at_them() -> void:
	var hallucinations := _hallucinations(50.0)
	_look_at(hallucinations, BOWL, 100.0)
	assert_eq(hallucinations.shows(BOWL), Hallucinations.Shows.SNACKS)


func test_at_high_humanity_the_mirror_shows_the_old_body_then_flickers_to_the_pig() -> void:
	var hallucinations := _hallucinations()

	_look_at(hallucinations, MIRROR, 100.0, 0.9)
	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.OLD_BODY)

	_look_at(hallucinations, MIRROR, 100.0, 0.2)
	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.PIG_BODY)


func test_looking_away_and_back_shows_the_old_body_again() -> void:
	var hallucinations := _hallucinations()
	_look_at(hallucinations, MIRROR, 100.0, 2.0)

	_look_away(hallucinations, 100.0)

	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.OLD_BODY)


func test_the_mirror_shows_the_old_body_at_the_threshold_and_only_the_pig_just_below() -> void:
	var hallucinations := _hallucinations()

	_look_away(hallucinations, 55.0)
	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.OLD_BODY)

	_look_away(hallucinations, 54.9)
	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.PIG_BODY)


func test_a_pig_only_mirror_stays_pig_only_while_looked_at_even_if_humanity_comes_back() -> void:
	var hallucinations := _hallucinations(10.0)
	_look_at(hallucinations, MIRROR, 100.0)
	assert_eq(hallucinations.shows(MIRROR), Hallucinations.Shows.PIG_BODY)


func test_the_back_door_glass_shows_the_old_body_only_at_high_humanity_and_never_flickers() -> void:
	var hallucinations := _hallucinations()
	_look_at(hallucinations, GLASS, 100.0, 5.0)
	assert_eq(hallucinations.shows(GLASS), Hallucinations.Shows.OLD_BODY)

	_look_away(hallucinations, 54.9)
	assert_eq(hallucinations.shows(GLASS), Hallucinations.Shows.PIG_BODY)


func test_pig_vision_grows_as_humanity_drops_and_is_full_by_the_threshold() -> void:
	var hallucinations := _hallucinations()
	assert_eq(hallucinations.pig_vision(100.0), 0.0)
	assert_almost_eq(hallucinations.pig_vision(60.0), 0.5, 0.0001)
	assert_eq(hallucinations.pig_vision(20.0), 1.0)
	assert_eq(hallucinations.pig_vision(0.0), 1.0)


func test_breathing_sounds_more_like_a_pig_as_humanity_drops() -> void:
	var hallucinations := _hallucinations()
	assert_eq(hallucinations.breathing(85.0), Hallucinations.Breathing.HUMAN)
	assert_eq(hallucinations.breathing(84.9), Hallucinations.Breathing.SNOUTY)
	assert_eq(hallucinations.breathing(40.0), Hallucinations.Breathing.SNOUTY)
	assert_eq(hallucinations.breathing(39.9), Hallucinations.Breathing.PIG)


func test_the_ending_is_human_while_the_mirror_still_shows_the_old_body() -> void:
	var hallucinations := _hallucinations()
	assert_eq(hallucinations.ending(55.0), Hallucinations.Ending.HUMAN)
	assert_eq(hallucinations.ending(54.9), Hallucinations.Ending.PIG)


func _rot(humanity: float = 100.0) -> Hallucinations:
	var hallucinations := Hallucinations.new(NightTestTuning.table())
	hallucinations.add_space(&"kitchen", humanity)
	hallucinations.add_space(&"hallway", humanity)
	return hallucinations


func _look_at_spaces(hallucinations: Hallucinations, humanity: float, spaces: Array) -> void:
	var in_view: Array[StringName] = []
	in_view.assign(spaces)
	hallucinations.look_at_spaces(humanity, in_view)


func test_the_rot_is_cosy_from_70_soured_down_to_40_and_grotesque_below() -> void:
	var hallucinations := _rot()
	assert_eq(hallucinations.rot_for(100.0), Hallucinations.Rot.COSY)
	assert_eq(hallucinations.rot_for(70.0), Hallucinations.Rot.COSY)
	assert_eq(hallucinations.rot_for(69.9), Hallucinations.Rot.SOURED)
	assert_eq(hallucinations.rot_for(40.0), Hallucinations.Rot.SOURED)
	assert_eq(hallucinations.rot_for(39.9), Hallucinations.Rot.GROTESQUE)


func test_a_space_starts_at_the_rot_stage_of_its_humanity() -> void:
	assert_eq(_rot(50.0).rot(&"kitchen"), Hallucinations.Rot.SOURED)


func test_a_space_out_of_view_rots_as_humanity_drops() -> void:
	var hallucinations := _rot()

	_look_at_spaces(hallucinations, 69.9, [])
	assert_eq(hallucinations.rot(&"kitchen"), Hallucinations.Rot.SOURED)

	_look_at_spaces(hallucinations, 39.9, [])
	assert_eq(hallucinations.rot(&"kitchen"), Hallucinations.Rot.GROTESQUE)


func test_a_space_never_rots_while_in_view_and_catches_up_once_out_of_it() -> void:
	var hallucinations := _rot()

	_look_at_spaces(hallucinations, 10.0, [&"kitchen"])
	assert_eq(hallucinations.rot(&"kitchen"), Hallucinations.Rot.COSY)
	assert_eq(hallucinations.rot(&"hallway"), Hallucinations.Rot.GROTESQUE)

	_look_at_spaces(hallucinations, 10.0, [&"hallway"])
	assert_eq(hallucinations.rot(&"kitchen"), Hallucinations.Rot.GROTESQUE)


func test_putting_the_rot_back_changes_every_space_even_in_view() -> void:
	var hallucinations := _rot(10.0)

	hallucinations.put_rot_back(100.0)

	assert_eq(hallucinations.rot(&"kitchen"), Hallucinations.Rot.COSY)
	assert_eq(hallucinations.rot(&"hallway"), Hallucinations.Rot.COSY)
