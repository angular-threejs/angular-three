import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'io.ionic.starter',
	appName: 'ionic-app',
	webDir: '../../dist/apps/ionic-app',
	bundledWebRuntime: false,
	server: {
		androidScheme: 'https',
	},
};

export default config;
