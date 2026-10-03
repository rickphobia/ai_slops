class_name BodyEvent
extends RefCounted
## Something the Piggy's body did this step. Every event carries where it happened and how
## far it is heard (its noise radius, 0 for silent ones), so the noise rules can turn any
## of them into a noise without asking Body anything else. Read-only once made.

enum Kind {
	## The urge crossed the warning threshold: heavier breathing, a twitch, a low grunt.
	WARNING,
	## The body made a snort, a squeal or a lunge. See outburst.
	OUTBURST,
	## The player started holding back an outburst that was due.
	SUPPRESS_STARTED,
	## The Piggy started giving in at a give-in spot.
	GIVE_IN_STARTED,
	## Giving in finished: the urge is 0 and humanity is lower.
	GAVE_IN,
}

enum Outburst { NONE, SNORT, SQUEAL, LUNGE }

var kind: Kind
var position: Vector3
## How far the event is heard, in metres.
var loudness: float
var outburst: Outburst


func _init(
	of_kind: Kind, at: Vector3, heard_radius: float = 0.0, which: Outburst = Outburst.NONE
) -> void:
	kind = of_kind
	position = at
	loudness = heard_radius
	outburst = which
