/**
 * Angular Three Compatibility Matrix Generator
 *
 * Generates a compatibility matrix JSON file that can be fetched by documentation sites
 * to render compatibility tables.
 *
 * Output: dist/libs/plugin/compat-matrix.json (also copied to tools/ for git versioning)
 *
 * Two tables are generated:
 * 1. Combined matrix - angular-three core with three.js, angular, ngxtension versions
 * 2. Per-package matrix - each package with its specific peer dependencies
 *
 * Workflow:
 * - First run: Creates initial entries based on current dist/* package.json
 * - Subsequent runs: Diffs current vs existing, adds new entries for breaking changes
 *
 * Breaking change detection:
 * - If new minimum version > old minimum version → breaking change
 * - Old entry gets upper bound added, new entry created
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
	// Versioned config file (git tracked)
	matrixPath: resolve(__dirname, '../compat-matrix.config.json'),
	// Output for CDN access
	outputPath: 'dist/libs/plugin/compat-matrix.json',

	// Package definitions
	packages: [
		{ name: 'angular-three', distPath: 'dist/libs/core/package.json', displayName: 'Core', isCore: true },
		{ name: 'angular-three-soba', distPath: 'dist/libs/soba/package.json', displayName: 'Soba' },
		{ name: 'angular-three-cannon', distPath: 'dist/libs/cannon/package.json', displayName: 'Cannon' },
		{ name: 'angular-three-rapier', distPath: 'dist/libs/rapier/package.json', displayName: 'Rapier' },
		{
			name: 'angular-three-postprocessing',
			distPath: 'dist/libs/postprocessing/package.json',
			displayName: 'Postprocessing',
		},
		{ name: 'angular-three-theatre', distPath: 'dist/libs/theatre/package.json', displayName: 'Theatre' },
		{ name: 'angular-three-tweakpane', distPath: 'dist/libs/tweakpane/package.json', displayName: 'Tweakpane' },
	],

	// Peer deps shown in combined matrix (from core package)
	combinedPeerDeps: {
		angular: '@angular/core',
		three: 'three',
		ngxtension: 'ngxtension',
	},

	// Common peer deps to exclude from per-package display
	commonPeerDeps: ['@angular/common', '@angular/core', 'three'],
};

// ============================================================================
// Semver Helpers
// ============================================================================

/**
 * Extract the minimum version from a semver range
 * @param {string} range - Semver range like ">=0.174.0" or ">=0.174.0 <0.183.0"
 * @returns {string|null} - Minimum version or null if invalid
 */
function getMinVersion(range) {
	if (!range) return null;
	const min = semver.minVersion(range);
	return min ? min.version : null;
}

/**
 * Check if a peer dep change is breaking (new min > old min)
 * @param {string} oldRange - Previous version range
 * @param {string} newRange - New version range
 * @returns {boolean}
 */
function isBreakingChange(oldRange, newRange) {
	const oldMin = getMinVersion(oldRange);
	const newMin = getMinVersion(newRange);

	if (!oldMin || !newMin) return false;

	return semver.gt(newMin, oldMin);
}

/**
 * Add upper bound to a range based on breaking version
 * @param {string} oldRange - Original range like ">=0.174.0"
 * @param {string} breakingMin - The breaking minimum version like "0.183.0"
 * @returns {string} - Updated range like ">=0.174.0 <0.183.0"
 */
function addUpperBound(oldRange, breakingMin) {
	const oldMin = getMinVersion(oldRange);
	if (!oldMin) return oldRange;

	// If already has upper bound, keep it
	if (oldRange.includes('<')) return oldRange;

	return `>=${oldMin} <${breakingMin}`;
}

// ============================================================================
// File Helpers
// ============================================================================

/**
 * Read and parse a JSON file
 */
