import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { type NgtVector3 } from 'angular-three';
import { NgteEcctrl, type NgteEcctrlMovementInput, type NgteEcctrlOptions } from 'angular-three-ecctrl';
import { NgteEcctrlAnimationState, type NgteEcctrlAnimationStateValue } from 'angular-three-ecctrl/animation';
import { NgteEcctrlCameraFollow } from 'angular-three-ecctrl/camera';
import { NgteEcctrlMovementBinding } from 'angular-three-ecctrl/input';
import { createKeyboardControls, NgtsCameraControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { EcctrlExampleControls } from './example-controls';
import { EcctrlHumanModel } from './human-model';

const { controlsMap } = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'backward', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
	{ name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
	{ name: 'jump', keys: ['Space'] },
]);

@Component({
	selector: 'app-ecctrl-keyboard-player',
	template: `
		<ngt-group [keyboardControls]="controlsMap" preventDefault>
			<ngte-ecctrl
				#player="ecctrl"
				[position]="position()"
				[options]="options()"
				[movementInput]="movement()"
				animationState
				(animationStateChange)="setAnimationState($event)"
			>
				<app-ecctrl-human-model [state]="animationState()" [timeScale]="animationTimeScale()" />
			</ngte-ecctrl>
			<ngts-camera-controls
				[options]="{ makeDefault: true, maxPolarAngle: Math.PI / 2.02 }"
				[ecctrlCameraFollow]="{
					ecctrl: player,
					enabled: cameraFollow(),
					offset: cameraOffset(),
					upMode: cameraUpMode(),
				}"
			/>
		</ngt-group>
	`,
	imports: [
		EcctrlHumanModel,
		NgteEcctrl,
		NgteEcctrlAnimationState,
		NgteEcctrlCameraFollow,
		NgteEcctrlMovementBinding,
		NgtsCameraControls,
		NgtsKeyboardControls,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcctrlKeyboardPlayer {
	position = input<NgtVector3>([0, 1.25, 5]);
	options = input<NgteEcctrlOptions>({ enableToggleRun: false });
	touchControls = input(false);
	cameraFollow = input(true);
	cameraOffset = input<Exclude<NgtVector3, number>>([0, 0.7, 0]);
	cameraUpMode = input<'world' | 'character'>('world');
	animationTimeScale = input(1);

	protected readonly Math = Math;
	protected readonly controlsMap = controlsMap;
	protected readonly animationState = signal<NgteEcctrlAnimationStateValue>('IDLE');
	protected readonly movement = signal<Partial<NgteEcctrlMovementInput>>({});

	private readonly keyboardControls = viewChild(NgtsKeyboardControls);
	private readonly cameraControls = viewChild(NgtsCameraControls);
	private readonly exampleControls = inject(EcctrlExampleControls, { optional: true });

	constructor() {
		effect((onCleanup) => {
			const cameraControls = this.cameraControls()?.controls();
			if (!cameraControls || !this.exampleControls) return;
			this.exampleControls.restoreCameraTarget(cameraControls);
			onCleanup(() => this.exampleControls?.captureCameraTarget(cameraControls));
		});

		effect((onCleanup) => {
			if (!this.touchControls() || !this.exampleControls) return;
			this.exampleControls.touchActive.set(true);
			onCleanup(() => this.exampleControls?.resetTouch());
		});

		effect(() => {
			const keyboardControls = this.keyboardControls();
			if (!keyboardControls) return;
			const touch = this.touchControls() ? this.exampleControls : null;

			this.movement.set({
				forward: keyboardControls.select('forward')(),
				backward: keyboardControls.select('backward')(),
				leftward: keyboardControls.select('leftward')(),
				rightward: keyboardControls.select('rightward')(),
				joystick: touch?.joystick(),
				run: keyboardControls.select('run')() || touch?.run() || false,
				jump: keyboardControls.select('jump')() || touch?.jump() || false,
			});
		});
	}

	protected setAnimationState(state: NgteEcctrlAnimationStateValue) {
		this.animationState.set(state);
	}
}
