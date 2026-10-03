class_name SoundOcclusion
extends Node
## The muffled sound channel: every physics step, each registered 3D sound with a wall or
## closed door between it and the listener plays through the Muffled bus (a low-pass and a
## volume cut, set in default_bus_layout.tres); the rest play straight to Master. Doors are
## solid bodies, so an open door stops muffling as soon as it swings out of the way.

const OPEN_BUS: StringName = &"Master"
const MUFFLED_BUS: StringName = &"Muffled"

## Where the player hears from: the Piggy's camera. Nothing is muffled until it is set.
var listener: Node3D

var _players: Array[AudioStreamPlayer3D] = []


## Muffle this sound whenever something solid is between it and the listener.
func register(player: AudioStreamPlayer3D) -> void:
	if not _players.has(player):
		_players.append(player)


func sound_count() -> int:
	return _players.size()


func _physics_process(_delta: float) -> void:
	# A freed sound can't be passed to a typed lambda, so walk back and drop it in place.
	for index in range(_players.size() - 1, -1, -1):
		if not is_instance_valid(_players[index]):
			_players.remove_at(index)
	if listener == null or not listener.is_inside_tree():
		return
	var space := listener.get_world_3d().direct_space_state
	for player in _players:
		player.bus = MUFFLED_BUS if _is_blocked(space, player) else OPEN_BUS


func _is_blocked(space: PhysicsDirectSpaceState3D, player: AudioStreamPlayer3D) -> bool:
	var query := PhysicsRayQueryParameters3D.create(
		listener.global_position, player.global_position
	)
	# The bodies the listener and the sound sit on are not in the way: the Piggy's own body,
	# and the door a creak comes from.
	var exclude: Array[RID] = []
	for node: Node in [listener, player]:
		var body := _body_of(node)
		if body != null:
			exclude.append(body.get_rid())
	query.exclude = exclude
	return not space.intersect_ray(query).is_empty()


static func _body_of(node: Node) -> CollisionObject3D:
	var at := node.get_parent()
	while at != null:
		var body := at as CollisionObject3D
		if body != null:
			return body
		at = at.get_parent()
	return null
