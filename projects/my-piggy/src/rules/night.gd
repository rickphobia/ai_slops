class_name Night
extends RefCounted
## One playthrough, from waking up in the bedroom to an ending.
## Pure rules: no scene tree, nodes, physics, rendering or audio.

const FIRST_SPACE: StringName = &"bedroom"

var space: StringName = FIRST_SPACE
var step: int = 0


func advance() -> void:
	step += 1
