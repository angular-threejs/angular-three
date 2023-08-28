import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { signalStore, type NgtThreeEvent } from 'angular-three';

export type NgtsGizmoViewCubeInputState = {
	opacity: number;
	hoverColor: string;
	textColor: string;
	strokeColor: string;
	faces: string[];
	font?: string;
	color?: string;
	clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>;
};

@Directive()
export abstract class NgtsGizmoViewcubeInput {
	inputs = signalStore<NgtsGizmoViewCubeInputState>({});

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	@Input({ alias: 'hoverColor' }) set _hoverColor(hoverColor: string) {
		this.inputs.set({ hoverColor });
	}

	@Input({ alias: 'textColor' }) set _textColor(textColor: string) {
		this.inputs.set({ textColor });
	}

	@Input({ alias: 'strokeColor' }) set _strokeColor(strokeColor: string) {
		this.inputs.set({ strokeColor });
	}

	@Input({ alias: 'faces' }) set _faces(faces: string[]) {
		this.inputs.set({ faces });
	}

	@Input({ alias: 'font' }) set _font(font: string) {
		this.inputs.set({ font });
	}

	@Input({ alias: 'color' }) set _color(color: string) {
		this.inputs.set({ color });
	}

	@Output() viewcubeClick = new EventEmitter<NgtThreeEvent<MouseEvent>>();

	hoverColor = this.inputs.select('hoverColor');
	opacity = this.inputs.select('opacity');
	textColor = this.inputs.select('textColor');
	strokeColor = this.inputs.select('strokeColor');
	faces = this.inputs.select('faces');
	font = this.inputs.select('font');
	color = this.inputs.select('color');
}
