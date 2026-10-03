extends GutTest
## Mum in the real house: she walks her route humming, goes to a noise she heard, searches
## there and talks instead of humming.

const HOUSE_SCENE := preload("res://src/adapters/house.tscn")
const NOISE_AT := Vector3(0.0, 0.0, -19.0)

var _brain: FamilyBrain
var _mum: Mum
var _lines: Array[String] = []


func before_each() -> void:
	var tuning := NightTestTuning.table()
	var house: House = add_child_autofree(HOUSE_SCENE.instantiate())
	house.setup(tuning)
	var start := house.mum_start().global_position
	_brain = FamilyBrain.new(tuning.mum_search_seconds, start)
	_mum = Mum.new()
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	_mum.setup(tuning, _brain, house.mum_route(), rng)
	_lines = []
	_mum.said.connect(func(line: String) -> void: _lines.append(line))
	add_child_autofree(_mum)
	_mum.global_position = start


func test_unaware_she_walks_her_route_humming() -> void:
	var start := _mum.global_position

	await wait_seconds(1.0)

	assert_gt(_mum.global_position.distance_to(start), 0.3, "she set off")
	assert_true(_mum.is_humming())
	assert_eq(_lines.size(), 0, "no lines while humming")


func test_she_goes_to_a_noise_she_heard_and_searches_there_talking() -> void:
	await wait_seconds(0.2)
	_brain.hear(NOISE_AT)

	await wait_until(func() -> bool: return _brain.alert == FamilyBrain.Alert.SEARCHING, 6.0)

	assert_eq(_brain.alert, FamilyBrain.Alert.SEARCHING)
	assert_lt(_brain.position.distance_to(NOISE_AT), 1.0)
	assert_false(_mum.is_humming())
	await wait_seconds(1.0)
	assert_gt(_lines.size(), 0, "she talks while searching")
