class_name DebugOverlay
extends Label
## The owner's tuning aid: shows the hidden numbers (humanity, urge, Mum's alert level) in
## a corner; NoiseRings draws the noises in the house. Off unless
## the page URL has ?debug=1 (web) or the game is started with `-- --debug` (desktop).

const QUERY_FLAG := "debug=1"
const COMMAND_LINE_FLAG := "--debug"

var _night: Night


## True when the URL query (e.g. "?debug=1&x=2") or the user command-line arguments ask for it.
static func is_requested(url_query: String, user_args: PackedStringArray) -> bool:
	var query := url_query.trim_prefix("?")
	return query.split("&").has(QUERY_FLAG) or user_args.has(COMMAND_LINE_FLAG)


## The page's URL query on the web, "" anywhere else.
static func page_query() -> String:
	if not OS.has_feature("web"):
		return ""
	return str(JavaScriptBridge.eval("window.location.search", true))


func setup(night: Night) -> void:
	_night = night
	position = Vector2(12.0, 12.0)
	add_theme_color_override("font_color", Color.YELLOW)
	add_theme_color_override("font_outline_color", Color.BLACK)
	add_theme_constant_override("outline_size", 4)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _process(_delta: float) -> void:
	var body := _night.body
	var doing := ""
	if body.is_giving_in():
		doing = "  giving in"
	elif body.is_suppressing():
		doing = "  suppressing (x%.2f)" % body.loudness_multiplier()
	elif body.is_warning():
		doing = "  warning"
	text = (
		"humanity %.0f\nurge %.0f%s\nmum %s"
		% [body.humanity, body.urge, doing, FamilyBrain.alert_name(_night.mum.alert)]
	)
