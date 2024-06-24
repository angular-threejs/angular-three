import { REVISION } from 'three';

export function getVersion() {
	return parseInt(REVISION.replace(/\D+/g, ''));
}
