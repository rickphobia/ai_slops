class_name FastTuning
extends RefCounted
## The test tuning table: small, round numbers so a test can play a whole crop in a few calls.
## Cotton ripens in 30 seconds, so each of the three growing stages lasts 10.

const GROW_SECONDS := 30.0


static func table() -> Tuning:
	var tuning := Tuning.new()
	tuning.grow_seconds = GROW_SECONDS
	return tuning
