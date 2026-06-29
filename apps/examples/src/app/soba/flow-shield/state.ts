import { Injectable, signal } from '@angular/core';
import { type NgtsEnvironmentPresets } from 'angular-three-soba/staging';

@Injectable()
export class FlowShieldState {
	grid = {
		show: signal(true),
	};

	environment = {
		preset: signal<NgtsEnvironmentPresets>('night'),
	};
}
