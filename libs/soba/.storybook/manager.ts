import { addons } from '@storybook/manager-api';
import theme from './theme';

addons.setConfig({ theme });

// NOTE: this is to keep the addons width at 300 by default
const storybookLayout = JSON.parse(localStorage['storybook-layout'] || '{}');
const newLayout = { resizerNav: { x: 300, y: 0 } };
localStorage['storybook-layout'] = JSON.stringify({ ...storybookLayout, ...newLayout });
