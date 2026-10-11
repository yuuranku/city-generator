# 独立拆分记录

拆分日期：2026-10-11。

源项目为 `yuuranku/world-atlas-engine`，采用当前城市功能开发工作区中的代码，而非较早发布包。该工作区的基础提交为 `e406d5d`，城市代码还包含其后的本地修改。

保留可编辑的城市来源文件，使用 `city-site-entry.js` 和 `city-character-entry.js` 重新构建浏览器脚本。附带原有文化命名 JSON、局部地图生成算法、城市几何、渲染器与手势交互。

独立项目的调整：

- 命名数据引用改为本仓库的 `data/city-naming.json`。
- 城市地图通过显式 `loadCity` 回调读取输入，移除世界页面元数据与编辑器通信依赖。
- 布局缓存使用独立 IndexedDB 数据库 `city-generator-layouts`；源码和依赖指纹用于缓存版本判断。
- 新增独立 HTML、样式、示例选择、JSON 导入保存及当前视野 SVG 导出。
- 六份城市输入从原有世界的 `review/city-maps/` 原样复制，未附带整个世界的地形、栅格或网页输出。
- 保留来源项目中有意义的城市几何测试，并增加示例城市复现测试。

核心 JavaScript API 名称 `WorldAtlasCityCharacter`、`WorldAtlasCitySite`、`WorldAtlasCities` 与 `WorldAtlasCityMap` 沿用源码中的名称。所有实现均在本仓库，无需安装或访问原世界引擎。

浏览器地图创建示例：

```js
const map = WorldAtlasCityMap.create({
  viewport: document.getElementById('city-map-viewport'),
  container: document.getElementById('city-fabric-layer'),
  generatorKey: window.CityGeneratorVersion,
  loadCity: async (place, {signal}) => {
    const response = await fetch(`city-maps/${place.sourceId}.json`, {signal});
    if (!response.ok) throw new Error('无法读取城市输入');
    return response.json();
  },
});
await map.open({id: 'settlement-0018', sourceId: 'settlement-0018', name: '云原'});
```

`city-map.js` 依赖独立入口中提供的地图 DOM 和控制按钮。更底层的 `WorldAtlasCitySite.generate(recipe, siteContext, {seed})` 与 `WorldAtlasCities.plan(generated, {grid})` 可直接生成城市及几何计划，不依赖地图页面。
