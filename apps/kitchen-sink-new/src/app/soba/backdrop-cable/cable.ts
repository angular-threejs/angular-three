import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { injectBeforeRender } from 'angular-three';
import { NgtsQuadraticBezierLine } from 'angular-three-soba/abstractions';
import { Group, Vector3 } from 'three';

@Component({
	selector: 'app-cable',
	template: `
		<ngts-quadratic-bezier-line [options]="{ lineWidth: 3, color: '#ff2060' }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtsQuadraticBezierLine],
})
export class Cable {
	startRef = input.required<ElementRef<Group> | undefined>();
	endRef = input.required<ElementRef<Group>>();

	bezierLine = viewChild.required(NgtsQuadraticBezierLine);

	constructor() {
		const [v1, v2] = [new Vector3(), new Vector3()];

		injectBeforeRender(() => {
			const [bezierLine, start, end] = [this.bezierLine(), this.startRef()?.nativeElement, this.endRef().nativeElement];
			if (!start || !end) return;
			bezierLine.setPoints(start.getWorldPosition(v1), end.getWorldPosition(v2));
		});
	}
}
