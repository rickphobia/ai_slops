extends GutTest
## The leaving watch says the player is leaving on each notification that means so, and not
## on others. (The browser's visibilitychange is checked by playing the web build.)


func test_each_leaving_notification_is_reported() -> void:
	var watch: LeavingWatch = add_child_autofree(LeavingWatch.new())
	watch_signals(watch)

	for what in LeavingWatch.LEAVING_NOTIFICATIONS:
		watch.notification(what)

	assert_signal_emit_count(watch, "leaving", LeavingWatch.LEAVING_NOTIFICATIONS.size())


func test_coming_back_is_not_leaving() -> void:
	var watch: LeavingWatch = add_child_autofree(LeavingWatch.new())
	watch_signals(watch)

	watch.notification(Node.NOTIFICATION_APPLICATION_FOCUS_IN)

	assert_signal_not_emitted(watch, "leaving")
