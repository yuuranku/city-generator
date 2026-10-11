import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entries = {
  'city-character': 'city-character-entry.js',
  'city-site': 'city-site-entry.js',
  'city-detail': 'city-detail.js',
  'city-map': 'city-map.js',
  'map-interaction': 'map-interaction.js',
};
const digest = createHash('sha256');
for (const filename of [...Object.values(entries).map(name => 'src/' + name), 'data/city-naming.json', 'package-lock.json']) {
  digest.update(filename);
  digest.update((await readFile(resolve(root, filename), 'utf8')).replace(/\r\n/g, '\n'));
}
await mkdir(resolve(root, 'assets'), {recursive: true});
await build({
  entryPoints: Object.fromEntries(Object.entries(entries).map(([name, filename]) => [name, resolve(root, 'src', filename)])),
  outdir: resolve(root, 'assets'),
  bundle: true,
  format: 'iife',
  target: 'es2022',
  legalComments: 'eof',
  logLevel: 'info',
});
// Vendor license blocks can contain whitespace-only lines. Normalize only
// that final comment, preserving all generated program and string content.
for (const name of Object.keys(entries)) {
  const filename = resolve(root, 'assets', name + '.js');
  const output = await readFile(filename, 'utf8');
  const licenses = output.lastIndexOf('/*! Bundled license information:');
  if (licenses >= 0) await writeFile(filename, output.slice(0, licenses) + output.slice(licenses).replace(/[ \t]+$/gm, ''));
}
await writeFile(resolve(root, 'assets/generator-version.js'), `window.CityGeneratorVersion=${JSON.stringify(digest.digest('hex'))};\n`);
