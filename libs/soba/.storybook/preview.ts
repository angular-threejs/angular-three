import { Preview } from '@storybook/angular';
// @ts-expect-error - we can import mdx
import DocumentationTemplate from './documentation-template.mdx';

export default {
	parameters: {
		deepControls: { enabled: true },
		docs: {
			page: DocumentationTemplate,
		},
	},
	tags: ['autodocs'],
} as Preview;