function readJson(filePath) {
	const absolutePath = filePath.startsWith('/') ? filePath : resolve(__dirname, '../../', filePath);
	if (!existsSync(absolutePath)) {
		return null;
	}
	return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

/**
 * Write JSON file with pretty formatting
 */
function writeJson(filePath, data) {
	const absolutePath = filePath.startsWith('/') ? filePath : resolve(__dirname, '../../', filePath);
	const dir = dirname(absolutePath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(absolutePath, JSON.stringify(data, null, '\t') + '\n');
}

// ============================================================================
// Matrix Generation
// ============================================================================

/**
 * Extract peer deps from package.json, excluding common ones
 */
function extractPeerDeps(packageJson, excludeCommon = true) {
	if (!packageJson?.peerDependencies) return {};

	const peerDeps = { ...packageJson.peerDependencies };

	if (excludeCommon) {
		for (const dep of CONFIG.commonPeerDeps) {
			delete peerDeps[dep];
		}
	}

	return peerDeps;
}

/**
 * Process combined matrix - handles breaking changes for core deps
 */
function processCombinedMatrix(existingMatrix, corePackage) {
	const combined = existingMatrix?.combined || [];
	const currentVersion = corePackage.version;
	const currentPeerDeps = corePackage.peerDependencies || {};

	// Build current entry
	const currentEntry = {
		angularThree: `>=${currentVersion}`,
		three: currentPeerDeps.three || null,
		angular: currentPeerDeps['@angular/core'] || null,
		ngxtension: currentPeerDeps.ngxtension || null,
	};

	// First run - no existing entries
	if (combined.length === 0) {
		console.log('  First run: Creating initial combined entry');
		return [currentEntry];
	}

	// Get the latest (first) entry
	const latestEntry = combined[0];

	// Check for breaking changes in any core peer dep
	const breakingChanges = [];
	for (const [key, depName] of Object.entries(CONFIG.combinedPeerDeps)) {
		const oldRange = latestEntry[key];
		const newRange = currentPeerDeps[depName];

		if (oldRange && newRange && isBreakingChange(oldRange, newRange)) {
			breakingChanges.push({ key, depName, oldRange, newRange });
		}
	}

	if (breakingChanges.length === 0) {
		// No breaking changes - only update peer dep ranges, keep angularThree version
		console.log('  No breaking changes detected, updating peer dep ranges');
		combined[0] = {
			...latestEntry,
			three: currentPeerDeps.three || latestEntry.three,
			angular: currentPeerDeps['@angular/core'] || latestEntry.angular,
			ngxtension: currentPeerDeps.ngxtension || latestEntry.ngxtension,
		};
		return combined;
	}

	// Breaking changes detected - update old entry and prepend new one
	console.log('  Breaking changes detected:');
	for (const { key, oldRange, newRange } of breakingChanges) {
		const newMin = getMinVersion(newRange);
		console.log(`    ${key}: ${oldRange} → ${newRange} (breaking at ${newMin})`);

		// Add upper bound to old entry
		latestEntry[key] = addUpperBound(oldRange, newMin);
	}

	// Update angularThree range on old entry
	const newMin = getMinVersion(currentEntry.angularThree);
	latestEntry.angularThree = addUpperBound(latestEntry.angularThree, newMin);

	// Prepend new entry
	return [currentEntry, ...combined];
}

/**
 * Process per-package matrix - handles breaking changes for each package's specific deps
 */
function processPackagesMatrix(existingMatrix, distPackages) {
	const packages = existingMatrix?.packages || {};

	for (const pkgConfig of CONFIG.packages) {
		const distPkg = distPackages[pkgConfig.name];
		if (!distPkg) continue;

		const currentVersion = distPkg.version;
		const currentPeerDeps = extractPeerDeps(distPkg, true);

		// Skip if no specific peer deps (only common ones)
		if (Object.keys(currentPeerDeps).length === 0) continue;

		const existingPkg = packages[pkgConfig.name];
		const existingEntries = existingPkg?.entries || [];

		// Build current entry
		const currentEntry = {
			version: `>=${currentVersion}`,
			peerDependencies: currentPeerDeps,
		};

		// First run for this package
		if (existingEntries.length === 0) {
			console.log(`  ${pkgConfig.displayName}: Creating initial entry`);
			packages[pkgConfig.name] = {
				displayName: pkgConfig.displayName,
				entries: [currentEntry],
			};
			continue;
		}

		// Check for breaking changes
		const latestEntry = existingEntries[0];
		const latestPeerDeps = latestEntry.peerDependencies || {};
		let hasBreaking = false;

		for (const [depName, newRange] of Object.entries(currentPeerDeps)) {
			const oldRange = latestPeerDeps[depName];
			if (oldRange && isBreakingChange(oldRange, newRange)) {
				const newMin = getMinVersion(newRange);
				console.log(`  ${pkgConfig.displayName}: ${depName} breaking at ${newMin}`);

				// Update old entry with upper bound
				latestPeerDeps[depName] = addUpperBound(oldRange, newMin);
				hasBreaking = true;
			}
		}

		if (hasBreaking) {
			// Update version range on old entry
			const newMin = getMinVersion(currentEntry.version);
			latestEntry.version = addUpperBound(latestEntry.version, newMin);

			// Prepend new entry
			existingEntries.unshift(currentEntry);
		} else {
			// No breaking changes - only update peer dep ranges, keep version
			existingEntries[0] = {
				...latestEntry,
				peerDependencies: currentPeerDeps,
			};
		}

		packages[pkgConfig.name] = {
			displayName: pkgConfig.displayName,
			entries: existingEntries,
		};
	}

	return packages;
}

// ============================================================================
// Main
// ============================================================================

function main() {
	console.log('Angular Three Compatibility Matrix Generator\n');

	// Read existing matrix (if any)
	const existingMatrix = readJson(CONFIG.matrixPath);
	if (existingMatrix) {
		console.log('Found existing matrix config');
	} else {
		console.log('No existing matrix config, will create new one');
	}

	// Read all dist package.json files
	const distPackages = {};
	let corePackage = null;

	console.log('\nReading dist packages:');
	for (const pkgConfig of CONFIG.packages) {
		const pkg = readJson(pkgConfig.distPath);
		if (pkg) {
			console.log(`  ${pkgConfig.displayName}: v${pkg.version}`);
			distPackages[pkgConfig.name] = pkg;
			if (pkgConfig.isCore) {
				corePackage = pkg;
			}
		} else {
			console.warn(`  ${pkgConfig.displayName}: NOT FOUND (${pkgConfig.distPath})`);
		}
	}

	if (!corePackage) {
		throw new Error('Core package (angular-three) not found in dist. Run build first.');
	}

	// Process matrices
	console.log('\nProcessing combined matrix:');
	const combined = processCombinedMatrix(existingMatrix, corePackage);

	console.log('\nProcessing per-package matrix:');
	const packages = processPackagesMatrix(existingMatrix, distPackages);

	// Build output
	const output = {
		$schema: 'https://angular-threejs.github.io/schemas/compat-matrix.schema.json',
		generated: new Date().toISOString(),
		description: 'Compatibility matrix for angular-three ecosystem packages',
		combined,
		packages,
	};

	// Write to both locations
	writeJson(CONFIG.matrixPath, output);
	writeJson(CONFIG.outputPath, output);

	console.log('\nGenerated files:');
	console.log(`  - ${CONFIG.matrixPath} (git versioned)`);
	console.log(`  - ${CONFIG.outputPath} (CDN access)`);

	console.log('\nSummary:');
	console.log(`  - ${combined.length} combined matrix entries`);
	console.log(`  - ${Object.keys(packages).length} packages with entries`);
}

main();
