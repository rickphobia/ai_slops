class_name WallClock
extends RefCounted
## Works out offline time while the game runs. A hidden browser tab stops frames, so the
## wall-clock time between two frames, less the frame's own step (which counts as online
## play), is time the Worker was away. Offline time since the last save, on start, comes with
## saving (ticket 09).

## Gaps shorter than this are slow frames or a glance at another tab, not an absence: each
## absence gets an away summary, and one after a few seconds would only make The App chatter.
const MIN_AWAY_SECONDS := 10.0

## func() -> float: seconds since the Unix epoch, such as Time.get_unix_time_from_system.
var _now: Callable
var _last_frame := NAN


func _init(now: Callable) -> void:
	_now = now


## Seconds offline since the last frame, or 0 on the first frame and after a short gap.
## Negative when the device clock went back; the rules decide what that means.
func offline_seconds(frame_delta: float) -> float:
	var now: float = _now.call()
	if is_nan(_last_frame):
		_last_frame = now
		return 0.0
	var gap := now - _last_frame
	_last_frame = now
	var away := gap if gap < 0.0 else maxf(gap - frame_delta, 0.0)
	return away if absf(away) >= MIN_AWAY_SECONDS else 0.0
