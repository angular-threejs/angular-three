import { kebabToPascal } from './utils';

describe('renderer/utils', () => {
	test(kebabToPascal.name, () => {
		expect(kebabToPascal('ngt-mesh')).toEqual('NgtMesh');
		expect(kebabToPascal('ngt-mesh-standard-material')).toEqual('NgtMeshStandardMaterial');
		expect(kebabToPascal('ngt-object-3D')).toEqual('NgtObject3D');
		expect(kebabToPascal('ngt-lOD')).toEqual('NgtLOD');
	});
});
