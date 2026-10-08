class_name DebugMode
extends RefCounted
## Debug mode is for the owner only: on with `?debug=1` in the page URL (web) or `-- --debug`
## on the command line (desktop), off otherwise, so players never see its controls.

const URL_FLAG := "debug=1"
const COMMAND_LINE_FLAG := "--debug"


## Whether this run asked for debug mode, read from the page URL and the command line.
static func is_on() -> bool:
	var page_query := ""
	if OS.has_feature("web"):
		var search: Variant = JavaScriptBridge.eval("window.location.search", true)
		page_query = str(search)
	return asked_for(page_query, OS.get_cmdline_user_args())


## True when the page query (such as "?debug=1&x=2") has debug=1 or the arguments after `--`
## have --debug.
static func asked_for(page_query: String, user_args: PackedStringArray) -> bool:
	var query_parts := page_query.trim_prefix("?").split("&", false)
	return query_parts.has(URL_FLAG) or user_args.has(COMMAND_LINE_FLAG)
