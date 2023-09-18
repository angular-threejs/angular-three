import devkit from '@nx/devkit';
const { readJsonFile, writeJsonFile } = devkit;

const packageGroup = ['soba', 'postprocessing', 'cannon'];
const distPath = 'dist/libs/core';

const packageJson = readJsonFile(`${distPath}/package.json`);

for (const packageName of packageGroup) {
	packageJson['nx-migrations'].packageGroup[`angular-three-${packageName}`] = packageJson['version'];
	packageJson['ng-update'].packageGroup[`angular-three-${packageName}`] = packageJson['version'];
}

writeJsonFile(`${distPath}/package.json`, packageJson);
