/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	return {
		publicDir: 'src/public',

		build: {
			target: ['es2020'],
		},
		plugins: [
			analog({
				ssr: false,
			}),
			tsConfigPaths({
				root: '../../',
			}),
			splitVendorChunkPlugin(),
		],
	};
});
