(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const select = byId('city-select'), status = byId('app-status');
  const payloads = new Map();
  let catalog = [], selected = null, busy = false;
  const map = WorldAtlasCityMap.create({
    viewport: byId('city-map-viewport'), container: byId('city-fabric-layer'),
    generatorKey: window.CityGeneratorVersion,
    loadCity: async (place, {signal}) => {
      if (payloads.has(place.sourceId)) return payloads.get(place.sourceId);
      const response = await fetch(`city-maps/${encodeURIComponent(place.sourceId)}.json`, {signal});
      if (!response.ok) throw new Error('无法读取城市数据');
      const payload = await response.json();
      payloads.set(place.sourceId, payload);
      return payload;
    }
  });
  // Public handle for inspecting the current map in browser developer tools.
  window.cityMap = map;
  function setBusy(value) {
    busy = value;
    for (const id of ['city-select', 'regenerate', 'export-json', 'export-svg', 'import-city']) byId(id).disabled = value;
    byId('city-map-section').setAttribute('aria-busy', String(value));
  }
  function describe(recipe) {
    const population = recipe.population.estimate.toLocaleString('zh-CN');
    byId('city-name').textContent = recipe.name;
    byId('city-description').textContent = selected.label;
    byId('population').textContent = population;
    const stats = map.stats();
    byId('building-count').textContent = stats.buildings.toLocaleString('zh-CN');
    byId('character').textContent = stats.character;
    byId('seed').textContent = stats.seed;
    document.title = `${recipe.name} · 城市生成器`;
  }
  async function openCity(place, regenerate = false) {
    if (busy) return;
    selected = place;
    status.textContent = '';
    setBusy(true);
    try {
      const recipe = await map.open(place, {regenerate});
      if (!recipe) throw new Error(byId('city-map-status').textContent || '城市生成失败');
      describe(recipe);
      const url = new URL(location.href);
      if (place.imported) url.searchParams.delete('city');
      else url.searchParams.set('city', place.id);
      history.replaceState(null, '', url);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setBusy(false);
      byId('export-json').disabled = byId('export-svg').disabled = !map.recipe;
    }
  }
  function download(content, filename, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  select.addEventListener('change', () => openCity(catalog.find(city => city.id === select.value)));
  byId('regenerate').addEventListener('click', () => openCity(selected, true));
  byId('export-json').addEventListener('click', () => {
    const payload = structuredClone(payloads.get(selected.sourceId));
    payload.recipe.seed = map.stats().seed;
    download(JSON.stringify(payload, null, 2), `${selected.sourceId}.json`, 'application/json');
  });
  byId('export-svg').addEventListener('click', () => {
    const node = byId('city-map-canvas'), copy = node.cloneNode(true), box = node.getBoundingClientRect();
    copy.setAttribute('width', box.width); copy.setAttribute('height', box.height);
    copy.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = 'svg{background:#ccd4a6;font-family:"Microsoft YaHei","PingFang SC",sans-serif}.city-field-rows{display:none}.city-close-detail .city-field-rows{display:inline}.city-farmland{stroke-opacity:.2}.city-close-detail .city-farmland{stroke-opacity:.56}';
    copy.prepend(style);
    download(new XMLSerializer().serializeToString(copy), `${selected.sourceId}-${map.stats().seed}.svg`, 'image/svg+xml');
  });
  byId('import-city').addEventListener('change', async event => {
    const input = event.target, file = input.files[0];
    if (!file || busy) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload.schema !== 'world-atlas-city-map-v1' || !payload.recipe?.id || !payload.recipe?.urban
          || !payload.recipe?.population || !payload.siteContext?.elevationMetres || !payload.grid) {
        throw new Error('请选择包含 recipe、siteContext 和 grid 的城市 JSON。');
      }
      const place = {id: payload.recipe.id, sourceId: payload.recipe.id, name: payload.recipe.name || file.name, label: '导入的城市', imported: true};
      payloads.set(place.sourceId, payload);
      catalog = catalog.filter(city => city.id !== place.id);
      catalog.push(place);
      refreshOptions(); select.value = place.id;
      await openCity(place);
    } catch (error) {
      status.textContent = `导入失败：${error.message}`;
    } finally { input.value = ''; }
  });
  function refreshOptions() {
    select.replaceChildren(...catalog.map(city => {
      const option = document.createElement('option');
      option.value = city.id; option.textContent = `${city.name} · ${city.label}`;
      return option;
    }));
  }
  async function start() {
    try {
      const response = await fetch('city-maps/catalog.json');
      if (!response.ok) throw new Error('无法读取示例目录');
      catalog = await response.json();
      refreshOptions();
      const requested = new URLSearchParams(location.search).get('city');
      const first = catalog.find(city => city.id === requested) || catalog[0];
      if (!first) throw new Error('示例目录为空');
      select.value = first.id;
      await openCity(first);
    } catch (error) {
      status.textContent = `${error.message}。请通过本地 HTTP 服务打开本页。`;
    }
  }
  start();
})();
