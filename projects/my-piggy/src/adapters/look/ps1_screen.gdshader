// PS1 look for the whole screen: a low resolution, few colours, and a 4x4 ordered dither
// so dark gradients break into a pattern instead of banding. Pig vision blurs it first,
// in the same pass: a second screen-reading layer would read the screen before this one
// drew, so it can't simply stack on top.
shader_type canvas_item;

uniform sampler2D screen : hint_screen_texture, filter_nearest;
// Size of one PS1 pixel, in screen pixels.
uniform float pixel_size = 3.0;
// Shades per colour channel.
uniform float colour_levels = 24.0;
// Pig vision, 0 (sharp) to 1 (as blurry as it gets). Set from Hallucinations by humanity.
uniform float pig_vision : hint_range(0.0, 1.0) = 0.0;
// How far pig vision smears at full strength, in screen pixels.
uniform float pig_vision_blur_pixels = 9.0;

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
	if (pig_vision > 0.0) {
		// Eight taps on a ring around the pixel, mixed with the centre: a soft, cheap blur
		// that WebGL 2 runs fine at full screen.
		vec2 reach = pig_vision * pig_vision_blur_pixels * SCREEN_PIXEL_SIZE;
		vec3 ring = vec3(0.0);
		for (int tap = 0; tap < 8; tap++) {
			float angle = float(tap) * 0.785398;
			ring += texture(screen, uv + vec2(cos(angle), sin(angle)) * reach).rgb;
		}
		colour = mix(colour, ring / 8.0, 0.4 + 0.5 * pig_vision);
	}
	int index = int(mod(cell.x, 4.0)) + int(mod(cell.y, 4.0)) * 4;
	float threshold = BAYER[index] / 16.0 - 0.5;
	COLOR = vec4(floor(colour * colour_levels + threshold + 0.5) / colour_levels, 1.0);
}
