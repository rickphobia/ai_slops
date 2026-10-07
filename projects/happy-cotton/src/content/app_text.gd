class_name AppText
extends RefCounted
## The App's words: the text for each message key the rules emit, the overlay's labels, and
## the state's doublespeak terms. All of it is the state's cheerful voice, never the Worker's.
## A line that uses a doublespeak term or makes a claim cites its source by id from the
## sources register; tests/content/test_app_text.gd fails if one doesn't.

## The state's vocabulary, each term mapped to the source that documents it.
## Where in the source, so a reader can check it:
## - Poverty Alleviation: zenz-2020, Executive Summary: cotton picking "plays a key role in
##   achieving the state's poverty alleviation targets. These targets are mainly achieved
##   through coercive labor transfers."
const DOUBLESPEAK: Dictionary[String, String] = {
	"Poverty Alleviation": "zenz-2020",
}

## Overlay labels, filled with String.format.
const QUOTA_BAR := "Quota {picked} / {quota}"
const SHIFT_TIMER := "Shift {shift}  ·  {time} left"
const LABOUR_POINTS := "{points} Labour Points"


## Text for every message key the rules can emit (Farm.MESSAGE_KEYS).
static func lines() -> Dictionary[StringName, AppLine]:
	return {
		Farm.SHIFT_STARTED:
		AppLine.new(
			(
				"Shift {shift} begins! Today's Quota is {quota} cotton. Every boll you pick"
				+ " is a step on the road of Poverty Alleviation!"
			),
			["zenz-2020"]
		),
		Farm.QUOTA_MET:
		AppLine.new(
			(
				"Wonderful! {picked} picked, Quota of {quota} met! Such fine work shows how"
				+ " much more you can give next Shift!"
			)
		),
		Farm.QUOTA_MISSED:
		AppLine.new("Shift {shift}: {picked} of {quota}. The Quota was not met. This is recorded."),
	}


## The message as The App says it, or an empty string when the key has no text.
static func render(message: AppMessage) -> String:
	var all_lines := lines()
	if not all_lines.has(message.key):
		return ""
	return all_lines[message.key].text.format(message.values)


## Everything wrong with the App text: emitted keys with no text, source ids missing from the
## register, and lines that use a doublespeak term without citing its source.
static func problems(
	emitted_keys: Array[StringName],
	app_lines: Dictionary[StringName, AppLine],
	terms: Dictionary[String, String],
	known_source_ids: Array[String]
) -> Array[String]:
	var found: Array[String] = []
	for key in emitted_keys:
		if not app_lines.has(key):
			found.append("message key %s has no text" % key)
	for term: String in terms:
		if not known_source_ids.has(terms[term]):
			found.append("term %s cites unknown source %s" % [term, terms[term]])
	for key: StringName in app_lines:
		var line: AppLine = app_lines[key]
		for source_id in line.source_ids:
			if not known_source_ids.has(source_id):
				found.append("line %s cites unknown source %s" % [key, source_id])
		for term: String in terms:
			var term_source: String = terms[term]
			if line.text.containsn(term) and not line.source_ids.has(term_source):
				found.append("line %s uses %s but doesn't cite %s" % [key, term, term_source])
	return found
