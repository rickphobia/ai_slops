class_name HeardNoise
extends RefCounted
## A noise a listener heard, and how it reached them. Read-only once made.

var noise: PiggyNoise
## How far the noise travelled to the listener, in metres.
var distance: float
## Closed doors and walls it came through.
var barriers: int


func _init(heard: PiggyNoise, path: SoundPath) -> void:
	noise = heard
	distance = path.distance
	barriers = path.barriers
