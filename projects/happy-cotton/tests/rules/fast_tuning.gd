class_name FastTuning
extends RefCounted
## The test tuning table: small, round numbers so a test can play a whole crop in a few calls.
## Cotton ripens in 30 seconds, so each of the three growing stages lasts 10. A Shift lasts
## 100 seconds, the first Quota is 3 picks and rises by 2 each Shift, and a pick earns 5
## Labour Points. A missed Quota's first Study Session lasts 20 seconds and each one in a row
## doubles, capped at 50: 20, 40, 50, 50. On the Generator a lap takes 10 seconds and the
## Worker runs 10 laps (100 seconds, longer than a crop takes) before he stops to breathe for 5.
## Offline, crops grow at half speed (60 seconds offline to ripen) and one return counts at
## most 1000 seconds. Each Withered plot docks 8 Labour Points, and Negligence starts an
## 80-second Study Session, longer than the 50-second cap for missed Quotas.
## In table() ripe cotton takes far longer to Wither than any test plays, so tests about other
## rules never meet it; withering_table() makes it Wither after 50 seconds.

const GROW_SECONDS := 30.0
const SHIFT_SECONDS := 100.0
const FIRST_QUOTA := 3
const QUOTA_RISE := 2
const LABOUR_POINTS_PER_PICK := 5
const STUDY_SESSION_SECONDS := 20.0
const STUDY_SESSION_CAP_SECONDS := 50.0
const LAP_SECONDS := 10.0
const LAPS_BEFORE_BREATH := 10
const BREATH_SECONDS := 5.0
const OFFLINE_GROWTH_RATE := 0.5
const OFFLINE_CAP_SECONDS := 1000.0
const WITHER_SECONDS := 50.0
const SLOW_WITHER_SECONDS := 1000000.0
const NEGLIGENCE_LABOUR_POINTS := 8
const NEGLIGENCE_STUDY_SESSION_SECONDS := 80.0


static func table() -> Tuning:
	var tuning := Tuning.new()
	tuning.grow_seconds = GROW_SECONDS
	tuning.shift_seconds = SHIFT_SECONDS
	tuning.first_quota = FIRST_QUOTA
	tuning.quota_rise = QUOTA_RISE
	tuning.labour_points_per_pick = LABOUR_POINTS_PER_PICK
	tuning.study_session_seconds = STUDY_SESSION_SECONDS
	tuning.study_session_cap_seconds = STUDY_SESSION_CAP_SECONDS
	tuning.lap_seconds = LAP_SECONDS
	tuning.laps_before_breath = LAPS_BEFORE_BREATH
	tuning.breath_seconds = BREATH_SECONDS
	tuning.offline_growth_rate = OFFLINE_GROWTH_RATE
	tuning.offline_cap_seconds = OFFLINE_CAP_SECONDS
	tuning.wither_seconds = SLOW_WITHER_SECONDS
	tuning.negligence_labour_points = NEGLIGENCE_LABOUR_POINTS
	tuning.negligence_study_session_seconds = NEGLIGENCE_STUDY_SESSION_SECONDS
	return tuning


## The test table with ripe cotton Withering after WITHER_SECONDS.
static func withering_table() -> Tuning:
	var tuning := table()
	tuning.wither_seconds = WITHER_SECONDS
	return tuning
