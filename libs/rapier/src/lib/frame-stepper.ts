import { NgIf } from '@angular/common';
import {
	Component,
	Directive,
	EventEmitter,
	Injector,
	Input,
	NgZone,
	Output,
	inject,
	type OnInit,
} from '@angular/core';
import { injectBeforeRender, signalStore } from 'angular-three';
import { injectNgtrRaf } from './utils';

type NgtrFrameStepperState = {
	type?: 'follow' | 'independent';
	updatePriority?: number;
};

@Directive({ selector: 'ngtr-before-render-frame-stepper', standalone: true })
export class NgtrBeforeRenderFrameStepper implements OnInit {
	private injector = inject(Injector);

	@Input() updatePriority = 0;
	@Output() step = new EventEmitter<number>();

	ngOnInit() {
		injectBeforeRender(
			({ delta }) => {
				this.step.emit(delta);
			},
			{ priority: this.updatePriority, injector: this.injector },
		);
	}
}

@Directive({ selector: 'ngtr-raf-frame-stepper', standalone: true })
export class NgtrRafFrameStepper {
	private injector = inject(Injector);
	private zone = inject(NgZone);

	@Output() step = new EventEmitter<number>();

	ngOnInit() {
		this.zone.runOutsideAngular(() => {
			injectNgtrRaf(this.step.emit.bind(this.step), this.injector);
		});
	}
}

@Component({
	selector: 'ngtr-frame-stepper',
	template: `
		<ngtr-before-render-frame-stepper
			*ngIf="type() === 'follow'; else raf"
			[updatePriority]="updatePriority()"
			(step)="step.emit($event)"
		/>
		<ng-template #raf>
			<ngtr-raf-frame-stepper (step)="step.emit($event)" />
		</ng-template>
	`,
	imports: [NgtrBeforeRenderFrameStepper, NgtrRafFrameStepper, NgIf],
	standalone: true,
})
export class NgtrFrameStepper {
	private inputs = signalStore<NgtrFrameStepperState>({ type: 'follow', updatePriority: 0 });

	@Input({ alias: 'type' }) set _type(type: NgtrFrameStepperState['type']) {
		this.inputs.set({ type });
	}

	@Input({ alias: 'updatePriority' }) set _updatePriority(updatePriority: NgtrFrameStepperState['updatePriority']) {
		this.inputs.set({ updatePriority });
	}

	@Output() step = new EventEmitter<number>();

	type = this.inputs.select('type');
	updatePriority = this.inputs.select('updatePriority');
}
