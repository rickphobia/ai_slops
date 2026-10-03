class_name Tuning
extends Resource
## The one table of game numbers. Rules and adapters read their numbers from here,
## never from literals. Every field starts as NAN, so a table that leaves one out
## is caught as "missing" instead of silently using a default.

## Allowed range per field, inclusive: [lowest, highest].
const LIMITS: Dictionary = {
	"walk_speed": [0.1, 10.0],
	"mouse_sensitivity": [0.0001, 0.05],
	"opening_seconds": [0.5, 20.0],
	"door_creak_quietest_radius": [0.0, 30.0],
	"door_creak_loudest_radius": [0.1, 30.0],
	"door_creak_loudest_speed": [0.1, 10.0],
	"creep_speed": [0.1, 10.0],
	"trot_speed": [0.1, 10.0],
	"urge_rise_at_rest": [0.1, 50.0],
	"urge_rise_trotting": [0.1, 50.0],
	"urge_warning": [1.0, 99.0],
	"urge_after_outburst": [0.0, 99.0],
	"suppressed_rise_increase": [0.0, 1.0],
	"suppress_speed_factor": [0.0, 1.0],
	"suppress_loudness_per_second": [0.0, 1.0],
	"suppress_limit_seconds": [0.5, 30.0],
	"give_in_seconds": [0.5, 10.0],
	"give_in_humanity_cost": [0.0, 100.0],
	"give_in_noise_radius": [0.0, 30.0],
	"give_in_reach": [0.2, 5.0],
	"snort_radius": [0.0, 50.0],
	"squeal_radius": [0.0, 50.0],
	"lunge_radius": [0.0, 50.0],
	"lunge_distance": [0.0, 3.0],
	"outburst_camera_jerk": [0.0, 1.0],
	"warning_camera_twitch": [0.0, 0.2],
	"creep_noise_radius": [0.0, 30.0],
	"walk_noise_radius": [0.0, 30.0],
	"trot_noise_radius": [0.0, 30.0],
	"footstep_seconds": [0.1, 2.0],
	"noise_cut_per_barrier": [0.0, 1.0],
	"mum_walk_speed": [0.1, 10.0],
	"mum_investigate_speed": [0.1, 10.0],
	"mum_search_seconds": [1.0, 120.0],
	"mum_search_radius": [0.5, 10.0],
	"mum_line_seconds": [1.0, 60.0],
	"snacks_below_humanity": [0.0, 100.0],
	"mirror_pig_only_below_humanity": [0.0, 100.0],
	"mirror_old_body_seconds": [0.1, 10.0],
	"pig_vision_full_at_humanity": [0.0, 99.0],
	"snouty_breathing_below_humanity": [0.0, 100.0],
	"pig_breathing_below_humanity": [0.0, 100.0],
	"rot_soured_below_humanity": [0.0, 100.0],
	"rot_grotesque_below_humanity": [0.0, 100.0],
	"mum_chase_speed": [0.1, 10.0],
	"mum_torch_cone_degrees": [1.0, 170.0],
	"mum_torch_range": [0.5, 50.0],
	"mum_caught_distance": [0.2, 5.0],
	"mum_restart_distance": [0.0, 30.0],
}

