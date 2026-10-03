// PS1 look for the house and props: vertices snap to a coarse screen grid (the wobble as
// the camera moves) and surfaces get a tiny grime texture sampled with no filtering.
// World-space UVs, so CSG boxes of any size get the same texel size. Lit by Godot as usual.
shader_type spatial;
render_mode diffuse_lambert, specular_disabled;

uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D grime : source_color, filter_nearest, repeat_enable;
// How many times the grime texture repeats per metre.
uniform float grime_per_metre = 0.5;
// The grid vertices snap to, in screen units. Lower is wobblier.
uniform vec2 snap_grid = vec2(320.0, 180.0);

varying vec3 world_position;
varying vec3 world_normal;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	world_normal = normalize((MODEL_MATRIX * vec4(NORMAL, 0.0)).xyz);
	vec4 clip = PROJECTION_MATRIX * MODELVIEW_MATRIX * vec4(VERTEX, 1.0);
	vec2 half_grid = snap_grid * 0.5;
	clip.xy = round(clip.xy / clip.w * half_grid) / half_grid * clip.w;
	POSITION = clip;
}

void fragment() {
	vec3 facing = abs(world_normal);
	vec2 uv = facing.y > max(facing.x, facing.z) ? world_position.xz
		: (facing.x > facing.z ? world_position.zy : world_position.xy);
	ALBEDO = albedo.rgb * texture(grime, uv * grime_per_metre).rgb;
}
