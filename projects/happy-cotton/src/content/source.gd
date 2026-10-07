class_name Source
extends RefCounted
## One entry in the sources register: a documented report the game draws on.

var id: String
var title: String
## Author and publisher as the source credits them.
var author: String
var date: String
var link: String
## What the game uses this source for, in one line.
var used_for: String


func _init(
	p_id: String,
	p_title: String,
	p_author: String,
	p_date: String,
	p_link: String,
	p_used_for: String
) -> void:
	id = p_id
	title = p_title
	author = p_author
	date = p_date
	link = p_link
	used_for = p_used_for


## Everything wrong with this entry, one line per problem. Empty when it is complete.
func problems() -> Array[String]:
	var found: Array[String] = []
	var fields := {
		"id": id,
		"title": title,
		"author": author,
		"date": date,
		"link": link,
		"used_for": used_for,
	}
	for field: String in fields:
		var value: String = fields[field]
		if value.strip_edges().is_empty():
			found.append("source %s has no %s" % [id, field])
	if not link.is_empty() and not link.begins_with("https://"):
		found.append("source %s link is not https: %s" % [id, link])
	return found