## How fast the Piggy walks, in metres per second.
@export var walk_speed: float = NAN
## How far the view turns per pixel of mouse movement, in radians.
@export var mouse_sensitivity: float = NAN
## How long the opening lasts: black, breathing and a heartbeat before the eyes open, in seconds.
@export var opening_seconds: float = NAN
## How far a door creak is heard when the door is barely pushed, in metres.
@export var door_creak_quietest_radius: float = NAN
## How far a door creak is heard when the door is pushed at door_creak_loudest_speed or faster.
@export var door_creak_loudest_radius: float = NAN
## Push speed (metres per second) at which a door creaks its loudest.
@export var door_creak_loudest_speed: float = NAN
## How fast the Piggy creeps (Ctrl or C held), in metres per second. Not above walk_speed.
@export var creep_speed: float = NAN
## How fast the Piggy trots (Shift held), in metres per second. Not below walk_speed.
@export var trot_speed: float = NAN
## How much the urge (0–100) rises per second while not trotting.
@export var urge_rise_at_rest: float = NAN
## How much the urge rises per second while trotting.
@export var urge_rise_trotting: float = NAN
## Urge at which the warning signs start (heavier breathing, camera twitch, a grunt).
@export var urge_warning: float = NAN
## Urge left after an outburst. Below urge_warning.
@export var urge_after_outburst: float = NAN
## How much each suppressed outburst raises the urge rise rate for the rest of the space,
## as a fraction (0.1 is 10% faster).
@export var suppressed_rise_increase: float = NAN
## Movement speed while suppressing, as a fraction of normal.
@export var suppress_speed_factor: float = NAN
## How much louder the next outburst gets per second of suppressing, as a fraction.
@export var suppress_loudness_per_second: float = NAN
## How long suppressing can hold an outburst back before it happens anyway, in seconds.
@export var suppress_limit_seconds: float = NAN
## How long giving in takes, in seconds.
@export var give_in_seconds: float = NAN
## Humanity lost each time the Piggy gives in.
@export var give_in_humanity_cost: float = NAN
## How far the noise of giving in is heard, in metres.
@export var give_in_noise_radius: float = NAN
## How close the Piggy must be to a give-in spot to give in there, in metres.
@export var give_in_reach: float = NAN
## How far a snort outburst is heard, in metres.
@export var snort_radius: float = NAN
## How far a squeal outburst is heard, in metres.
@export var squeal_radius: float = NAN
## How far a lunge outburst is heard, in metres.
@export var lunge_radius: float = NAN
## How far a lunge outburst throws the Piggy forward, in metres.
@export var lunge_distance: float = NAN
## How far an outburst jerks the camera, in radians.
@export var outburst_camera_jerk: float = NAN
## How far the camera twitches during the warning signs, in radians.
@export var warning_camera_twitch: float = NAN
## How far each creeping footstep is heard, in metres.
@export var creep_noise_radius: float = NAN
## How far each walking footstep is heard, in metres.
@export var walk_noise_radius: float = NAN
## How far each trotting footstep is heard, in metres.
@export var trot_noise_radius: float = NAN
## Seconds between the Piggy's footstep noises while moving.
@export var footstep_seconds: float = NAN
## How much each closed door or wall between a noise and a listener cuts its radius, as a
## fraction (0.4 leaves 60% per barrier).
@export var noise_cut_per_barrier: float = NAN
## How fast Mum walks her route and searches, in metres per second.
@export var mum_walk_speed: float = NAN
## How fast Mum goes to a noise she heard, in metres per second.
@export var mum_investigate_speed: float = NAN
## How long Mum searches around a noise before going back to her route, in seconds.
@export var mum_search_seconds: float = NAN
## How far from the noise Mum looks while searching, in metres.
@export var mum_search_radius: float = NAN
## Seconds between Mum's lines while she investigates or searches.
@export var mum_line_seconds: float = NAN
## Below this humanity the slop bowls show the player's favourite snacks instead of slop.
@export var snacks_below_humanity: float = NAN
## Below this humanity the mirror (and the back-door glass) shows only the pig body, and
## the night ends on the pig end card.
@export var mirror_pig_only_below_humanity: float = NAN
## How long the mirror shows the old human body before it flickers to the pig, in seconds.
@export var mirror_old_body_seconds: float = NAN
## Humanity at which pig vision is at full strength. It is off at 100 and grows evenly.
@export var pig_vision_full_at_humanity: float = NAN
## Below this humanity the Piggy's breathing and heartbeat start to sound snouty.
@export var snouty_breathing_below_humanity: float = NAN
## Below this humanity they sound like a pig's. Not above snouty_breathing_below_humanity.
@export var pig_breathing_below_humanity: float = NAN
## Below this humanity the house's spaces rot from cosy to soured.
@export var rot_soured_below_humanity: float = NAN
## Below this humanity they rot on to grotesque. Not above rot_soured_below_humanity.
@export var rot_grotesque_below_humanity: float = NAN
## How fast Mum chases the Piggy once she has seen them, in metres per second.
@export var mum_chase_speed: float = NAN
## How wide Mum's torch beam is, edge to edge, in degrees. She only sees the Piggy inside it.
@export var mum_torch_cone_degrees: float = NAN
## How far Mum's torch reaches, in metres. She sees nothing beyond it in the dark.
@export var mum_torch_range: float = NAN
## How close Mum must get to the Piggy while chasing to catch them, in metres.
@export var mum_caught_distance: float = NAN
## After being caught, the least distance on foot Mum starts again from the Piggy, in
## metres. She is back on her route, unaware and out of sight.
@export var mum_restart_distance: float = NAN


## Loads a tuning table from a .tres file. Returns null if the file can't be loaded
## as a Tuning. The caller still has to check problems().
static func load_file(path: String) -> Tuning:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as Tuning


## One message per bad field, each naming the field. Empty when the table is fine.
func problems() -> Array[String]:
	var found: Array[String] = []
	for field: String in LIMITS:
		var value: float = get(field)
		var limits: Array = LIMITS[field]
		var lowest: float = limits[0]
		var highest: float = limits[1]
		if is_nan(value):
			found.append("%s is missing from the tuning table" % field)
		elif value < lowest or value > highest:
			found.append(
				"%s is %s, but it must be between %s and %s" % [field, value, lowest, highest]
			)
	if door_creak_loudest_radius < door_creak_quietest_radius:
		(
			found
			. append(
				(
					"door_creak_loudest_radius is %s, but it must not be below door_creak_quietest_radius (%s)"
					% [door_creak_loudest_radius, door_creak_quietest_radius]
				)
			)
		)
	if creep_speed > walk_speed or trot_speed < walk_speed:
		(
			found
			. append(
				(
					"creep_speed (%s), walk_speed (%s) and trot_speed (%s) must go from slowest to fastest"
					% [creep_speed, walk_speed, trot_speed]
				)
			)
		)
	if urge_after_outburst >= urge_warning:
		found.append(
			(
				"urge_after_outburst is %s, but it must be below urge_warning (%s)"
				% [urge_after_outburst, urge_warning]
			)
		)
	if pig_breathing_below_humanity > snouty_breathing_below_humanity:
		(
			found
			. append(
				(
					"pig_breathing_below_humanity (%s) must not be above snouty_breathing_below_humanity (%s)"
					% [pig_breathing_below_humanity, snouty_breathing_below_humanity]
				)
			)
		)
	if rot_grotesque_below_humanity > rot_soured_below_humanity:
		found.append(
			(
				"rot_grotesque_below_humanity (%s) must not be above rot_soured_below_humanity (%s)"
				% [rot_grotesque_below_humanity, rot_soured_below_humanity]
			)
		)
	return found
