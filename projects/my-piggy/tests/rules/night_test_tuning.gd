class_name NightTestTuning
extends RefCounted
## The tuning table the tests use. Numbers are chosen to make the sums easy, not to match
## the game, so retuning the game never breaks a test.


static func table() -> Tuning:
	var tuning := Tuning.new()
	tuning.walk_speed = 2.0
	tuning.mouse_sensitivity = 0.003
	tuning.opening_seconds = 4.0
	tuning.door_creak_quietest_radius = 2.0
	tuning.door_creak_loudest_radius = 8.0
	tuning.door_creak_loudest_speed = 3.0
	tuning.creep_speed = 1.0
	tuning.trot_speed = 3.0
	tuning.urge_rise_at_rest = 10.0
	tuning.urge_rise_trotting = 20.0
	tuning.urge_warning = 70.0
	tuning.urge_after_outburst = 30.0
	tuning.suppressed_rise_increase = 0.5
	tuning.suppress_speed_factor = 0.25
	tuning.suppress_loudness_per_second = 0.2
	tuning.suppress_limit_seconds = 5.0
	tuning.give_in_seconds = 3.0
	tuning.give_in_humanity_cost = 12.0
	tuning.give_in_noise_radius = 2.0
	tuning.give_in_reach = 1.0
	tuning.snort_radius = 10.0
	tuning.squeal_radius = 20.0
	tuning.lunge_radius = 15.0
	tuning.lunge_distance = 0.8
	tuning.outburst_camera_jerk = 0.2
	tuning.warning_camera_twitch = 0.02
	return tuning
