class_name GameFlow
extends RefCounted
## Where the player is outside the night itself: on the title screen, in the opening
## (a few seconds of black before the eyes open), playing, paused, or ended. Decides when the
## player has control. Pure rules: no scene tree, input or audio.

enum Stage { TITLE, OPENING, PLAYING, PAUSED, ENDED }

var stage: Stage = Stage.TITLE

var _opening_seconds: float
var _opening_left: float


func _init(opening_seconds: float) -> void:
	_opening_seconds = opening_seconds


## The click on the title screen. Ignored once the game has started.
func start() -> void:
	if stage != Stage.TITLE:
		return
	stage = Stage.OPENING
	_opening_left = _opening_seconds


func advance(seconds: float) -> void:
	if stage != Stage.OPENING:
		return
	_opening_left -= seconds
	if _opening_left <= 0.0:
		stage = Stage.PLAYING


## Only play can be paused: the opening is short and pausing it would spoil it.
func pause() -> void:
	if stage == Stage.PLAYING:
		stage = Stage.PAUSED


func resume() -> void:
	if stage == Stage.PAUSED:
		stage = Stage.PLAYING


## The night is over (the Piggy reached the back door). Control never comes back.
func end() -> void:
	stage = Stage.ENDED


func has_control() -> bool:
	return stage == Stage.PLAYING
