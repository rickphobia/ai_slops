class_name LeavingWatch
extends Node
## Tells the entrypoint when the player is leaving the game, so it can save first: the browser
## tab hidden (the page's visibilitychange event, which Godot doesn't pass on), the window or
## app losing focus, the app paused on a phone, or the window closing.

signal leaving

const LEAVING_NOTIFICATIONS: Array[int] = [
	NOTIFICATION_WM_WINDOW_FOCUS_OUT,
	NOTIFICATION_APPLICATION_FOCUS_OUT,
	NOTIFICATION_APPLICATION_PAUSED,
	NOTIFICATION_WM_CLOSE_REQUEST,
]

## Kept so the browser's callback stays alive as long as this node.
var _on_visibility_change: JavaScriptObject
var _document: JavaScriptObject


func _ready() -> void:
	if not OS.has_feature("web"):
		return
	_document = JavaScriptBridge.get_interface("document")
	_on_visibility_change = JavaScriptBridge.create_callback(_visibility_changed)
	_document.call("addEventListener", "visibilitychange", _on_visibility_change)


func _notification(what: int) -> void:
	if what in LEAVING_NOTIFICATIONS:
		leaving.emit()


func _visibility_changed(_event: Array) -> void:
	var state: Variant = _document.get("visibilityState")
	if state == "hidden":
		leaving.emit()
