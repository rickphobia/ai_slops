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
	tuning.creep_noise_radius = 0.0
	tuning.walk_noise_radius = 3.0
	tuning.trot_noise_radius = 9.0
	tuning.footstep_seconds = 0.5
	tuning.noise_cut_per_barrier = 0.5
	tuning.mum_walk_speed = 1.0
	tuning.mum_investigate_speed = 2.0
	tuning.mum_search_seconds = 20.0
	tuning.mum_search_radius = 3.0
	tuning.mum_line_seconds = 5.0
	tuning.snacks_below_humanity = 70.0
	tuning.mirror_pig_only_below_humanity = 55.0
	tuning.mirror_old_body_seconds = 1.0
	tuning.pig_vision_full_at_humanity = 20.0
	tuning.snouty_breathing_below_humanity = 85.0
	tuning.pig_breathing_below_humanity = 40.0
	tuning.mum_chase_speed = 4.0
	tuning.mum_torch_cone_degrees = 60.0
	tuning.mum_torch_range = 10.0
	tuning.mum_caught_distance = 1.0
	return tuning
