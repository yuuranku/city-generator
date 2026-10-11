(() => {
  // src/city-map.js
  (() => {
    "use strict";
    const SVG_NS = "http://www.w3.org/2000/svg";
    const svg = (name, attributes = {}) => {
      const node = document.createElementNS(SVG_NS, name);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
      return node;
    };
    const path = (points, origin = { column: 0, row: 0 }) => points.map((p, i) => `${i ? "L" : "M"}${(p.column - origin.column).toFixed(9)} ${(p.row - origin.row).toFixed(9)}`).join(" ");
    let layoutDatabase;
    async function storedLayout(key, value) {
      if (!layoutDatabase) layoutDatabase = new Promise((resolve, reject) => {
        const opening = indexedDB.open("city-generator-layouts", 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore("layouts");
        opening.onsuccess = () => resolve(opening.result);
        opening.onerror = () => reject(opening.error);
      });
      const database = await layoutDatabase;
      return new Promise((resolve, reject) => {
        const transaction = database.transaction("layouts", value === void 0 ? "readonly" : "readwrite"), store = transaction.objectStore("layouts");
        const operation = value === void 0 ? store.get(key) : store.put(value, key);
        let result;
        operation.onsuccess = () => {
          result = operation.result;
        };
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
      });
    }
    function create({ viewport, container, loadCity, generatorKey }) {
      if (typeof loadCity !== "function" || typeof generatorKey !== "string" || !generatorKey)
        throw new TypeError("City viewer requires a city loader and generator identity");
      const cameraNode = document.getElementById("city-map-camera"), status = document.getElementById("city-map-status");
      const reliefKey = document.createElement("div");
      reliefKey.className = "city-relief-key";
      reliefKey.setAttribute("aria-label", "\u6D77\u62D4\u4E0E\u7B49\u9AD8\u7EBF");
      viewport.append(reliefKey);
      const locationMarker = svg("g", { class: "city-location-marker", "pointer-events": "none", role: "img" });
      locationMarker.style.display = "none";
      locationMarker.append(
        svg("circle", { r: 12, fill: "#2475d8", "fill-opacity": 0.16 }),
        svg("circle", { r: 6, fill: "#2475d8", stroke: "#fff", "stroke-width": 2 })
      );
      cameraNode.parentNode.append(locationMarker);
      let locatedFeature = null;
      let selected = null, recipe = null, lastLayout = null, controller = null, request = 0, generatedCount = 0, seed = null, loading = false;
      const worldKey = new URL(".", document.baseURI).href;
      const localPath = (points) => path(points, recipe.location);
      const sitePath = (d) => d.replace(/([ML])\s*([-+\d.e]+)[\s,]+([-+\d.e]+)/gi, (_all, command, x, y) => command + (Number(x) - recipe.location.column).toFixed(9) + " " + (Number(y) - recipe.location.row).toFixed(9));
      let scale = 1, translateX = 0, translateY = 0, width = 0, height = 0, fitScale = 1, extent = "city";
      let minimumScale = 1, maximumScale = 1800;
      const notify = (message) => {
        status.textContent = message;
      };
      function updateCamera() {
        if (recipe && width && height) {
          const bounds = recipe.localSite.bounds, metric2 = recipe.urban.gridCellKilometres;
          minimumScale = Math.max(width / ((bounds.east - bounds.west) * metric2.column), height / ((bounds.south - bounds.north) * metric2.row)) * 1.015;
          maximumScale = Math.max(minimumScale, 1800);
          scale = Math.max(minimumScale, Math.min(maximumScale, scale));
          translateX = Math.max(
            width - (bounds.east - recipe.location.column) * metric2.column * scale,
            Math.min(-(bounds.west - recipe.location.column) * metric2.column * scale, translateX)
          );
          translateY = Math.max(
            height - (bounds.south - recipe.location.row) * metric2.row * scale,
            Math.min(-(bounds.north - recipe.location.row) * metric2.row * scale, translateY)
          );
          document.getElementById("city-map-zoom-in").disabled = scale >= maximumScale * 0.999;
          document.getElementById("city-map-zoom-out").disabled = scale <= minimumScale * 1.001;
        }
        cameraNode.setAttribute("transform", `translate(${translateX} ${translateY}) scale(${scale})`);
        if (!recipe) return;
        const metric = recipe.urban.gridCellKilometres;
        if (locatedFeature) {
          const x = translateX + (locatedFeature.anchor.column - recipe.location.column) * metric.column * scale, y = translateY + (locatedFeature.anchor.row - recipe.location.row) * metric.row * scale;
          locationMarker.setAttribute("transform", `translate(${x} ${y})`);
          locationMarker.style.display = x >= 0 && x <= width && y >= 0 && y <= height ? "" : "none";
        }
        const terrainDetail = Math.max(0, Math.min(1, (recipe.localSite.radiusKm * 2 * scale / (recipe.localSite.surface.rows - 1) - 3) / 8));
        const naturalDetail = scale >= 120;
        for (const node of container.querySelectorAll(".city-tree-shadows,.city-tree-canopies,.city-tree-highlights,.city-local-rocks"))
          node.style.display = naturalDetail ? "" : "none";
        const roofDetail = Math.max(0, Math.min(1, (scale * 8e-3 - 2) / 4));
        for (const node of container.querySelectorAll(".city-roof-faces,.city-country-roof-faces,.city-country-doorways"))
          node.style.opacity = roofDetail;
        for (const node of container.querySelectorAll(".city-building-shadows")) node.style.opacity = 0.2 * roofDetail;
        for (const node of container.querySelectorAll(".city-roof-ridges")) node.style.opacity = 0.48 * roofDetail;
        for (const node of container.querySelectorAll(".city-harbor-fine-detail")) node.style.opacity = Math.max(0, Math.min(1, (scale * 6e-3 - 1.5) / 4));
        for (const line of container.querySelectorAll(".city-local-contours path")) line.setAttribute(
          "stroke-opacity",
          line.dataset.major === "true" ? 0.18 + terrainDetail * 0.13 : 0.035 + terrainDetail * 0.115
        );
        for (const road of container.querySelectorAll(".city-external-roads path")) road.setAttribute(
          "stroke-width",
          Math.max(Number(road.dataset.width), Number(road.dataset.minimumPixels) / (scale * (metric.row + metric.column) / 2))
        );
        const diameter = recipe.urban.radiusKm * 2 * scale, occupied = [], names = /* @__PURE__ */ new Set();
        const labels = Array.from(container.querySelectorAll("[data-city-screen-label]")).sort((a, b) => Number(Boolean(locatedFeature) && b.dataset.featureId === locatedFeature.id) - Number(Boolean(locatedFeature) && a.dataset.featureId === locatedFeature.id) || Number(a.dataset.priority) + (diameter > 640 && a.dataset.featureKind === "square" ? 4 : 0) - (Number(b.dataset.priority) + (diameter > 640 && b.dataset.featureKind === "square" ? 4 : 0)));
        for (const node of labels) {
          const road = node.dataset.featureKind === "road", natural = ["terrain", "forest", "river", "elevation"].includes(node.dataset.featureKind), font = node.dataset.featureKind === "elevation" ? 9 : road ? 10.5 : 11.5, angle = road ? Number(node.dataset.angle) : 0;
          const row = Number(node.dataset.anchorRow), column = Number(node.dataset.anchorColumn);
          const x = translateX + (column - recipe.location.column) * metric.column * scale, y = translateY + (row - recipe.location.row) * metric.row * scale;
          node.setAttribute("font-size", font / (scale * metric.row));
          node.setAttribute("stroke-width", 3 / (scale * metric.row));
          node.setAttribute("transform", `translate(${column - recipe.location.column} ${row - recipe.location.row}) scale(${metric.row / metric.column} 1) rotate(${angle})`);
          node.setAttribute("font-weight", road ? "400" : "500");
          const textWidth = Array.from(node.textContent).reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 1 : 0.58), 0) * font + 12;
          const radians = angle * Math.PI / 180, w = Math.abs(Math.cos(radians)) * textWidth + Math.abs(Math.sin(radians)) * font + 8, h = Math.abs(Math.sin(radians)) * textWidth + Math.abs(Math.cos(radians)) * font + 8;
          const box = { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 };
          const focused = Boolean(locatedFeature) && node.dataset.featureId === locatedFeature.id;
          const visible = (focused || natural || diameter >= [100, 250, 610][Number(node.dataset.detailLevel)]) && (node.dataset.featureKind !== "elevation" || terrainDetail > 0.6 && scale >= 80) && (focused || !road || Number(node.dataset.lengthKm) * scale > textWidth * 1.18) && x > 30 && x < width - 30 && y > 20 && y < height - 20 && !names.has(node.textContent) && !occupied.some((b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
          node.style.display = visible ? "" : "none";
          if (visible) {
            occupied.push(box);
            names.add(node.textContent);
          }
        }
        container.classList.toggle("city-close-detail", diameter > 520);
        reliefKey.textContent = `\u6D77\u62D4 ${recipe.localSite.elevationRange.minimum}\u2013${recipe.localSite.elevationRange.maximum} m \xB7 \u7B49\u9AD8\u8DDD ${recipe.localSite.elevationRange.interval} m`;
        const maximum = 100 / scale, power = 10 ** Math.floor(Math.log10(maximum));
        const km = [1, 2, 5].map((v) => v * power).filter((v) => v <= maximum).pop() || power / 2;
        document.getElementById("city-scale-label").textContent = km < 1 ? `${Math.round(km * 1e3)} m` : `${Number(km.toFixed(2))} km`;
        document.getElementById("city-scale-rule").style.width = `${km * scale}px`;
      }
      function reset() {
        width = viewport.clientWidth;
        height = viewport.clientHeight;
        if (!recipe || !width || !height) return;
        const radius = extent === "region" ? recipe.localSite.radiusKm * 0.94 : recipe.urban.radiusKm * 1.45;
        fitScale = extent === "region" ? Math.max(width, height) / (recipe.localSite.radiusKm * 2) * 1.04 : Math.min(width, height) / (radius * 2) * 0.91;
        scale = fitScale;
        translateX = width / 2;
        translateY = height / 2;
        updateCamera();
      }
      function setExtent(value) {
        if (!["city", "region"].includes(value)) throw new TypeError("Invalid city extent");
        extent = value;
        for (const key of ["city", "region"]) document.getElementById("city-map-" + key).setAttribute("aria-pressed", String(key === extent));
        reset();
      }
      function zoomAt(factor, x, y) {
        if (!recipe) return;
        const box = viewport.getBoundingClientRect(), px = x - box.left, py = y - box.top;
        const next = Math.max(minimumScale, Math.min(maximumScale, scale * factor));
        translateX = px - (px - translateX) * next / scale;
        translateY = py - (py - translateY) * next / scale;
        scale = next;
        updateCamera();
      }
      function zoomBy(factor) {
        const box = viewport.getBoundingClientRect();
        zoomAt(factor, box.left + box.width / 2, box.top + box.height / 2);
      }
      function locateFeature(localId) {
        if (!recipe || !lastLayout || loading) return false;
        const id = String(localId), metric = recipe.urban.gridCellKilometres, annotation = lastLayout.cityPlan.annotations.find((item) => String(item.id) === id), streets = lastLayout.cityPlan.streets.filter((item) => item.kind !== "rail" && String(item.id) === id);
        let anchor = annotation?.anchor, bounds = null, name = annotation?.name || "";
        if (streets.length) {
          const runs = streets.map((street) => ({ street, lengths: street.points.slice(1).map((b, i) => {
            const a = street.points[i];
            return Math.hypot((b.column - a.column) * metric.column, (b.row - a.row) * metric.row);
          }) })).map((run2) => ({ ...run2, length: run2.lengths.reduce((sum, value) => sum + value, 0) })).sort((a, b) => b.length - a.length), run = runs[0];
          let remaining = run.length / 2;
          anchor = run.street.points[0];
          name = run.street.name || name;
          for (let i = 0; i < run.lengths.length; i++) {
            const length = run.lengths[i];
            if (remaining > length) {
              remaining -= length;
              continue;
            }
            const a = run.street.points[i], b = run.street.points[i + 1], t = length ? remaining / length : 0;
            anchor = { column: a.column + (b.column - a.column) * t, row: a.row + (b.row - a.row) * t };
            break;
          }
          bounds = {
            columns: Math.max(...run.street.points.map((p) => p.column)) - Math.min(...run.street.points.map((p) => p.column)),
            rows: Math.max(...run.street.points.map((p) => p.row)) - Math.min(...run.street.points.map((p) => p.row))
          };
        }
        if (!anchor || !Number.isFinite(anchor.row) || !Number.isFinite(anchor.column)) return false;
        width = viewport.clientWidth;
        height = viewport.clientHeight;
        if (!width || !height) return false;
        locatedFeature = { id, anchor: { ...anchor } };
        locationMarker.dataset.featureId = id;
        locationMarker.setAttribute("aria-label", name || "\u6240\u9009\u5730\u70B9");
        scale = bounds ? Math.max(120, 0.7 * Math.min(width / Math.max(0.15, bounds.columns * metric.column), height / Math.max(0.15, bounds.rows * metric.row))) : Math.min(width, height) / 0.45;
        scale = Math.max(minimumScale, Math.min(maximumScale, scale));
        translateX = width / 2 - (anchor.column - recipe.location.column) * metric.column * scale;
        translateY = height / 2 - (anchor.row - recipe.location.row) * metric.row * scale;
        updateCamera();
        notify("");
        return true;
      }
      function clear() {
        request++;
        controller?.abort();
        controller = null;
        selected = null;
        recipe = null;
        loading = false;
        locatedFeature = null;
        locationMarker.style.display = "none";
        container.replaceChildren();
        notify("");
      }
      function joinHarborRoadLayers(city, harbor) {
        const ground = harbor.querySelector(".city-harbor-ground");
        if (!ground) return;
        const edges = city.querySelector(".city-street-edges"), surfaces = city.querySelector(".city-streets-major");
        edges.append(...ground.querySelector(".city-harbor-road-edges").children);
        surfaces.append(...ground.querySelector(".city-harbor-road-surfaces").children);
        const land = city.querySelector(".city-land-geometry");
        land.insertBefore(ground, land.querySelector(".city-defensive-ditches"));
      }
      function drawSite(site) {
        const group = svg("g", { class: "city-local-site", "data-water-source": site.waterSource.kind });
        const bands = svg("g", { class: "city-local-terrain" });
        for (const band of site.terrainBands) bands.append(svg("path", { d: sitePath(band.d), fill: band.fill }));
        group.append(bands);
        const shade = svg("g", { class: "city-local-hillshade" });
        const definitions = svg("defs"), filter = svg("filter", { id: "city-terrain-soften", x: "-10%", y: "-10%", width: "120%", height: "120%" });
        const metric = recipe.urban.gridCellKilometres;
        const soften = site.radiusKm * 2 / (site.surface.rows - 1) * 0.45;
        filter.append(svg("feGaussianBlur", { stdDeviation: `${soften / metric.column} ${soften / metric.row}` }));
        definitions.append(filter);
        group.append(definitions);
        shade.setAttribute("filter", "url(#city-terrain-soften)");
        for (const patch of site.hillshade || []) shade.append(svg("path", { d: sitePath(patch.d), fill: patch.fill, opacity: patch.opacity }));
        if (site.waterArea) group.append(svg("path", { d: sitePath(site.waterArea), fill: "#91d5e9", class: "city-coastal-water" }));
        const contours = svg("g", { class: "city-local-contours", fill: "none", stroke: "#85927d", "stroke-linecap": "round" });
        for (const line of site.contours) contours.append(svg("path", {
          d: sitePath(line.d),
          "data-height-m": line.elevation,
          "data-major": line.major,
          "stroke-width": line.major ? 0.7 : 0.45,
          "vector-effect": "non-scaling-stroke"
        }));
        const water = svg("g", { class: "city-local-water" });
        const dryClip = svg("clipPath", { id: "city-river-dry-ground", clipPathUnits: "userSpaceOnUse" });
        dryClip.append(svg("path", { d: sitePath(site.dryArea) }));
        definitions.append(dryClip);
        water.setAttribute("clip-path", "url(#city-river-dry-ground)");
        const ribbon = (channel, factor, margin = 0) => {
          const banks = [[], []];
          for (let i = 0; i < channel.points.length; i++) {
            const p = channel.points[i], a = channel.points[Math.max(0, i - 1)], z = channel.points[Math.min(channel.points.length - 1, i + 1)], dx = (z.column - a.column) * metric.column, dy = (z.row - a.row) * metric.row, len = Math.hypot(dx, dy) || 1, half = p.widthMetres / 2e3 * factor + margin;
            for (const [bank, sign] of [[0, -1], [1, 1]]) banks[bank].push({ column: p.column - dy / len * half * sign / metric.column, row: p.row + dx / len * half * sign / metric.row });
          }
          return localPath(banks[0].concat(banks[1].reverse())) + "Z";
        };
        const b = site.bounds, woodMask = svg("mask", {
          id: "city-woodland-clearance",
          maskUnits: "userSpaceOnUse",
          x: b.west - recipe.location.column,
          y: b.north - recipe.location.row,
          width: b.east - b.west,
          height: b.south - b.north,
          "mask-type": "luminance"
        });
        woodMask.append(svg("path", { d: sitePath(site.dryArea), fill: "#fff" }));
        woodMask.append(svg("path", { d: [
          ...site.farmland.map((field2) => localPath(field2.points) + "Z"),
          ...site.lakes.flatMap((lake) => lake.patches.map((points) => localPath(points) + "Z")),
          ...site.channels.map((channel) => ribbon(channel, 1, 0.02))
        ].join(" "), fill: "#000" }));
        woodMask.append(svg("ellipse", {
          cx: 0,
          cy: 0,
          rx: recipe.urban.radiusKm * 1.12 / metric.column,
          ry: recipe.urban.radiusKm * 1.12 / metric.row,
          fill: "#000"
        }));
        const roadClearance = svg("g", {
          transform: `scale(${1 / metric.column} ${1 / metric.row})`,
          fill: "none",
          stroke: "#000",
          "stroke-width": 0.14,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        });
        roadClearance.append(svg("path", { d: [...recipe.transport.corridors, ...site.ruralRoads].filter((road) => road.kind === "road").map((road) => path(road.points.map((p) => ({ column: (p.column - recipe.location.column) * metric.column, row: (p.row - recipe.location.row) * metric.row })))).join(" ") }));
        woodMask.append(roadClearance);
        definitions.append(woodMask);
        const woods = svg("g", { class: "city-local-woodland", mask: "url(#city-woodland-clearance)" });
        woods.append(svg("path", { d: (site.woodland || []).map((points) => localPath(points) + "Z").join(" "), fill: "#c5e1ad", opacity: 0.78 }));
        const crowns = (site.trees || []).map((tree, index) => {
          const rx = tree.radiusMetres / 1e3 / metric.column, ry = tree.radiusMetres / 1e3 / metric.row, p = tree.point;
          return Array.from({ length: 12 }, (_, i) => {
            const angle = i * Math.PI / 6, radius = 0.8 + 0.12 * Math.sin(i * 2.7 + index * 1.9);
            return { column: p.column + Math.cos(angle) * rx * radius, row: p.row + Math.sin(angle) * ry * radius };
          });
        });
        woods.append(svg("path", {
          d: crowns.map((points) => localPath(points) + "Z").join(" "),
          class: "city-tree-shadows",
          fill: "#536e54",
          opacity: 0.18,
          transform: `translate(${2e-3 / metric.column} ${3e-3 / metric.row})`
        }));
        for (const [index, fill] of ["#98b683", "#adc795", "#8fad84"].entries()) woods.append(svg("path", {
          d: crowns.filter((_, i) => i % 3 === index).map((points) => localPath(points) + "Z").join(" "),
          class: "city-tree-canopies",
          fill,
          stroke: "#668568",
          "stroke-width": 45e-5 / ((metric.row + metric.column) / 2),
          opacity: 0.86,
          "data-tree-count": crowns.filter((_, i) => i % 3 === index).length
        }));
        woods.append(svg("path", {
          d: crowns.map((points) => localPath(points.slice(6, 11))).join(" "),
          class: "city-tree-highlights",
          fill: "none",
          stroke: "#c3cea5",
          "stroke-width": 8e-4 / ((metric.row + metric.column) / 2),
          opacity: 0.5,
          "stroke-linecap": "round"
        }));
        const rockPath = (site.rocks || []).map((p) => localPath([
          { column: p.column - 0.015 / metric.column, row: p.row },
          { column: p.column, row: p.row - 0.01 / metric.row },
          { column: p.column + 0.018 / metric.column, row: p.row + 7e-3 / metric.row }
        ])).join(" ");
        woods.append(svg("path", { d: rockPath, class: "city-local-rocks", fill: "none", stroke: "#9b9b87", "stroke-width": 0.6, "vector-effect": "non-scaling-stroke" }));
        group.append(woods, shade, contours);
        if (site.channels.length) {
          const riverWater = site.channels.map((channel) => ribbon(channel, 1)).join(" "), widths = site.channels.flatMap((channel) => channel.points.map((p) => p.widthMetres)), bankOutline = svg("mask", {
            id: "city-river-outer-banks",
            maskUnits: "userSpaceOnUse",
            x: b.west - recipe.location.column,
            y: b.north - recipe.location.row,
            width: b.east - b.west,
            height: b.south - b.north,
            "mask-type": "luminance"
          });
          bankOutline.append(svg("path", { d: sitePath(site.dryArea), fill: "#fff" }));
          bankOutline.append(svg("path", { d: riverWater, fill: "#000", "fill-rule": "nonzero" }));
          definitions.append(bankOutline);
          water.append(svg("path", {
            d: site.channels.map((channel) => ribbon(channel, 1.65)).join(" "),
            fill: "#b1cfae",
            opacity: 0.46,
            class: "city-riverbank",
            "fill-rule": "nonzero"
          }));
          water.append(svg("path", {
            d: riverWater,
            fill: "#91d5e9",
            class: "city-supply-river",
            "fill-rule": "nonzero",
            "data-min-width-m": Math.min(...widths),
            "data-max-width-m": Math.max(...widths)
          }));
          water.append(svg("path", {
            d: riverWater,
            fill: "none",
            stroke: "#78bdcf",
            "stroke-width": 0.9,
            "vector-effect": "non-scaling-stroke",
            mask: "url(#city-river-outer-banks)",
            class: "city-river-outline"
          }));
        }
        const source = site.waterSource;
        if (source.kind === "groundwater") water.append(svg("circle", { cx: source.location.column - recipe.location.column, cy: source.location.row - recipe.location.row, r: 0.028 / metric.row, fill: "#9dbcc2", stroke: "#536d75", "stroke-width": 1, "vector-effect": "non-scaling-stroke", class: "city-water-well" }));
        group.append(water);
        const lakes = svg("g", { class: "city-local-lakes", "data-lake-count": site.lakes.length });
        for (const lake of site.lakes) lakes.append(svg("path", {
          d: lake.patches.map((p) => localPath(p) + "Z").join(" "),
          fill: "#91d5e9",
          "data-water-level-m": lake.waterLevelMetres,
          "data-area-km2": lake.areaKm2
        }));
        group.append(lakes);
        const roadWidth = recipe.urban.streetWidthsMetres.arterial / 1e3 / ((metric.row + metric.column) / 2);
        const roads = svg("g", {
          class: "city-external-roads",
          fill: "none",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "clip-path": "url(#city-river-dry-ground)"
        }), segments = [];
        const field = site.surface, bounds = field.bounds;
        const nearLine = (p, points) => {
          let best = Infinity;
          for (let i = 1; i < points.length; i++) {
            const a = points[i - 1], b2 = points[i], dx = (b2.column - a.column) * metric.column, dy = (b2.row - a.row) * metric.row, px = (p.column - a.column) * metric.column, py = (p.row - a.row) * metric.row, t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
            best = Math.min(best, Math.hypot(px - dx * t, py - dy * t));
          }
          return best;
        };
        const allowed = (point, corridor) => {
          const u = (point.column - bounds.west) / (bounds.east - bounds.west), v = (point.row - bounds.north) / (bounds.south - bounds.north);
          if (u < 0 || u > 1 || v < 0 || v > 1) return false;
          return WorldAtlasCitySite.isDry(field, point) && !site.channels.some((channel) => {
            const near = window.WorldAtlasCitySite.distanceToChannel(point, channel, metric);
            return near.distance < near.widthMetres / 2e3 + 4e-3;
          }) || site.bridges.some((bridge) => nearLine(point, bridge.points) < 0.02);
        };
        for (const corridor of [...recipe.transport.corridors, ...site.ruralRoads].filter((c) => c.kind === "road")) {
          let run = [];
          const flush = () => {
            if (run.length > 1) segments.push(localPath(run));
            run = [];
          };
          for (let i = 1; i < corridor.points.length; i++) {
            const a = corridor.points[i - 1], b2 = corridor.points[i];
            const count = Math.max(1, Math.ceil(Math.hypot((b2.column - a.column) * metric.column, (b2.row - a.row) * metric.row) / 0.06));
            for (let j = 0; j <= count; j++) {
              const t = j / count, point = { row: a.row + (b2.row - a.row) * t, column: a.column + (b2.column - a.column) * t };
              if (allowed(point, corridor)) run.push(point);
              else flush();
            }
          }
          flush();
        }
        roads.append(svg("path", {
          d: segments.join(" "),
          stroke: "#a9b5bf",
          "stroke-width": roadWidth * 1.35,
          "data-width": roadWidth * 1.35,
          "data-minimum-pixels": 2.3
        }));
        roads.append(svg("path", {
          d: segments.join(" "),
          stroke: "#faf9f3",
          "stroke-width": roadWidth,
          "data-width": roadWidth,
          "data-minimum-pixels": 1.35
        }));
        group.append(roads);
        const bridges = svg("g", { class: "city-local-bridges", "data-bridge-count": site.bridges.length });
        for (const bridge of site.bridges) {
          const [a, b2] = bridge.points, dx = (b2.column - a.column) * metric.column, dy = (b2.row - a.row) * metric.row, length = Math.hypot(dx, dy);
          bridges.append(svg("path", { d: localPath(bridge.points), fill: "none", stroke: "#8b8d7f", "stroke-width": roadWidth * 1.65 }));
          bridges.append(svg("path", { d: localPath(bridge.points), fill: "none", stroke: "#fff9ea", "stroke-width": roadWidth * 1.15 }));
          for (const sign of [-1, 1]) {
            const offset = bridge.widthMetres / 2e3 * sign;
            bridges.append(svg("path", {
              d: localPath(bridge.points.map((p) => ({ row: p.row + dx / length * offset / metric.row, column: p.column - dy / length * offset / metric.column }))),
              fill: "none",
              stroke: "#727e77",
              "stroke-width": 0.65,
              "vector-effect": "non-scaling-stroke"
            }));
          }
        }
        group.append(bridges);
        return group;
      }
      function drawHarbor(harbor, cityPlan) {
        const path2 = localPath;
        if (!harbor) return svg("g");
        const m = recipe.urban.gridCellKilometres, n = harbor.outward, t = { x: -n.y, y: n.x }, s = harbor.shore, extent2 = harbor.berthLayout.span * harbor.berthLayout.scale, capacity = harbor.berthLayout.capacity, at = (x, y) => ({ column: s.column + (t.x * x + n.x * y) / m.column, row: s.row + (t.y * x + n.y * y) / m.row }), distance = (a, b2) => Math.hypot((a.column - b2.column) * m.column, (a.row - b2.row) * m.row), mix = (a, b2, u) => ({ column: a.column + (b2.column - a.column) * u, row: a.row + (b2.row - a.row) * u });
        const group = svg("g", { class: "city-harbor", "data-harbor-kind": harbor.kind, "stroke-linejoin": "round", "stroke-linecap": "round" }), ground = svg("g", { class: "city-harbor-ground" }), structures = svg("g", { class: "city-harbor-structures" }), detail = svg("g", { class: "city-harbor-fine-detail" }), labels = svg("g"), roadEdges = svg("g", { class: "city-harbor-road-edges", "stroke-linejoin": "round", "stroke-linecap": "round" }), roadSurfaces = svg("g", { class: "city-harbor-road-surfaces", "stroke-linejoin": "round", "stroke-linecap": "round" });
        group.append(ground, structures, detail, labels);
        ground.append(roadEdges, roadSurfaces);
        const field = recipe.localSite.surface, b = field.bounds;
        const inside = (p) => p.column >= b.west && p.column <= b.east && p.row >= b.north && p.row <= b.south;
        const inChannel = (p) => recipe.localSite.channels.some((channel) => {
          const q = WorldAtlasCitySite.distanceToChannel(p, channel, m);
          return q.distance < q.widthMetres / 2e3;
        });
        const dry = (p) => inside(p) && WorldAtlasCitySite.isDry(field, p) && !inChannel(p), wet = (p) => inside(p) && (!WorldAtlasCitySite.isDry(field, p) || inChannel(p));
        const random = (salt) => {
          let x = (recipe.seed ^ Math.imul(salt, 2654435769)) >>> 0;
          x = Math.imul(x ^ x >>> 16, 569420461);
          return ((x ^ x >>> 15) >>> 0) / 4294967296;
        };
        const small = recipe.population.estimate < 1800, modern = ["industrial", "contemporary"].includes(recipe.era), quayWidth = small ? 6e-3 : modern ? 0.018 : 0.012, promenadeWidth = small ? 25e-4 : 4e-3, accessWidth = cityPlan.streetWidths.arterial * cityPlan.gridCellKilometres, berths = [], fronts = [], quays = [];
        const bounds = (points) => ({
          west: Math.min(...points.map((p) => p.column)),
          east: Math.max(...points.map((p) => p.column)),
          north: Math.min(...points.map((p) => p.row)),
          south: Math.max(...points.map((p) => p.row))
        });
        const intersects = (a, z, p, q) => {
          const x = z.column - a.column, y = z.row - a.row, sx = q.column - p.column, sy = q.row - p.row, den = x * sy - y * sx;
          if (Math.abs(den) < 1e-16) return false;
          const u = ((p.column - a.column) * sy - (p.row - a.row) * sx) / den, v = ((p.column - a.column) * y - (p.row - a.row) * x) / den;
          return u >= 0 && u <= 1 && v >= 0 && v <= 1;
        };
        const within = (p, poly) => {
          let result = false;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const a = poly[i], z = poly[j];
            if (a.row > p.row !== z.row > p.row && p.column < (z.column - a.column) * (p.row - a.row) / (z.row - a.row) + a.column) result = !result;
          }
          return result;
        };
        const overlap = (a, z) => a.some((p) => within(p, z)) || z.some((p) => within(p, a)) || a.some((p, i) => z.some((q, j) => intersects(p, a[(i + 1) % a.length], q, z[(j + 1) % z.length])));
        const band = (a, z, half) => {
          const length = distance(a, z);
          if (length < 1e-8) return [];
          const x = -(z.row - a.row) * m.row / length * half, y = (z.column - a.column) * m.column / length * half;
          return [[a, 1], [z, 1], [z, -1], [a, -1]].map(([p, sign]) => ({ column: p.column + x * sign / m.column, row: p.row + y * sign / m.row }));
        };
        const portBounds = bounds([at(-extent2 - 0.18, -0.65), at(extent2 + 0.18, -0.65), at(extent2 + 0.18, 0.65), at(-extent2 - 0.18, 0.65)]), touches = (a, z) => a.west <= z.east && a.east >= z.west && a.north <= z.south && a.south >= z.north;
        const obstacles = [];
        const reserve = (points, road = false, landing = false) => {
          if (points.length < 3) return;
          const box = bounds(points);
          if (touches(box, portBounds)) obstacles.push({ points, box, road, landing });
        };
        for (const item of [...cityPlan.buildings, ...cityPlan.landmarks, ...cityPlan.countryside, ...cityPlan.towers, ...cityPlan.plazas]) reserve(item.points);
        for (const gate of cityPlan.gates) for (const points of gate.towers) reserve(points);
        if (cityPlan.fortress) reserve(cityPlan.fortress.clearancePoints);
        for (const [a, z] of [...cityPlan.walls, ...cityPlan.innerWalls]) reserve(band(a, z, cityPlan.streetWidths.collector * cityPlan.gridCellKilometres * 1.6 + 1e-3));
        for (const street of cityPlan.streets) {
          const half = cityPlan.streetWidths[street.kind] * cityPlan.gridCellKilometres * 0.5 + 15e-4;
          if (!Number.isFinite(half)) continue;
          for (let i = 1; i < street.points.length; i++) reserve(band(street.points[i - 1], street.points[i], half), true);
        }
        const blocked = (points, roads = true, allowLanding = false) => {
          const box = bounds(points);
          return obstacles.some((o) => (roads || !o.road) && (!allowLanding || !o.landing) && touches(box, o.box) && overlap(points, o.points));
        };
        const safeArea = (points, test) => {
          if (!points.every(test)) return false;
          const center = points.reduce((p, z) => ({ column: p.column + z.column / points.length, row: p.row + z.row / points.length }), { column: 0, row: 0 });
          if (!test(center)) return false;
          return points.every((a, i) => {
            const z = points[(i + 1) % points.length], steps = Math.max(2, Math.ceil(distance(a, z) / 6e-3));
            for (let k = 1; k < steps; k++) if (!test(mix(a, z, k / steps))) return false;
            return true;
          });
        };
        const safeLink = (a, z) => safeArea(band(a, z, 16e-4), dry) && !blocked(band(a, z, 16e-4), false, true);
        const line = (parent, points, color, width2, extra = {}) => parent.append(svg("path", { d: path2(points), fill: "none", stroke: color, "stroke-width": width2 / ((m.row + m.column) / 2), ...extra }));
        const bank = (x) => {
          let low = -0.25 * harbor.berthLayout.scale, high = harbor.kind === "river" ? harbor.channelWidthMetres / 2e3 : 0.4 * harbor.berthLayout.scale;
          if (!dry(at(x, low)) || !wet(at(x, high))) return null;
          for (let i = 0; i < 22; i++) {
            const middle = (low + high) / 2;
            if (dry(at(x, middle))) low = middle;
            else high = middle;
          }
          return (low + high) / 2;
        };
        const count = Math.max(16, Math.min(80, Math.ceil(extent2 * 2 / 0.018)));
        for (let i = 0; i <= count; i++) {
          const x = (i / count * 2 - 1) * extent2, y = bank(x);
          fronts.push(y === null ? null : { x, y });
        }
        let run = [];
        const flush = () => {
          if (run.length > 1) {
            const land = run.map((p) => at(p.x, p.y - quayWidth)), edge = run.map((p) => at(p.x, p.y - 12e-4)), points = land.concat(edge.slice().reverse()), promenade = run.map((p) => at(p.x, p.y - quayWidth * 0.62));
            ground.append(svg("path", { d: path2(points) + "Z", class: "city-harbor-quay", fill: small ? "#b9aa8d" : "#ddd8c5" }));
            line(structures, edge, small ? "#8a795f" : "#8f9485", 12e-4, { class: "city-harbor-coping" });
            line(detail, land, "#f2eadd", 55e-5);
            line(ground, promenade, "#f1eddf", promenadeWidth);
            quays.push({ front: run.slice(), promenade });
          }
          run = [];
        };
        for (const front of fronts) {
          if (!front) {
            flush();
            continue;
          }
          const previous = run.at(-1);
          if (previous) {
            const poly = [at(previous.x, previous.y - quayWidth), at(front.x, front.y - quayWidth), at(front.x, front.y - 12e-4), at(previous.x, previous.y - 12e-4)];
            if (!safeArea(poly, dry) || blocked(poly, false)) {
              flush();
              run.push(front);
              continue;
            }
          }
          run.push(front);
        }
        flush();
        const onQuay = (x) => quays.some((quay) => x >= quay.front[0].x && x <= quay.front.at(-1).x);
        const palette = WorldAtlasCityCharacter.profile(recipe).roof;
        for (let i = 0; i < capacity; i++) {
          const base = capacity === 1 ? 0 : (i / (capacity - 1) * 2 - 1) * extent2 * 0.79 + (random(i + 301) - 0.5) * extent2 / capacity * 0.35;
          let chosen = null;
          for (const offset of [0, -0.012, 0.012, -0.025, 0.025]) {
            const x2 = base + offset, y2 = bank(x2);
            if (y2 === null || !onQuay(x2)) continue;
            const length2 = harbor.kind === "river" ? Math.min(small ? 0.035 : 0.08, harbor.channelWidthMetres / 1e3 * 0.25) : small ? 0.025 + random(i + 303) * 0.035 : modern ? 0.08 + random(i + 303) * 0.15 : 0.045 + random(i + 303) * 0.09, half2 = small ? 22e-4 + random(i + 309) * 12e-4 : modern ? 7e-3 + random(i + 309) * 5e-3 : 33e-4 + random(i + 309) * 22e-4, pier2 = [at(x2 - half2, y2 - quayWidth * 0.75), at(x2 + half2, y2 - quayWidth * 0.75), at(x2 + half2, y2 + length2), at(x2 - half2, y2 + length2)], water = [at(x2 - half2, y2 + 15e-4), at(x2 + half2, y2 + 15e-4), at(x2 + half2, y2 + length2), at(x2 - half2, y2 + length2)];
            if (length2 < 0.012 || !safeArea(water, wet) || blocked(pier2, false) || berths.some((berth) => overlap(pier2, berth.pier))) continue;
            chosen = { x: x2, y: y2, length: length2, half: half2, pier: pier2 };
            break;
          }
          if (!chosen) continue;
          berths.push(chosen);
          const { x, y, length, half, pier } = chosen;
          reserve(pier, false, true);
          const dock = svg("g", { class: "city-harbor-dock" });
          structures.append(dock);
          dock.append(svg("path", {
            d: path2(pier) + "Z",
            class: "city-harbor-pier",
            fill: ["#b9a17c", "#c2ac87", "#ae9470"][i % 3],
            stroke: "#807563",
            "stroke-width": 65e-5 / ((m.row + m.column) / 2),
            "data-width-metres": half * 2e3,
            "data-length-metres": length * 1e3
          }));
          line(dock, [at(x - half, y - 2e-3), at(x - half, y + length)], "#dbc9a5", 65e-5);
          line(dock, [at(x + half, y - 2e-3), at(x + half, y + length)], "#8d785b", 8e-4);
          const plankCount = Math.ceil((length + quayWidth * 0.75) / 16e-4), planks = [];
          for (let k = 1; k < plankCount; k++) planks.push(path2([at(x - half * 0.9, y - quayWidth * 0.75 + (length + quayWidth * 0.75) * k / plankCount), at(x + half * 0.9, y - quayWidth * 0.75 + (length + quayWidth * 0.75) * k / plankCount)]));
          detail.append(svg("path", { d: planks.join(" "), class: "city-pier-planks", fill: "none", stroke: "#ece0c4", "stroke-opacity": 0.65, "stroke-width": 22e-5 / ((m.row + m.column) / 2) }));
          for (let k = 1; k <= Math.floor(length / 0.012); k++) for (const side of [-1, 1]) {
            const p = at(x + side * half, y + k * 0.012);
            detail.append(svg("circle", { cx: p.column - recipe.location.column, cy: p.row - recipe.location.row, r: 6e-4 / m.row, fill: "#716451", class: "city-pier-bollard" }));
          }
          for (const side of [-1, 1]) {
            if (random(i * 19 + side + 340) < 0.32) continue;
            const boatLength = Math.min(length * 0.6, small ? 8e-3 + random(i * 17 + side + 341) * 9e-3 : modern ? 0.022 + random(i * 17 + side + 341) * 0.038 : 0.014 + random(i * 17 + side + 341) * 0.023), boatWidth = boatLength * (0.18 + random(i * 13 + side + 342) * 0.055), bx = x + side * (half + boatWidth * 0.6 + 12e-4), by = y + length * (0.45 + random(i * 23 + side + 343) * 0.25), heading = (random(i * 11 + side + 344) - 0.5) * 0.13, cos = Math.cos(heading), sin = Math.sin(heading), boatAt = (u, v) => at(bx + u * cos - v * sin, by + u * sin + v * cos), outline = [[0, -0.5], [0.3, -0.43], [0.48, -0.24], [0.5, 0.1], [0.43, 0.4], [0.22, 0.48], [-0.22, 0.48], [-0.43, 0.4], [-0.5, 0.1], [-0.48, -0.24], [-0.3, -0.43]].map(([u, v]) => boatAt(u * boatWidth, v * boatLength));
            if (!safeArea(outline, wet) || blocked(outline, false) || berths.some((berth) => overlap(outline, berth.pier))) continue;
            const ship = svg("g", { class: "city-moored-craft" });
            structures.append(ship);
            ship.append(svg("path", {
              d: path2(outline) + "Z",
              class: "city-harbor-vessel",
              fill: ["#d7c9aa", "#eee1c4", "#c5b594"][i % 3],
              stroke: "#687369",
              "stroke-width": 55e-5 / ((m.row + m.column) / 2),
              "data-length-metres": boatLength * 1e3,
              "data-width-metres": boatWidth * 1e3
            }));
            const deck = outline.map((p) => mix({ column: at(bx, by).column, row: at(bx, by).row }, p, 0.78));
            ship.append(svg("path", { d: path2(deck) + "Z", fill: "#ae9571", "fill-opacity": 0.4 }));
            for (const v of [-0.2, 0.16]) {
              const hatch = [[-0.26, v - 0.07], [0.26, v - 0.07], [0.26, v + 0.07], [-0.26, v + 0.07]].map(([u, z2]) => boatAt(u * boatWidth, z2 * boatLength));
              detail.append(svg("path", { d: path2(hatch) + "Z", fill: "#88795f", class: "city-ship-hatch" }));
            }
            line(detail, [boatAt(0, -boatLength * 0.28), boatAt(0, boatLength * 0.31)], "#eee5ce", 5e-4);
            for (const v of [-0.25, 0.25]) line(detail, [boatAt(-side * boatWidth * 0.44, v * boatLength), at(x + side * half, by + v * boatLength)], "#6d766b", 22e-5, { class: "city-mooring-line" });
            reserve(outline);
          }
          const width2 = small ? 0.01 + random(i + 329) * 6e-3 : 0.016 + random(i + 329) * 0.013, depth = small ? 9e-3 + random(i + 330) * 6e-3 : 0.014 + random(i + 330) * 0.012, a = bank(x - 0.012), z = bank(x + 0.012), slope = a !== null && z !== null ? (z - a) / 0.024 : 0, tangent = { x: 1 / Math.hypot(1, slope), y: slope / Math.hypot(1, slope) }, apron = at(x, y - quayWidth * 0.62);
          let store = null;
          storeSearch: for (const along of [0, -0.025, 0.025, -0.05, 0.05]) for (const gap of [7e-3, 0.015, 0.028, 0.045, 0.065]) {
            const setback = quayWidth + depth * 0.5 + gap, center = { x: x + tangent.x * along + tangent.y * setback, y: y + tangent.y * along - tangent.x * setback }, houseAt = (u, v) => at(center.x + tangent.x * u - tangent.y * v, center.y + tangent.y * u + tangent.x * v), house = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([u, v]) => houseAt(u * width2, v * depth)), heights = house.map((p) => WorldAtlasCitySite.elevationAt(field, p)), door = houseAt(0, depth * 0.5);
            if (safeArea(house, dry) && Math.max(...heights) - Math.min(...heights) < 3.5 && !blocked(house) && safeLink(door, apron)) {
              store = { house, houseAt, door };
              break storeSearch;
            }
          }
          if (store) {
            const { house, houseAt, door } = store;
            const warehouse = svg("g", { class: "city-harbor-storehouse" });
            structures.append(warehouse);
            warehouse.append(svg("path", {
              d: path2(house) + "Z",
              class: "city-harbor-warehouse",
              fill: palette[i % palette.length],
              stroke: "#687062",
              "stroke-width": 45e-5 / ((m.row + m.column) / 2),
              "data-width-metres": width2 * 1e3,
              "data-depth-metres": depth * 1e3
            }));
            const ridge = [houseAt(-width2 * 0.5, 0), houseAt(width2 * 0.5, 0)];
            warehouse.append(svg("path", { d: path2([house[0], house[1], ridge[1], ridge[0]]) + "Z", fill: "#fff4d4", "fill-opacity": 0.14 }));
            warehouse.append(svg("path", { d: path2([ridge[0], ridge[1], house[2], house[3]]) + "Z", fill: "#293f3c", "fill-opacity": 0.18 }));
            line(detail, ridge, "#eee5ce", 35e-5);
            line(ground, [door, apron], "#eee8d8", 28e-4);
            reserve(house);
          }
        }
        if (harbor.access.length) {
          const end = harbor.access.at(-1), start = harbor.access[0], landEnd = distance(end, harbor.landPoint) <= distance(start, harbor.landPoint) ? end : start;
          const targets = quays.flatMap((quay) => quay.promenade.slice(1).map((z, i) => {
            const a = quay.promenade[i], dx = (z.column - a.column) * m.column, dy = (z.row - a.row) * m.row, u = Math.max(0, Math.min(1, ((landEnd.column - a.column) * m.column * dx + (landEnd.row - a.row) * m.row * dy) / (dx * dx + dy * dy || 1)));
            return mix(a, z, u);
          })).sort((a, z) => distance(a, landEnd) - distance(z, landEnd));
          const approach = (target, factor) => {
            const length = distance(landEnd, target);
            if (length < 1e-8) return [];
            const nx = -(target.row - landEnd.row) * m.row / length, ny = (target.column - landEnd.column) * m.column / length;
            return [[landEnd, accessWidth / 2], [target, promenadeWidth / 2], [target, -promenadeWidth / 2], [landEnd, -accessWidth / 2]].map(([p, half]) => ({ column: p.column + nx * half * factor / m.column, row: p.row + ny * half * factor / m.row }));
          };
          for (const target of targets) {
            const edge = approach(target, 1.2), surface = approach(target, 1);
            if (edge.length !== 4 || !safeArea(edge, dry) || blocked(edge, false, true)) continue;
            roadEdges.append(svg("path", { d: path2(edge) + "Z", fill: "#adb6bf", stroke: "none", class: "city-harbor-road-edge" }));
            roadSurfaces.append(svg("path", {
              d: path2(surface) + "Z",
              fill: "#fffdf7",
              stroke: "none",
              class: "city-harbor-road-link",
              "data-start-width-metres": accessWidth * 1e3,
              "data-end-width-metres": promenadeWidth * 1e3
            }));
            break;
          }
        }
        if (harbor.kind === "sea" && !small && harbor.shelter < 0.78 && berths.length > 1) {
          const half = 4e-3, cap = (p) => Array.from({ length: 12 }, (_, i) => ({
            column: p.column + Math.cos(i * Math.PI / 6) * half / m.column,
            row: p.row + Math.sin(i * Math.PI / 6) * half / m.row
          }));
          let wall = null;
          search: for (const side of [1, -1]) for (const gap of [0.025, 0.045, 0.07, 0.1]) {
            const edge = side > 0 ? Math.max(...berths.map((p) => p.x + p.half)) : Math.min(...berths.map((p) => p.x - p.half)), x = edge + side * gap, y = bank(x);
            if (y === null) continue;
            const root = at(x, y - Math.max(8e-3, quayWidth * 0.75)), landing = quays.flatMap((quay) => quay.promenade).find((p) => distance(p, root) < 0.12 && safeLink(root, p));
            if (!landing || !safeArea(cap(root), dry)) continue;
            const depth = Math.max(y + 0.06, ...berths.map((p) => p.y + p.length + 0.03)), candidate = [root, at(x, depth), at(x - side * Math.min(0.14, Math.max(0.055, extent2 * 0.3)), depth)], arms = [band(candidate[0], candidate[1], half), band(candidate[1], candidate[2], half)];
            if (!safeArea(arms[0], inside) || !safeArea(arms[1], wet) || arms.some((points) => blocked(points, false)) || candidate.some((p) => blocked(cap(p), false)) || !safeArea(cap(candidate[1]), wet) || !safeArea(cap(candidate[2]), wet)) continue;
            const start = y - Math.max(8e-3, quayWidth * 0.75), steps = Math.ceil((depth - start) / 2e-3);
            let connected = true;
            crossings: for (const across of [-half, 0, half]) {
              let enteredWater = false;
              for (let k = 0; k <= steps; k++) {
                const p = at(x + across, start + (depth - start) * k / steps);
                if (wet(p)) enteredWater = true;
                else if (enteredWater) {
                  connected = false;
                  break crossings;
                }
              }
              if (!enteredWater) {
                connected = false;
                break;
              }
            }
            if (!connected) continue;
            wall = candidate;
            break search;
          }
          if (wall) {
            line(structures, wall, "#77887e", 7e-3, { class: "city-harbor-breakwater" });
            line(structures, wall, "#d5ccb1", 45e-4);
            const tip = wall.at(-1);
            structures.append(svg("circle", {
              cx: tip.column - recipe.location.column,
              cy: tip.row - recipe.location.row,
              r: 35e-4 / m.row,
              fill: "#ece0bd",
              stroke: "#6e7e70",
              "stroke-width": 5e-4 / ((m.row + m.column) / 2),
              class: "city-harbor-beacon"
            }));
          }
        }
        group.dataset.berthCount = String(berths.length);
        group.dataset.quayRuns = String(quays.length);
        line(roadEdges, harbor.access, "#adb6bf", accessWidth * 1.2, { class: "city-harbor-access-edge" });
        line(roadSurfaces, harbor.access, "#fffdf7", accessWidth, { class: "city-harbor-access-surface" });
        if (harbor.sailing?.length) labels.append(svg("path", {
          d: path2(harbor.sailing),
          fill: "none",
          stroke: "#558e9e",
          "stroke-opacity": 0.6,
          "stroke-width": 0.9,
          "stroke-dasharray": "4 5",
          "vector-effect": "non-scaling-stroke",
          class: "city-harbor-sailing"
        }));
        const label = svg("text", {
          "data-anchor-column": s.column,
          "data-anchor-row": s.row,
          "data-city-screen-label": harbor.name,
          "data-feature-kind": "harbor",
          "data-priority": 0,
          "data-detail-level": 0,
          "data-angle": 0,
          "paint-order": "stroke fill",
          "text-anchor": "middle",
          fill: "#2f6984",
          stroke: "#f5faf6"
        });
        label.textContent = "\u2693 " + harbor.name;
        labels.append(label);
        return group;
      }
      async function open(place, { regenerate = false } = {}) {
        if (!place) {
          clear();
          return null;
        }
        const key = JSON.stringify([worldKey, place.sourceId]), previous = lastLayout?.key === key ? lastLayout : null, reuseCamera = selected?.sourceId === place.sourceId && recipe && width && height;
        request++;
        controller?.abort();
        controller = new AbortController();
        const current = request, signal = controller.signal;
        selected = place;
        recipe = null;
        locatedFeature = null;
        locationMarker.style.display = "none";
        container.replaceChildren();
        loading = true;
        notify(`\u6B63\u5728\u8F7D\u5165${place.name}\u2026`);
        try {
          const payload = await loadCity(place, { signal });
          if (current !== request) return null;
          if (payload?.schema !== "world-atlas-city-map-v1" || payload.recipe?.id !== place.sourceId)
            throw new Error("\u57CE\u5E02\u6570\u636E\u683C\u5F0F\u6216\u6807\u8BC6\u4E0D\u6B63\u786E");
          const generator = generatorKey;
          const source = JSON.stringify(payload), stored = previous || await storedLayout(key);
          if (current !== request) return null;
          let layout = !regenerate && stored?.source === source && stored.generator === generator ? stored : null;
          if (!layout) {
            notify(`\u6B63\u5728\u751F\u6210${place.name}\u2026`);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            if (current !== request) return null;
            let nextSeed = stored?.source === source ? stored.seed : payload.recipe.seed;
            if (regenerate) {
              const value = crypto.getRandomValues(new Uint32Array(1))[0];
              nextSeed = value === stored?.seed ? value + 1 >>> 0 : value;
            }
            const generated = WorldAtlasCitySite.generate({ ...structuredClone(payload.recipe), seed: nextSeed }, payload.siteContext, { seed: nextSeed });
            layout = { source, generator, seed: nextSeed, recipe: generated, cityPlan: WorldAtlasCities.plan(generated, { grid: payload.grid }) };
            generatedCount++;
            await storedLayout(key, layout);
            if (current !== request) return null;
          }
          recipe = layout.recipe;
          seed = layout.seed;
          let nodes = layout.nodes;
          if (!nodes) {
            const city = WorldAtlasCities.render(recipe, { grid: payload.grid, clipPrefix: "city-panel", cityPlan: layout.cityPlan, origin: recipe.location });
            city.dataset.seed = String(seed);
            city.dataset.population = String(recipe.population.estimate);
            city.dataset.nativeRow = String(recipe.location.row);
            city.dataset.nativeColumn = String(recipe.location.column);
            const harbor = drawHarbor(recipe.harbor, layout.cityPlan);
            joinHarborRoadLayers(city, harbor);
            nodes = [drawSite(recipe.localSite), city, harbor];
          }
          const metric = recipe.urban.gridCellKilometres;
          container.setAttribute("transform", `scale(${metric.column} ${metric.row})`);
          container.replaceChildren(...nodes);
          lastLayout = { ...layout, key, payload, nodes };
          loading = false;
          notify("");
          if (!reuseCamera) setExtent("city");
          else updateCamera();
          return recipe;
        } catch (error) {
          if (signal.aborted || current !== request) return null;
          loading = false;
          recipe = null;
          notify(error.message + "\uFF0C\u70B9\u51FB\u201C\u91CD\u65B0\u751F\u6210\u201D\u91CD\u8BD5\u3002");
          return null;
        }
      }
      const interaction = WorldAtlasInteraction.attach({
        viewport,
        getCamera: () => ({ scale, translateX, translateY, minimumScale, maximumScale }),
        setCamera: (next) => {
          scale = next.scale;
          translateX = next.translateX;
          translateY = next.translateY;
          updateCamera();
        },
        zoomAt,
        zoomBy,
        reset,
        onTap: () => {
        },
        onCommit: () => updateCamera()
      });
      const listeners = [];
      for (const [id, action] of [["zoom-in", () => zoomBy(1.6)], ["zoom-out", () => zoomBy(1 / 1.6)], ["reset", reset], ["city", () => setExtent("city")], ["region", () => setExtent("region")]]) {
        const node = document.getElementById("city-map-" + id);
        node.addEventListener("click", action);
        listeners.push(() => node.removeEventListener("click", action));
      }
      const observer = new ResizeObserver(() => {
        if (!recipe) return;
        const nextWidth = viewport.clientWidth, nextHeight = viewport.clientHeight;
        if (!nextWidth || !nextHeight) return;
        if (!width || !height) reset();
        else {
          translateX += (nextWidth - width) / 2;
          translateY += (nextHeight - height) / 2;
          width = nextWidth;
          height = nextHeight;
          updateCamera();
        }
      });
      observer.observe(viewport);
      return {
        open,
        regenerate: (place) => open(place || selected, { regenerate: true }),
        locateFeature,
        clear,
        zoomBy,
        reset,
        setExtent,
        refreshLabels: updateCamera,
        get recipe() {
          return recipe;
        },
        stats: () => ({
          selected: selected?.id || null,
          recipeId: recipe?.id || null,
          seed,
          generatedCount,
          loading,
          active: recipe ? 1 : 0,
          anchor: recipe ? { ...recipe.location } : null,
          population: recipe?.population || null,
          locatedFeature: locatedFeature ? { id: locatedFeature.id, anchor: { ...locatedFeature.anchor } } : null,
          buildings: Array.from(container.querySelectorAll("[data-building-count]"), (node) => Number(node.dataset.buildingCount)).reduce((a, b) => a + b, 0),
          innerCity: container.querySelectorAll(".city-block-old-town,.city-block-civic").length,
          innerWalls: Array.from(container.querySelectorAll(".city-inner-walls")).filter((node) => node.getAttribute("d")).length,
          gates: Number(container.querySelector("[data-gate-count]")?.dataset.gateCount || 0),
          bridges: recipe?.localSite.bridges.length || 0,
          barbicans: Number(container.querySelector("[data-barbican-count]")?.dataset.barbicanCount || 0),
          moats: Number(container.querySelector("[data-moat-count]")?.dataset.moatCount || 0),
          riverMode: recipe?.localSite.riverMode,
          harbor: recipe?.harbor || null,
          character: recipe ? WorldAtlasCityCharacter.profile(recipe).label : null,
          labels: container.querySelectorAll("[data-city-screen-label]").length,
          visibleLabels: Array.from(container.querySelectorAll("[data-city-screen-label]")).filter((node) => node.style.display !== "none").map((node) => node.textContent),
          outerCity: container.querySelectorAll(".city-blocks .city-block").length,
          farmland: Array.from(container.querySelectorAll("[data-farmland-count]"), (node) => Number(node.dataset.farmlandCount)).reduce((a, b) => a + b, 0),
          waterSource: recipe?.localSite.waterSource || null,
          camera: { scale, translateX, translateY, width, height, extent, minimumScale, maximumScale }
        }),
        destroy() {
          clear();
          lastLayout = null;
          locationMarker.remove();
          reliefKey.remove();
          interaction.destroy();
          observer.disconnect();
          listeners.forEach((remove) => remove());
        }
      };
    }
    window.WorldAtlasCityMap = { create };
  })();
})();
