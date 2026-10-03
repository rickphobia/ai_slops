class_name CaptureScene
extends Control
## Being caught: Mum's torch in the Piggy's face (a white flash), her face with her scream,
## then black. Emits `finished` once, about 1.7 seconds in; main then restores the
## checkpoint and frees it. Her face is a drawn placeholder until the real one exists.

signal finished

const FLASH_SECONDS := 0.25
const FACE_SECONDS := 1.05
const BLACK_SECONDS := 0.4
const SKIN := Color(0.86, 0.8, 0.72)
const HOLLOW := Color(0.05, 0.02, 0.02)

var _seconds: float = 0.0
var _has_finished: bool = false
var _scream := AudioStreamPlayer.new()


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_scream.stream = PlaceholderSounds.scream()
	add_child(_scream)


func _process(delta: float) -> void:
	var was_flash := _seconds < FLASH_SECONDS
	_seconds += delta
	if was_flash and _seconds >= FLASH_SECONDS:
		_scream.play()
	if not _has_finished and _seconds >= FLASH_SECONDS + FACE_SECONDS + BLACK_SECONDS:
		_has_finished = true
		finished.emit()
	queue_redraw()


func _draw() -> void:
	var screen := get_rect()
	if _seconds < FLASH_SECONDS:
		draw_rect(screen, Color.WHITE)
		return
	draw_rect(screen, Color.BLACK)
	if _seconds >= FLASH_SECONDS + FACE_SECONDS:
		return
	# Her face fills the view, lit from below by the torch, and lurches closer.
	var lurch := 1.0 + 0.25 * (_seconds - FLASH_SECONDS) / FACE_SECONDS
	var size := screen.size.y * 0.45 * lurch
	var centre := screen.size / 2.0
	draw_set_transform(centre, 0.0, Vector2(0.8, 1.0))
	draw_circle(Vector2.ZERO, size, SKIN)
	draw_set_transform(Vector2.ZERO)
	for side: float in [-1.0, 1.0]:
		draw_circle(centre + Vector2(side * size * 0.32, -size * 0.25), size * 0.13, HOLLOW)
	draw_set_transform(centre + Vector2(0.0, size * 0.4), 0.0, Vector2(0.6, 1.0))
	draw_circle(Vector2.ZERO, size * 0.28, HOLLOW)
	draw_set_transform(Vector2.ZERO)
