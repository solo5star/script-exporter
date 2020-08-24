/**
 * Asyncify main context
 */
(async () => {

const express = require('express');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const exec = util.promisify(require('child_process').exec);
const spawn = require('child_process').spawn;
const path = require('path');



/**
 * Environment Variables
 */
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 9109;
const SCRIPTS_DIRECTORY = process.env.SCRIPTS_DIRECTORY || './scripts';
const COLLECT_INTERVAL = process.env.COLLECT_INTERVAL || 5000;
const REQUIRE_PACKAGES = process.env.REQUIRE_PACKAGES;



/**
 * Kill handler
 */
function handleShutdown(){
	console.log();
	console.log('Caught interrupt signal');

	process.exit();
}
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);



/**
 * Install REQUIRE_PACKAGES
 */
if(REQUIRE_PACKAGES){
	const apt = spawn('apt', ['install', '-y', REQUIRE_PACKAGES]);

	apt.stdout.on('data', data => console.log(data.toString()));
	apt.stderr.on('data', data => console.error(data.toString()));
	apt.on('exit', code => console.log(`apt installation done with exit code ${code.toString()}`));
}



/**
 * Express bootstrap
 */
const app = express();

const rootPage = `
<h1>Script Exporter Metrics</h1>
<a href="/metrics">Metrics</a>
`;

var scripts = [];
var metrics = '';



/**
 * Scanning scripts
 */
async function scanScripts(){
	files = (await readdir(SCRIPTS_DIRECTORY))
		.filter(filename => filename.endsWith('.sh'));
	
	scripts = files.map(name => ({
		name: name,
		filename: path.join(SCRIPTS_DIRECTORY, name)
	}));

	await Promise.all(scripts.map(async script => {
		script.script = await readFile(script.filename, 'utf8');
	}));
}

console.log('------------------------------');
console.log(`SCRIPTS_DIRECTORY=${SCRIPTS_DIRECTORY}`);
console.log(`COLLECT_INTERVAL=${COLLECT_INTERVAL}`);
console.log('------------------------------');

await scanScripts();

console.log(`Scripts found: ${scripts.length}`);
scripts.forEach(({ name, script }) => console.log(`  * ${name}`));
console.log('------------------------------');



/**
 * Express setup
 */
app.get('/', (req, res) => {
	res.send(rootPage);
})

app.get('/metrics', (req, res) => {
	res.set('Content-Type', 'text/plain');
	res.send(metrics);
});

app.listen(PORT, HOST, () => {
	console.log(`Script Exporter is listening at http://${HOST}:${PORT}`);
});



/**
 * Initialize metrics collector
 */
async function collect(){
	metrics = (await Promise.all(scripts.map(evaluateScript))).join("\n");
	// metrics = (await exec('./scripts/smartmon.sh')).stdout;
}

async function evaluateScript({ name, filename, script }){
	try{
		return (await exec('/bin/sh -c ' + script)).stdout;
	}catch(e){
		console.error(`Error occured while tried to execute script "${name}"`);
		console.error(`Script location: ${filename}`);
		console.error(e.message || e);
	}
	return '';
}

setTimeout(collect, 0);
setInterval(collect, COLLECT_INTERVAL);

})();