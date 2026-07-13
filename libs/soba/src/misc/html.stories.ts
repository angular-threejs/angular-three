import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import {
	NgtsHTML,
	NgtsHTMLContentOptions,
	type NgtsHTMLOcclusionFrame,
	type NgtsHTMLOcclusionStrategy,
	type NgtsHTMLOcclusionTarget,
	NgtsHTMLOptions,
} from 'angular-three-soba/misc';
import { NgtsDetailed } from 'angular-three-soba/performances';
import { ColorRepresentation, Object3D, Vector3 } from 'three';
import { storyDecorators, storyFunction, storyObject, Turnable } from '../setup-canvas';

const MARKER_RADIUS = 2.2;

function sphericalMarkers(count: number) {
	const goldenAngle = Math.PI * (3 - Math.sqrt(5));

	return Array.from({ length: count }, (_, id) => {
		const y = 1 - (id / (count - 1)) * 2;
		const ringRadius = Math.sqrt(1 - y * y);
		const angle = goldenAngle * id;

		return {
			id,
			position: [
				Math.cos(angle) * ringRadius * MARKER_RADIUS,
				y * MARKER_RADIUS,
				Math.sin(angle) * ringRadius * MARKER_RADIUS,
			] as [number, number, number],
		};
	});
}

class SphericalOcclusionStrategy implements NgtsHTMLOcclusionStrategy {
	private readonly cameraPosition = new Vector3();
	private readonly sphereCenter = new Vector3();
	private readonly sphereScale = new Vector3();
	private readonly anchorPosition = new Vector3();
	private readonly cameraToAnchor = new Vector3();
	private readonly cameraToCenter = new Vector3();
	private radiusSquared = 0;

	constructor(
		private readonly sphere: () => Object3D,
		private readonly radius: number,
	) {}

	beginFrame(_targets: readonly NgtsHTMLOcclusionTarget[], { state }: NgtsHTMLOcclusionFrame) {
		state.camera.getWorldPosition(this.cameraPosition);

		const sphere = this.sphere();
		sphere.getWorldPosition(this.sphereCenter);
		sphere.getWorldScale(this.sphereScale);
		const worldRadius = this.radius * Math.max(this.sphereScale.x, this.sphereScale.y, this.sphereScale.z);
		this.radiusSquared = worldRadius * worldRadius;
	}

	isOccluded({ anchor }: NgtsHTMLOcclusionTarget, _frame: NgtsHTMLOcclusionFrame) {
		anchor.getWorldPosition(this.anchorPosition);
		this.cameraToAnchor.subVectors(this.anchorPosition, this.cameraPosition);

		const markerDistance = this.cameraToAnchor.length();
		if (markerDistance === 0) return false;

		this.cameraToAnchor.divideScalar(markerDistance);
		this.cameraToCenter.subVectors(this.sphereCenter, this.cameraPosition);
		const closestPoint = this.cameraToCenter.dot(this.cameraToAnchor);

		if (closestPoint <= 0 || closestPoint >= markerDistance) return false;

		return this.cameraToCenter.lengthSq() - closestPoint * closestPoint < this.radiusSquared;
	}
}

@Component({
	selector: 'html-scene',
	template: `
		<ngt-group turnable>
			<ngt-mesh [position]="[3, 6, 4]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>First</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[10, 0, 10]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>Second</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh [position]="[-20, 0, -20]">
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material [color]="color()" wireframe />

				<ngts-html [options]="{ transform: transform() }">
					<div [htmlContent]="{ distanceFactor: 30 }" style="color: white;">
						<h1>Third</h1>
					</div>
				</ngts-html>
			</ngt-mesh>

			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsHTML, Turnable],
})
class HtmlScene {
	color = input<ColorRepresentation>('hotpink');
	transform = input(false);
}

@Component({
	template: `
		<html-scene color="palegreen" transform>
			<ngts-html [options]="htmlOptions()">
				<div [htmlContent]="htmlContentOptions()">Transform mode</div>
			</ngts-html>
		</html-scene>
	`,
	styles: `
		::ng-deep .transformed-container {
			background: palegreen;
			font-size: 50px;
			padding: 10px 18px;
			border: 2px solid black;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [HtmlScene, NgtsHTML],
})
class HtmlTransformScene {
	htmlOptions = input({} as NgtsHTMLOptions);
	htmlContentOptions = input({} as NgtsHTMLContentOptions);
}

@Component({
	selector: 'html-lod-scene',
	template: `
		<ngts-detailed [distances]="[0, 8, 18]">
			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 4]" />
				<ngt-mesh-basic-material color="hotpink" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div
						[htmlContent]="{ center: true }"
						style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;"
					>
						High Detail
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 2]" />
				<ngt-mesh-basic-material color="orange" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div
						[htmlContent]="{ center: true }"
						style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;"
					>
						Medium Detail
					</div>
				</ngts-html>
			</ngt-mesh>

			<ngt-mesh>
				<ngt-icosahedron-geometry *args="[2, 1]" />
				<ngt-mesh-basic-material color="skyblue" wireframe />

				<ngts-html [options]="{ position: [2.5, 0, 0] }">
					<div
						[htmlContent]="{ center: true }"
						style="color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; white-space: nowrap;"
					>
						Low Detail
					</div>
				</ngts-html>
			</ngt-mesh>
		</ngts-detailed>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsHTML, NgtsDetailed],
})
class HtmlWithLODScene {}

@Component({
	selector: 'html-custom-occlusion-scene',
	template: `
		<ngt-color *args="['#070b18']" attach="background" />
		<ngt-ambient-light [intensity]="0.8" />
		<ngt-directional-light [position]="[4, 5, 6]" [intensity]="2" />

		<ngt-mesh #planet>
			<ngt-sphere-geometry *args="[2, 48, 48]" />
			<ngt-mesh-standard-material color="#182f59" [roughness]="0.72" [metalness]="0.08" />
		</ngt-mesh>

		@for (marker of markers; track marker.id) {
			<ngts-html [options]="{ position: marker.position, occlude: occlusionStrategy }">
				<div
					[htmlContent]="{ center: true }"
					style="padding: 2px 5px; border: 1px solid #7dd3fc; border-radius: 999px; background: #071426e6; color: #e0f2fe; font: 10px/1 monospace; white-space: nowrap;"
				>
					{{ marker.id + 1 }}
				</div>
			</ngts-html>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsHTML],
})
class HtmlCustomOcclusionScene {
	protected readonly markers = sphericalMarkers(48);
	protected readonly occlusionStrategy = new SphericalOcclusionStrategy(() => this.planetRef().nativeElement, 2);

	private readonly planetRef = viewChild.required<ElementRef<Object3D>>('planet');
}

export default {
	title: 'Misc/HTML',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyFunction(HtmlScene, { camera: { position: [-20, 20, -20] } });
export const WithLOD = storyFunction(HtmlWithLODScene, { camera: { position: [0, 0, 10] } });
export const CustomOcclusionStrategy = storyFunction(HtmlCustomOcclusionScene, {
	camera: { position: [0, 1, 7] },
	lights: false,
});
export const Transform = storyObject(HtmlTransformScene, {
	camera: { position: [-20, 20, -20] },
	argsOptions: {
		htmlOptions: {
			transform: true,
			position: [5, 15, 0],
		},
		htmlContentOptions: {
			sprite: true,
			distanceFactor: 20,
			containerClass: 'transformed-container',
			containerStyle: {
				background: 'palegreen',
				fontSize: '50px',
				padding: '10px 18px',
				border: '2px solid black',
			} as Partial<CSSStyleDeclaration>,
		},
	},
});
