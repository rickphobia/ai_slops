// PS1 look for the whole screen: a low resolution, few colours, and a 4x4 ordered dither
// so dark gradients break into a pattern instead of banding.
shader_type canvas_item;

uniform sampler2D screen : hint_screen_texture, filter_nearest;
// Size of one PS1 pixel, in screen pixels.
uniform float pixel_size = 3.0;
// Shades per colour channel.
uniform float colour_levels = 24.0;

const float BAYER[16] = float[](
	0.0, 8.0, 2.0, 10.0,
	12.0, 4.0, 14.0, 6.0,
	3.0, 11.0, 1.0, 9.0,
	15.0, 7.0, 13.0, 5.0
);

void fragment() {
	vec2 cell = floor(FRAGCOORD.xy / pixel_size);
	vec2 uv = (cell + 0.5) * pixel_size * SCREEN_PIXEL_SIZE;
	vec3 colour = texture(screen, uv).rgb;
	int index = int(mod(cell.x, 4.0)) + int(mod(cell.y, 4.0)) * 4;
	float threshold = BAYER[index] / 16.0 - 0.5;
	COLOR = vec4(floor(colour * colour_levels + threshold + 0.5) / colour_levels, 1.0);
}
