/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, splitVendorChunkPlugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	return {
		root: __dirname,
		cacheDir: `../../node_modules/.vite`,
		build: {
			outDir: '../../dist/apps/docs/client',
			reportCompressedSize: true,
			target: ['es2020'],
		},
		server: {
			fs: {
				allow: ['.'],
			},
		},
		plugins: [
			analog({
				ssr: false,
				vite: {
					experimental: {
						supportAnalogFormat: true,
					},
				},
			}),
			nxViteTsPaths({
				debug: true,
			}),
			splitVendorChunkPlugin(),
		],
	};
});
