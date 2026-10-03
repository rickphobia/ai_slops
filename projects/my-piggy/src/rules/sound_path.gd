class_name SoundPath
extends RefCounted
## How a sound gets from one point to another through the house: how far it travels and
## how many closed doors and walls it passes on the way. Read-only once made.

## Path distance in metres; INF when there is no way through.
var distance: float
## Closed doors and walls between the two points.
var barriers: int


func _init(path_distance: float, barrier_count: int) -> void:
	distance = path_distance
	barriers = barrier_count
