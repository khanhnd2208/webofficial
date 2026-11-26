// Coordinates use the source illustration, so the effects follow the drawing at every crop.
export const vertex = `
attribute vec2 position;
varying vec2 frame;
void main() {
  frame = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;

export const fragment = `
precision highp float;
varying vec2 frame;
uniform sampler2D paper, road;
uniform vec4 crop;
uniform vec2 view, gaze, impact;
uniform float age, meetingTime, meetingPoint, portrait;
void main() {
  vec2 uv = frame * crop.xy + crop.zw;
  vec2 delta = (frame - impact) * view / min(view.x, view.y);
  float radius = length(delta);
  float distanceToCrest = radius - max(0., age) * .82;
  float envelope = exp(-distanceToCrest * distanceToCrest * 280.) *
                   exp(-max(0., age) * 1.25) * step(0., age);
  float wave = sin(distanceToCrest * 114.) * envelope;
  uv -= delta / max(.012, radius) * wave * .015 * min(view.x,view.y) / view * crop.xy;
  // Near ink (figure and ledge) shifts further than the distant mountain or sun.
  float nearX = mix(.23,.54,portrait);
  float foreground = (1. - smoothstep(nearX-.05, nearX+.055, uv.x)) *
                     smoothstep(.08,.26,uv.y);
  float depth = .16 + .22 * uv.y + .62 * foreground;
  uv += gaze * depth * .012;
  vec3 color = texture2D(paper, uv).rgb;
  vec2 sun = mix(vec2(.329,.31),vec2(.727,.303),portrait);
  float sunMask = (1. - smoothstep(.055,.071,length((uv-sun)*vec2(1.,mix(.625,1.25,portrait))))) *
                  smoothstep(.06,.23,color.r-color.b);
  float foil = exp(-pow((uv.x-sun.x + .28*(uv.y-sun.y) - gaze.x*.09)*53., 2.));
  color += sunMask * foil * min(1.,length(gaze)*2.) * vec3(.23,.18,.09);
  color += wave * vec3(.115,.105,.085);
  vec4 trail = texture2D(road, uv);
  float elapsed = age - meetingTime;
  float travel = abs(trail.r-meetingPoint)*1.5;
  float stroke = smoothstep(-.065,.025,elapsed-travel) *
                 (1.-smoothstep(.26,1.25,elapsed-travel)) *
                 mix(.42,1.,smoothstep(-.03,.03,trail.r-meetingPoint)) * step(0.,elapsed);
  color = mix(color, vec3(.80,.54,.17), trail.a * stroke * .95);
  // A small bead falls onto the page just before the opening wave.
  if (age < 0. && age > -.46) {
    vec2 bead = delta + vec2(0., -.24*age);
    float edge = length(bead * vec2(1.,.75));
    float body = 1.-smoothstep(.008,.012,edge);
    color = mix(color,vec3(.70,.56,.33),body*.76);
    color += (1.-smoothstep(.001,.005,length(bead+vec2(.003,.003))))*.32;
  }
  gl_FragColor = vec4(color,1.);
}`;
