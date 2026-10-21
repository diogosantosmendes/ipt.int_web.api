const fs = require('node:fs/promises');
const path = require('node:path');

const recordCount = 500;
let state = 20261021;

function random() {
	state = (state * 48271) % 2147483647;
	return (state - 1) / 2147483646;
}

function round(value, decimals) {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

async function generateCharges() {
	const start = Date.UTC(2025, 0, 1);
	const end = Date.UTC(2026, 9, 21, 23, 59, 59);
	const powerLevelsKw = [7.4, 11, 22];
	const charges = Array.from({ length: recordCount }, () => {
		const duration = 25 + Math.floor(random() * 156);
		const chargingPowerKw = powerLevelsKw[Math.floor(random() * powerLevelsKw.length)];
		const kWh = round((duration / 60) * chargingPowerKw, 2);
		const timestamp = new Date(start + Math.floor(random() * (end - start))).toISOString();

		return { timestamp, duration, kWh };
	});

	const outputPath = path.join(__dirname, 'charge.json');
	await fs.writeFile(outputPath, `${JSON.stringify(charges, null, 2)}\n`);
	console.log(`Generated ${charges.length} charge records at ${outputPath}`);
}

generateCharges().catch((error) => {
	console.error('Failed to generate charge records:', error);
	process.exitCode = 1;
});
