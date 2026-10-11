const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scope = {window: {}};
global.window = scope.window;
for (const filename of ['city-character.js', 'city-site.js', 'city-detail.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, 'assets', filename), 'utf8'), {filename});
}
const geometry = plan => JSON.stringify({
  streets: plan.streets.map(street => street.points),
  buildings: plan.buildings,
  blocks: plan.blocks,
  walls: plan.walls,
});
const fixtures = fs.readdirSync(path.join(root, 'city-maps')).filter(filename => filename.endsWith('.json') && filename !== 'catalog.json');
assert.ok(fixtures.length >= 3, 'the standalone product ships representative saved cities');

for (const filename of fixtures) {
  test('saved city generates reproducibly: ' + filename, () => {
    const payload = JSON.parse(fs.readFileSync(path.join(root, 'city-maps', filename), 'utf8'));
    const source = structuredClone(payload.recipe);
    const generated = scope.window.WorldAtlasCitySite.generate(source, payload.siteContext, {seed: source.seed});
    const plan = scope.window.WorldAtlasCities.plan(generated, {grid: payload.grid});
    assert.ok(plan.streets.length > 0, 'saved geography produces an actual street network');
    assert.ok(plan.buildings.length > 0, 'saved geography produces habitable buildings');
    const repeatedSource = structuredClone(payload.recipe);
    const repeated = scope.window.WorldAtlasCitySite.generate(repeatedSource, payload.siteContext, {seed: repeatedSource.seed});
    assert.equal(geometry(scope.window.WorldAtlasCities.plan(repeated, {grid: payload.grid})), geometry(plan));
    const nextSeed = (payload.recipe.seed + 1) >>> 0;
    const changed = scope.window.WorldAtlasCitySite.generate({...structuredClone(payload.recipe), seed: nextSeed}, payload.siteContext, {seed: nextSeed});
    assert.notEqual(geometry(scope.window.WorldAtlasCities.plan(changed, {grid: payload.grid})), geometry(plan), 'regeneration changes real geometry');
    const street = plan.streets.find(item => item.name && !item.palacePerimeter && !item.palaceAccess);
    assert.ok(street, 'a named street is available for inspection');
    const renamed = scope.window.WorldAtlasCities.plan({...generated, localNames: {...generated.localNames, [street.id]: '自定义街名'}}, {grid: payload.grid});
    assert.equal(geometry(renamed), geometry(plan), 'renaming preserves physical layout');
    assert.ok(renamed.streets.some(item => item.id === street.id && item.name === '自定义街名'));
  });
}
