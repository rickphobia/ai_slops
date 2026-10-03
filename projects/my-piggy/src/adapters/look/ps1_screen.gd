class_name Ps1Screen
extends CanvasLayer
## The full-screen half of the PS1 look (low resolution, few colours, dithering). Sits
## under the menus and the opening's black, so those stay crisp.

const LAYER := 5
const SHADER := preload("res://src/adapters/look/ps1_screen.gdshader")


func _ready() -> void:
	layer = LAYER
	var cover := ColorRect.new()
	cover.set_anchors_preset(Control.PRESET_FULL_RECT)
	cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var material := ShaderMaterial.new()
	material.shader = SHADER
	cover.material = material
	add_child(cover)
