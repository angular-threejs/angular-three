/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(() => {
	return {
		publicDir: 'src/public',
		build: {
			outDir: '../../dist/apps/examples/client',
			reportCompressedSize: true,
			commonjsOptions: { transformMixedEsModules: true },
			target: ['es2020'],
		},
		plugins: [analog({ ssr: false }), tsConfigPaths({ root: '../../' }), splitVendorChunkPlugin()],
	};
});
