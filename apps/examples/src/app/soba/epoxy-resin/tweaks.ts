import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
	NgtTweakCheckbox,
	NgtTweakColor,
	NgtTweakFolder,
	NgtTweakNumber,
	NgtTweakPane,
	NgtTweakText,
} from 'angular-three-tweakpane';

@Component({
	selector: 'app-tweaks',
	template: `
		<ngt-tweak-pane title="Epoxy Resin" left="8px">
			<ngt-tweak-text [(value)]="text" label="text" />
			<ngt-tweak-color [(value)]="shadow" label="Shadow Color" />
			<ngt-tweak-checkbox [(value)]="autoRotate" label="Auto Rotate" />
			<ngt-tweak-folder title="Text Material">
				<ngt-tweak-checkbox [(value)]="backside" label="Backside" />
				<ngt-tweak-number
					[(value)]="backsideThickness"
					label="Backside Thickness"
					[params]="{ min: 0, max: 2 }"
				/>
				<ngt-tweak-number [(value)]="samples" label="Samples" [params]="{ min: 1, max: 32, step: 1 }" />
				<ngt-tweak-number
					[(value)]="resolution"
					label="Resolution"
					[params]="{ min: 64, max: 2048, step: 64 }"
				/>
				<ngt-tweak-number [(value)]="transmission" label="Transmission" [params]="{ min: 0, max: 1 }" />
				<ngt-tweak-number [(value)]="clearcoat" label="Clearcoat" [params]="{ min: 0.1, max: 1 }" />
				<ngt-tweak-number
					[(value)]="clearcoatRoughness"
					label="Clearcoat Roughness"
					[params]="{ min: 0, max: 1 }"
				/>
				<ngt-tweak-number [(value)]="thickness" label="Thickness" [params]="{ min: 0, max: 5 }" />
				<ngt-tweak-number
					[(value)]="chromaticAberration"
					label="Chromatic Aberration"
					[params]="{ min: 0, max: 5 }"
				/>
				<ngt-tweak-number [(value)]="anisotropy" label="Anisotropy" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<ngt-tweak-number [(value)]="roughness" label="Roughness" [params]="{ min: 0, max: 1, step: 0.01 }" />
				<ngt-tweak-number [(value)]="distortion" label="Distortion" [params]="{ min: 0, max: 4, step: 0.01 }" />
				<ngt-tweak-number
					[(value)]="distortionScale"
					label="Distortion Scale"
					[params]="{ min: 0.01, max: 1, step: 0.01 }"
				/>
				<ngt-tweak-number
					[(value)]="temporalDistortion"
					label="Temporal Distortion"
					[params]="{ min: 0, max: 1, step: 0.01 }"
				/>
				<ngt-tweak-number [(value)]="ior" label="IOR" [params]="{ min: 0, max: 2, step: 0.01 }" />
				<ngt-tweak-color [(value)]="color" label="Color" />
			</ngt-tweak-folder>
		</ngt-tweak-pane>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtTweakCheckbox, NgtTweakColor, NgtTweakNumber, NgtTweakFolder, NgtTweakText, NgtTweakPane],
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
