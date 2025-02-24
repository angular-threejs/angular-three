import type { NodeRepresentation, ShaderNodeObject } from 'three/tsl';
import { Fn, If, PI2, atan, frontFacing, output, positionLocal, vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';

type AngleInputs = { startAngle: NodeRepresentation; arcAngle: NodeRepresentation };

const inAngle = Fn(
	([position, startAngle, endAngle]: [ShaderNodeObject<Node>, NodeRepresentation, NodeRepresentation]) => {
		const angle = atan(position.y, position.x).sub(startAngle).mod(PI2).toVar();
		return angle.greaterThan(0).and(angle.lessThan(endAngle));
	},
);

export const outputNodeFn = Fn(({ startAngle, arcAngle, color }: AngleInputs & { color: NodeRepresentation }) => {
	inAngle(positionLocal.xy, startAngle, arcAngle).discard();
	const finalOutput = output;
	If(frontFacing.not(), () => {
		finalOutput.assign(vec4(color, 1));
	});
	return finalOutput;
});

export const shadowNodeFn = Fn(({ startAngle, arcAngle }: AngleInputs) => {
	inAngle(positionLocal.xy, startAngle, arcAngle).discard();
	return vec4(0, 0, 0, 1);
});
