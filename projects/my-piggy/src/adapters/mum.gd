class_name Mum
extends CharacterBody3D
## Mum's body in the house: walks where her FamilyBrain says (her route when unaware, to
## the noise when investigating, around it when searching) over the walkable area, pushes
## doors she walks into, and tells the brain when she gets there. Hums while unaware;
## while investigating or searching she talks instead, in a voice for each alert level.
## Her humming, footsteps and lines are 3D sounds; main registers them for muffling.

## Mum said a line (its words, for the log).
signal said(line: String)

## Placeholders until the real lines are recorded: the words, and how many syllables the
## murmur that stands in for them has.
const LINES: Dictionary = {
	FamilyBrain.Alert.INVESTIGATING: ["Piggy?", "Is that you, my piggy?", "Mummy heard you."],
	FamilyBrain.Alert.SEARCHING:
	["Come to Mummy.", "It's alright, my piggy.", "Where's my little piggy?"],
}
## Her voice is higher and sharper when she has just heard something, low and soft searching.
const VOICE_PITCH: Dictionary = {
	FamilyBrain.Alert.INVESTIGATING: 1.15, FamilyBrain.Alert.SEARCHING: 0.9
}
const VOICE_HZ := 230.0
## Seconds from a change of alert level to her first line.
const FIRST_LINE_SECONDS := 0.6
## Body size: a capsule for collision, a stand-in mesh until her model exists.
const HEIGHT := 1.7
const RADIUS := 0.25
const MOUTH_HEIGHT := 1.55
const STRIDE_METRES := 0.7
## How close counts as arrived, in metres (the walkable area stops short of walls).
const ARRIVED_WITHIN := 0.5

var _tuning: Tuning
var _brain: FamilyBrain
var _route: Array[Vector3] = []
var _route_index: int = 0
var _rng: RandomNumberGenerator
var _heading_alert: FamilyBrain.Alert = FamilyBrain.Alert.UNAWARE
var _heading_target: Vector3 = Vector3.INF
var _line_seconds_left: float = 0.0
var _step_seconds_left: float = 0.0
var _lines: Dictionary = {}

var _agent := NavigationAgent3D.new()
var _humming := AudioStreamPlayer3D.new()
var _footsteps := AudioStreamPlayer3D.new()
var _voice := AudioStreamPlayer3D.new()


## Hands Mum her numbers, her brain and her route (points in walking order). Call before
## she enters the scene tree. The rng picks her lines and search spots.
func setup(
	tuning: Tuning, brain: FamilyBrain, route: Array[Vector3], rng: RandomNumberGenerator
) -> void:
	_tuning = tuning
	_brain = brain
	_route = route
	_rng = rng


## Her 3D sounds, for the muffled channel.
func sounds() -> Array[AudioStreamPlayer3D]:
	return [_humming, _footsteps, _voice]


func is_humming() -> bool:
	return _humming.playing and not _humming.stream_paused


func _ready() -> void:
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	var capsule := CapsuleShape3D.new()
	capsule.height = HEIGHT
	capsule.radius = RADIUS
	var shape := CollisionShape3D.new()
	shape.shape = capsule
	shape.position.y = HEIGHT / 2.0
	add_child(shape)
	var mesh := CapsuleMesh.new()
	mesh.height = HEIGHT
	mesh.radius = RADIUS
	var body_mesh := MeshInstance3D.new()
	body_mesh.mesh = mesh
	body_mesh.position.y = HEIGHT / 2.0
	add_child(body_mesh)

	_agent.path_desired_distance = ARRIVED_WITHIN
	_agent.target_desired_distance = ARRIVED_WITHIN
	add_child(_agent)
	_humming.stream = PlaceholderSounds.humming()
	_footsteps.stream = PlaceholderSounds.footstep()
	for player: AudioStreamPlayer3D in sounds():
		player.position.y = MOUTH_HEIGHT
		add_child(player)
	# Low, but clear of the floor so the muffling ray does not end inside it.
	_footsteps.position.y = 0.1
	for level: FamilyBrain.Alert in LINES:
		var made: Array[AudioStreamWAV] = []
		for line: String in LINES[level]:
			made.append(PlaceholderSounds.spoken_line(line.split(" ").size() + 1, VOICE_HZ))
		_lines[level] = made
	_humming.play()


func _physics_process(delta: float) -> void:
	_brain.position = global_position
	# Until the walkable area reaches the navigation map there is nowhere to go.
	if NavigationServer3D.map_get_iteration_id(_agent.get_navigation_map()) == 0:
		return
	_follow_brain()
	if _agent.is_navigation_finished():
		_arrive()
	else:
		_walk_toward(_agent.get_next_path_position(), delta)
	_humming.stream_paused = _brain.alert != FamilyBrain.Alert.UNAWARE
	_talk(delta)


## Picks a new destination whenever the brain's alert level or target changes.
func _follow_brain() -> void:
	if _brain.alert == _heading_alert and _brain.target == _heading_target:
		return
	_heading_alert = _brain.alert
	_heading_target = _brain.target
	_line_seconds_left = FIRST_LINE_SECONDS
	match _brain.alert:
		FamilyBrain.Alert.UNAWARE:
			_head_for(_route[_route_index])
		FamilyBrain.Alert.INVESTIGATING:
			_head_for(_brain.target)
		FamilyBrain.Alert.SEARCHING:
			_head_for(_search_spot())


func _arrive() -> void:
	match _brain.alert:
		FamilyBrain.Alert.UNAWARE:
			_route_index = (_route_index + 1) % _route.size()
			_head_for(_route[_route_index])
		FamilyBrain.Alert.INVESTIGATING:
			_brain.arrived()
		FamilyBrain.Alert.SEARCHING:
			_head_for(_search_spot())


func _head_for(point: Vector3) -> void:
	_agent.target_position = point


## A random walkable point within the search radius of where the noise was.
func _search_spot() -> Vector3:
	var angle := _rng.randf() * TAU
	var reach := _rng.randf() * _tuning.mum_search_radius
	var spot := _brain.target + Vector3(cos(angle), 0.0, sin(angle)) * reach
	return NavigationServer3D.map_get_closest_point(_agent.get_navigation_map(), spot)


func _walk_toward(point: Vector3, delta: float) -> void:
	var speed := _tuning.mum_walk_speed
	if _brain.alert == FamilyBrain.Alert.INVESTIGATING:
		speed = _tuning.mum_investigate_speed
	var toward := point - global_position
	toward.y = 0.0
	if toward.length() < 0.01:
		return
	velocity = toward.normalized() * speed
	look_at(global_position + toward, Vector3.UP)
	var pushing := velocity
	move_and_slide()
	Door.push_touched(self, pushing)
	_step_seconds_left -= delta
	if _step_seconds_left <= 0.0:
		_step_seconds_left = STRIDE_METRES / speed
		_footsteps.play()


## While she isn't humming, a line every mum_line_seconds, in her voice for the alert level.
func _talk(delta: float) -> void:
	if _brain.alert == FamilyBrain.Alert.UNAWARE:
		return
	_line_seconds_left -= delta
	if _line_seconds_left > 0.0 or _voice.playing:
		return
	_line_seconds_left = _tuning.mum_line_seconds
	var words: Array = LINES[_brain.alert]
	var sounds_for: Array[AudioStreamWAV] = _lines[_brain.alert]
	var which := _rng.randi_range(0, words.size() - 1)
	_voice.stream = sounds_for[which]
	_voice.pitch_scale = VOICE_PITCH[_brain.alert]
	_voice.play()
	said.emit(words[which])
