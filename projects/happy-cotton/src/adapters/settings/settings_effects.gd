class_name SettingsEffects
extends RefCounted
## Puts the player's settings into effect in Godot: the master volume and mute on the Master
## bus, which every sound reaches, and the text size on a tree of Controls.

## Where scale_text() keeps a Control's own font size, so scaling again starts from it.
const BASE_FONT_SIZE := &"base_font_size"


## Every bus sends to Master, so this sets the volume of every sound at once.
static func apply_volume(settings: PlayerSettings) -> void:
	var master := AudioServer.get_bus_index(&"Master")
	AudioServer.set_bus_mute(master, settings.is_silent())
	if not settings.is_silent():
		AudioServer.set_bus_volume_db(master, linear_to_db(settings.volume))


## Scales the font size of every Control under `root` that sets its own (all of the game's
## text does) to `scale` times the size it was built with.
static func scale_text(root: Node, scale: float) -> void:
	var controls: Array[Node] = root.find_children("*", "Control", true, false)
	if root is Control:
		controls.append(root)
	for node in controls:
		var control := node as Control
		if not control.has_theme_font_size_override(&"font_size"):
			continue
		if not control.has_meta(BASE_FONT_SIZE):
			control.set_meta(BASE_FONT_SIZE, control.get_theme_font_size(&"font_size"))
		var base: int = control.get_meta(BASE_FONT_SIZE)
		control.add_theme_font_size_override(&"font_size", roundi(base * scale))
