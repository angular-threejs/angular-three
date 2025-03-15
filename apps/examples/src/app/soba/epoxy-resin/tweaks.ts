import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
	TweakpaneCheckbox,
	TweakpaneColor,
	TweakpaneFolder,
	TweakpaneNumber,
	TweakpanePane,
	TweakpaneText,
} from 'angular-three-tweakpane';

@Component({
	selector: 'app-tweaks',
	template: `
		<tweakpane-pane title="Epoxy Resin" left="8px">
			<tweakpane-text [(value)]="text" label="text" />
			<tweakpane-color [(value)]="shadow" label="Shadow Color" />
			<tweakpane-checkbox [(value)]="autoRotate" label="Auto Rotate" />
			<tweakpane-folder title="Text Material">
				<tweakpane-checkbox [(value)]="backside" label="Backside" />
				<tweakpane-number
					[(value)]="backsideThickness"
					label="Backside Thickness"
					[params]="{ min: 0, max: 2 }"
				/>
				<tweakpane-number [(value)]="samples" label="Samples" [params]="{ min: 1, max: 32, step: 1 }" />
				<tweakpane-number
					[(value)]="resolution"
					label="Resolution"
					[params]="{ min: 64, max: 2048, step: 64 }"
				/>
				<tweakpane-number [(value)]="transmission" label="Transmission" [params]="{ min: 0, max: 1 }" />
				<tweakpane-number [(value)]="clearcoat" label="Clearcoat" [params]="{ min: 0.1, max: 1 }" />
				<tweakpane-number
					[(value)]="clearcoatRoughness"
					label="Clearcoat Roughness"
					[params]="{ min: 0, max: 1 }"
				/>
				<tweakpane-number [(value)]="thickness" label="Thickness" [params]="{ min: 0, max: 5 }" />
				<tweakpane-number
					[(value)]="chromaticAberration"
					label="Chromatic Aberration"
					[params]="{ min: 0, max: 5 }"
				/>
				<tweakpane-number [(value)]="anisotropy" label="Anisotropy" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<tweakpane-number [(value)]="roughness" label="Roughness" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<tweakpane-number [(value)]="distortion" label="Distortion" [params]="{ min: 0, max: 4, step: 0.01 }" />
				<tweakpane-number
					[(value)]="distortionScale"
					label="Distortion Scale"
					[params]="{ min: 0.01, max: 1, step: 0.01 }"
				/>
				<tweakpane-number
					[(value)]="temporalDistortion"
					label="Temporal Distortion"
					[params]="{ min: 0, max: 1, step: 0.01 }"
				/>
				<tweakpane-number [(value)]="ior" label="IOR" [params]="{ min: 0, max: 2, step: 0.01 }" />
				<tweakpane-color [(value)]="color" label="Color" />
			</tweakpane-folder>
		</tweakpane-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [TweakpaneCheckbox, TweakpaneColor, TweakpaneNumber, TweakpaneFolder, TweakpaneText, TweakpanePane],
})
export class Tweaks<T> {
	text = signal('Angular');
	shadow = signal('#750d57');
	autoRotate = signal(false);

	protected backside = signal(true);
	protected backsideThickness = signal(0.3);
	protected samples = signal(16);
	protected resolution = signal(1024);
	protected transmission = signal(1);
	protected clearcoat = signal(0);
	protected clearcoatRoughness = signal(0.0);
	protected thickness = signal(0.3);
	protected chromaticAberration = signal(5);
	protected anisotropy = signal(0.3);
	protected roughness = signal(0);
	protected distortion = signal(0.5);
	protected distortionScale = signal(0.1);
	protected temporalDistortion = signal(0);
	protected ior = signal(1.5);
	protected color = signal('#ff9cf5');

	materialConfig = computed(() => ({
		color: this.color(),
		roughness: this.roughness(),
		transmission: this.transmission(),
		thickness: this.thickness(),
		ior: this.ior(),
		clearcoat: this.clearcoat(),
		clearcoatRoughness: this.clearcoatRoughness(),
		anisotropy: this.anisotropy(),
		chromaticAberration: this.chromaticAberration(),
		distortion: this.distortion(),
		distortionScale: this.distortionScale(),
		temporalDistortion: this.temporalDistortion(),
		backside: this.backside(),
		backsideThickness: this.backsideThickness(),
		samples: this.samples(),
		resolution: this.resolution(),
	}));
}
