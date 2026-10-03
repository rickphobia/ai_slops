class_name SlopBowl
extends Node3D
## What a slop bowl looks like: rotten slop with flies buzzing over it, or the player's
## favourite snacks. Placeholder shapes until the custom models exist. Hallucinations picks
## which; LyingObjects only swaps it while the Piggy isn't looking.

const SLOP_COLOURS: Array[Color] = [Color(0.3, 0.33, 0.12), Color(0.25, 0.18, 0.08)]
const SNACK_COLOURS: Array[Color] = [
	Color(1.0, 0.55, 0.05), Color(0.95, 0.85, 0.2), Color(0.85, 0.1, 0.15)
]

var _slop := Node3D.new()
var _snacks := Node3D.new()
var _flies := AudioStreamPlayer3D.new()
var _showing: Hallucinations.Shows = Hallucinations.Shows.SLOP


func _ready() -> void:
	for index in 5:
		var lump := SphereMesh.new()
		lump.radius = 0.06
		lump.height = 0.07
		var angle := TAU * index / 5.0
		var at := Vector3(cos(angle) * 0.09, 0.09, sin(angle) * 0.09)
		_slop.add_child(PlainShapes.piece(lump, SLOP_COLOURS[index % SLOP_COLOURS.size()], at))
	for index in 3:
		var snack := BoxMesh.new()
		snack.size = Vector3(0.12, 0.05, 0.08)
		var angle := TAU * index / 3.0
		var at := Vector3(cos(angle) * 0.08, 0.11, sin(angle) * 0.08)
		_snacks.add_child(PlainShapes.piece(snack, SNACK_COLOURS[index], at))
	add_child(_slop)
	add_child(_snacks)
	_flies.stream = PlaceholderSounds.flies()
	_flies.unit_size = 1.5
	_flies.position.y = 0.3
	add_child(_flies)
	show_as(_showing)


## The 3D sound to register with SoundOcclusion.
func flies() -> AudioStreamPlayer3D:
	return _flies


func show_as(shows: Hallucinations.Shows) -> void:
	_showing = shows
	var is_slop := shows == Hallucinations.Shows.SLOP
	_slop.visible = is_slop
	_snacks.visible = not is_slop
	if is_slop and not _flies.playing and is_inside_tree():
		_flies.play()
	elif not is_slop:
		_flies.stop()


func showing() -> Hallucinations.Shows:
	return _showing
