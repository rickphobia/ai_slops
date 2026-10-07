class_name FastTuning
extends RefCounted
## The test tuning table: small, round numbers so a test can play a whole crop in a few calls.
## Cotton ripens in 30 seconds, so each of the three growing stages lasts 10. A Shift lasts
## 100 seconds, the first Quota is 3 picks and rises by 2 each Shift, and a pick earns 5
## Labour Points.

const GROW_SECONDS := 30.0
const SHIFT_SECONDS := 100.0
const FIRST_QUOTA := 3
const QUOTA_RISE := 2
const LABOUR_POINTS_PER_PICK := 5


static func table() -> Tuning:
	var tuning := Tuning.new()
	tuning.grow_seconds = GROW_SECONDS
	tuning.shift_seconds = SHIFT_SECONDS
	tuning.first_quota = FIRST_QUOTA
	tuning.quota_rise = QUOTA_RISE
	tuning.labour_points_per_pick = LABOUR_POINTS_PER_PICK
	return tuning
