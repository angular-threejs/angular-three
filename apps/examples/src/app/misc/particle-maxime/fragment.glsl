varying vec3 vPosition;

const vec3 COLOR_1 = vec3(0.894, 0.0, 0.208); // #E40035
const vec3 COLOR_2 = vec3(0.965, 0.039, 0.282); // #F60A48
const vec3 COLOR_3 = vec3(0.949, 0.027, 0.333); // #F20755
const vec3 COLOR_4 = vec3(0.863, 0.031, 0.490); // #DC087D
const vec3 COLOR_5 = vec3(0.592, 0.090, 0.906); // #9717E7
const vec3 COLOR_6 = vec3(0.424, 0.0, 0.961); // #6C00F5

const float STEP_1 = 0.24;
const float STEP_2 = 0.352;
const float STEP_3 = 0.494;
const float STEP_4 = 0.745;

void main() {
    float gradientPos = (vPosition.y + 1.0) * 0.5;

    vec3 color = gradientPos < STEP_1 ? mix(COLOR_1, COLOR_2, gradientPos / STEP_1) :
        gradientPos < STEP_2 ? mix(COLOR_2, COLOR_3, (gradientPos - STEP_1) / (STEP_2 - STEP_1)) :
        gradientPos < STEP_3 ? mix(COLOR_3, COLOR_4, (gradientPos - STEP_2) / (STEP_3 - STEP_2)) :
        gradientPos < STEP_4 ? mix(COLOR_4, COLOR_5, (gradientPos - STEP_3) / (STEP_4 - STEP_3)) :
        mix(COLOR_5, COLOR_6, (gradientPos - STEP_4) / (1.0 - STEP_4));

    gl_FragColor = vec4(color, 1.0);
}
