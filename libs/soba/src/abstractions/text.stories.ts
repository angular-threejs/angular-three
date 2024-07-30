import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender } from 'angular-three';
import { NgtsText, NgtsTextOptions } from 'angular-three-soba/abstractions';
import { DoubleSide } from 'three';
import { color, makeDecorators, makeStoryObject, number } from '../setup-canvas';

@Component({
	selector: 'text-container',
	standalone: true,
	template: `
		<ngts-text [text]="text" [options]="options()" />
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class TextContainer {
	options = input<Partial<NgtsTextOptions>>();
	text = `LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.`;

	textRef = viewChild.required(NgtsText);

	constructor() {
		injectBeforeRender(() => {
			const text = this.textRef().troikaMesh;
			text.rotation.y += 0.01;
		});
	}
}

@Component({
	selector: 'text-container',
	standalone: true,
	template: `
		<ngts-text [text]="text" [options]="options">
			<ngt-mesh-basic-material [side]="DoubleSide" [color]="color()" [transparent]="true" [opacity]="opacity()" />
		</ngts-text>
	`,
	imports: [NgtsText],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class TextCustomMaterialContainer {
	DoubleSide = DoubleSide;
	color = input('#EC2D2D');
	opacity = input(1);
	text = `LOREM IPSUM DOLOR SIT AMET, CONSECTETUR ADIPISCING ELIT, SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE
      MAGNA ALIQUA. UT ENIM AD MINIM VENIAM, QUIS NOSTRUD EXERCITATION ULLAMCO LABORIS NISI UT ALIQUIP EX EA COMMODO
      CONSEQUAT. DUIS AUTE IRURE DOLOR IN REPREHENDERIT IN VOLUPTATE VELIT ESSE CILLUM DOLORE EU FUGIAT NULLA PARIATUR.
      EXCEPTEUR SINT OCCAECAT CUPIDATAT NON PROIDENT, SUNT IN CULPA QUI OFFICIA DESERUNT MOLLIT ANIM ID EST LABORUM.`;
	options = {
		fontSize: 12,
		maxWidth: 200,
		lineHeight: 1,
		letterSpacing: 0.02,
		textAlign: 'left' as const,
		font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
		anchorX: 'center' as const,
		anchorY: 'middle' as const,
	};

	textRef = viewChild.required(NgtsText);

	constructor() {
		injectBeforeRender(() => {
			const text = this.textRef().troikaMesh;
			text.rotation.y += 0.01;
		});
	}
}

export default {
	title: 'Abstractions/Text',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(TextContainer, {
	canvasOptions: { camera: { position: [0, 0, 200] } },
	argsOptions: {
		options: {
			color: color('#EC2D2D'),
			fontSize: 12,
			maxWidth: 200,
			lineHeight: 1,
			letterSpacing: 0.02,
			textAlign: 'left',
			font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
			anchorX: 'center',
			anchorY: 'middle',
		},
	},
});

export const Outline = makeStoryObject(TextContainer, {
	canvasOptions: { camera: { position: [0, 0, 200] } },
	argsOptions: {
		options: {
			color: color('#EC2D2D'),
			fontSize: 12,
			maxWidth: 200,
			lineHeight: 1,
			letterSpacing: 0.02,
			textAlign: 'left',
			font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
			anchorX: 'center',
			anchorY: 'middle',
			outlineWidth: 2,
			outlineColor: color('#ffffff'),
		},
	},
});

export const TransparentWithStroke = makeStoryObject(TextContainer, {
	canvasOptions: { camera: { position: [0, 0, 200] } },
	argsOptions: {
		options: {
			fontSize: 12,
			maxWidth: 200,
			lineHeight: 1,
			letterSpacing: 0.02,
			textAlign: 'left',
			font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
			anchorX: 'center',
			anchorY: 'middle',
			fillOpacity: 0,
			strokeWidth: '2.5%',
			strokeColor: color('#ffffff'),
		},
	},
});

export const TextShadow = makeStoryObject(TextContainer, {
	canvasOptions: { camera: { position: [0, 0, 200] } },
	argsOptions: {
		options: {
			color: color('#EC2D2D'),
			fontSize: 12,
			maxWidth: 200,
			lineHeight: 1,
			letterSpacing: 0.02,
			textAlign: 'left',
			font: 'https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff',
			anchorX: 'center',
			anchorY: 'middle',
			outlineOffsetX: '10%',
			outlineOffsetY: '10%',
			outlineBlur: '30%',
			outlineOpacity: 0.3,
			outlineColor: color('#EC2D2D'),
		},
	},
});

export const CustomMaterial = makeStoryObject(TextCustomMaterialContainer, {
	canvasOptions: { camera: { position: [0, 0, 200] } },
	argsOptions: {
		color: color('#EC2D2D'),
		opacity: number(1, { range: true, min: 0, max: 1, step: 0.01 }),
	},
});
