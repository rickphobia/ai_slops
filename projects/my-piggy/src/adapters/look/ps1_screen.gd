class_name Ps1Screen
extends CanvasLayer
## The full-screen half of the PS1 look (low resolution, few colours, dithering). Sits
## under the menus and the opening's black, so those stay crisp. Also draws pig vision.

const LAYER := 5
const SHADER := preload("res://src/adapters/look/ps1_screen.gdshader")

var _material := ShaderMaterial.new()


func _ready() -> void:
	layer = LAYER
	var cover := ColorRect.new()
	cover.set_anchors_preset(Control.PRESET_FULL_RECT)
	cover.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_material.shader = SHADER
	set_pig_vision(0.0)
	cover.material = _material
	add_child(cover)


## How blurry pig vision is, 0 (sharp) to 1 (full).
func set_pig_vision(strength: float) -> void:
	_material.set_shader_parameter(&"pig_vision", strength)


func pig_vision() -> float:
	return _material.get_shader_parameter(&"pig_vision")
