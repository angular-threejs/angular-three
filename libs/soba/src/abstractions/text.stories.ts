import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsText } from 'angular-three-soba/abstractions';
import { DoubleSide } from 'three';
import { color, makeDecorators, makeStoryObject, turn } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'left'"
			[font]="'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			(beforeRender)="turn($event.object)"
		>
			<ngt-mesh-basic-material [color]="color" [side]="DoubleSide" [transparent]="true" [opacity]="1" />
		</ngts-text>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class CustomMaterialTextStory {
	@Input() text = '';
	@Input() color = 'turquoise';
	readonly turn = turn;
	readonly DoubleSide = DoubleSide;
}

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[color]="'#EC2D2D'"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'right'"
			[direction]="'auto'"
			[font]="'https://fonts.gstatic.com/s/scheherazade/v20/YA9Ur0yF4ETZN60keViq1kQgtA.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			(beforeRender)="turn($any($event).object)"
		/>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class LTRTextStory {
	@Input() text = '';
	readonly turn = turn;
}

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[color]="'#EC2D2D'"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'left'"
			[font]="'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			[outlineOffsetX]="'10%'"
			[outlineOffsetY]="'10%'"
			[outlineBlur]="'30%'"
			[outlineOpacity]="0.3"
			[outlineColor]="'#EC2D2D'"
			(beforeRender)="turn($any($event).object)"
		/>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class ShadowTextStory {
	@Input() text = '';
	readonly turn = turn;
}

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[color]="'#EC2D2D'"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'left'"
			[font]="'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			[strokeWidth]="'2.5%'"
			[strokeColor]="'#fff'"
			(beforeRender)="turn($any($event).object)"
		/>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class StrokeTextStory {
	@Input() text = '';
	readonly turn = turn;
}

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[color]="'#EC2D2D'"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'left'"
			[font]="'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			[outlineWidth]="2"
			[outlineColor]="'#fff'"
			(beforeRender)="turn($any($event).object)"
		/>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class OutlineTextStory {
	@Input() text = '';
	readonly turn = turn;
}

@Component({
	standalone: true,
	template: `
		<ngts-text
			[text]="text"
			[color]="color"
			[fontSize]="12"
			[maxWidth]="200"
			[lineHeight]="1"
			[letterSpacing]="0.02"
			[textAlign]="'left'"
			[font]="'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff'"
			[anchorX]="'center'"
			[anchorY]="'middle'"
			(beforeRender)="turn($any($event).object)"
		/>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultTextStory {
	@Input() text = '';
	@Input() color = '#ec2d2d';
	readonly turn = turn;
}

export default {
	title: 'Abstractions/Text',
	decorators: makeDecorators(),
} as Meta;

const defaultText = `LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.`;

const canvasOptions = { camera: { position: [0, 0, 200] } };

export const Default = makeStoryObject(DefaultTextStory, {
	canvasOptions,
	argsOptions: { text: defaultText, color: color('#ec2d2d') },
});
export const Outline = makeStoryObject(OutlineTextStory, { canvasOptions, argsOptions: { text: defaultText } });
export const Stroke = makeStoryObject(StrokeTextStory, { canvasOptions, argsOptions: { text: defaultText } });
export const Shadow = makeStoryObject(ShadowTextStory, { canvasOptions, argsOptions: { text: defaultText } });
export const LTR = makeStoryObject(LTRTextStory, {
	canvasOptions,
	argsOptions: {
		text: `يولد جميع الناس أحرارًا متساوين في الكرامة والحقوق. وقد وهبوا عقلاً وضميرًا وعليهم أن يعامل بعضهم بعضًا بروح الإخاء.`,
	},
});
export const CustomMaterial = makeStoryObject(CustomMaterialTextStory, {
	canvasOptions,
	argsOptions: {
		text: defaultText,
		color: color('turquoise'),
	},
});
