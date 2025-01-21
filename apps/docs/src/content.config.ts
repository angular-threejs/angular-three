import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';
import { blogSchema } from 'starlight-blog/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			// @ts-expect-error
			extend: (context) => blogSchema(context),
		}),
	}),
	snippets: defineCollection({
		loader: glob({ pattern: '**/*.md', base: './src/content/snippets' }),
		schema: z.object({}),
	}),
};
