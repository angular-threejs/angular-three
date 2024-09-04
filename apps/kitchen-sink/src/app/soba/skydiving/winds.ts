import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsInstance, NgtsInstances } from 'angular-three-soba/performances';
import { AdditiveBlending, DoubleSide, MathUtils, Vector3 } from 'three';

@Component({
	selector: 'app-wind-shape',
	standalone: true,
	template: `
		<ngts-instance [options]="{ color: 'white', position: randomPosition }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstance],
})
export class WindShape {
	protected randomPosition = [
		MathUtils.randFloatSpread(8),
		MathUtils.randFloatSpread(5),
		MathUtils.randFloatSpread(8),
	] as const;
	private v3 = new Vector3();
	private randomSpeed = MathUtils.randFloat(0.05, 0.5);

	private instanceRef = viewChild.required(NgtsInstance);

	constructor() {
		injectBeforeRender(({ camera, viewport }) => {
			const instance = this.instanceRef().positionMeshRef().nativeElement;
			if (!instance) return;

			const { height: elHeight } = (instance.geometry as any)['parameters'];
			const worldPosition = instance.getWorldPosition(this.v3);
			const limitPos = viewport.height - (worldPosition.y + elHeight / 2);
			if (limitPos < 0) {
				instance.position.y = -(viewport.height + elHeight / 2);
			}
			instance.position.y += this.randomSpeed;
			instance.rotation.y = camera.rotation.y;
		});
	}
}

@Component({
	selector: 'app-winds',
	standalone: true,
	template: `
		<ngt-group>
			<ngts-instances>
				<ngt-plane-geometry *args="[0.0135, 1.2]" />
				<ngt-mesh-basic-material
					[side]="DoubleSide"
					[blending]="AdditiveBlending"
					[opacity]="0.15"
					[transparent]="true"
				/>

				@for (i of count; track $index) {
					<app-wind-shape />
				}
			</ngts-instances>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstances, NgtArgs, WindShape],
})
export class Winds {
	protected readonly DoubleSide = DoubleSide;
	protected readonly AdditiveBlending = AdditiveBlending;

	protected count = Array.from({ length: 200 }, (_, i) => i);
}
