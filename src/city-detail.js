/* Pure city planning and detached SVG drawing for World Atlas recipes. */
(function (global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const VALID_ERAS = new Set(["tribal", "ancient", "medieval", "early-modern", "preindustrial", "industrial", "contemporary"]);

  /* Return detached geometry for the selected city on the atlas. */
  function render(recipe, { grid, clipPrefix = "city-detail", cityPlan, origin = {column:0,row:0} } = {}) {
    return cityNode(recipe, normalizeGrid(grid), clipPrefix, cityPlan, origin);
  }

  function cityRequest(recipe, options = {}) {
    validateRecipe(recipe);
    const grid = normalizeGrid(options.grid);
    if (grid) recipe = recipeInLocalLongitude(recipe, grid.width);
    const character = global.WorldAtlasCityCharacter.profile(recipe);
    if (character.settlementRadiusKm) {
      const ratio = character.settlementRadiusKm / recipe.urban.radiusKm;
      recipe = {...recipe, urban: {...recipe.urban, radiusKm: character.settlementRadiusKm,
        radiusRows: recipe.urban.radiusRows * ratio, radiusColumns: recipe.urban.radiusColumns * ratio,
        coreZones: (recipe.urban.coreZones || []).map(zone => ({...zone,
          row: recipe.location.row + (zone.row - recipe.location.row) * ratio,
          column: recipe.location.column + (zone.column - recipe.location.column) * ratio,
          radiusKm: zone.radiusKm * ratio}))}};
    }
    const urban = recipe.urban || {};
    const morphology = recipe.morphology || {};
    const terrain = recipe.terrain || {};
    const water = recipe.water || {};
    const center = recipe.location;
    const radiusRows = Math.max(1e-7, finiteOr(urban.radiusRows, 0.05));
    const radiusColumns = Math.max(1e-7, finiteOr(urban.radiusColumns, 0.05));
    const seed = unsigned(recipe.seed);
    const bearing = Number.isFinite(water.waterBearingDegrees) ? normalizeAngle(water.waterBearingDegrees) : null;
    const request = {
      recipe,
      center,
      radiusRows,
      radiusColumns,
      seed,
      bearing,
      morphology: morphology.kind || "plain-organic",
      streetPattern: morphology.streetPattern || "organic",
      slopeClass: terrain.slopeClass || "flat",
      orientation: finiteOr(morphology.orientationDegrees, 0),
      buildingPattern: morphology.buildingPattern || "perimeter-blocks",
      blockAspect: finiteOr(morphology.blockAspect, 1),
      streetIrregularity: finiteOr(morphology.streetIrregularity, 0.35),
      population: Math.max(0, finiteOr(recipe.population && recipe.population.estimate, 0)),
      era: recipe.era,
      culturalStyle: (recipe.culture || {}).style || "vernacular-mixed",
      tier: recipe.tier || "site",
      areaKm2: Math.max(0, finiteOr(urban.targetFootprintKm2, 0)),
      character,
    };
    return request;
  }

  function streetNetwork(recipe) {
    return urbanFabric({...cityRequest(recipe), streetsOnly: true});
  }

  /* Pure planner; pass options.grid to unwrap canonical world cells at the longitude seam. */
  function plan(recipe, options = {}) {
    const request = cityRequest(recipe, options);
    recipe = request.recipe;
    const urban = recipe.urban || {}, terrain = recipe.terrain || {};
    const {center, radiusRows, radiusColumns} = request;
    const fabric = urbanFabric(request);
    nameStreets(fabric.streets,request);
    const buildable = normalizeBuildable(terrain.buildable);
    const annotations=namePlaces(featureAnnotations(recipe,fabric,request.character).concat(recipe.localSite?.annotations||[]),request);
    const placeNames=new Map(annotations.map(item=>[item.id,item.name]));
    for(const landmark of fabric.landmarks)if(placeNames.has(landmark.compoundId))landmark.name=placeNames.get(landmark.compoundId);
    for(const [index,plaza] of fabric.plazas.entries()){
      const id=plaza.market?'square-'+index:plaza.compoundId;if(placeNames.has(id))plaza.name=placeNames.get(id);
    }
    for(const [index,gate] of fabric.gates.entries())if(placeNames.has('gate-'+index))gate.name=placeNames.get('gate-'+index);
    for(const [index,court] of fabric.barbicans.entries())if(placeNames.has('barbican-'+index))court.name=placeNames.get('barbican-'+index);
    const cores = Array.isArray(urban.coreZones) && urban.coreZones.length
      ? urban.coreZones.map((zone) => ({
          id: String(zone.id),
          role: String(zone.role || "central-core"),
          row: finiteOr(zone.row, center.row),
          column: finiteOr(zone.column, center.column),
          radiusKm: Math.max(0.1, finiteOr(zone.radiusKm, 0.25)),
        }))
      : [{ id: recipe.id + "-core-1", role: "central-core", row: center.row, column: center.column, radiusKm: 0.25 }];
    return {
      era: recipe.era,
      footprint: fabric.footprint,
      blocks: fabric.blocks,
      districts: fabric.districts,
      streets: fabric.streets,
      buildings: fabric.buildings,
      walls: fabric.walls,
      innerWalls: fabric.innerWalls,
      wallSpans:fabric.wallSpans,
      innerWallSpans:fabric.innerWallSpans,
      enclosures:fabric.enclosures,
      innerEnclosures:fabric.innerEnclosures,
      gateStreets:fabric.gateStreets,
      towers: fabric.towers,
      plazas: fabric.plazas,
      landmarks: fabric.landmarks,
      countryside: fabric.countryside,
      farmland: fabric.farmland,
      fortress: fabric.fortress,
      gates: fabric.gates,
      barbicans: fabric.barbicans,
      moats:fabric.moats,
      countryLanes: fabric.countryLanes,
      hamlets: fabric.hamlets,
      character: request.character,
      annotations,
      streetWidths: streetWidthsInGrid(recipe, radiusRows, radiusColumns),
      footprintRadiusRows: radiusRows,
      footprintRadiusColumns: radiusColumns,
      gridCellKilometres: gridCellKilometres(recipe, radiusRows, radiusColumns),
      cores,
      buildable,
    };
  }

  function namePlaces(items,request) {
    const pool=Array.from(new Set(request.recipe.namePool?.places||[])),manual=request.recipe.localNames||{},
      used=new Set(Object.values(manual)),suffixes={
        'market-square':/(?:市集广场|广场|集场|市场|集市|市集)$/,
        'royal-palace':/(?:王宫|宫殿|行宫)$/,'imperial-palace':/(?:皇宫|宫殿|行宫)$/,
        'council-house':/(?:议会宫|议会厅|议政厅|议事堂|议院)$/,
        'town-hall':/(?:府署|官署|市政厅|镇公所|公所|议政厅)$/,
        'lord-manor':/(?:领主府|领主庄园|庄园)$/,
        'barracks':/(?:卫戍营|兵营|军营|营寨)$/,'granary':/(?:粮仓|公仓|仓)$/,
        'customs-house':/(?:海关商馆|海关|关署)$/,'caravanserai':/(?:商旅驿馆|商旅馆|驿馆)$/,
        'common-house':/(?:议事屋|议事堂|议事厅)$/,'assembly-tent':/(?:议事大帐|大帐)$/,
        'landing-store':/(?:埠头仓|港仓|码头仓)$/,'village-market':/(?:集场|市场|集市)$/,
        'market-hall':/(?:市集大厅|市集厅|交易所|市场大厅)$/,
        'holy-tomb':/(?:陵寝|圣陵|陵)$/,'observatory-sanctuary':/(?:观星院|观星台|天文台)$/,
        'pilgrimage-monastery':/(?:修院|修道院|寺院)$/,
        'harbor-shrine':/(?:圣祠|祠庙|神祠)$/,'village-shrine':/(?:小祠|祠|祠堂)$/,
        'sanctuary':/(?:庙院|祠庙|神殿|神庙|教堂|圣堂|圣殿|寺院)$/,
        'water-sanctuary':/(?:圣水神殿|水神殿|圣殿)$/,'great-sanctuary':/(?:大圣殿|圣殿)$/,
        'citadel':/(?:关堡|卫城|堡垒|城堡)$/,'gate':/(?:城门|关门|门)$/,'barbican':/瓮城$/
      },
      knownSuffix=/(?:市集广场|市场大厅|市集大厅|海关商馆|商旅驿馆|议事大帐|天律观星院|圣水神殿|巡礼大圣殿|先圣陵寝|圣山修院|潮汐圣祠|领主庄园|议会宫|议会厅|议政厅|议事堂|议事厅|市政厅|镇公所|领主府|卫戍营|观星院|观星台|天文台|大圣殿|祠堂|庙院|祠庙|神殿|神庙|教堂|圣堂|圣殿|寺院|修道院|修院|王宫|皇宫|宫殿|行宫|广场|集场|市场|集市|市集|兵营|军营|营寨|粮仓|公仓|埠头仓|码头仓|港仓|海关|关署|商旅馆|驿馆|议事屋|公所|官署|府署|议院|庄园|大帐|陵寝|圣陵|圣祠|神祠|小祠|关堡|卫城|堡垒|城堡|城门|关门|瓮城|交易所|宫|仓|陵|祠|门)$/;
    return items.map(item=>{
      if(manual[item.id])return {...item,name:manual[item.id]};
      if(!item.nameType||!item.nameSuffix||!pool.length)return item;
      const directionalGate=/^(内城)?[东南西北](?:城门|关门|门)$/,
        matches=name=>item.nameType==='gate'&&directionalGate.test(name)?name===item.nameSuffix:
          name.endsWith(item.nameSuffix)||(suffixes[item.nameType]?.test(name)||false),
        adapt=name=>item.nameType==='gate'&&directionalGate.test(name)?item.nameSuffix:
          matches(name)?name:(name.replace(knownSuffix,'')||request.character.prefix)+item.nameSuffix,
        complete=pool.filter(matches),candidates=(complete.length?complete:pool).map(adapt);
      let hash=2166136261;for(const c of item.id)hash=Math.imul(hash^c.charCodeAt(0),16777619);
      const start=Math.floor(random(request.seed,hash>>>0)*candidates.length);
      let name;
      for(let i=0;i<candidates.length;i++){const candidate=candidates[(start+i)%candidates.length];if(!used.has(candidate)){name=candidate;break;}}
      if(!name)name=candidates[start];
      used.add(name);return {...item,name};
    });
  }

  function nameStreets(streets,request) {
    const recipe=request.recipe,pool=Array.from(new Set(recipe.namePool?.streets||[])),
      roots=request.character.namingTradition.streets,manual=recipe.localNames||{},
      used=new Set(Object.values(manual)),assigned=new Map(),roads=new Map();
    // Clipping creates multiple pieces of a logical road. Allocate once per ID.
    for(const street of streets)if(street.kind!=='rail'&&(street.name||manual[street.id])){
      const previous=roads.get(street.id);
      if(!previous||['arterial','collector','local'].indexOf(street.kind)<['arterial','collector','local'].indexOf(previous.kind))roads.set(street.id,street);
    }
    const hash=id=>{let value=2166136261;for(const c of id)value=Math.imul(value^c.charCodeAt(0),16777619);return value>>>0;},
      complete=(root,suffix)=>/(?:大街|大道|街|路|道|巷)$/.test(root)?root:root+suffix;
    const ordered=Array.from(roads.values()).sort((a,b)=>hash(a.id)-hash(b.id)||a.id.localeCompare(b.id));
    for(const street of ordered){
      if(manual[street.id]){assigned.set(street.id,manual[street.id]);continue;}
      const suffixes=street.kind==='arterial'?['大街','路','街']:street.kind==='local'?['巷','街','路']:['街','路','巷'],
        alternatives=roots.flatMap(root=>suffixes.map(suffix=>complete(root,suffix))),
        candidates=pool.concat(alternatives),start=Math.floor(random(request.seed,hash(street.id))*Math.max(1,pool.length));
      let name;
      // A custom library entry is used verbatim, never combined with a new suffix.
      for(let i=0;i<pool.length;i++){const candidate=pool[(start+i)%pool.length];if(!used.has(candidate)){name=candidate;break;}}
      if(!name){
        const offset=Math.floor(random(request.seed,hash(street.id))*alternatives.length);
        for(let i=0;i<alternatives.length;i++){const candidate=alternatives[(offset+i)%alternatives.length];if(!used.has(candidate)){name=candidate;break;}}
      }
      if(!name){
        // A large city can exhaust a short player library. Keep the root and
        // add a conventional orientation/branch, rather than reusing a name.
        const root=candidates[start%candidates.length]||street.name||request.character.prefix+'街';
        for(const direction of ['东','西','南','北','上','下']){const candidate=direction+root;if(!used.has(candidate)){name=candidate;break;}}
        for(let branch=2;!name;branch++){const candidate=root+branch+'巷';if(!used.has(candidate))name=candidate;}
      }
      used.add(name);assigned.set(street.id,name);
    }
    for(const street of streets)if(assigned.has(street.id))street.name=assigned.get(street.id);
  }

  function recipeInLocalLongitude(recipe, width) {
    const centre = recipe.location.column;
    const columnNearCity = column => column + Math.round((centre - column) / width) * width;
    const pointNearCity = point => ({...point,column:columnNearCity(point.column)});
    const cellsNearCity = cells => cells.map(([row, column]) => [row, columnNearCity(column + 0.5) - 0.5]);
    const buildable = recipe.terrain.buildable;
    return {
      ...recipe,
      urban: {...recipe.urban, coreZones: (recipe.urban.coreZones || []).map(core => ({...core, column: columnNearCity(core.column)}))},
      terrain: {...recipe.terrain, buildable: {...buildable,
        allowedCells: cellsNearCity(buildable.allowedCells),
        blockedCells: cellsNearCity(buildable.blockedCells || []),
      }},
      transport: {...recipe.transport, corridors: (recipe.transport?.corridors || []).map(corridor => ({...corridor,
        points: corridor.points.map(point => ({...point, column: columnNearCity(point.column)})),
      }))},
      localSite: recipe.localSite ? {...recipe.localSite,
        gateStreets:(recipe.localSite.gateStreets||[]).map(gate=>({...gate,points:gate.points.map(pointNearCity),gateCenter:pointNearCity(gate.gateCenter),wallSpan:gate.wallSpan.map(pointNearCity)})),
        gates:(recipe.localSite.gates||[]).map(gate=>({...gate,center:pointNearCity(gate.center),passage:gate.passage.map(pointNearCity),
          towers:gate.towers.map(tower=>tower.map(pointNearCity)),wallSpan:gate.wallSpan.map(pointNearCity)})),
        wallSpans:(recipe.localSite.wallSpans||[]).map(span=>span.map(pointNearCity)),
        innerWallSpans:(recipe.localSite.innerWallSpans||[]).map(span=>span.map(pointNearCity)),
        enclosures:(recipe.localSite.enclosures||[]).map(polygon=>polygon.map(pointNearCity)),
        innerEnclosures:(recipe.localSite.innerEnclosures||[]).map(polygon=>polygon.map(pointNearCity)),
        bounds: recipe.localSite.bounds ? {...recipe.localSite.bounds, west: columnNearCity(recipe.localSite.bounds.west), east: columnNearCity(recipe.localSite.bounds.east)} : undefined,
        surface: recipe.localSite.surface ? {...recipe.localSite.surface, bounds: {...recipe.localSite.surface.bounds,
          west: columnNearCity(recipe.localSite.surface.bounds.west), east: columnNearCity(recipe.localSite.surface.bounds.east)}} : undefined,
        channels: (recipe.localSite.channels || []).map(channel => ({...channel, points: channel.points.map(point => ({...point, column: columnNearCity(point.column)}))})),
        reservedCompounds: (recipe.localSite.reservedCompounds || []).map(compound=>({...compound,
          points:compound.points.map(point=>({...point,column:columnNearCity(point.column)})),
          gate:compound.gate?{...compound.gate,column:columnNearCity(compound.gate.column)}:undefined})),
        farmland: (recipe.localSite.farmland || []).map(field => ({...field, points: field.points.map(point => ({...point, column: columnNearCity(point.column)})),
          lines: (field.lines || []).map(line => line.map(point => ({...point, column: columnNearCity(point.column)})))})),
      } : undefined,
    };
  }

  // Keep SVG path coordinates near zero. Browser path storage uses floats,
  // so world coordinates can otherwise quantize small houses by several metres.
  function drawingPlan(plan,origin){
    if(origin.column===0&&origin.row===0)return plan;
    const move=value=>{
      if(Array.isArray(value))return value.map(move);
      if(!value||typeof value!=='object')return value;
      if(Number.isFinite(value.column)&&Number.isFinite(value.row))return {...value,column:value.column-origin.column,row:value.row-origin.row};
      return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,move(item)]));
    };
    return move(plan);
  }

  function cityNode(recipe, grid, clipPrefix, preparedPlan, origin) {
    const city = svg("g", {
      "data-city-detail-id": recipe.id,
      "data-city-era": recipe.era,
      "data-city-morphology": (recipe.morphology && recipe.morphology.kind) || "plain-organic",
      class: "city-detail city-detail-" + (recipe.tier || "site"),
      "pointer-events": "none",
    });
    const cityPlan = drawingPlan(preparedPlan || plan(recipe, {grid}),origin);
    city.setAttribute('data-geometry-origin-column',origin.column);city.setAttribute('data-geometry-origin-row',origin.row);
    const clipId = clipIdentifier(recipe, clipPrefix);
    const definitions = svg("defs", {});
    const clip = svg("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" });
    if(recipe.localSite){
      const b=recipe.localSite.bounds;
      clip.appendChild(svg('rect',{x:b.west-origin.column,y:b.north-origin.row,width:b.east-b.west,height:b.south-b.north}));
    }else cityPlan.buildable.allowedCells.forEach((cell) => {
      clip.appendChild(svg("rect", {
        x: cell[1]-origin.column, y: cell[0]-origin.row, width: 1, height: 1,
      }));
    });
    definitions.appendChild(clip);
    const urbanClipId = clipId + "-urban";
    const urbanClip = svg("clipPath", { id: urbanClipId, clipPathUnits: "userSpaceOnUse" });
    cityPlan.districts.forEach((points) => urbanClip.appendChild(svg("path", { d: pathData(points, true) })));
    definitions.appendChild(urbanClip);
    city.appendChild(definitions);
    const landGeometry = svg("g", {
      id: clipId + "-geometry",
      class: "city-land-geometry",
      "clip-path": "url(#" + clipId + ")",
    });
    const geometry = svg("g", {
      class: "city-geometry",
      "clip-path": "url(#" + urbanClipId + ")",
    });
    appendCountryside(landGeometry, cityPlan);
    geometry.appendChild(svg('path',{class:'city-street-ground',d:cityPlan.districts.map(points=>pathData(points,true)).join(' '),
      fill:cityPlan.character.small?'#ecebdf':'#f1f2eb','fill-opacity':cityPlan.character.small?.12:.78}));
    const blocks = svg("g", { class: "city-blocks" });
    cityPlan.blocks.forEach((block) => blocks.appendChild(svg("path", {
      d: pathData(block.points, true),
      class: "city-block city-block-" + block.kind,
      fill: block.kind==='park'?'#d0e6ba':'#f4f3ec',
      "fill-opacity": block.opacity,
      stroke: "none",
    })));
    geometry.appendChild(blocks);
    geometry.appendChild(svg("path", {class: "city-plazas",
      d: cityPlan.plazas.map(plaza => pathData(plaza.points, true)).join(" "),
      fill: "#eee9db", stroke: "#b1ab9a", "stroke-width": 0.45,
      "vector-effect": "non-scaling-stroke"}));
    const buildings = svg("g", { class: "city-buildings" });
    if(cityPlan.buildings.some(building=>building.access))geometry.appendChild(svg('path',{class:'city-household-access',
      d:cityPlan.buildings.filter(building=>building.access).map(building=>pathData(building.access,false)).join(' '),
      fill:'none',stroke:'#efedde','stroke-width':.001/cityPlan.gridCellKilometres,'stroke-linecap':'round','stroke-linejoin':'round'}));
    geometry.appendChild(svg('path',{class:'city-building-shadows',d:cityPlan.buildings.map(building=>pathData(building.points,true)).join(' '),
      fill:'#3d4441',opacity:.20,transform:`translate(${.0014/cityPlan.gridCellKilometres} ${.0019/cityPlan.gridCellKilometres})`}));
    for (const key of new Set(cityPlan.buildings.map(building => building.kind + ":" + building.fill))) {
      const members = cityPlan.buildings.filter(building => building.kind + ":" + building.fill === key);
      const kind = members[0].kind;
      buildings.appendChild(svg("path", {
        d: members.map(building => pathData(building.points, true) + (building.courtyard ? " " + pathData(building.courtyard, true) : "")).join(" "),
        class: "city-building city-building-" + kind,
        "data-building-count": members.length,
        fill: members[0].fill, stroke: "#596053", "stroke-width": .00045 / cityPlan.gridCellKilometres,
        "stroke-opacity": .72, "stroke-linejoin": "round", "fill-rule": "evenodd",
      }));
    }
    geometry.appendChild(buildings);
    appendRoofPaint(geometry,cityPlan.buildings,'city-roof-faces',cityPlan.gridCellKilometres);
    geometry.appendChild(svg("path", {class: "city-roof-ridges",
      d: cityPlan.buildings.flatMap(building => building.roofLines || []).map(points => pathData(points, false)).join(" "),
      fill: "none", stroke: "#eee7cf", "stroke-width": .00028 / cityPlan.gridCellKilometres,
      "stroke-linecap": "round", opacity: 0.48}));
    const roadEdges = svg("g", {class: "city-street-edges", fill: "none", stroke: "#adb6bf",
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.75});
    const minorRoads = svg("g", {
      class: "city-streets city-streets-minor",
      fill: "none",
      stroke: "#fbfbf8",
      "stroke-width": cityPlan.streetWidths.local,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    const majorRoads = svg("g", {
      class: "city-streets city-streets-major",
      fill: "none",
      stroke: "#fffdf7",
      "stroke-width": cityPlan.streetWidths.arterial,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    cityPlan.streets.forEach((street) => {
      if (street.kind === "rail") return;
      const width = cityPlan.streetWidths[street.kind] || cityPlan.streetWidths.local;
      roadEdges.appendChild(svg("path", {
        d: pathData(street.points, false), "stroke-width": width * 1.2,
      }));
      (street.kind === "arterial" ? majorRoads : minorRoads).appendChild(svg("path", {
        d: pathData(street.points, false),
        "stroke-width": street.kind === "collector" ? cityPlan.streetWidths.collector : undefined,
      }));
    });
    // Validated street paths include gate passages and edge junctions. Their
    // strokes must remain whole when they cross the urban parcel boundary.
    if(recipe.localSite){
      const shoreClipId=clipId+'-road-shore',shoreClip=svg('clipPath',{id:shoreClipId,clipPathUnits:'userSpaceOnUse'}),
        m=recipe.urban.gridCellKilometres,
        roadHalfWidth=Math.max(...Object.values(cityPlan.streetWidths))*.6*Math.max(m.column,m.row),
        dryPath=recipe.localSite.dryArea.replace(/([ML])\s*([-+\d.e]+)[\s,]+([-+\d.e]+)/gi,(_all,command,x,y)=>
          command+(Number(x)-origin.column).toFixed(9)+' '+(Number(y)-origin.row).toFixed(9));
      shoreClip.appendChild(svg('path',{d:dryPath,'fill-rule':'nonzero'}));
      // Only validated bridges may extend this dry-road surface into water.
      // Their full width and land portals keep bridge strokes continuous.
      for(const bridge of recipe.localSite.bridges){
        const halfWidth=Math.max(roadHalfWidth,bridge.widthMetres/2000);
        for(let i=1;i<bridge.points.length;i++){
          const a=bridge.points[i-1],b=bridge.points[i],dx=(b.column-a.column)*m.column,dy=(b.row-a.row)*m.row,
            length=Math.hypot(dx,dy);if(length<1e-9)continue;
          const x=dx/length,y=dy/length,
            polygon=[[-1,1],[1,1],[1,-1],[-1,-1]].map(([end,side])=>{
              const p=end<0?a:b;
              return {column:p.column-origin.column+(x*halfWidth*end-y*halfWidth*side)/m.column,
                row:p.row-origin.row+(y*halfWidth*end+x*halfWidth*side)/m.row};
            });
          shoreClip.appendChild(svg('path',{d:pathData(polygon,true)}));
        }
      }
      definitions.appendChild(shoreClip);
      for(const roads of [roadEdges,minorRoads,majorRoads])roads.setAttribute('clip-path','url(#'+shoreClipId+')');
    }
    const civicGeometry=svg('g',{class:'city-civic-geometry','clip-path':'url(#'+urbanClipId+')'});
    appendLandmarks(civicGeometry, cityPlan);
    if (cityPlan.fortress) appendFortress(civicGeometry, cityPlan);
    const rail = cityPlan.streets.filter(street => street.kind === "rail").map(street => pathData(street.points, false)).join(" ");
    if (rail) {
      const width = cityPlan.streetWidths.arterial * 0.65;
      civicGeometry.appendChild(svg("path", {d: rail, fill: "none", stroke: "#3b3c38", "stroke-width": width}));
      civicGeometry.appendChild(svg("path", {d: rail, fill: "none", stroke: "#fffdf4", "stroke-width": width * 0.55, "stroke-dasharray": `${width * 3} ${width * 2}`}));
    }
    landGeometry.appendChild(geometry);
    // Ditches remain visible over district ground; crossing roads and bridges
    // are drawn above them.
    appendMoats(landGeometry,cityPlan);
    landGeometry.appendChild(roadEdges);landGeometry.appendChild(minorRoads);landGeometry.appendChild(majorRoads);
    landGeometry.appendChild(civicGeometry);
    appendWalls(landGeometry, cityPlan);
    appendLabels(landGeometry, cityPlan,origin);
    city.appendChild(landGeometry);
    // Plan once in continuous local longitude, then reuse the clipped geometry
    // at the opposite edge of the rectangular atlas.
    if (grid) {
      const bounds = recipe.urban.bounds;
      if (bounds.west < 0) city.appendChild(svg("use", {href: "#" + clipId + "-geometry", transform: `translate(${grid.width} 0)`}));
      if (bounds.east > grid.width) city.appendChild(svg("use", {href: "#" + clipId + "-geometry", transform: `translate(${-grid.width} 0)`}));
    }
    return city;
  }

  function appendLandmarks(city, cityPlan) {
    const group = svg("g", {class: "city-landmarks"});
    group.appendChild(svg('path',{class:'city-landmark-shadows',
      d:cityPlan.landmarks.map(landmark=>pathData(landmark.points,true)).join(' '),
      fill:'#38473f',opacity:.23,transform:`translate(${.003/cityPlan.gridCellKilometres} ${.004/cityPlan.gridCellKilometres})`}));
    for (const landmark of cityPlan.landmarks) group.appendChild(svg("path", {
      d: pathData(landmark.points, true), class: "city-landmark city-landmark-" + landmark.kind,
      fill: landmark.fill, stroke: "#736750", "stroke-width": .0007 / cityPlan.gridCellKilometres,
      "stroke-linejoin": "round",
    }));
    group.appendChild(svg("path", {d: cityPlan.landmarks.flatMap(landmark => landmark.roofLines || [])
      .map(points => pathData(points, false)).join(" "), fill: "none", stroke: "#f8e3b9",
      "stroke-width": .0004 / cityPlan.gridCellKilometres}));
    appendRoofPaint(group,cityPlan.landmarks,'city-landmark-faces',cityPlan.gridCellKilometres);
    city.appendChild(group);
  }

  function appendRoofPaint(parent,buildings,className,metric){
    const dark=[],light=[],hipLines=[],flat=[];
    for(const building of buildings){
      const polygon=building.points.map(p=>({x:p.column,y:p.row})),c=polygonCentre(polygon);
      if(building.roof==='flat'){const inside=insetPolygon(polygon,Math.sqrt(polygonArea(polygon))*.10);
        flat.push(pathData(inside.map(p=>({column:p.x,row:p.y})),true));continue;}
      if(building.courtyard){
        const inner=building.courtyard;
        for(let i=0;i<building.points.length;i++){
          const a=building.points[i],b=building.points[(i+1)%building.points.length],
            near=p=>inner.reduce((best,q)=>Math.hypot(p.column-q.column,p.row-q.row)<Math.hypot(p.column-best.column,p.row-best.row)?q:best,inner[0]);
          const ring=[a,b,near(b),near(a)],value=(b.column-a.column)-(b.row-a.row);
          (value>0?light:dark).push(pathData(ring,true));
        }continue;
      }
      const ridge=building.roofLines?.find(line=>line.length===2);
      if(!ridge){
        for(let i=0;i<polygon.length;i++){
          const a=polygon[i],b=polygon[(i+1)%polygon.length],value=b.x-a.x-(b.y-a.y);
          (value>0?light:dark).push(pathData([a,b,c].map(p=>({column:p.x,row:p.y})),true));
        }continue;
      }
      const [a,b]=ridge,nx=b.row-a.row,ny=a.column-b.column,d=nx*a.column+ny*a.row;
      for(const sign of [-1,1]){
        const face=clipHalfPlane(polygon,nx*sign,ny*sign,d*sign);
        if(face.length>=3)(sign*(nx+ny)>0?light:dark).push(pathData(face.map(p=>({column:p.x,row:p.y})),true));
      }
      if(building.roof==='hip'||building.roof==='gate')for(const tip of [a,b]){
        const corners=building.points.slice().sort((p,q)=>Math.hypot(p.column-tip.column,p.row-tip.row)-Math.hypot(q.column-tip.column,q.row-tip.row)).slice(0,2);
        hipLines.push(...corners.map(p=>pathData([p,tip],false)));
      }
    }
    const group=svg('g',{class:className});
    group.appendChild(svg('path',{d:dark.join(' '),fill:'#233e42',opacity:.18}));
    group.appendChild(svg('path',{d:light.join(' '),fill:'#ffedb9',opacity:.18}));
    group.appendChild(svg('path',{d:flat.join(' '),fill:'none',stroke:'#f3e8cd',opacity:.55,'stroke-width':.0003/metric}));
    group.appendChild(svg('path',{d:hipLines.join(' '),fill:'none',stroke:'#f3e8cd',opacity:.5,'stroke-width':.0003/metric}));
    parent.appendChild(group);
  }

  function appendMoats(city,plan){
    const group=svg('g',{class:'city-defensive-ditches','data-moat-count':plan.moats.length,fill:'none','stroke-linejoin':'round'});
    for(const moat of plan.moats){const d=pathData(moat.points,true),width=moat.widthMetres/1000/plan.gridCellKilometres;
      group.appendChild(svg('path',{d,stroke:'#a6b39a','stroke-width':width*1.5}));
      group.appendChild(svg('path',{d,stroke:moat.wet?'#91d5e9':'#b1a082','stroke-width':width}));
      for(const crossing of moat.crossings)group.appendChild(svg('path',{d:pathData(crossing,false),stroke:'#f1e9d5','stroke-width':plan.streetWidths.arterial*1.25}));
    }city.appendChild(group);
  }

  function appendWalls(city, cityPlan) {
    const group = svg("g", {class: "city-fortifications", "stroke-linejoin": "round", "stroke-linecap": "round"});
    for (const [name, walls, width] of [["outer", cityPlan.walls, 1.8], ["inner", cityPlan.innerWalls, 2.3]]) {
      const d = walls.map(points => pathData(points, false)).join(" ");
      group.appendChild(svg('path',{d,class:'city-wall-shadow',fill:'none',stroke:'#3d4639',opacity:.22,
        'stroke-width':cityPlan.streetWidths.collector*(width+.8),
        transform:`translate(${.0025/cityPlan.gridCellKilometres} ${.0035/cityPlan.gridCellKilometres})`}));
      group.appendChild(svg("path", {d, class: "city-" + name + "-walls", fill: "none", stroke: "#756c57",
        "stroke-width": cityPlan.streetWidths.collector * (width + 0.8)}));
      group.appendChild(svg("path", {d, fill: "none", stroke: "#e8dfc5", "stroke-width": cityPlan.streetWidths.collector * width}));
      group.appendChild(svg("path", {d, fill: "none", stroke: "#96866a", "stroke-width": cityPlan.streetWidths.local * 0.6,
        "stroke-dasharray": `${cityPlan.streetWidths.local * 2} ${cityPlan.streetWidths.local * 3}`}));
    }
    for(const plaza of cityPlan.plazas.filter(p=>p.precinct)){
      const d=plaza.walls.map(p=>pathData(p,false)).join(' ');
      group.appendChild(svg('path',{d,fill:'none',stroke:'#626456','stroke-width':cityPlan.streetWidths.collector*1.9,class:'city-palace-precinct'}));
      group.appendChild(svg('path',{d,fill:'none',stroke:'#d8ceb0','stroke-width':cityPlan.streetWidths.collector*1.2}));
    }
    group.appendChild(svg("path", {class: "city-wall-towers", "data-wall-tower-count": cityPlan.towers.length,
      d: cityPlan.towers.map(tower => pathData(tower.points, true)).join(" "), fill: "#b5aa8b",
      stroke: "#6e624d", "stroke-width": 0.8, "vector-effect": "non-scaling-stroke"}));
    group.appendChild(svg("path", {class: "city-tower-roofs",
      d: cityPlan.towers.flatMap(tower => tower.roofLines || []).map(points => pathData(points, false)).join(" "),
      fill: "none", stroke: "#f7efd9", "stroke-width": 0.6, "vector-effect": "non-scaling-stroke"}));
    const gates=svg('g',{class:'city-gatehouses','data-gate-count':cityPlan.gates.length});
    for(const gate of cityPlan.gates){
      gates.appendChild(svg('path',{d:gate.towers.map(points=>pathData(points,true)).join(' '),fill:'#b0a18a',stroke:'#726653',
        'stroke-width':.75,'vector-effect':'non-scaling-stroke'}));
      gates.appendChild(svg('path',{d:pathData(gate.passage,false),fill:'none',stroke:'#fff9eb','stroke-width':cityPlan.streetWidths.arterial,'stroke-linecap':'round'}));
      gates.appendChild(svg('path',{d:gate.towers.flatMap(points=>roofLines(points)).map(points=>pathData(points,false)).join(' '),
        fill:'none',stroke:'#f4ead4','stroke-width':.7,'vector-effect':'non-scaling-stroke'}));
    }
    const barbicans=svg('g',{class:'city-barbicans','data-barbican-count':cityPlan.barbicans.length});
    for(const court of cityPlan.barbicans){
      barbicans.appendChild(svg('path',{d:pathData(court.points,true),fill:'#e9e1cb',stroke:'none'}));
      barbicans.appendChild(svg('path',{d:court.walls.map(p=>pathData(p,false)).join(' '),fill:'none',stroke:'#766b57','stroke-width':cityPlan.streetWidths.collector*2.8,'stroke-linejoin':'round'}));
      barbicans.appendChild(svg('path',{d:court.walls.map(p=>pathData(p,false)).join(' '),fill:'none',stroke:'#e9dfc4','stroke-width':cityPlan.streetWidths.collector*1.8,'stroke-linejoin':'round'}));
      barbicans.appendChild(svg('path',{d:pathData(court.access,false),fill:'none',stroke:'#fff8e9','stroke-width':cityPlan.streetWidths.arterial,'stroke-linecap':'round'}));
    }group.appendChild(barbicans);
    group.appendChild(gates);
    city.appendChild(group);
  }

  function appendCountryside(city, cityPlan) {
    const group = svg("g", {class: "city-countryside"});
    for(const fill of new Set(cityPlan.farmland.map(field=>field.fill))){
      const fields=cityPlan.farmland.filter(field=>field.fill===fill);
      group.appendChild(svg("path", {class: "city-farmland", "data-farmland-count": fields.length,
        d: fields.map(field => pathData(field.points, true)).join(" "), fill, "fill-opacity": 0.60,
        stroke: "#9da371", "stroke-opacity":.56,"stroke-width": 0.50, "vector-effect": "non-scaling-stroke"}));
    }
    group.appendChild(svg("path", {class: "city-field-rows", d: cityPlan.farmland.flatMap(field => field.lines || [])
      .map(points => pathData(points, false)).join(" "), fill: "none", stroke: "#a7b07a", "stroke-width": 0.5,
      "vector-effect": "non-scaling-stroke", opacity: 0.50}));
    for(const fill of new Set(cityPlan.countryside.map(house=>house.yardFill)))group.appendChild(svg('path',{
      class:'city-country-yards','data-yard-count':cityPlan.countryside.filter(house=>house.yardFill===fill).length,
      d:cityPlan.countryside.filter(house=>house.yardFill===fill).map(house=>pathData(house.yard,true)).join(' '),
      fill,'fill-opacity':.72,stroke:'#aab8a0','stroke-opacity':.55,'stroke-width':.00025/cityPlan.gridCellKilometres}));
    group.appendChild(svg('path',{class:'city-country-lanes',d:cityPlan.countryside.map(house=>pathData(house.access,false)).join(' '),
      fill:'none',stroke:'#f1f3e8','stroke-width':Math.min(cityPlan.streetWidths.local,.0018/cityPlan.gridCellKilometres),
      'stroke-linejoin':'round','stroke-linecap':'round'}));
    for(const fill of new Set(cityPlan.countryside.map(house=>house.fill)))group.appendChild(svg("path", {
      class: "city-country-houses", d: cityPlan.countryside.filter(house=>house.fill===fill).map(house => pathData(house.points, true)).join(" "),
      fill, stroke: "#5e6353", "stroke-width": .00045 / cityPlan.gridCellKilometres, "stroke-opacity": .72}));
    appendRoofPaint(group,cityPlan.countryside,'city-country-roof-faces',cityPlan.gridCellKilometres);
    group.appendChild(svg("path", {d: cityPlan.countryside.flatMap(house => house.roofLines || []).map(points => pathData(points, false)).join(" "),
      fill: "none", stroke: "#f0d6ac", "stroke-width": .0003 / cityPlan.gridCellKilometres}));
    const doors=cityPlan.countryside.map(house=>{
      const edge=house.points.map((a,i)=>({a,b:house.points[(i+1)%house.points.length],q:nearestPoint(house.entrance,a,house.points[(i+1)%house.points.length])}))
        .sort((a,b)=>Math.hypot(a.q.column-house.entrance.column,a.q.row-house.entrance.row)-Math.hypot(b.q.column-house.entrance.column,b.q.row-house.entrance.row))[0];
      const dx=edge.b.column-edge.a.column,dy=edge.b.row-edge.a.row,length=Math.hypot(dx,dy),half=.0006/cityPlan.gridCellKilometres;
      return pathData([-1,1].map(side=>({column:house.entrance.column+dx/length*half*side,row:house.entrance.row+dy/length*half*side})),false);
    });
    group.appendChild(svg('path',{class:'city-country-doorways',d:doors.join(' '),fill:'none',stroke:'#64786c','stroke-width':.00065/cityPlan.gridCellKilometres}));
    city.appendChild(group);
  }

  function appendLabels(city, cityPlan,origin) {
    const group=svg('g',{class:'city-place-labels','pointer-events':'none',fill:'#495247',stroke:'#fffdf5',
      'paint-order':'stroke fill','stroke-linejoin':'round','font-family':'Microsoft YaHei, sans-serif',
      'text-anchor':'middle','dominant-baseline':'middle'});
    for(const feature of cityPlan.annotations){
      const node=svg('text',{x:0,y:0,'data-anchor-column':feature.anchor.column+origin.column,'data-anchor-row':feature.anchor.row+origin.row,
        transform:`translate(${feature.anchor.column} ${feature.anchor.row})`,'data-city-screen-label':feature.name,
        'data-feature-kind':feature.kind,'data-feature-id':feature.id,'data-priority':feature.priority,
        'data-detail-level':feature.detailLevel,'data-length-km':feature.lengthKm||0,
        'data-angle':feature.angle||0,'font-size':cityPlan.footprintRadiusRows*.04,
        'stroke-width':cityPlan.streetWidths.local,'pointer-events':feature.kind==='elevation'?'none':'visiblePainted',fill:feature.kind==='road'?'#7b7569':'#3f635b'});
      node.textContent=feature.name;group.appendChild(node);
    }
    city.appendChild(group);
  }

  function featureAnnotations(recipe,fabric,character) {
    const result=[],prefix=character.prefix,center=points=>{
      const p=polygonCentre(points.map(p=>({x:p.column,y:p.row})));return {row:p.y,column:p.x};
    };
    const point=(id,name,kind,points,priority=3,detailLevel=1,naming={})=>result.push({id,name,kind,anchor:center(points),priority,detailLevel,...naming});
    for(const [index,plaza] of fabric.plazas.entries())if(plaza.market)point('square-'+index,plaza.name,'square',plaza.points,2,0,
      {nameType:'market-square',nameSuffix:plaza.nameSuffix});
    const seen=new Set();
    for(const landmark of fabric.landmarks)if(landmark.name&&!seen.has(landmark.compoundId)){
      const principal=['royal-palace','imperial-palace','council-house','holy-tomb','water-sanctuary','observatory-sanctuary','pilgrimage-monastery','harbor-shrine','great-sanctuary'].includes(landmark.kind);
      seen.add(landmark.compoundId);point(landmark.compoundId,landmark.name,'landmark',landmark.compoundPoints,principal?0:2,0,
        {nameType:landmark.nameType,nameSuffix:landmark.nameSuffix});
    }
    if(fabric.fortress)point('citadel',prefix+(recipe.siteType==='pass'?'关堡':'卫城'),'landmark',fabric.fortress.points,1,0,
      {nameType:'citadel',nameSuffix:recipe.siteType==='pass'?'关堡':'卫城'});
    for(const [index,gate] of fabric.gates.entries())point('gate-'+index,gate.name,'gate',gate.towers.flat(),2,1,
      {nameType:'gate',nameSuffix:gate.name});
    for(const [index,court] of fabric.barbicans.entries())point('barbican-'+index,court.name,'gate',court.points,3,2,
      {nameType:'barbican',nameSuffix:'瓮城'});
    for(const [index,moat] of fabric.moats.entries())point('moat-'+index,moat.name,'water',moat.points.slice(0,2),4,1);
    for(const [index,hamlet] of fabric.hamlets.entries())point('hamlet-'+index,hamlet.name,'hamlet',hamlet.points,5,0);
    const longest=new Map(),metric=recipe.urban.gridCellKilometres;
    for(const street of fabric.streets)if(street.name){
      if(street.palacePerimeter||street.palaceAccess)continue;
      const a=street.points[0],b=street.points.at(-1),dx=(b.column-a.column)*metric.column,dy=(b.row-a.row)*metric.row,lengthKm=Math.hypot(dx,dy);
      if(lengthKm<.06||longest.get(street.name)?.lengthKm>=lengthKm)continue;
      let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;
      longest.set(street.name,{id:street.id,name:street.name,kind:'road',anchor:{row:(a.row+b.row)/2,column:(a.column+b.column)/2},
        priority:street.kind==='arterial'?3:6,detailLevel:street.kind==='arterial'?1:2,lengthKm,angle});
    }
    return result.concat(Array.from(longest.values()));
  }

  // A convex partition creates streets and blocks from the same cuts.  Every
  // cut terminates on an existing boundary; buildings are subdivided afterwards.
  // No Watabou source is used: this is a bounded BSP parcel planner.
  function urbanFabric(request) {
    const modern = request.era === "industrial" || request.era === "contemporary";
    const character=request.character;
    const householdSettlement=character.small&&!character.mobile;
    const tribal = request.era === "tribal"||character.mobile;
    const defensiveEra = ["ancient", "medieval", "early-modern", "preindustrial"].includes(request.era);
    const fortifiedSite = ["fortress", "pass"].includes(request.recipe.siteType) || (request.recipe.landmarks || []).some(landmark => landmark === "citadel" || landmark === "government-seat");
    const courtyardStyle = character.court;
    const rowHouseStyle = ["terraced", "canal-side"].includes(request.culturalStyle) || request.buildingPattern === "terraced-compounds";
    const radiusKm = Math.max(0.05, finiteOr(request.recipe.urban.radiusKm, 1));
    const widths = streetWidthsInGrid(request.recipe, request.radiusRows, request.radiusColumns);
    const metric = gridCellKilometres(request.recipe, request.radiusRows, request.radiusColumns);
    const roadGap = widths.arterial * metric / radiusKm * 0.58;
    const targetBlocks = character.small?Math.max(8,Math.min(128,Math.round(character.buildingCount/6))):Math.max(25,Math.min(235,Math.round(character.buildingCount/13)));
    const targetArea = Math.PI / (targetBlocks * (tribal ? 0.48 : 1));
    const groundForm=request.recipe.localSite?.form;
    const explicit=request.recipe.citySettings;
    let angle = groundForm?groundForm.axisRadians:explicit?0:request.orientation*Math.PI/180;
    const planned=explicit?.streetPattern==='grid'||explicit?.streetPattern!=='organic'&&['axial','orthogonal'].includes(character.plan)&&(!groundForm||['plain','hills'].includes(groundForm.kind));
    if(character.plan==='axial'&&groundForm?.kind==='plain')angle=0;
    if(!groundForm&&['hill-town','fortress','border-pass'].includes(character.kind)&&request.recipe.localSite?.surface){
      const field=request.recipe.localSite.surface,b=field.bounds,x=Math.max(1,Math.min(field.columns-2,Math.round((request.center.column-b.west)/(b.east-b.west)*(field.columns-1)))),
        y=Math.max(1,Math.min(field.rows-2,Math.round((request.center.row-b.north)/(b.south-b.north)*(field.rows-1)))),index=y*field.columns+x;
      const dx=field.elevationMetres[index+1]-field.elevationMetres[index-1],dy=field.elevationMetres[index+field.columns]-field.elevationMetres[index-field.columns];
      if(Math.hypot(dx,dy)>.1)angle=Math.atan2(dx,-dy);
    }
    if(explicit)angle+=request.orientation*Math.PI/180;
    const toWorld = point => ({
      column: request.center.column + (point.x * Math.cos(angle) - point.y * Math.sin(angle)) * request.radiusColumns,
      row: request.center.row + (point.x * Math.sin(angle) + point.y * Math.cos(angle)) * request.radiusRows,
    });
    const toLocal=p=>{const x=(p.column-request.center.column)/request.radiusColumns,y=(p.row-request.center.row)/request.radiusRows;
      return {x:x*Math.cos(angle)+y*Math.sin(angle),y:-x*Math.sin(angle)+y*Math.cos(angle)};};
    const outlineVertices=householdSettlement&&character.defence.layers>0?8:48;
    const outline = planned&&character.plan==='axial'?[{x:-.94,y:-.86},{x:.94,y:-.86},{x:.94,y:.86},{x:-.94,y:.86}]:Array.from({length:outlineVertices}, (_, index) => {
      const theta = (index + (random(request.seed, 2500 + index) - 0.5) * 0.5) * Math.PI * 2 / outlineVertices;
      // All vertices lie on one convex ellipse: subdivision cannot self-intersect.
      const elongated=['hill-town','border-pass','fortress','river-town','river-port','seaport','lake-port'].includes(character.kind);
      return {x: Math.cos(theta) * (groundForm?groundForm.alongScale:elongated?1.02:.95),
        y:Math.sin(theta)*(groundForm?groundForm.crossScale:['steep','escarpment'].includes(request.slopeClass)?.30:elongated?.73:.92)};
    });
    const segments = [];
    const parcels = [];
    const split = (polygon, depth, channel) => {
      const area = polygonArea(polygon);
      if (depth >= 11 || area < targetArea * (0.74 + random(request.seed, channel) * 0.65)) {
        parcels.push({polygon, channel}); return;
      }
      const centre = polygonCentre(polygon);
      const historicCore = Math.hypot(centre.x, centre.y) < (modern ? 0.30 : request.era === "early-modern" ? 0.56 : 0.85);
      const ordered = planned||!historicCore && (modern || request.era === "early-modern");
      const chaos = ordered ? (request.era === "industrial" ? 0.035 : 0.015) : (tribal ? 0.8 : 0.22 + request.streetIrregularity * 0.58);
      const result = bisectParcel(polygon, request.seed, channel, chaos, explicit?request.blockAspect:1);
      if (!result) { parcels.push({polygon, channel}); return; }
      const names=character.mobile?['集会道','牧场道','驿道','水源道']:character.kind==='oasis'?['井泉街','商旅街','驼铃街','绿荫街']:
        ['市集街','长街','粮仓街','石匠街','榆树街','工匠街','学舍街','花园街'];
      const kind=depth<2?'arterial':depth<5?'collector':'local';
      const worldCut=result.cut.map(toWorld),a=worldCut[0],b=worldCut[1];
      segments.push({id:'street-'+channel,kind,name:kind==='local'?null:depth<2?character.prefix+(Math.abs(b.row-a.row)>Math.abs(b.column-a.column)?'南北大街':'东西大街'):names[(channel+Math.round(random(request.seed,7)*7))%names.length],points:worldCut});
      split(result.first, depth + 1, channel * 2 + 1);
      split(result.second, depth + 1, channel * 2 + 2);
    };
    let garrisonParcel=null;
    if(householdSettlement){
      parcels.push({polygon:outline,channel:31});
      const village=villageStreets(request,outline,toWorld,radiusKm);
      segments.push(...village.streets);garrisonParcel=village.garrisonParcel;
      request.garrisonReservation=garrisonParcel?.polygon.map(toWorld)||null;
    }else split(outline, 0, 31);
    const throughRiver=request.recipe.localSite?.riverMode==='through';
    const candidates = parcels.filter(parcel => {
      const centre = polygonCentre(parcel.polygon),along=groundForm?.alongScale||.95,cross=groundForm?.crossScale||.92,
        bearing = Math.atan2(centre.y/cross, centre.x/along);
      const growthLimit = 0.78 + Math.sin(bearing * 3 + random(request.seed, 7100) * Math.PI * 2) * 0.11
        + Math.sin(bearing * 5 + random(request.seed, 7101) * Math.PI * 2) * 0.075;
      return (householdSettlement||planned&&character.plan==='axial'?Math.max(Math.abs(centre.x/.94),Math.abs(centre.y/.86))<=.98:
        Math.hypot(centre.x/along, centre.y/cross)<=growthLimit)
        &&(request.recipe.localSite||parcel.polygon.map(toWorld).every(point=>segmentOnLand(request.center,point,request.recipe)));
    }).flatMap(parcel=>request.recipe.localSite?clipToLand(parcel.polygon.map(toWorld),request.recipe).map(points=>({...parcel,polygon:points.map(toLocal)})):[parcel]);
    // Keep the connected settlement around the centre. A road or bridge is
    // required before development can grow across a forbidden water corridor.
    const selectedParcels = connectedParcels(candidates,throughRiver?(request.recipe.localSite.bridges||[]).map(b=>b.points.map(toLocal)):[]);
    const householdDensity=character.buildingCount/Math.max(1e-8,selectedParcels.reduce((area,parcel)=>area+polygonArea(parcel.polygon),0));
    const districtPolygons=selectedParcels.map(parcel=>parcel.polygon.map(toWorld));
    const footprint = outline.map(toWorld);
    const corridors = [...((request.recipe.transport || {}).corridors || []),...(request.recipe.localSite?.ruralRoads||[])].filter(corridor =>
      Array.isArray(corridor.points) && corridor.points.length > 1);
    const streets = segments.filter(street=>streetCrossingsValid(street,request.recipe)).flatMap(street=>clipToDistricts(street,districtPolygons));
    const innerParcels=character.defence.layers>1?selectedParcels.filter(parcel=>{
      const centre=polygonCentre(parcel.polygon);
      return Math.hypot(centre.x/(groundForm?.alongScale||.95),centre.y/(groundForm?.crossScale||.92))<.46;
    }):[];
    const innerEnclosures=innerParcels.map(parcel=>parcel.polygon.map(toWorld));
    const walled = defensiveEra && character.defence.layers>0 && (request.tier !== "site" || fortifiedSite);
    const defenceGeometry=request.recipe.localSite?.gates?{
      wallSpans:request.recipe.localSite.wallSpans||[],innerWallSpans:request.recipe.localSite.innerWallSpans||[]
    }:{wallSpans:defenceSpans(walled?districtPolygons:[],request,[],'outer'),
      innerWallSpans:defenceSpans(walled?innerEnclosures:[],request,[],'inner')};
    const publicConstraints=publicBuildingConstraints(request,districtPolygons,innerEnclosures,defenceGeometry);
    if(request.garrisonReservation&&publicConstraints.fits(request.garrisonReservation,34))
      request.garrisonReservation=publicConstraints.padding(request.garrisonReservation,34);
    // Civic compounds reserve their ground before either urban or rural routes
    // attach, so the routing skeleton and the rendered palace share a boundary.
    const publicSpaces = createPublicSpaces(request, metric, streets,districtPolygons,publicConstraints);
    const {plazas, landmarks} = publicSpaces;
    const defence=request.recipe.localSite?.gates?request.recipe.localSite:
      planDefences(request,walled?districtPolygons:[],walled?innerEnclosures:[],streets,plazas,widths,metric,defenceGeometry);
    const wallSpans=defence.wallSpans||[],innerWallSpans=defence.innerWallSpans||[],gates=defence.gates||[],gateStreets=defence.gateStreets||[];
    const walls=wallSpans.flatMap(span=>wallSegmentsWithGates(span[0],span[1],gates.filter(g=>g.layer==='outer'),request));
    const innerWalls=innerWallSpans.flatMap(span=>wallSegmentsWithGates(span[0],span[1],gates.filter(g=>g.layer==='inner'),request));
    const protectedStreets=streetsClearOfWalls(streets,[...walls,...innerWalls],request,widths);
    streets.splice(0,streets.length,...protectedStreets,...gateStreets.map(gate=>({...gate,access:true})));
    if (request.streetsOnly) return {footprint,districts:districtPolygons,streets,gateStreets,gates,
      enclosures:walled?districtPolygons:[],wallSpans,innerEnclosures:walled?innerEnclosures:[],innerWallSpans,
      reservedCompounds:plazas.concat(request.garrisonReservation?[{points:request.garrisonReservation,garrison:true}]:[])};
    // Real routes are authoritative. Connect each to the existing street graph
    // by a short land-only access, never move its line or fabricate a bridge.
    const baseStreets = streets.slice();
    for (const corridor of corridors) {
      const a=corridor.points[0],b=corridor.points.at(-1),dx=b.column-a.column,dy=b.row-a.row;
      const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'东':'西'):(dy>0?'南':'北');
      streets.push(...clipToDistricts({id:corridor.id,kind:corridor.kind==='rail'?'rail':corridor.local?'collector':'arterial',name:corridor.local?direction+'庄道':direction+'驿路',points:corridor.points,authoritative:true},districtPolygons));
      if (corridor.kind === "rail") continue;
      let closest = null;
      for (const point of [corridor.points[0], corridor.points.at(-1)]) for (const street of baseStreets) {
        for (let index = 1; index < street.points.length; index++) {
          const target = nearestPoint(point, street.points[index - 1], street.points[index]);
          const distance = Math.hypot(point.row - target.row, point.column - target.column);
          if ((!closest || distance < closest.distance) && segmentOnLand(point, target, request.recipe)) closest = {point, target, distance};
        }
      }
      if (closest && closest.distance > 1e-10 && closest.distance < Math.max(request.radiusRows, request.radiusColumns) * 0.7) {
        streets.push({id:'corridor-access-'+corridor.id,kind: "collector", points: [closest.point, closest.target], access: true});
      }
    }
    const fortressParcels=householdSettlement?(garrisonParcel?[garrisonParcel]:[]):selectedParcels;
    const fortress = defensiveEra && fortifiedSite ? createFortress(fortressParcels, request, toWorld, radiusKm, streets, plazas,publicConstraints) : null;
    if (fortress) streets.push({id:'fortress-access',kind: "collector", points: fortress.access, access: true,fortressAccess:true});
    const protectedRoutes = streets.filter(street => street.access || street.authoritative);
    const buildings = [];
    const blocks = [];
    const districts = householdSettlement?districtPolygons.slice():[];
    const occupiedParcels = [];
      const palette = character.roof;
    for (const parcel of selectedParcels) {
      const centre = polygonCentre(parcel.polygon);
        const radial = Math.hypot(centre.x/(groundForm?.alongScale||.95), centre.y/(groundForm?.crossScale||.92));
      const vacant = !character.small&&random(request.seed, parcel.channel + 17000) < (tribal ? 0.24 : radial > 0.8 ? 0.10 : 0.035);
      const worldDistrict = parcel.polygon.map(toWorld);
      const occupied = insetPolygon(parcel.polygon, roadGap);
      if (occupied.length < 3) continue;
      occupiedParcels.push(parcel.polygon);
      let kind = radial < (modern ? 0.30 : 0.46) ? "old-town" : modern ? "planned-extension" : "residential";
      const worldCentre = toWorld(centre);
      const cores = request.recipe.urban.coreZones || [];
      const nearestCore = cores.reduce((best, core) => {
        const distance = Math.hypot((worldCentre.row - core.row) / request.radiusRows, (worldCentre.column - core.column) / request.radiusColumns);
        return !best || distance < best.distance ? {core, distance} : best;
      }, null);
      if (nearestCore && nearestCore.distance < 0.12) kind = "civic";
      if (modern && radial > 0.6 && corridors.some(corridor => corridor.kind === "rail" && routeNear(worldCentre, corridor.points, request.radiusRows * 0.25))) kind = "industrial";
      if (vacant) kind = "park";
      for (const points of householdSettlement?[]:clipToLand(occupied.map(toWorld), request.recipe)) {
        blocks.push({points, kind, fill: kind === "park" ? "#c6d3b3" : "#ede5d4", opacity: character.small?"0.24":"0.90"});
        districts.push(worldDistrict);
      }
      if (vacant || character.small&&!character.mobile) continue;
      const lots = [];
      const density = radial < 0.46 ? 1.1 : 0.65 + (1 - radial) * 0.30;
      const perBlock=Math.max(2,Math.min(28,character.buildingCount/Math.max(1,selectedParcels.length)));
      const lotTarget = Math.max(polygonArea(occupied) / (perBlock * density), (modern ? 0.0007 : 0.00028) / (radiusKm * radiusKm));
      const subdivideLots = (polygon, depth, channel) => {
        if (depth >= 5 || polygonArea(polygon) < lotTarget * (0.8 + random(request.seed, channel) * 0.65)) { lots.push({polygon, channel}); return; }
        const division = bisectParcel(polygon, request.seed, channel, kind === "old-town" && !rowHouseStyle ? 0.20 : 0.025);
        if (!division) { lots.push({polygon, channel}); return; }
        // Each subdivision leaves an alley that reaches the parent street.
        const alley = Math.max(0.0009 / radiusKm, roadGap * 0.15);
        streets.push({id:'lane-'+channel,kind:'local',points:division.cut.map(toWorld),alley:true});
        const first = insetPolygon(division.first, alley), second = insetPolygon(division.second, alley);
        if (first.length >= 3) subdivideLots(first, depth + 1, channel * 2 + 1);
        if (second.length >= 3) subdivideLots(second, depth + 1, channel * 2 + 2);
      };
      subdivideLots(occupied, 0, parcel.channel + 30000);
      const lotBounds={west:Math.min(...worldDistrict.map(p=>p.column))-widths.arterial*3,east:Math.max(...worldDistrict.map(p=>p.column))+widths.arterial*3,
        north:Math.min(...worldDistrict.map(p=>p.row))-widths.arterial*3,south:Math.max(...worldDistrict.map(p=>p.row))+widths.arterial*3};
      const parcelStreets=streets.filter(s=>s.points.some((p,i)=>i&&Math.max(p.column,s.points[i-1].column)>=lotBounds.west
        &&Math.min(p.column,s.points[i-1].column)<=lotBounds.east&&Math.max(p.row,s.points[i-1].row)>=lotBounds.north&&Math.min(p.row,s.points[i-1].row)<=lotBounds.south));
      const parcelRoadIndex=character.mobile?null:streetClearanceIndex(parcelStreets,widths,request.center,.05/metric);
      for (const lot of lots) {
        let homes;
        if(character.mobile){
          const inset=Math.sqrt(polygonArea(lot.polygon))*.50*(.7+random(request.seed,lot.channel)*.5),shape=insetPolygon(lot.polygon,inset);
          if(shape.length<3)continue;const c=polygonCentre(shape),r=Math.sqrt(polygonArea(shape))*.31,
            points=Array.from({length:12},(_,i)=>toWorld({x:c.x+Math.cos(i*Math.PI/6)*r,y:c.y+Math.sin(i*Math.PI/6)*r}));
          homes=completeBuildingGround(points,request.recipe)?[{points,index:0,rank:random(request.seed,lot.channel+9201)}]:[];
        }else homes=frontageBuilding(lot.polygon.map(toWorld),parcelStreets,request.recipe,lot.channel,
          {courtyard:courtyardStyle,rowHouse:rowHouseStyle,industrial:kind==='industrial',modern,roadIndex:parcelRoadIndex,
            capacity:Math.max(1,Math.min(64,Math.ceil(polygonArea(lot.polygon)*householdDensity*2)))});
        for (const home of homes) {
          const {points}=home;
          if (fortress && polygonsOverlap(points, fortress.clearancePoints)) continue;
          if (protectedRoutes.some(route => polygonNearRoute(points, route.points, (route.kind === "collector" ? widths.collector : widths.arterial) * 0.75))) continue;
          if (plazas.some(plaza => polygonsOverlap(points, plaza.points))) continue;
          const foundation=completeBuildingFoundation(points,request.recipe);
          if(foundation.reliefMetres>3.5)continue;
          const harbor=request.recipe.harbor;
          if(harbor?.reservedLand&&polygonsOverlap(points,harbor.reservedLand))continue;
          const building = {...home,kind,foundation, material:character.material.name,
            roof:character.mobile?'dome':courtyardStyle?'hip':['arcaded','terraced'].includes(character.style)?'flat':'gable',
            fill: palette[Math.floor(random(request.seed,lot.channel+9200+home.index*7)*palette.length)]};
          if (courtyardStyle && !tribal && kind !== "industrial") {
            const polygon = points.map(point => ({x: point.column, y: point.row}));
            const inner = insetPolygon(polygon, Math.sqrt(polygonArea(polygon)) * (request.culturalStyle === "walled-compound" ? 0.16 : 0.23));
            if (inner.length >= 3) building.courtyard = inner.map(point => ({column: point.x, row: point.y}));
          }
          building.roofLines = roofLines(building.points, building.courtyard);
          buildings.push(building);
        }
      }
    }
    if(character.small&&!character.mobile)buildings.push(...settlementFrontageBuildings(request,streets,character.defence.layers>0?districtPolygons:[footprint],plazas,fortress,widths,metric));
    let safeStreets=streets;
    for(const plaza of plazas)safeStreets=safeStreets.flatMap(street=>streetOutsidePolygon(street,plaza.points));
    if(fortress)safeStreets=safeStreets.flatMap(street=>street.fortressAccess?[street]:streetOutsidePolygon(street,fortress.clearancePoints));
    safeStreets=safeStreets.flatMap(street=>clipStreetToLand(street,request.recipe));
    safeStreets=streetsClearOfWalls(safeStreets,[...walls,...innerWalls],request,widths);
    joinStreetLanes(safeStreets,request,widths,plazas,fortress,buildings,[...walls,...innerWalls]);
    const barbicans=character.defence.barbicans?createBarbicans(gates,request,widths):[];
    const towers = wallTowers([...walls, ...innerWalls], request, metric, safeStreets,gates);
    const rural=countryHouses(request,corridors,occupiedParcels.map(polygon=>polygon.map(toWorld)),metric,widths);
    const reservations=gates.flatMap(gate=>gate.towers).concat(towers.map(t=>t.points),barbicans.map(b=>b.points));
    const roadIndex=streetClearanceIndex(safeStreets,widths,request.center,.075/metric);
    let safeBuildings=buildings.filter(building=>!reservations.some(points=>polygonsOverlap(building.points,points))
      &&![...walls,...innerWalls].some(wall=>polygonNearRoute(building.points,wall,widths.collector*1.8))
      &&!roadIndex.intersects(building.points));
    rural.houses=rural.houses.filter(house=>!barbicans.some(b=>polygonsOverlap(house.points,b.points)));
    assignStreetNames(safeStreets,request,gates,landmarks);
    const moats=defensiveDitches(request,fortress,innerParcels.map(parcel=>parcel.polygon),toWorld,safeStreets,landmarks);
    safeBuildings=safeBuildings.filter(building=>!moats.some(m=>polygonNearRoute(building.points,m.points.concat(m.points[0]),m.widthMetres/1500/metric)));
    safeBuildings=attachBuildingFrontages(safeBuildings,safeStreets,request.recipe);
    if(safeBuildings.length>character.buildingCount)safeBuildings=safeBuildings.sort((a,b)=>a.rank-b.rank).slice(0,character.buildingCount);
    const farmland=(request.recipe.localSite?.farmland||[]).filter(field=>!request.recipe.harbor?.reservedLand||!polygonsOverlap(field.points,request.recipe.harbor.reservedLand))
      .filter(field=>!rural.lanes.some(lane=>polygonNearRoute(field.points,lane,widths.local*1.2))
      &&!rural.houses.some(house=>polygonsOverlap(field.points,house.points)));
    return {footprint,blocks,districts,streets:safeStreets,buildings:safeBuildings,farmland,
      walls,innerWalls,wallSpans,innerWallSpans,enclosures:districtPolygons,innerEnclosures,towers,gates,gateStreets,barbicans,moats,plazas,landmarks,countryside:rural.houses,countryLanes:rural.lanes,hamlets:rural.hamlets,fortress};
  }

  function boundsIndex(entries,center,size){
    const bins=new Map(),keys=b=>{const out=[];
      for(let y=Math.floor((b.north-center.row)/size);y<=Math.floor((b.south-center.row)/size);y++)
        for(let x=Math.floor((b.west-center.column)/size);x<=Math.floor((b.east-center.column)/size);x++)out.push(x+','+y);
      return out;
    };
    for(const [index,entry] of entries.entries())for(const key of keys(entry.bounds)){
      if(!bins.has(key))bins.set(key,[]);bins.get(key).push(index);
    }
    return bounds=>Array.from(new Set(keys(bounds).flatMap(key=>bins.get(key)||[])))
      .sort((a,b)=>a-b).map(index=>entries[index]);
  }

  function streetClearanceIndex(streets,widths,center,size){
    const entries=[];
    for(const street of streets)for(let i=1;i<street.points.length;i++){
      const a=street.points[i-1],b=street.points[i],width=(widths[street.kind]||widths.local)*.60,entry={points:[a,b],width};
      entry.bounds={west:Math.min(a.column,b.column)-width,east:Math.max(a.column,b.column)+width,
        north:Math.min(a.row,b.row)-width,south:Math.max(a.row,b.row)+width};entries.push(entry);
    }
    const candidates=boundsIndex(entries,center,size);
    return {intersects(points){for(const entry of candidates(polygonBounds(points)))
      if(polygonNearRoute(points,entry.points,entry.width))return true;return false;}};
  }

  function usefulWallSegments(points,request,enclosures){
    const site=request.recipe.localSite;if(!site)return [points];
    const m=request.recipe.urban.gridCellKilometres,a=points[0],z=points.at(-1),
      dx=(z.column-a.column)*m.column,dy=(z.row-a.row)*m.row,length=Math.hypot(dx,dy);
    if(length<1e-8)return [];
    const steps=Math.max(1,Math.ceil(length/.02)),out=[];let run=[];
    const at=t=>t===0?a:t===1?z:({column:a.column+(z.column-a.column)*t,row:a.row+(z.row-a.row)*t});
    const inside=p=>enclosures.some(polygon=>containsPoint(polygon,{x:p.column,y:p.row}));
    const normal={x:-dy/length,y:dx/length},midpoint=at(.5),
      probe={column:midpoint.column+normal.x*.0001/m.column,row:midpoint.row+normal.y*.0001/m.row},
      outward=inside(probe)?{x:-normal.x,y:-normal.y}:normal,
      reach=Math.max(.06,Math.min(.20,request.recipe.urban.radiusKm*.14)),
      exterior=p=>({column:p.column+outward.x*.0001/m.column,row:p.row+outward.y*.0001/m.row});
    const useful=p=>{
      // A broad, continuous water reach outside the enclosure replaces a
      // shore wall. A nearby creek, an inland pond, or water behind the wall
      // does not. Surface dryness includes both sea and raised lake water.
      if(site.surface&&!inside(exterior(p))){
        let waterRun=0;
        for(let distance=.01;distance<=reach+.06+1e-8;distance+=.01){
          const q={column:p.column+outward.x*distance/m.column,row:p.row+outward.y*distance/m.row};
          const bounds=site.surface.bounds;
          if(q.column<bounds.west||q.column>bounds.east||q.row<bounds.north||q.row>bounds.south)break;
          if(global.WorldAtlasCitySite.isDry(site.surface,q))waterRun=0;
          else if(++waterRun>=7)return false;
        }
      }
      return !site.channels.some(channel=>{
      const near=global.WorldAtlasCitySite.distanceToChannel(p,channel,m);
      if(near.widthMetres<50||near.distance>near.widthMetres/2000+.035)return false;
      // Only a parallel bank wall is redundant. A transverse land wall may
      // terminate at a river, leaving the water as the remaining barrier.
      return channel.points.slice(1).some((b,i)=>{const c=channel.points[i],q=nearestPoint(p,c,b),
        cx=(b.column-c.column)*m.column,cy=(b.row-c.row)*m.row,d=Math.hypot((p.column-q.column)*m.column,(p.row-q.row)*m.row);
        return d<near.widthMetres/2000+.035&&((q.column-p.column)*m.column*outward.x+(q.row-p.row)*m.row*outward.y)>=-1e-6
          &&Math.abs(dx*cx+dy*cy)/(length*Math.hypot(cx,cy))>.75;});
      });
    };
    for(let i=0;i<steps;i++){
      if(useful(at((i+.5)/steps))){if(!run.length)run.push(at(i/steps));run.push(at((i+1)/steps));}
      else if(run.length){out.push([run[0],run.at(-1)]);run=[];}
    }
    if(run.length)out.push([run[0],run.at(-1)]);return out;
  }

  function assignStreetNames(streets,request,gates,landmarks){
    const character=request.character,groups=new Map(),used=new Set(),words=character.tradition.streets,
      rotation=Math.floor(random(request.recipe.seed,request.recipe.culture?.civilizationId||0)*words.length);
    for(const street of streets){
      if(street.palacePerimeter||street.palaceAccess){street.name=null;continue;}
      if(street.kind==='rail'||street.kind==='local'||street.alley)continue;
      const key=street.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(street);}
    let index=0;
    for(const [id,segments] of groups){const main=segments.reduce((a,b)=>Math.hypot(...[a.points.at(-1).column-a.points[0].column,a.points.at(-1).row-a.points[0].row])>
      Math.hypot(...[b.points.at(-1).column-b.points[0].column,b.points.at(-1).row-b.points[0].row])?a:b),points=main.points;
      let name=null,nearest=Infinity;
      for(const destination of gates.map(g=>({name:g.name,p:g.center})).concat(landmarks.filter(l=>l.kind.indexOf('-wing')<0).map(l=>({name:l.name,p:{row:l.points.reduce((s,p)=>s+p.row,0)/l.points.length,column:l.points.reduce((s,p)=>s+p.column,0)/l.points.length}})))){
        const d=Math.min(...points.map(p=>Math.hypot(p.row-destination.p.row,p.column-destination.p.column)));
        const candidate=destination.name+(character.plan==='axial'?'大街':'路');
        if(d<request.radiusRows*.08&&d<nearest&&!used.has(candidate)){nearest=d;name=candidate;}
      }
      if(id.includes('harbor-access'))name=character.prefix+'港埠路';
      if(id==='urban-river-spine')name=character.prefix+'通桥大街';
      if(!name||used.has(name)){
        const word=words[(rotation+index)%words.length],cycle=Math.floor(index/words.length),
          zone=cycle?['上','下','东','西','南','北'][cycle%6]:main.kind==='arterial'?character.prefix:'';
        name=zone+word+(main.kind==='arterial'&&character.plan==='axial'?'大街':character.mobile?'道':'街');
        while(used.has(name))name=character.prefix+name;
      }
      used.add(name);for(const street of segments)street.name=name;index++;
    }
  }

  function defensiveDitches(request,fortress,innerParcels,toWorld,streets,landmarks){
    const site=request.recipe.localSite;if(!site||!request.character.defence.layers||!['plain','hills'].includes(site.form.kind))return [];
    const candidates=[];
    if(fortress?.moatEligible)candidates.push({points:fortress.clearancePoints,name:request.character.prefix+'卫城'});
    if(request.character.capital&&innerParcels.length){
      const points=innerParcels.flatMap(p=>p.map(toWorld)),sorted=points.map(p=>({x:p.column,y:p.row})).sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lower=[],upper=[];
      for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
      for(const p of sorted.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
      candidates.push({points:lower.slice(0,-1).concat(upper.slice(0,-1)).map(p=>({column:p.x,row:p.y})),name:'内城'});
    }
    const result=[],metric=gridCellKilometres(request.recipe,request.radiusRows,request.radiusColumns);
    for(const candidate of candidates){if(candidate.points.length<3)continue;
      const centre=polygonCentre(candidate.points.map(p=>({x:p.column,y:p.row}))),points=candidate.points.map(p=>{
        const dx=p.column-centre.x,dy=p.row-centre.y,len=Math.hypot(dx,dy);return {column:p.column+dx/len*.024/metric,row:p.row+dy/len*.024/metric};});
      if(!points.every((p,i)=>segmentOnLand(p,points[(i+1)%points.length],request.recipe))||landmarks.some(l=>polygonNearRoute(l.compoundPoints,points.concat(points[0]),.012/metric)))continue;
      const foundation=foundationAt(points,request.recipe);if(foundation.reliefMetres>8)continue;
      const wet=foundation.reliefMetres<1.8&&site.channels.length>0,widthMetres=candidate.name==='内城'?18:12,crossings=[];
      for(const street of streets.filter(s=>s.kind!=='local'))for(let i=1;i<street.points.length;i++)for(let j=0;j<points.length;j++){
        const a=street.points[i-1],b=street.points[i],c=points[j],d=points[(j+1)%points.length],dx=b.column-a.column,dy=b.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=dx*sy-dy*sx;
        if(Math.abs(den)<1e-12)continue;const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*dy-(c.row-a.row)*dx)/den;
        if(t<0||t>1||u<0||u>1)continue;const len=Math.hypot(dx,dy),half=widthMetres/1500/metric;
        crossings.push([-1,1].map(sign=>({column:a.column+dx*t+dx/len*half*sign,row:a.row+dy*t+dy/len*half*sign})));
      }
      result.push({points,name:candidate.name+(wet?'护城河':'防御壕'),wet,widthMetres,crossings,foundation});
    }return result;
  }

  function createBarbicans(gates,request,widths){
    const courts=[],{m,distance,shift}=defenceMetric(request),
      width=widths.arterial*(m.column+m.row)*.5,depth=Math.max(width*4,.065),opening=width*.9,
      roads=[...(request.recipe.transport?.corridors||[]),...(request.recipe.localSite?.ruralRoads||[])].filter(road=>road.kind==='road');
    for(const gate of gates.filter(g=>g.layer==='outer')){
      if(courts.length>=4)break;
      const normal=gate.outward,tangent={x:-normal.y,y:normal.x},
        local=p=>{const x=(p.column-gate.center.column)*m.column,y=(p.row-gate.center.row)*m.row;
          return {x:x*tangent.x+y*tangent.y,y:x*normal.x+y*normal.y};},
        at=(x,y)=>shift(gate.center,tangent.x*x+normal.x*y,tangent.y*x+normal.y*y);
      let entrance=null;
      // The routed approach already passes through the main gate. Follow it
      // to the outer court wall instead of inventing another straight exit.
      for(const road of roads){
        const index=road.points.findIndex(p=>distance(p,gate.center)<1e-6);if(index<0)continue;
        for(const direction of [-1,1]){
          const access=[gate.center];
          for(let i=index+direction;i>=0&&i<road.points.length;i+=direction){
            const a=access.at(-1),b=road.points[i],first=local(a),last=local(b);
            if(last.y<-.001)break;
            if(first.y<=depth&&last.y>=depth&&last.y-first.y>1e-9){
              const t=(depth-first.y)/(last.y-first.y),front={column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t},x=local(front).x;
              if(Math.abs(x)>depth)break;
              access.push(front);const remaining=distance(front,b);
              if(remaining>1e-8){const fraction=Math.min(1,width/remaining);access.push({column:front.column+(b.column-front.column)*fraction,row:front.row+(b.row-front.row)*fraction});}
              entrance={x,access};break;
            }
            if(Math.hypot(last.x,last.y)>depth*3)break;access.push(b);
          }
          if(entrance)break;
        }
        if(entrance)break;
      }
      if(!entrance)continue;
      const half=Math.max(width*2.2,.026,Math.abs(entrance.x)+opening+widths.collector*(m.column+m.row)/2*1.4+.002);
      const points=[at(-half,0),at(half,0),at(half,depth),at(-half,depth)];
      if(!points.every((p,i)=>segmentOnLand(gate.center,p,request.recipe)&&segmentOnLand(p,points[(i+1)%points.length],request.recipe)))continue;
      const walls=[[points[0],points[3]],[points[1],points[2]],[points[3],at(entrance.x-opening,depth)],[at(entrance.x+opening,depth),points[2]]],access=entrance.access;
      if(!access.every((p,i)=>!i||segmentOnLand(access[i-1],p,request.recipe)))continue;
      courts.push({points,walls,access,gateId:gate.id,name:gate.name+'瓮城'});
    }return courts;
  }

  // Villages grow beside connected lanes, rather than inside urban BSP blocks.
  // Every lane uses the same dry ground and metre slope constraints as houses.
  function villageStreets(request,outline,toWorld,radiusKm){
    const recipe=request.recipe,m=recipe.urban.gridCellKilometres,
      n=Math.max(17,Math.min(65,Math.ceil(radiusKm*2/.012)+1)),points=[],allowed=[],links=[],roads=[],network=new Set(),
      distance=(a,b)=>Math.hypot((a.column-b.column)*m.column,(a.row-b.row)*m.row),
      phase=random(request.seed,58001)*Math.PI*2,ordered=request.character.court,
      roadGround=request.character.defence.layers>0?insetPolygon(outline,.016/radiusKm):outline;
    let garrisonParcel=null;
    if(request.character.defence.layers>0){
      const half=Math.min(.22,.070/radiusKm),sites=[],garrisonGround=insetPolygon(outline,.050/radiusKm),
        fixedRoads=recipe.localSite?[]:(recipe.transport?.corridors||[]);
      // Leave space for the complete fort pad, ditch and outside city wall.
      for(const [x,y] of [[0,0],[-.30,-.36],[-.30,.36],[.30,-.36],[.30,.36]]){
        const polygon=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>({x:x+dx*half,y:y+dy*half})),world=polygon.map(toWorld);
        if(polygon.every(p=>containsPoint(outline,p))&&world.every((p,i)=>segmentOnLand(p,world[(i+1)%4],recipe))
          &&!fixedRoads.some(road=>polygonNearRoute(world,road.points,.005/gridCellKilometres(recipe,request.radiusRows,request.radiusColumns)))
          &&foundationAt(world,recipe).reliefMetres<4)sites.push({polygon,channel:58003,elevation:foundationAt(world,recipe).elevationMetres,
            moatRoom:garrisonGround.length>=3&&polygon.every(p=>containsPoint(garrisonGround,p))});
      }sites.sort((a,b)=>Number(b.moatRoom)-Number(a.moatRoom)||b.elevation-a.elevation);garrisonParcel=sites[0]||null;
    }
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x/(n-1)*2-1,v=y/(n-1)*2-1,
        p={x:u,y:v+(ordered?.012:.055)*Math.sin(u*3+phase)*Math.cos(v*1.4)},world=toWorld(p);
      points.push(world);allowed.push(containsPoint(roadGround,p)&&(!garrisonParcel||!containsPoint(garrisonParcel.polygon,p))&&segmentOnLand(world,world,recipe));links.push([]);
    }
    for(let i=0;i<points.length;i++)if(allowed[i]){
      const x=i%n,y=Math.floor(i/n);
      for(const [sx,sy] of [[1,0],[0,1],[1,1],[-1,1]]){
        if(x+sx<0||x+sx>=n||y+sy>=n)continue;const j=i+sy*n+sx;
        if(!allowed[j]||!segmentOnLand(points[i],points[j],recipe)
          ||garrisonParcel&&clipToDistricts({points:[points[i],points[j]]},[garrisonParcel.polygon.map(toWorld)]).length)continue;
        const length=distance(points[i],points[j]),heights=recipe.localSite?.surface,
          grade=heights?Math.abs(global.WorldAtlasCitySite.elevationAt(heights,points[i])-global.WorldAtlasCitySite.elevationAt(heights,points[j]))/(length*1000):0;
        if(grade>.12)continue;
        const cost=length*(1+grade*12);links[i].push([j,cost]);links[j].push([i,cost]);
      }
    }
    const pathsFrom=sources=>{
      const costs=new Float64Array(points.length).fill(Infinity),parents=new Int32Array(points.length).fill(-1),heap=[];
      const put=(i,cost)=>{let k=heap.length;heap.push([i,cost]);while(k){const p=(k-1)>>1;if(heap[p][1]<=cost)break;heap[k]=heap[p];k=p;}heap[k]=[i,cost];};
      const take=()=>{const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let c=k*2+1;if(c+1<heap.length&&heap[c+1][1]<heap[c][1])c++;if(heap[c][1]>=last[1])break;heap[k]=heap[c];k=c;}heap[k]=last;}return first;};
      for(const i of sources){costs[i]=0;put(i,0);}
      while(heap.length){const [i,cost]=take();if(cost!==costs[i])continue;
        for(const [j,weight] of links[i])if(cost+weight<costs[j]){costs[j]=cost+weight;parents[j]=i;put(j,costs[j]);}}
      return {costs,parents};
    };
    const nearest=(target,reach)=>{let best=-1,minimum=Infinity;for(let i=0;i<points.length;i++)if(allowed[i]&&(!reach||Number.isFinite(reach.costs[i]))){
      const d=distance(points[i],target);if(d<minimum){minimum=d;best=i;}}return best;};
    const root=nearest(request.center);if(root<0)return {streets:[],garrisonParcel};
    const reachable=pathsFrom([root]),trace=(target,map)=>{const path=[];for(let i=target;i>=0;i=map.parents[i])path.push(i);return path.reverse();};
    const add=(indices,kind)=>{
      if(indices.length<2)return;indices.forEach(i=>network.add(i));
      roads.push({kind,indices});
    };
    const first=nearest(toWorld({x:-.83,y:0}),reachable),last=nearest(toWorld({x:.83,y:0}),reachable);
    add(trace(first,reachable).reverse().concat(trace(last,reachable).slice(1)),'collector');
    const spine=Array.from(network);
    const neededLength=request.character.buildingCount*.0065,
      lanes=Math.max(1,Math.min(12,Math.ceil(neededLength/(radiusKm*1.42))-1)),cross=Math.max(.34,Math.max(...outline.map(p=>Math.abs(p.y)))*.72);
    for(let band=0;band<lanes;band++){
      const y=((band+1)/(lanes+1)*2-1)*cross;
      if(Math.abs(y)<.08)continue;
      const a=nearest(toWorld({x:-.76,y}),reachable),b=nearest(toWorld({x:.76,y}),reachable),map=pathsFrom([a]),line=trace(b,map);
      if(line.length<2)continue;
      const target=toWorld({x:(band%2?.48:-.48),y}),at=line.reduce((best,i)=>distance(points[i],target)<distance(points[best],target)?i:best,line[0]),connect=pathsFrom(network);
      add(trace(at,connect),'local');add(line,'local');
      // A second junction makes a loop, so each lane has alternatives to a hub.
      const other=line[Math.floor(line.length*(band%2?.18:.82))],aim=toWorld({x:band%2?-.55:.55,y:0}),
        junction=spine.reduce((best,i)=>distance(points[i],aim)<distance(points[best],aim)?i:best,spine[0]);
      add(trace(other,pathsFrom([junction])),'local');
    }
    // The landing is a destination on the same graph. Rural routing can then
    // continue from this exact entrance to the quay without a detached port.
    if(recipe.harbor&&request.character.defence.layers===0){
      const entrance=recipe.harbor.landPoint,target=nearest(entrance,reachable),map=pathsFrom(network);
      add(trace(target,map),'collector');
      if(segmentOnLand(points[target],entrance,recipe)&&distance(points[target],entrance)<radiusKm*.8){
        points.push(entrance);add([target,points.length-1],'collector');
      }
    }
    // Join shared graph edges before smoothing, retaining every real junction.
    const graph=new Map(),edges=new Map(),visited=new Set(),result=[],key=(a,b)=>a<b?a+':'+b:b+':'+a;
    for(const road of roads)for(let k=1;k<road.indices.length;k++){
      const a=road.indices[k-1],b=road.indices[k];if(a===b)continue;
      if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a).add(b);graph.get(b).add(a);
      const id=key(a,b);if(!edges.has(id)||road.kind==='collector')edges.set(id,road.kind);
    }
    const chain=(start,next)=>{const indices=[start],kinds=[];let a=start,b=next;
      while(!visited.has(key(a,b))){visited.add(key(a,b));kinds.push(edges.get(key(a,b)));indices.push(b);
        if(graph.get(b).size!==2)break;const c=Array.from(graph.get(b)).find(i=>i!==a);a=b;b=c;
      }
      const path=indices.map(i=>points[i]),simplified=[path[0]];
      for(let start=0;start<path.length-1;){let end=start+1;
        for(let next=end+1;next<path.length;next++){
          if(!segmentOnLand(path[start],path[next],recipe)
            ||garrisonParcel&&clipToDistricts({points:[path[start],path[next]]},[garrisonParcel.polygon.map(toWorld)]).length
            ||path.slice(start+1,next).some(p=>distance(p,nearestPoint(p,path[start],path[next]))>.001))break;
          end=next;
        }simplified.push(path[end]);start=end;
      }
      if(simplified.length>1)result.push({id:'village-lane-'+result.length,kind:kinds.includes('collector')?'collector':'local',points:simplified,village:true});
    };
    for(const [a,neighbours] of graph)if(neighbours.size!==2)for(const b of neighbours)if(!visited.has(key(a,b)))chain(a,b);
    for(const [a,neighbours] of graph)for(const b of neighbours)if(!visited.has(key(a,b)))chain(a,b);
    return {streets:result,garrisonParcel};
  }

  function settlementFrontageBuildings(request,streets,districts,plazas,fortress,widths,metric) {
    const candidates=[],buildings=[],recipe=request.recipe,m=recipe.urban.gridCellKilometres||{},
      rowMetric=m.row||metric,columnMetric=m.column||metric,
      roadIndex=streetClearanceIndex(streets,widths,request.center,.035/metric),
      localDistricts=districts.map(points=>points.map(p=>({x:p.column,y:p.row})));
    for(const [streetIndex,street] of streets.entries())if(street.kind!=='rail'&&!street.access)for(let segment=1;segment<street.points.length;segment++){
      const a=street.points[segment-1],b=street.points[segment],dx=(b.column-a.column)*columnMetric,dy=(b.row-a.row)*rowMetric,length=Math.hypot(dx,dy);
      if(length<.014)continue;
      const count=Math.floor(length/.0105),u={x:dx/length,y:dy/length},v={x:-u.y,y:u.x};
      for(let index=0;index<count;index++)for(const side of [-1,1]){
        const channel=62000+streetIndex*7919+segment*631+index*17+(side+1),
          front=.006+random(request.seed,channel)*.004,depth=.008+random(request.seed,channel+1)*.004,
          fraction=(index+.45+random(request.seed,channel+2)*.10)/count,
          roadWidth=(widths[street.kind]||widths.local)*metric,
          setback=roadWidth*.65+.0018+depth*.5;
        const center={column:a.column+(dx*fraction+v.x*setback*side)/columnMetric,row:a.row+(dy*fraction+v.y*setback*side)/rowMetric};
        const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({
          column:center.column+(u.x*x*front*.5+v.x*y*depth*.5)/columnMetric,
          row:center.row+(u.y*x*front*.5+v.y*y*depth*.5)/rowMetric}));
        if(!points.every(p=>localDistricts.some(d=>containsPoint(d,{x:p.column,y:p.row})))
          ||roadIndex.intersects(points)
          ||plazas.some(plaza=>polygonsOverlap(points,plaza.points))
          ||fortress&&polygonsOverlap(points,fortress.clearancePoints)
          ||recipe.harbor?.reservedLand&&polygonsOverlap(points,recipe.harbor.reservedLand)
          ||!completeBuildingGround(points,recipe))continue;
        const foundation=foundationAt(points,recipe);if(foundation.reliefMetres>3.5)continue;
        const entrance={column:center.column-v.x*depth*.5*side/columnMetric,row:center.row-v.y*depth*.5*side/rowMetric},
          access={column:a.column+dx*fraction/columnMetric,row:a.row+dy*fraction/rowMetric};
        if(!segmentOnLand(entrance,access,recipe))continue;
        candidates.push({points,entrance,access,foundation,channel,distance:Math.hypot((center.column-request.center.column)*columnMetric,(center.row-request.center.row)*rowMetric)});
      }
    }
    candidates.sort((a,b)=>a.distance-b.distance||a.channel-b.channel);
    for(const home of candidates){
      if(buildings.length>=request.character.buildingCount)break;
      if(buildings.some(building=>polygonsOverlap(home.points,building.points)))continue;
      const roof=['arcaded','terraced'].includes(request.character.style)?'flat':'gable';
      buildings.push({points:home.points,entrance:home.entrance,access:[home.entrance,home.access],foundation:home.foundation,
        kind:'residential',material:request.character.material.name,roof,roofLines:roofLines(home.points),
        fill:request.character.roof[Math.floor(random(request.seed,home.channel+9200)*request.character.roof.length)]});
    }
    return buildings;
  }

  function frontageBuilding(polygon,streets,recipe,channel,{courtyard,rowHouse,industrial,modern,roadIndex,capacity}) {
    const metric=recipe.urban.gridCellKilometres,origin=polygon[0],
      toMetres=p=>({x:(p.column-origin.column)*metric.column*1000,y:(p.row-origin.row)*metric.row*1000}),
      local=polygon.map(toMetres),bounds=polygonBounds(polygon),homes=[],candidates=[],
      widths=streetWidthsInGrid(recipe,recipe.urban.radiusRows,recipe.urban.radiusColumns),gridMetric=gridCellKilometres(recipe,recipe.urban.radiusRows,recipe.urban.radiusColumns),
      houseWidth=industrial?[18,34]:courtyard?[12,22]:rowHouse?[6,10]:modern?[9,18]:[7,13],
      houseDepth=industrial?[24,46]:courtyard?[14,25]:rowHouse?[10,18]:modern?[12,24]:[9,17];
    for(const [streetIndex,street] of streets.entries())if(street.kind!=='rail'&&!street.plaza&&!street.palacePerimeter)for(let segment=1;segment<street.points.length;segment++){
      const start=street.points[segment-1],end=street.points[segment],margin=.035,
        expanded={west:bounds.west-margin/metric.column,east:bounds.east+margin/metric.column,north:bounds.north-margin/metric.row,south:bounds.south+margin/metric.row};
      if(Math.max(start.column,end.column)<expanded.west||Math.min(start.column,end.column)>expanded.east
        ||Math.max(start.row,end.row)<expanded.north||Math.min(start.row,end.row)>expanded.south)continue;
      const a=toMetres(start),b=toMetres(end),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<houseWidth[0])continue;
      const u={x:dx/length,y:dy/length},baseNormal={x:-u.y,y:u.x},roadWidth=(widths[street.kind]||widths.local)*gridMetric*1000;
      for(const side of [-1,1]){
        const salt=channel+streetIndex*7919+segment*131+(side+1)*191,normal={x:baseNormal.x*side,y:baseNormal.y*side},
          at=(x,y)=>({column:origin.column+(a.x+u.x*x+normal.x*y)/metric.column/1000,
            row:origin.row+(a.y+u.y*x+normal.y*y)/metric.row/1000}),
          projected=local.map(p=>({x:(p.x-a.x)*u.x+(p.y-a.y)*u.y,y:(p.x-a.x)*normal.x+(p.y-a.y)*normal.y}));
        if(side<0)projected.reverse();
        // Erode the convex plot by the actual house rectangle. Its remaining
        // polygon contains all legal centres, so narrow tips cannot turn into
        // tiny buildings and no building needs iterative shrink or clipping.
        const width=houseWidth[0]+random(recipe.seed,salt+12100)*(houseWidth[1]-houseWidth[0]),
          depth=houseDepth[0]+random(recipe.seed,salt+12101)*(houseDepth[1]-houseDepth[0]),halfW=width/2,halfD=depth/2;
        let centres=projected;
        for(let edge=0;edge<projected.length&&centres.length>=3;edge++){
          const p=projected[edge],q=projected[(edge+1)%projected.length],nx=q.y-p.y,ny=p.x-q.x;
          centres=clipHalfPlane(centres,nx,ny,p.x*nx+p.y*ny-Math.abs(nx)*halfW-Math.abs(ny)*halfD);
        }
        centres=clipHalfPlane(centres,-1,0,0);centres=clipHalfPlane(centres,1,0,length);
        centres=clipHalfPlane(centres,0,-1,-(roadWidth*.65+1.4+halfD));
        centres=clipHalfPlane(centres,0,1,35+halfD);
        if(centres.length<3)continue;
        const minimumY=Math.min(...centres.map(p=>p.y)),maximumY=Math.max(...centres.map(p=>p.y)),
          y=minimumY+Math.min(.5,(maximumY-minimumY)*.20),intercepts=[];
        for(let edge=0;edge<centres.length;edge++){
          const p=centres[edge],q=centres[(edge+1)%centres.length];
          if((p.y<=y&&q.y>=y)||(q.y<=y&&p.y>=y)){
            if(Math.abs(q.y-p.y)<1e-8)intercepts.push(p.x,q.x);else intercepts.push(p.x+(q.x-p.x)*(y-p.y)/(q.y-p.y));
          }
        }
        if(!intercepts.length)continue;
        const west=Math.min(...intercepts),east=Math.max(...intercepts),gap=rowHouse?.8:1.2+random(recipe.seed,salt+12102)*2.8,
          count=Math.max(1,Math.min(capacity*2,1+Math.floor((east-west)/(width+gap)))),pitch=count>1?(east-west)/(count-1):0,
          first=count>1?west:(west+east)*.5;
        for(let index=0;index<count;index++){
          const front=width*(.84+random(recipe.seed,salt+index*29+12201)*.16),deep=depth*(.88+random(recipe.seed,salt+index*29+12202)*.12),
            x=first+index*pitch,points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>at(x+sx*front/2,y+sy*deep/2));
          if(side<0)points.reverse();
          const entrance=at(x,y-deep/2),roadPoint=at(x,0);
          candidates.push({points,entrance,access:[entrance,roadPoint],index:salt+index,
            frontage:{streetId:street.id||null,roadPoint,widthMetres:front,depthMetres:deep},rank:random(recipe.seed,salt+index*29+12300)});
        }
      }
    }
    candidates.sort((a,b)=>a.rank-b.rank);
    for(const home of candidates){
      if(homes.length===capacity)break;
      if(!completeBuildingGround(home.points,recipe)||!segmentOnLand(home.entrance,home.access.at(-1),recipe)||roadIndex.intersects(home.points))continue;
      if(homes.some(other=>polygonsOverlap(home.points,other.points)
        ||polygonNearRoute(home.points,other.access,.0008/gridMetric)||polygonNearRoute(other.points,home.access,.0008/gridMetric)))continue;
      homes.push(home);
    }return homes;
  }

  function completeBuildingSamples(points){
    const center=polygonCentre(points.map(p=>({x:p.column,y:p.row}))),samples=points.slice();
    samples.push({column:center.x,row:center.y});
    for(let i=0;i<points.length;i++)samples.push({column:(points[i].column+points[(i+1)%points.length].column)/2,
      row:(points[i].row+points[(i+1)%points.length].row)/2});
    return samples;
  }

  function completeBuildingGround(points,recipe){
    const surface=recipe.localSite?.surface;
    if(surface){
      const b=surface.bounds,box=polygonBounds(points);
      if(box.west<b.west||box.east>b.east||box.north<b.north||box.south>b.south)return false;
      const firstX=Math.floor((box.west-b.west)/(b.east-b.west)*(surface.columns-1)),
        lastX=Math.min(surface.columns-1,Math.ceil((box.east-b.west)/(b.east-b.west)*(surface.columns-1))),
        firstY=Math.floor((box.north-b.north)/(b.south-b.north)*(surface.rows-1)),
        lastY=Math.min(surface.rows-1,Math.ceil((box.south-b.north)/(b.south-b.north)*(surface.rows-1)));
      let entirelyAllowed=!(surface.lakeTerrain||[]).some(field=>box.east>=field.bounds.west&&box.west<=field.bounds.east
        &&box.south>=field.bounds.north&&box.north<=field.bounds.south);
      for(let y=firstY;y<=lastY&&entirelyAllowed;y++)for(let x=firstX;x<=lastX;x++){
        const i=y*surface.columns+x;
        if(surface.elevationMetres[i]<=0||surface.slopes[i]>=.20||(surface.lakeDepths&&surface.lakeDepths[i]>=0)){entirelyAllowed=false;break;}
      }
      // Triangle heights and bilinear slopes are weighted node values. When
      // every covered node is legal the entire roof is legal, without repeated
      // route sampling. At a terrain boundary require the exact original area.
      if(!entirelyAllowed){
        const area=polygonArea(points.map(p=>({x:p.column,y:p.row}))),
          available=clipToLand(points,recipe).reduce((sum,part)=>sum+polygonArea(part.map(p=>({x:p.column,y:p.row}))),0);
        if(Math.abs(available-area)>Math.max(1e-14,area*1e-7))return false;
      }
    }else if(!points.every((p,i)=>segmentOnLand(p,points[(i+1)%points.length],recipe)))return false;
    return !polygonNearWater(points,recipe);
  }

  function completeBuildingFoundation(points,recipe){
    return foundationAt(completeBuildingSamples(points),recipe);
  }

  function attachBuildingFrontages(buildings,streets,recipe){
    const m=recipe.urban.gridCellKilometres,byId=new Map();
    for(const street of streets){const id=street.id||null;if(!byId.has(id))byId.set(id,[]);byId.get(id).push(street);}
    return buildings.flatMap(building=>{
      if(!building.frontage)return [building];
      const p=building.frontage.roadPoint;let target=null,minimum=Infinity;
      for(const street of byId.get(building.frontage.streetId)||[])for(let i=1;i<street.points.length;i++){
        const a=street.points[i-1],b=street.points[i],x=(b.column-a.column)*m.column,y=(b.row-a.row)*m.row,
          t=Math.max(0,Math.min(1,((p.column-a.column)*m.column*x+(p.row-a.row)*m.row*y)/(x*x+y*y||1))),
          q={column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t},distance=Math.hypot((q.column-p.column)*m.column,(q.row-p.row)*m.row);
        if(distance<minimum){minimum=distance;target=q;}
      }
      // Lane-end joins can move the segment by a few millimetres. Follow that
      // actual segment, and discard a lot whose only frontage was removed.
      if(!target||minimum>.002||!segmentOnLand(building.entrance,target,recipe))return [];
      return [{...building,access:[building.entrance,target],frontage:{...building.frontage,roadPoint:target}}];
    });
  }

  function joinStreetLanes(streets,request,widths,plazas,fortress,buildings,walls){
    const grounds=plazas.map(plaza=>plaza.points).concat(fortress?[fortress.clearancePoints]:[],buildings.map(building=>building.points)),
      boundedGrounds=grounds.map(points=>({points,bounds:polygonBounds(points)})),clearance=widths.local*.5,
      metric=gridCellKilometres(request.recipe,request.radiusRows,request.radiusColumns),
      candidates=boundsIndex(boundedGrounds,request.center,.075/metric),
      wallIndex=wallClearanceIndex(walls,request,widths);
    joinLaneEnds(streets,widths.arterial*metric*2.5,request.recipe,connection=>{
      const bounds=polygonBounds(connection.points);
      const nearby=candidates({west:bounds.west-clearance,east:bounds.east+clearance,
        north:bounds.north-clearance,south:bounds.south+clearance});
      if(nearby.some(ground=>ground.bounds.east>=bounds.west-clearance&&ground.bounds.west<=bounds.east+clearance
        &&ground.bounds.south>=bounds.north-clearance&&ground.bounds.north<=bounds.south+clearance
        &&polygonNearRoute(ground.points,connection.points,clearance)))return false;
      const clear=wallIndex.clip(clipStreetToLand(connection,request.recipe));
      return clear.length===1&&clear[0].points.length===connection.points.length
        &&clear[0].points.every((p,i)=>Math.hypot(p.column-connection.points[i].column,p.row-connection.points[i].row)<1e-10);
    });
  }

  function joinLaneEnds(streets,maximum,recipe,valid) {
    const origin=recipe.location,m=recipe.urban.gridCellKilometres,bins=new Map(),segments=new Map(),ends=new Map(),
      order=new Map(streets.map((s,i)=>[s,i])),distance=(a,b)=>Math.hypot((a.column-b.column)*m.column,(a.row-b.row)*m.row),
      cell=p=>[Math.floor((p.column-origin.column)*m.column/maximum),Math.floor((p.row-origin.row)*m.row/maximum)],key=p=>cell(p).join(','),
      parent=streets.map((s,i)=>i),root=street=>{let i=order.get(street);while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},
      connect=(a,b)=>{parent[root(a)]=root(b);},project=(p,a,b)=>{
        const dx=(b.column-a.column)*m.column,dy=(b.row-a.row)*m.row,
          t=Math.max(0,Math.min(1,((p.column-a.column)*m.column*dx+(p.row-a.row)*m.row*dy)/(dx*dx+dy*dy||1)));
        return {t,q:{column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t}};
      },nearby=cells=>{const result=new Set();for(const [x,y] of cells)for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
        for(const segment of bins.get(`${x+dx},${y+dy}`)||[])result.add(segment);return result;};
    for(const street of streets)if(street.kind!=='rail')for(let index=1;index<street.points.length;index++){
      const a=street.points[index-1],b=street.points[index],count=Math.max(1,Math.ceil(distance(a,b)/maximum));
      const segment={street,index,a,b,junctions:[],cells:[]},keys=new Set();
      if(!segments.has(street))segments.set(street,[]);segments.get(street).push(segment);
      for(let i=0;i<=count;i++)keys.add(key({column:a.column+(b.column-a.column)*i/count,row:a.row+(b.row-a.row)*i/count}));
      for(const k of keys){segment.cells.push(k.split(',').map(Number));if(!bins.has(k))bins.set(k,[]);bins.get(k).push(segment);}
    }
    for(const parts of segments.values())for(const first of parts)for(const second of nearby(first.cells)){
      if(root(first.street)===root(second.street))continue;
      const {a,b}=first,{a:c,b:d}=second,dx=b.column-a.column,dy=b.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=dx*sy-dy*sx;
      let crossed=false;if(Math.abs(den)>1e-18){const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*dy-(c.row-a.row)*dx)/den;
        crossed=t>=-1e-9&&t<=1+1e-9&&u>=-1e-9&&u<=1+1e-9;}
      if(crossed||Math.min(distance(a,project(a,c,d).q),distance(b,project(b,c,d).q),
        distance(c,project(c,a,b).q),distance(d,project(d,a,b).q))<1e-7)connect(first.street,second.street);
    }
    for(const lane of streets)if(lane.alley)for(const index of [0,lane.points.length-1]){
      const p=lane.points[index];let closest=null,outside=null;
      const candidates=nearby([cell(p)]);
      for(const segment of Array.from(candidates).sort((a,b)=>order.get(a.street)-order.get(b.street)||a.index-b.index))if(segment.street!==lane){
        const {q,t}=project(p,segment.a,segment.b),gap=distance(p,q),different=root(lane)!==root(segment.street),
          best=different?outside:closest;
        if(gap<1e-9){closest={q,gap,t,segment};connect(lane,segment.street);continue;}
        if(gap<=maximum&&(!best||gap<best.gap-1e-9)&&segmentOnLand(p,q,recipe)
          &&valid({kind:lane.kind,points:[p,q]})){
          const candidate={q,gap,t,segment};if(different)outside=candidate;else closest=candidate;
        }
      }
      closest=outside||closest;
      if(!closest)continue;
      connect(lane,closest.segment.street);
      closest.segment.junctions.push({point:closest.q,t:closest.t});
      if(closest.gap>1e-9){if(!ends.has(lane))ends.set(lane,new Map());ends.get(lane).set(index,closest.q);}
    }
    // Keep each original cut fixed. Moving a target lane after a projection
    // would detach roads that already joined it; extensions preserve that node.
    for(const [street,parts] of segments){
      const original=street.points,result=[original[0]];
      for(const segment of parts){
        for(const junction of segment.junctions.sort((a,b)=>a.t-b.t))if(junction.t>1e-9&&junction.t<1-1e-9
          &&distance(result.at(-1),junction.point)>1e-9)result.push(junction.point);
        result.push(segment.b);
      }
      const attached=ends.get(street);if(attached?.has(0))result.unshift(attached.get(0));
      if(attached?.has(original.length-1))result.push(attached.get(original.length-1));
      street.points=result;
    }
  }

  function streetOutsidePolygon(street,polygon) {
    const result=[];let run=[];
    const flush=()=>{if(run.length>1)result.push({...street,points:run});run=[];};
    for(let i=1;i<street.points.length;i++){
      const a=street.points[i-1],b=street.points[i],dx=b.column-a.column,dy=b.row-a.row,squared=dx*dx+dy*dy;
      if(squared<1e-20)continue;
      const inside=clipToDistricts({...street,points:[a,b]},[polygon]);
      const t=p=>Math.max(0,Math.min(1,((p.column-a.column)*dx+(p.row-a.row)*dy)/squared));
      const intervals=inside.length?[[0,t(inside[0].points[0])],[t(inside.at(-1).points.at(-1)),1]]:[[0,1]];
      for(const [low,high] of intervals){
        if(high-low<=1e-8){if(high>=1-1e-8)flush();continue;}
        const at=v=>({column:a.column+dx*v,row:a.row+dy*v}),first=at(low),last=at(high);
        if(run.length&&Math.hypot(run.at(-1).column-first.column,run.at(-1).row-first.row)>1e-9)flush();
        if(!run.length)run.push(first);run.push(last);
        if(high<1-1e-8)flush();
      }
    }
    flush();return result;
  }

  function connectedParcels(parcels,bridges=[]) {
    if(!parcels.length)return [];
    const neighbours=(first,second)=>first.some((a,index)=>{
      const b=first[(index+1)%first.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(length<1e-9)return false;
      return second.some((c,edge)=>{
        const d=second[(edge+1)%second.length];
        if(Math.abs(dx*(c.y-a.y)-dy*(c.x-a.x))>length*1e-7||Math.abs(dx*(d.y-a.y)-dy*(d.x-a.x))>length*1e-7)return false;
        const t=p=>((p.x-a.x)*dx+(p.y-a.y)*dy)/(length*length);
        return Math.min(1,Math.max(t(c),t(d)))-Math.max(0,Math.min(t(c),t(d)))>1e-7;
      });
    });
    const core=parcels.reduce((best,parcel)=>{
      const c=polygonCentre(parcel.polygon),b=polygonCentre(best.polygon);
      return Math.hypot(c.x,c.y)<Math.hypot(b.x,b.y)?parcel:best;
    },parcels[0]);
    const result=[core],remaining=new Set(parcels.filter(parcel=>parcel!==core));
    const near=(polygon,p)=>containsPoint(polygon,p)||polygon.some((a,i)=>{
      const b=polygon[(i+1)%polygon.length],q=nearestPoint({column:p.x,row:p.y},{column:a.x,row:a.y},{column:b.x,row:b.y});
      return Math.hypot(q.column-p.x,q.row-p.y)<.12;});
    for(let index=0;index<result.length;index++)for(const parcel of remaining)if(neighbours(result[index].polygon,parcel.polygon)
      ||bridges.some(([a,b])=>near(result[index].polygon,a)&&near(parcel.polygon,b)||near(result[index].polygon,b)&&near(parcel.polygon,a))){result.push(parcel);remaining.delete(parcel);}
    return result;
  }

  function clipToDistricts(street,polygons) {
    const result=[];
    for(let segment=1;segment<street.points.length;segment++){
      const a=street.points[segment-1],b=street.points[segment],intervals=[];
      for(const polygon of polygons){
        let low=0,high=1;
        for(let edge=0;edge<polygon.length&&low<=high;edge++){
          const c=polygon[edge],d=polygon[(edge+1)%polygon.length],dx=d.column-c.column,dy=d.row-c.row;
          const length=Math.hypot(dx,dy);if(length<1e-12)continue;
          const raw=(dx*(a.row-c.row)-dy*(a.column-c.column))/length,
            start=Math.abs(raw)<1e-10?0:raw,delta=(dx*(b.row-a.row)-dy*(b.column-a.column))/length;
          if(Math.abs(delta)<1e-10){if(start<0){low=1;high=0;}continue;}
          const t=-start/delta;if(delta>0)low=Math.max(low,t);else high=Math.min(high,t);
        }
        if(high-low>1e-8)intervals.push([low,high]);
      }
      intervals.sort((x,y)=>x[0]-y[0]);const joined=[];
      for(const interval of intervals){const last=joined.at(-1);if(last&&interval[0]<=last[1]+1e-7)last[1]=Math.max(last[1],interval[1]);else joined.push(interval.slice());}
      const point=t=>({row:a.row+(b.row-a.row)*t,column:a.column+(b.column-a.column)*t});
      for(const [low,high] of joined)result.push({...street,points:[point(low),point(high)]});
    }return result;
  }

  function createFortress(parcels, request, toWorld, radiusKm, streets, plazas,constraints) {
    const core = (request.recipe.urban.coreZones || []).find(zone => zone.role === "government-core") || request.center;
    const candidates = parcels.slice().sort((a, b) => {
      const first = toWorld(polygonCentre(a.polygon)), second = toWorld(polygonCentre(b.polygon));
      return Math.hypot(first.row - core.row, first.column - core.column) - Math.hypot(second.row - core.row, second.column - core.column);
    });
    let unmoatedFort=null;
    for (const parcel of candidates) {
      const center = polygonCentre(parcel.polygon);
      let radius = Math.min((request.character.small?.035+.02*Math.min(1,request.population/5000):.24) / radiusKm, Math.sqrt(polygonArea(parcel.polygon)) * 0.37);
      const square = (point, half) => [{x: point.x - half, y: point.y - half}, {x: point.x + half, y: point.y - half}, {x: point.x + half, y: point.y + half}, {x: point.x - half, y: point.y + half}];
      for (let attempt = 0; attempt < 5; attempt++, radius *= 0.78) {
        const local = square(center, radius);
        const clearancePoints = square(center, radius * 1.22);
        if (!clearancePoints.every(point => containsPoint(parcel.polygon, point))) continue;
        const points = local.map(toWorld);
        if(!constraints.fits(clearancePoints.map(toWorld)))continue;
        // The optional ditch is 24m outside the pad, with a 9m half stroke.
        // Decide whether its complete footprint fits while placing the fort.
        const moatFootprint=constraints.padding(clearancePoints.map(toWorld),34),
          moatEligible=constraints.fits(clearancePoints.map(toWorld),34)&&!plazas.some(plaza=>polygonsOverlap(moatFootprint,plaza.points));
        if(foundationAt(points,request.recipe).reliefMetres>4)continue;
        if (plazas.some(plaza => polygonsOverlap(clearancePoints.map(toWorld), plaza.points))) continue;
        if (!clearancePoints.map(toWorld).every(point => segmentOnLand(toWorld(center), point, request.recipe))) continue;
        if (streets.some(street => polygonNearRoute(clearancePoints.map(toWorld), street.points, request.radiusRows * 0.002))) continue;
        let gate = null;
        for (let edge = 0; edge < 4; edge++) {
          const a = points[edge], b = points[(edge + 1) % 4], midpoint = {row: (a.row + b.row) / 2, column: (a.column + b.column) / 2};
          for (const street of streets) if (street.kind !== "rail") for (let index = 1; index < street.points.length; index++) {
            const target = nearestPoint(midpoint, street.points[index - 1], street.points[index]);
            const distance = Math.hypot(midpoint.row - target.row, midpoint.column - target.column);
            if ((!gate || distance < gate.distance) && segmentOnLand(midpoint, target, request.recipe)&&constraints.access([midpoint,target])) gate = {edge, midpoint, target, distance};
          }
        }
        if (!gate) continue;
        const walls = [];
        for (let edge = 0; edge < 4; edge++) {
          const a = points[edge], b = points[(edge + 1) % 4];
          for (const [start, end] of edge === gate.edge ? [[0, 0.42], [0.58, 1]] : [[0, 1]]) walls.push([start, end].map(t => ({row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t})));
        }
        const ancient=request.era==='ancient',kind=ancient?(request.character.court?'palace-citadel':'garrison'):'castle';
        const interiors=[];
        if(ancient){
          const part=(x,y,w,h)=>rectangle({row:center.y+y*radius,column:center.x+x*radius},w*radius,h*radius).map(p=>toWorld({x:p.column,y:p.row}));
          interiors.push({points:part(0,-.48,.62,.18),kind:'command-hall'});
          for(const x of [-.55,.55])for(const y of [-.05,.43])interiors.push({points:part(x,y,.20,.15),kind:'barracks'});
          if(request.character.court)interiors.push({points:part(0,.42,.26,.12),kind:'sanctuary'});
        }
        const fortress = {
          era: request.era, points, clearancePoints: clearancePoints.map(toWorld), walls, access: [gate.midpoint, gate.target],
          kind,interiors,moatEligible,foundation:foundationAt(points,request.recipe),
          towers: local.map(point => square(point, radius * 0.14).map(toWorld)),
          ...(kind==='castle'?{keep:square({x: center.x - radius * 0.12, y: center.y - radius * 0.1}, radius * 0.33).map(toWorld)}:{}),
        };
        if(moatEligible)return fortress;
        if(!unmoatedFort)unmoatedFort=fortress;
      }
    }
    return unmoatedFort;
  }

  function rectangle(center, halfColumn, halfRow) {
    return [{row:center.row-halfRow,column:center.column-halfColumn}, {row:center.row-halfRow,column:center.column+halfColumn},
      {row:center.row+halfRow,column:center.column+halfColumn}, {row:center.row+halfRow,column:center.column-halfColumn}];
  }

  function villagePublicPlots(request,streets,districts){
    const m=request.recipe.urban.gridCellKilometres,plots=[],land=districts.map(polygon=>polygon.map(p=>({x:p.column,y:p.row})));
    for(const street of streets)if(street.kind!=='rail')for(let i=1;i<street.points.length;i++){
      const a=street.points[i-1],b=street.points[i],dx=(b.column-a.column)*m.column,dy=(b.row-a.row)*m.row,length=Math.hypot(dx,dy);
      if(length<.025)continue;const u={x:dx/length,y:dy/length},v={x:-u.y,y:u.x};
      for(const fraction of [.4,.7])for(const side of [-1,1]){
        const center={column:a.column+(dx*fraction+v.x*.022*side)/m.column,row:a.row+(dy*fraction+v.y*.022*side)/m.row},
          plot=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({column:center.column+(u.x*x*.016+v.x*y*.016)/m.column,
            row:center.row+(u.y*x*.016+v.y*y*.016)/m.row}));
        if(plot.every(p=>land.some(polygon=>containsPoint(polygon,{x:p.column,y:p.row}))))plots.push(plot);
      }
    }return plots;
  }

  function publicBuildingConstraints(request,districts,innerEnclosures,defence){
    const {m}=defenceMetric(request),metric=gridCellKilometres(request.recipe,request.radiusRows,request.radiusColumns),
      widths=streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns),
      physical=p=>({x:(p.column-request.center.column)*m.column,y:(p.row-request.center.row)*m.row}),
      world=p=>({column:request.center.column+p.x/m.column,row:request.center.row+p.y/m.row}),
      route=p=>({column:p.x,row:p.y}),ground=districts.map(polygon=>polygon.map(physical)),
      innerGround=innerEnclosures.map(polygon=>polygon.map(physical)),
      walls=[...defence.wallSpans,...defence.innerWallSpans].map(span=>span.map(p=>route(physical(p)))),
      wallClearance=Math.max(.008,widths.collector*metric*1.55)+.004,
      roads=(request.recipe.localSite?.gates?[...(request.recipe.transport?.corridors||[]),...(request.recipe.localSite.ruralRoads||[])]:[]).map(road=>({
        points:road.points.map(p=>route(physical(p))),width:widths[road.local?'collector':'arterial']*metric*.6}));
    const covers=(polygon,parcels)=>{
      const area=polygonArea(polygon),covered=parcels.reduce((sum,parcel)=>{
        let overlap=polygon;
        for(let i=0;i<parcel.length&&overlap.length>=3;i++){
          const a=parcel[i],b=parcel[(i+1)%parcel.length],nx=b.y-a.y,ny=a.x-b.x;
          overlap=clipHalfPlane(overlap,nx,ny,a.x*nx+a.y*ny);
        }return sum+polygonArea(overlap);
      },0);
      return area>1e-12&&covered>=area*(1-1e-8);
    };
    const buffered=(points,margin)=>{
      const polygon=points.map(physical),box={west:Math.min(...polygon.map(p=>p.x))-margin,east:Math.max(...polygon.map(p=>p.x))+margin,
        north:Math.min(...polygon.map(p=>p.y))-margin,south:Math.max(...polygon.map(p=>p.y))+margin};
      let result=[{x:box.west,y:box.north},{x:box.east,y:box.north},{x:box.east,y:box.south},{x:box.west,y:box.south}];
      for(let i=0;i<polygon.length;i++){
        const a=polygon[i],b=polygon[(i+1)%polygon.length],length=Math.hypot(b.x-a.x,b.y-a.y);
        if(length<1e-12)continue;const nx=(b.y-a.y)/length,ny=(a.x-b.x)/length;
        result=clipHalfPlane(result,nx,ny,a.x*nx+a.y*ny+margin);
      }return result;
    };
    return {
      padding:(points,marginMetres)=>buffered(points,marginMetres/1000).map(world),
      insideInner:p=>innerGround.some(polygon=>containsPoint(polygon,physical(p))),
      fits(points,marginMetres=5,requireInner=false){
        const polygon=buffered(points,marginMetres/1000),reservation=polygon.map(route),edge=polygon.map(world),
          roadReservation=buffered(points,.005).map(route);
        return covers(polygon,ground)&&(!requireInner||covers(polygon,innerGround))
          &&edge.every((p,i)=>segmentOnLand(p,edge[(i+1)%edge.length],request.recipe))
          &&!walls.some(wall=>polygonNearRoute(reservation,wall,wallClearance))
          &&!roads.some(road=>polygonNearRoute(roadReservation,road.points,road.width));
      },
      access(points){
        const half=widths.collector*metric*.6;
        for(let i=1;i<points.length;i++){
          const a=physical(points[i-1]),b=physical(points[i]),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
          if(length<1e-9)continue;const nx=-dy/length*half,ny=dx/length*half,
            strip=[{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny},{x:b.x-nx,y:b.y-ny},{x:a.x-nx,y:a.y-ny}].map(route);
          if(walls.some(wall=>polygonNearRoute(strip,wall,wallClearance)))return false;
        }return true;
      }
    };
  }

  function createPublicSpaces(request, metric, streets,districts,constraints) {
    const plazas = [], landmarks = [];
    const used=new Set(),placedKinds=new Set(),character=request.character;
    const m=request.recipe.urban.gridCellKilometres;
    const civicPlots=character.small&&!character.mobile?villagePublicPlots(request,streets,districts):districts;
    let cores = request.recipe.urban.coreZones?.length ? request.recipe.urban.coreZones.slice()
      : [{...request.center, role:"central-core", radiusKm:request.recipe.urban.radiusKm * 0.22}];
    const civicSite=(x,y,role)=>({row:request.center.row+request.radiusRows*y,column:request.center.column+request.radiusColumns*x,
      role,radiusKm:request.recipe.urban.radiusKm*.2});
      const military=['fortress','border-pass'].includes(character.kind),maritime=['seaport','lake-port','river-port'].includes(character.kind);
    if(character.capital&&!cores.some(c=>c.role==='government-core'))cores.unshift(civicSite(0,-.36,'government-core'));
    if(character.plan==='axial')for(const core of cores)if(core.role==='government-core'){core.column=request.center.column;core.row=request.center.row-request.radiusRows*.36;}
    if(!cores.some(c=>c.role==='government-core'))cores.unshift(civicSite(-.18,-.12,'local-government'));
    if(request.recipe.culture?.holyReligion&&!cores.some(c=>c.role==='sacred-core'))cores.unshift(civicSite(.2,-.25,'sacred-core'));
    if(!character.small&&!military)cores.push(civicSite(.34,.1,'market-core'));
    if(!character.small&&request.population>7000&&!military)cores.push(civicSite(-.38,.24,'military-core'));
    if(!character.small&&request.population>3000&&!cores.some(c=>['sacred-core','pilgrimage-core'].includes(c.role)))
      cores.push({row:request.center.row-request.radiusRows*.3,column:request.center.column+request.radiusColumns*.28,
        role:'sacred-core',radiusKm:request.recipe.urban.radiusKm*.19});
    if(character.small&&!character.mobile){
      const government=cores.find(core=>['government-core','local-government'].includes(core.role)),
        sacred=cores.find(core=>['sacred-core','pilgrimage-core'].includes(core.role)),
        landing=cores.find(core=>!['government-core','local-government','sacred-core','pilgrimage-core'].includes(core.role));
      cores=[government,sacred,maritime?landing:request.population>450?{...(landing||civicSite(.18,.12,'market-core')),role:'market-core'}:null].filter(Boolean);
    }
    for (const [coreIndex,core] of cores.entries()) {
      const sacred=['sacred-core','pilgrimage-core'].includes(core.role),government=['government-core','local-government'].includes(core.role);
      const regime=request.recipe.culture?.government,royal=['bureaucratic-monarchy','court-monarchy','estate-monarchy','hereditary-feudalism'].includes(regime),
        imperial=/帝国|王朝/.test(request.recipe.culture?.stateName||''),holy=request.recipe.culture?.holyReligion,
        holyKind={'ancestral-rite':'holy-tomb','river-mysteries':'water-sanctuary','sky-law':'observatory-sanctuary',
          'mountain-vow':'pilgrimage-monastery','tide-covenant':'harbor-shrine','pilgrim-way':'great-sanctuary'}[holy?.tradition];
      const kind=character.mobile?'assembly-tent':character.small?(government?'common-house':sacred?'village-shrine':maritime?'landing-store':'village-market'):sacred?(holyKind||'sanctuary'):government?(core.role==='government-core'?
        royal?imperial?'imperial-palace':'royal-palace':'council-house':regime==='hereditary-feudalism'?'lord-manor':'town-hall')
        :core.role==='military-core'?'barracks':core.role==='market-core'?'market-hall':character.kind==='oasis'?'caravanserai':maritime?'customs-house'
        :military?'barracks':coreIndex<2?'market-hall':'granary';
      if(placedKinds.has(kind))continue;
      const typeName={'common-house':'议事屋','village-shrine':'小祠','landing-store':'埠头仓','village-market':'集场','imperial-palace':'皇宫','royal-palace':'王宫','council-house':'议会宫', 'holy-tomb':'先圣陵寝',
        'water-sanctuary':'圣水神殿','observatory-sanctuary':'天律观星院','pilgrimage-monastery':'圣山修院','harbor-shrine':'潮汐圣祠','great-sanctuary':'巡礼大圣殿',
        'assembly-tent':'议事大帐',sanctuary:character.tradition.temple, 'lord-manor':'领主府','town-hall':character.tradition.hall,caravanserai:'商旅驿馆',
        'customs-house':'海关商馆',barracks:'卫戍营', 'market-hall':'市集大厅',granary:'公仓'}[kind];
      const civicName=character.small&&government&&!character.capital?'议事屋':typeName;
      const palace=['royal-palace','imperial-palace'].includes(kind),design=character.palace;
      const enclosedPalace=palace&&character.defence.layers>1;
      const candidates=civicPlots.map((points,index)=>({points,index,center:polygonCentre(points.map(p=>({x:p.column,y:p.row})))}))
        .filter(p=>!used.has(p.index)&&(!enclosedPalace||constraints.insideInner({column:p.center.x,row:p.center.y})))
        .sort((a,b)=>Math.hypot(a.center.x-core.column,a.center.y-core.row)-Math.hypot(b.center.x-core.column,b.center.y-core.row));
      const parts=global.WorldAtlasCityCharacter.template(kind,character.style,request.population,design);
      const aspect=palace?design.aspect:[1.35,1];
      const frame=(parcel,half)=>{
        const center={row:parcel.center.y,column:parcel.center.x};
        let angle=request.recipe.localSite?.form.axisRadians||0,nearest=Infinity,target=null;
        for(const street of streets)if(street.kind!=='rail'&&!street.alley&&!street.palacePerimeter)for(let i=1;i<street.points.length;i++){
          const a=street.points[i-1],b=street.points[i],q=nearestPoint(center,a,b),distance=Math.hypot((q.column-center.column)*m.column,(q.row-center.row)*m.row);
          if(distance<nearest){nearest=distance;target=q;angle=Math.atan2((b.row-a.row)*m.row,(b.column-a.column)*m.column);}
        }
        if(target&&-(target.column-center.column)*m.column*Math.sin(angle)+(target.row-center.row)*m.row*Math.cos(angle)<0)angle+=Math.PI;
        const at=(x,y)=>({column:center.column+(Math.cos(angle)*x-Math.sin(angle)*y)*metric/m.column,
          row:center.row+(Math.sin(angle)*x+Math.cos(angle)*y)*metric/m.row});
        let corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
        if(palace&&design.fortified)corners=[[-.84,-1],[.81,-1],[1,-.68],[1,1],[-1,1],[-1,-.71]];
        const square=corners.map(([x,y])=>at(x*aspect[0]*half,y*aspect[1]*half));
        return {center,half,square,index:parcel.index,at,angle,gate:at(0,aspect[1]*half)};
      };
      const componentPoints=chosen=>parts.map(part=>part.points.map(([x,y])=>chosen.at(x/1.35*aspect[0]*chosen.half,y*aspect[1]*chosen.half)));
      const fitsInnerEnclosure=chosen=>{
        if(!enclosedPalace)return true;
        const reserved=chosen.square.map(p=>({column:chosen.center.column+(p.column-chosen.center.column)*1.04,
          row:chosen.center.row+(p.row-chosen.center.row)*1.04}));
        return constraints.fits(reserved,25,true);
      };
      const fitsGround=chosen=>(!request.recipe.harbor?.reservedLand||!polygonsOverlap(chosen.square,request.recipe.harbor.reservedLand))
        &&(!request.garrisonReservation||!polygonsOverlap(constraints.padding(chosen.square,5),request.garrisonReservation))
        &&fitsInnerEnclosure(chosen)
        &&constraints.fits(chosen.square)
        &&chosen.square.every((p,i)=>segmentOnLand(p,chosen.square[(i+1)%chosen.square.length],request.recipe))
        &&componentPoints(chosen).every(points=>points.every(p=>segmentOnLand(p,p,request.recipe))&&foundationAt(points,request.recipe).reliefMetres<=4);
      let chosen=null;
      if(palace&&character.capital&&request.population>=30000){
        const groundsKm2=Math.min(2.4,.04+request.population*(imperial?3e-6:2e-6)),desired=Math.sqrt(groundsKm2/(4*aspect[0]*aspect[1]))/metric;
        for(const factor of [1,.85,.7,.55]){
          for(const parcel of candidates.slice(0,36)){
            const candidate=frame(parcel,desired*factor),{half,square,at}=candidate,
              interior=Array.from({length:49},(_,i)=>at(((i%7)/6*2-1)*half*aspect[0],(Math.floor(i/7)/6*2-1)*half*aspect[1]));
            if(!interior.every(p=>districts.some(d=>containsPoint(d.map(q=>({x:q.column,y:q.row})),{x:p.column,y:p.row})))
              ||!fitsGround(candidate)
              ||plazas.some(p=>polygonsOverlap(square,p.points))
              ||streets.some(s=>s.authoritative&&polygonNearRoute(square,s.points,streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns).arterial)))continue;
            chosen={...candidate,precinct:true};break;
          }if(chosen)break;
        }
      }
      for(const parcel of chosen?[]:candidates){
        const palaceHalf=Math.sqrt(Math.min(2.4,.04+request.population*(imperial?3e-6:2e-6))/(4*aspect[0]*aspect[1]));
        let half=(character.small?Math.min(sacred?.009:maritime&&!government?.010:.011+Math.min(.004,request.population/1000000),Math.max(.008,core.radiusKm*.28)):
          Math.min(government&&character.capital?palaceHalf:sacred&&holy?.18:.12,Math.max(.025,core.radiusKm*(government&&character.capital?.4:.28))))/metric;
        for(let i=0;i<8;i++,half*=.8){
          const candidate=frame(parcel,half),{square}=candidate;
          if(!square.every(p=>containsPoint(parcel.points.map(q=>({x:q.column,y:q.row})),{x:p.column,y:p.row}))
            ||!fitsGround(candidate)
            ||plazas.some(p=>polygonsOverlap(square,p.points))
            ||streets.some(street=>polygonNearRoute(square,street.points,streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns).collector)))continue;
          chosen={...candidate,precinct:palace};break;
        }
        if(chosen)break;
      }
      if(!chosen)continue;
      const {center,half,square,at}=chosen;used.add(chosen.index);placedKinds.add(kind);
      const name=character.prefix+(kind==='market-hall'?'市集广场':civicName);
      const gateHalf=streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns).arterial*1.2;
      const wallPieces=square.flatMap((p,i)=>{
        const z=square[(i+1)%square.length],q=nearestPoint(chosen.gate,p,z);
        if(Math.hypot(q.row-chosen.gate.row,q.column-chosen.gate.column)>1e-8)return [[p,z]];
        const len=Math.hypot(z.column-p.column,z.row-p.row),delta=Math.min(.18,gateHalf/len),t=Math.hypot(q.column-p.column,q.row-p.row)/len;
        const at=v=>({column:p.column+(z.column-p.column)*v,row:p.row+(z.row-p.row)*v});
        return [[p,at(t-delta)],[at(t+delta),z]];
      });
      plazas.push({points:square,role:core.role,name,compoundId:'compound-'+coreIndex,nameType:kind,nameSuffix:kind==='market-hall'?'市集广场':civicName,market:kind==='market-hall'||kind==='village-market',precinct:chosen.precinct,
        walls:wallPieces,gate:chosen.gate,design:palace?design.family:null});
      if(chosen.precinct){
        // Reserve the entire civic compound before walls, houses and lanes.
        const ring=square.map(p=>({column:center.column+(p.column-center.column)*1.04,row:center.row+(p.row-center.row)*1.04}));
        const old=streets.splice(0);streets.push(...old.flatMap(street=>streetOutsidePolygon(street,ring)));
        for(let i=0;i<ring.length;i++)streets.push({id:'palace-perimeter-'+coreIndex+'-'+i,kind:'collector',points:[ring[i],ring[(i+1)%ring.length]],access:true,palacePerimeter:true});
      }
      let access = null;
      for (const street of streets) if (street.kind !== "rail") for (let index=1;index<street.points.length;index++) {
        const target=nearestPoint(chosen.precinct?chosen.gate:center,street.points[index-1],street.points[index]);
        const entrance=chosen.precinct?chosen.gate:square.map((p,i)=>nearestPoint(target,p,square[(i+1)%square.length])).sort((a,b)=>
          Math.hypot(a.row-target.row,a.column-target.column)-Math.hypot(b.row-target.row,b.column-target.column))[0];
        const distance=Math.hypot((target.column-entrance.column)*m.column,(target.row-entrance.row)*m.row)/metric;
        if(plazas.some(plaza=>plaza.precinct&&clipToDistricts({points:[entrance,target]},[plaza.points]).some(part=>
          Math.hypot(part.points.at(-1).column-part.points[0].column,part.points.at(-1).row-part.points[0].row)>1e-8)))continue;
        if((!access || distance<access.distance) && segmentOnLand(entrance,target,request.recipe)&&constraints.access([entrance,target]))access={points:[entrance,target],distance};
      }
      if(access && access.distance<Math.max(request.radiusRows,request.radiusColumns)*0.5)
        streets.push({id:'public-access-'+coreIndex,kind:character.small?"local":"collector",points:access.points,access:true,plaza:true,palaceAccess:!!chosen.precinct});
      for(const [index,part] of parts.entries()){
        const points=componentPoints(chosen)[index];
        const roof=part.roof==='dome'?[points.map((p,i)=>i%4===0?[center,p]:null).filter(Boolean)].flat():roofLines(points);
        const fill=palace?character.material.palace[index%3]:character.roof[index%character.roof.length];
        landmarks.push({points,kind:index===0?kind:kind+'-wing',fill,roofLines:roof,roof:part.roof,design:palace?design.family:null,foundation:foundationAt(points,request.recipe),
          compoundId:'compound-'+coreIndex,compoundPoints:square,name:character.prefix+civicName,nameType:kind,nameSuffix:civicName});
      }
    }
    return {plazas,landmarks};
  }


  function foundationAt(points,recipe){
    const f=recipe.localSite?.surface;if(!f)return {elevationMetres:0,reliefMetres:0};
    const heights=points.map(p=>global.WorldAtlasCitySite.elevationAt(f,p));
    return {elevationMetres:Math.max(...heights),reliefMetres:Math.max(...heights)-Math.min(...heights)};
  }

  function chamferPolygon(points, fraction) {
    return points.flatMap((point,index)=>{
      const previous=points[(index+points.length-1)%points.length],next=points[(index+1)%points.length];
      return [{x:point.x+(previous.x-point.x)*fraction,y:point.y+(previous.y-point.y)*fraction},
        {x:point.x+(next.x-point.x)*fraction,y:point.y+(next.y-point.y)*fraction}];
    });
  }

  function roofLines(points, courtyard, roof='hip') {
    if(roof==='flat')return [];
    const polygon=points.map(point=>({x:point.column,y:point.row}));
    if(courtyard){
      const ring=insetPolygon(polygon,Math.sqrt(polygonArea(polygon))*0.10).map(point=>({column:point.x,row:point.y}));
      return ring.length>=3?[ring.concat(ring[0])]:[];
    }
    const center=polygonCentre(polygon);
    let direction=null,longest=0;
    for(let index=0;index<polygon.length;index++){
      const a=polygon[index],b=polygon[(index+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(length>longest){longest=length;direction={x:dx/length,y:dy/length};}
    }
    if(!direction)return [];
    const intersections=[];
    for(let index=0;index<polygon.length;index++){
      const a=polygon[index],b=polygon[(index+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y;
      const denominator=direction.x*dy-direction.y*dx;
      if(Math.abs(denominator)<1e-12)continue;
      const t=((a.x-center.x)*dy-(a.y-center.y)*dx)/denominator;
      const u=((a.x-center.x)*direction.y-(a.y-center.y)*direction.x)/denominator;
      if(u>=-1e-9&&u<=1+1e-9)intersections.push(t);
    }
    if(intersections.length<2)return [];
    const minimum=Math.min(...intersections),maximum=Math.max(...intersections),inset=(maximum-minimum)*(roof==='gable'?0:.15);
    return [[minimum+inset,maximum-inset].map(t=>({column:center.x+direction.x*t,row:center.y+direction.y*t}))];
  }

  // Walk whole physical wall chains; input direction, ordering and collinear
  // subdivisions cannot restart the tower cadence. Junctions terminate runs.
  function wallChains(walls,request){
    const {m,distance}=defenceMetric(request),epsilon=1e-7,vertices=new Map(),edges=new Map(),
      compare=(a,b)=>a.x-b.x||a.y-b.y,
      vertex=p=>{const x=Math.round((p.column-request.center.column)*m.column/epsilon),y=Math.round((p.row-request.center.row)*m.row/epsilon),key=x+','+y;
        if(!vertices.has(key))vertices.set(key,{key,x,y,point:{column:request.center.column+x*epsilon/m.column,row:request.center.row+y*epsilon/m.row},edges:[]});
        return vertices.get(key);};
    for(const [p,q] of walls){let a=vertex(p),b=vertex(q);if(a===b)continue;if(compare(a,b)>0)[a,b]=[b,a];
      const key=a.key+'|'+b.key;if(edges.has(key))continue;
      const edge={a,b,used:false};edges.set(key,edge);a.edges.push(edge);b.edges.push(edge);
    }
    const other=(edge,node)=>edge.a===node?edge.b:edge.a,nodes=Array.from(vertices.values()).sort(compare),chains=[];
    for(const node of nodes)node.edges.sort((a,b)=>compare(other(a,node),other(b,node)));
    const walk=(start,first)=>{const points=[start.point];let node=start,edge=first;
      while(edge&&!edge.used){edge.used=true;node=other(edge,node);points.push(node.point);
        if(node===start||node.edges.length!==2)break;edge=node.edges.find(next=>!next.used);
      }
      const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+distance(points[i-1],points[i]));
      chains.push({points,distances,length:distances.at(-1),closed:node===start});
    };
    for(const node of nodes)if(node.edges.length!==2)for(const edge of node.edges)if(!edge.used)walk(node,edge);
    for(const node of nodes)for(const edge of node.edges)if(!edge.used)walk(node,edge);
    return chains;
  }

  function wallChainPoint(chain,position,request){
    const {at}=defenceMetric(request),length=chain.length;
    position=chain.closed?(position%length+length)%length:Math.max(0,Math.min(length,position));
    for(let i=1;i<chain.points.length;i++)if(position<=chain.distances[i]){
      const start=chain.distances[i-1],span=chain.distances[i]-start;return at(chain.points[i-1],chain.points[i],(position-start)/span);
    }
    return chain.points.at(-1);
  }

  function wallTowerPolicy(request){
    const {m,shift}=defenceMetric(request),site=request.recipe.localSite,
      military=['fortress','pass'].includes(request.recipe.siteType)||['fortress','border-pass'].includes(request.character.kind),
      bank=center=>(site?.channels||[]).some(channel=>{const near=global.WorldAtlasCitySite.distanceToChannel(center,channel,m);
        return near.distance<near.widthMetres/2000+.045;})||!!site?.surface&&Array.from({length:8},(_,i)=>{
          const angle=i*Math.PI/4,p=shift(center,Math.cos(angle)*.045,Math.sin(angle)*.045),bounds=site.surface.bounds;
          return p.column>=bounds.west&&p.column<=bounds.east&&p.row>=bounds.north&&p.row<=bounds.south&&!global.WorldAtlasCitySite.isDry(site.surface,p);
        }).some(Boolean);
    return {radius:Math.max(.004,Math.min(.008,request.recipe.urban.radiusKm*.01)),lookahead:military?.03:.05,
      spacing:center=>military?(bank(center)?.08:.065):(bank(center)?.15:.10),
      minimum:center=>military?(bank(center)?.05:.045):(bank(center)?.11:.075)};
  }

  function completeWallTower(points,request){
    const {m}=defenceMetric(request),physical=polygon=>polygon.map(p=>({x:(p.column-request.center.column)*m.column,y:(p.row-request.center.row)*m.row})),
      area=polygonArea(physical(points)),remaining=clipToLand(points,request.recipe).reduce((sum,piece)=>sum+polygonArea(physical(piece)),0);
    return Math.abs(remaining-area)<=area*1e-5&&points.every((p,i)=>segmentOnLand(p,points[(i+1)%points.length],request.recipe));
  }

  // The first planning call has complete ungated spans. Gate cuts may remove
  // these reserved sites, but cannot reveal a new unreserved corner later.
  const wallCornerReservations=new WeakMap();
  function cornerTowerSites(walls,request,metric){
    const {m,distance}=defenceMetric(request),policy=wallTowerPolicy(request),{radius,lookahead}=policy,
      shape=(center,scale)=>rectangle(center,radius*scale/m.column,radius*scale/m.row);
    if(!wallCornerReservations.has(request)){
      const site=request.recipe.localSite,source=site?.wallSpans?[...site.wallSpans,...site.innerWallSpans||[]]:walls,candidates=[];
      for(const chain of wallChains(source,request))for(let i=chain.closed?0:1;i<chain.points.length-1;i++){
        const center=chain.points[i],previous=chain.points[(i+chain.points.length-2)%(chain.points.length-1)],next=chain.points[i+1],
          ax=(center.column-previous.column)*m.column,ay=(center.row-previous.row)*m.row,bx=(next.column-center.column)*m.column,by=(next.row-center.row)*m.row;
        if(Math.abs(ax*by-ay*bx)<=Math.hypot(ax,ay)*Math.hypot(bx,by)*1e-6)continue;
        const position=chain.distances[i],a=wallChainPoint(chain,position-lookahead,request),b=wallChainPoint(chain,position+lookahead,request),
          x=(center.column-a.column)*m.column,y=(center.row-a.row)*m.row,u=(b.column-center.column)*m.column,v=(b.row-center.row)*m.row,
          angle=Math.atan2(Math.abs(x*v-y*u),x*u+y*v);
        if(angle<Math.PI/6)continue;const points=shape(center,1);
        if(completeWallTower(points,request))candidates.push({center,points,clearance:shape(center,1.75),angle,minimum:policy.minimum(center)});
      }
      candidates.sort((a,b)=>b.angle-a.angle||a.center.column-b.center.column||a.center.row-b.center.row);
      const chosen=[];for(const candidate of candidates)if(!chosen.some(other=>distance(candidate.center,other.center)<Math.max(candidate.minimum,other.minimum)))chosen.push(candidate);
      wallCornerReservations.set(request,chosen);
    }
    const supported=wallChains(walls,request).flatMap(chain=>chain.points.slice(0,-1).filter((p,i)=>chain.closed||
      chain.distances[i]>=radius&&chain.length-chain.distances[i]>=radius));
    return wallCornerReservations.get(request).filter(corner=>supported.some(p=>distance(corner.center,p)<2e-6));
  }

  function wallTowers(walls, request, metric, streets,gates) {
    const towers=[],centers=[],{m,distance}=defenceMetric(request),policy=wallTowerPolicy(request),{radius}=policy,
      widths=streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns),
      emit=(center,points,kind)=>{
        const minimum=policy.minimum(center);
        if(centers.some(other=>distance(center,other.center)<Math.max(minimum,other.minimum))
          ||gates.some(gate=>distance(center,gate.center)<gate.widthKm+radius*Math.SQRT2||gate.towers.some(tower=>polygonsOverlap(points,tower)))
          ||streets.some(street=>street.kind!=='rail'&&polygonNearRoute(points,street.points,(widths[street.kind]||widths.local)*.55))
          ||!completeWallTower(points,request))return;
        centers.push({center,minimum});towers.push({points,kind,roofLines:roofLines(points)});
      };
    for(const corner of cornerTowerSites(walls,request,metric))emit(corner.center,corner.points,'corner-tower');
    for(const chain of wallChains(walls,request)){
      // A rejected location still consumes its distance interval. No segment
      // endpoint or failed water/street check restarts the sequence.
      let position=policy.spacing(chain.points[0])*.5;
      while(position<chain.length-radius){
        const center=wallChainPoint(chain,position,request);emit(center,rectangle(center,radius/m.column,radius/m.row),'wall-tower');
        position+=policy.spacing(center);
      }
    }
    return towers;
  }

  function countryHouses(request, corridors, districts, metric, widths) {
    const houses=[],lanes=[],hamlets=[],seen=[],candidates=[],recipe=request.recipe,
      budget=Math.min(180,Math.floor(request.character.buildingCount*.08)),
      m=recipe.urban.gridCellKilometres||{},rowMetric=m.row||metric,columnMetric=m.column||metric,
      roadIndex=streetClearanceIndex(corridors.map(route=>({...route,kind:route.kind==='rail'?'rail':route.local?'collector':'arterial'})),widths,request.center,.075/metric);
    for(const [corridorIndex,corridor] of corridors.entries())if(corridor.kind!=="rail")for(let segment=1;segment<corridor.points.length;segment++){
      const a=corridor.points[segment-1],b=corridor.points[segment],dx=(b.column-a.column)*columnMetric,dy=(b.row-a.row)*rowMetric,length=Math.hypot(dx,dy);
      if(length<.035)continue;
      let distance=.018+random(request.seed,48000+corridorIndex*7919+segment*300)*.04;
      for(let index=0;index<260&&distance<length-.012;index++){
        const channel=48000+corridorIndex*7919+segment*631+index*29,fraction=distance/length;
        // Irregular gaps alternate sparse farmsteads with a few neighboring
        // households. Every footprint and garden is built independently.
        distance+=random(request.seed,channel+15)<.34?.023+random(request.seed,channel+16)*.036:.065+random(request.seed,channel+16)*.18;
        const front=.007+random(request.seed,channel+1)*.005,depth=.008+random(request.seed,channel+3)*.007,
          side=random(request.seed,channel+2)>.5?1:-1,
          roadClearance=(widths[corridor.local?'collector':'arterial']*metric)*.68+.0015,
          frontYard=.003+random(request.seed,channel+4)*.009,backYard=.003+random(request.seed,channel+10)*.010,
          plotFront=front+.006+random(request.seed,channel+11)*.010,plotDepth=frontYard+depth+backYard,
          offset=roadClearance+frontYard+depth*.5,
          along=(random(request.seed,channel+12)-.5)*.003,
          roadUnit={x:dx/length,y:dy/length},normal={x:-dy/length*side,y:dx/length*side},
          at=(x,y)=>({column:a.column+(dx*fraction+roadUnit.x*x+normal.x*y)/columnMetric,
            row:a.row+(dy*fraction+roadUnit.y*x+normal.y*y)/rowMetric}),
          center=at(along,offset);
        const radial=Math.hypot((center.row-request.center.row)/request.radiusRows,(center.column-request.center.column)/request.radiusColumns);
        if(radial<.85||radial>3.7)continue;
        const rearShift=(random(request.seed,channel+13)-.5)*.004,
          frontLeft=at(-plotFront*.5,roadClearance),frontRight=at(plotFront*.5,roadClearance),
          yard=[frontLeft,frontRight,at(plotFront*.5+rearShift,roadClearance+plotDepth),at(-plotFront*.5+rearShift,roadClearance+plotDepth)];
        if(side<0)yard.reverse();
        const angle=Math.atan2(dy,dx)+(random(request.seed,channel+5)-.5)*.10,u={x:Math.cos(angle),y:Math.sin(angle)},v={x:-u.y,y:u.x};
        const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({column:center.column+(u.x*x*front*.5+v.x*y*depth*.5)/columnMetric,
          row:center.row+(u.y*x*front*.5+v.y*y*depth*.5)/rowMetric}));
        if(!points.every(p=>containsPoint(yard.map(q=>({x:q.column,y:q.row})),{x:p.column,y:p.row}))
          ||districts.some(district=>polygonsOverlap(yard,district))||roadIndex.intersects(yard)
          ||recipe.harbor?.reservedLand&&polygonsOverlap(yard,recipe.harbor.reservedLand)
          ||!completeBuildingGround(yard,recipe)||!completeBuildingGround(points,recipe))continue;
        const foundation=foundationAt(points,recipe);if(foundation.reliefMetres>3.5)continue;
        const entrance={column:center.column-v.x*depth*.5*side/columnMetric,row:center.row-v.y*depth*.5*side/rowMetric},
          access=nearestPoint(entrance,a,b),gate=nearestPoint(access,frontLeft,frontRight),lane=[entrance,gate,access];
        if(!lane.every((p,i)=>!i||segmentOnLand(lane[i-1],p,recipe)))continue;
        candidates.push({points,yard,gate,center,entrance,lane,foundation,channel,radial,rank:random(request.seed,channel+18)});
      }
    }
    candidates.sort((a,b)=>a.rank-b.rank||a.channel-b.channel);
    for(const home of candidates){
      if(houses.length>=budget)break;
      if(seen.some(other=>polygonsOverlap(home.yard,other.yard)))continue;
      const roof=request.character.style==='terraced'?'flat':random(request.seed,home.channel+8)<(request.character.court?.78:.22)?'hip':'gable';
      houses.push({points:home.points,yard:home.yard,yardGate:home.gate,yardFill:['#dfe6d7','#d7e5cc','#e8ecdf'][Math.floor(random(request.seed,home.channel+19)*3)],roofLines:roofLines(home.points,null,roof),roof,
        fill:request.character.roof[Math.floor(random(request.seed,home.channel+102)*request.character.roof.length)],
        entrance:home.entrance,access:home.lane,foundation:home.foundation});lanes.push(home.lane);seen.push(home);
    }
    const roots=recipe.localSite?.nameRoots||[],named=new Set();
    for(const home of seen)if(roots.length&&home.radial>1.65&&!named.has(home)&&hamlets.length<8){
      const neighbors=seen.filter(other=>!named.has(other)&&Math.hypot((other.center.row-home.center.row)*rowMetric,(other.center.column-home.center.column)*columnMetric)<.13)
        .slice(0,2+Math.floor(random(request.seed,home.channel+9)*5));
      if(neighbors.length<2)continue;
      neighbors.forEach(other=>named.add(other));
      const root=roots[(hamlets.length+Math.floor(random(request.seed,4180)*20))%roots.length];
      hamlets.push({points:neighbors.flatMap(other=>other.points),name:root+['庄','村','屯'][hamlets.length%3]});
    }
    return {houses,lanes,hamlets};
  }

  const polygonBoundsCache=new WeakMap();
  function polygonBounds(points){
    let b=polygonBoundsCache.get(points);if(!b){b={west:Math.min(...points.map(p=>p.column)),east:Math.max(...points.map(p=>p.column)),
      north:Math.min(...points.map(p=>p.row)),south:Math.max(...points.map(p=>p.row))};polygonBoundsCache.set(points,b);}return b;
  }
  function polygonsOverlap(first, second) {
    const a=polygonBounds(first),b=polygonBounds(second);
    if(a.west>=b.east||a.east<=b.west||a.north>=b.south||a.south<=b.north)return false;
    let polygon = first.map(point => ({x: point.column, y: point.row}));
    for (let index = 0; index < second.length; index++) {
      const a = second[index], b = second[(index + 1) % second.length];
      const nx = b.row - a.row, ny = a.column - b.column;
      polygon = clipHalfPlane(polygon, nx, ny, a.column * nx + a.row * ny);
    }
    return polygon.length >= 3 && polygonArea(polygon) > 1e-12;
  }

  function defenceMetric(request){
    const m=request.recipe.urban.gridCellKilometres;
    const distance=(a,b)=>Math.hypot((b.column-a.column)*m.column,(b.row-a.row)*m.row);
    const at=(a,b,t)=>({column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t});
    const shift=(p,x,y)=>({column:p.column+x/m.column,row:p.row+y/m.row});
    const project=(p,a,b)=>{const x=(b.column-a.column)*m.column,y=(b.row-a.row)*m.row,s=x*x+y*y;
      return at(a,b,s?Math.max(0,Math.min(1,((p.column-a.column)*m.column*x+(p.row-a.row)*m.row*y)/s)):0);};
    return {m,distance,at,shift,project};
  }

  // Canonical endpoints close the union of convex BSP parcels. Collinear
  // fragments merge only at degree-two vertices, so real corners stay intact.
  function enclosureBoundary(enclosures,request){
    const {m}=defenceMetric(request),snapped=new Map(),edges=new Map(),epsilon=1e-7;
    const snap=p=>{const x=Math.round(p.x/epsilon),y=Math.round(p.y/epsilon),key=x+','+y;
      if(!snapped.has(key))snapped.set(key,{x:x*epsilon,y:y*epsilon,key});return snapped.get(key);};
    const polygons=enclosures.map(polygon=>{
      const points=polygon.map(p=>snap({x:(p.column-request.center.column)*m.column,y:(p.row-request.center.row)*m.row}))
        .filter((p,i,all)=>p.key!==all[(i+all.length-1)%all.length].key);
      const signed=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0);
      if(signed<0)points.reverse();return points;
    }).filter(polygon=>polygon.length>=3);
    const vertices=Array.from(new Set(polygons.flat())),segments=polygons.flatMap(polygon=>polygon.map((a,i)=>[a,polygon[(i+1)%polygon.length]])),
      bounds=polygons.map(polygon=>({west:Math.min(...polygon.map(p=>p.x)),east:Math.max(...polygon.map(p=>p.x)),north:Math.min(...polygon.map(p=>p.y)),south:Math.max(...polygon.map(p=>p.y))})),
      inside=p=>polygons.some((polygon,i)=>{const box=bounds[i];return p.x>=box.west&&p.x<=box.east&&p.y>=box.north&&p.y<=box.south
        &&polygon.every((a,j)=>{const b=polygon[(j+1)%polygon.length],x=b.x-a.x,y=b.y-a.y;
          return x*(p.y-a.y)-y*(p.x-a.x)>=-Math.hypot(x,y)*epsilon*.1;});}),
      distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    for(const [a,b] of segments){
      const x=b.x-a.x,y=b.y-a.y,length=distance(a,b);if(length<epsilon)continue;const cuts=[0,1];
      for(const p of vertices){const px=p.x-a.x,py=p.y-a.y,t=(px*x+py*y)/(length*length);
        if(t>0&&t<1&&Math.abs(px*y-py*x)<=length*epsilon)cuts.push(t);}
      // Overlapping clipped parcels may meet inside an edge instead of at a
      // stored vertex. Split both edges before classifying union occupancy.
      for(const [c,d] of segments){
        if(Math.max(c.x,d.x)<Math.min(a.x,b.x)||Math.min(c.x,d.x)>Math.max(a.x,b.x)
          ||Math.max(c.y,d.y)<Math.min(a.y,b.y)||Math.min(c.y,d.y)>Math.max(a.y,b.y))continue;
        const sx=d.x-c.x,sy=d.y-c.y,den=x*sy-y*sx;if(Math.abs(den)<1e-14)continue;
        const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/den,u=((c.x-a.x)*y-(c.y-a.y)*x)/den;
        if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
      }
      cuts.sort((a,b)=>a-b);
      for(let j=1;j<cuts.length;j++){
        const first=snap(at(a,b,cuts[j-1])),last=snap(at(a,b,cuts[j]));if(first.key===last.key)continue;
        const mid=at(first,last,.5),dx=last.x-first.x,dy=last.y-first.y,len=distance(first,last),
          left=inside({x:mid.x-dy/len*epsilon*4,y:mid.y+dx/len*epsilon*4}),
          right=inside({x:mid.x+dy/len*epsilon*4,y:mid.y-dx/len*epsilon*4});
        if(left===right)continue;
        const key=[first.key,last.key].sort().join('|');edges.set(key,[first,last]);
      }
    }
    let lines=Array.from(edges.values()),merged=true;
    while(merged){merged=false;const joins=new Map();
      lines.forEach((line,i)=>line.forEach(p=>{if(!joins.has(p.key))joins.set(p.key,[]);joins.get(p.key).push(i);}));
      for(const [key,indices] of joins){if(indices.length!==2)continue;
        const [i,j]=indices,c=snapped.get(key),a=lines[i].find(p=>p.key!==key),b=lines[j].find(p=>p.key!==key);
        const ax=a.x-c.x,ay=a.y-c.y,bx=b.x-c.x,by=b.y-c.y;
        if(ax*bx+ay*by>=0||Math.abs(ax*by-ay*bx)>distance(a,c)*distance(b,c)*1e-6)continue;
        lines=lines.filter((_,index)=>index!==i&&index!==j);lines.push([a,b]);merged=true;break;
      }
    }
    return lines.map(line=>line.map(p=>({column:request.center.column+p.x/m.column,row:request.center.row+p.y/m.row})));
  }

  function defenceSpans(enclosures,request,plazas,layer){
    const {m}=defenceMetric(request),metric=gridCellKilometres(request.recipe,request.radiusRows,request.radiusColumns),
      halfWidth=streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns).collector*metric*(layer==='inner'?3.1:2.6)*.5,
      towerRadius=Math.max(.004,Math.min(.008,request.recipe.urban.radiusKm*.01)),setback=Math.max(halfWidth,towerRadius)*Math.SQRT2+.004,
      toLocal=p=>({x:(p.column-request.center.column)*m.column,y:(p.row-request.center.row)*m.row}),
      toWorld=p=>({column:request.center.column+p.x/m.column,row:request.center.row+p.y/m.row});
    let fitted=enclosures.map(polygon=>polygon.map(toLocal));
    // Fit one shared dry defence face around every channel. Applying this
    // common obstacle to parcels before extracting the union keeps the bank
    // wall continuous and leaves room for complete masonry and towers.
    for(const channel of request.recipe.localSite?.channels||[]){
      const samples=channel.points.filter((p,i,all)=>!i||Math.hypot((p.column-all[i-1].column)*m.column,(p.row-all[i-1].row)*m.row)>1e-7),
        points=samples.map(toLocal),units=points.slice(1).map((b,i)=>{
        const a=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);return {x:(b.x-a.x)/length,y:(b.y-a.y)/length};
      });
      if(!units.length)continue;
      const banks=points.map((p,i)=>{
        const first=units[Math.max(0,i-1)],last=units[Math.min(units.length-1,i)],nx=-first.y-last.y,ny=first.x+last.x,
          length=Math.hypot(nx,ny),normal=length>1e-8?{x:nx/length,y:ny/length}:{x:-first.y,y:first.x},
          clearance=(samples[i].widthMetres||channel.widthMetres||0)/2000+setback,
          reach=clearance/Math.max(.5,normal.x*-first.y+normal.y*first.x),
          extension=i===0?-clearance:i===points.length-1?clearance:0,
          center={x:p.x+last.x*extension,y:p.y+last.y*extension};
        return [-1,1].map(side=>({x:center.x+normal.x*reach*side,y:center.y+normal.y*reach*side}));
      });
      // Adjacent bank faces share the same offset junction. Independent
      // segment end caps make a comb of tiny corners along a winding creek.
      for(let i=1;i<banks.length;i++){
        const obstacle=[banks[i-1][0],banks[i][0],banks[i][1],banks[i-1][1]],
          planes=obstacle.map((a,j)=>{const b=obstacle[(j+1)%obstacle.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
            return [dy/length,-dx/length,(a.x*dy-a.y*dx)/length];}),
          west=Math.min(...obstacle.map(p=>p.x)),east=Math.max(...obstacle.map(p=>p.x)),north=Math.min(...obstacle.map(p=>p.y)),south=Math.max(...obstacle.map(p=>p.y));
        fitted=fitted.flatMap(polygon=>{
          if(polygon.every(p=>p.x<west)||polygon.every(p=>p.x>east)||polygon.every(p=>p.y<north)||polygon.every(p=>p.y>south))return [polygon];
          return subtractPlanes(polygon,planes);
        });
      }
    }
    const fittedEnclosures=fitted.map(polygon=>polygon.map(toWorld)),polygons=fittedEnclosures.map(polygon=>polygon.map(p=>({x:p.column,y:p.row})));
    const spans=enclosureBoundary(fittedEnclosures,request).flatMap(points=>{
      // The fitted polygon union is already on local dry ground. Reapplying
      // the street channel clip to its exact bank edges creates broken stubs.
      let pieces=request.recipe.localSite?[{points}]:clipStreetToLand({points},request.recipe);
      for(const plaza of plazas)pieces=pieces.flatMap(piece=>streetOutsidePolygon(piece,plaza.points));
      // A harbour needs an open waterfront through both city wall layers.
      // Independent inland citadels still keep their complete inner defence.
      return layer==='outer'||request.recipe.harbor?pieces.flatMap(piece=>usefulWallSegments(piece.points,request,polygons)):pieces.map(piece=>piece.points);
    });
    return supportedWallSpans(spans,request,layer);
  }

  // Land clipping can leave millimetre stubs. Short spans are structural only
  // when they join substantial walls; isolated tips cannot support a tower.
  function supportedWallSpans(spans,request,layer){
    const {m,distance}=defenceMetric(request),metric=gridCellKilometres(request.recipe,request.radiusRows,request.radiusColumns),
      minimum=streetWidthsInGrid(request.recipe,request.radiusRows,request.radiusColumns).collector*metric*(layer==='inner'?3.1:2.6),
      key=p=>Math.round((p.column-request.center.column)*m.column/1e-7)+','+Math.round((p.row-request.center.row)*m.row/1e-7),nodes=new Map();
    const entries=spans.map((points,index)=>({points,index,ends:points.map(key),long:distance(...points)>=minimum}))
      .filter(edge=>edge.ends[0]!==edge.ends[1]);
    for(const edge of entries)for(const end of edge.ends){
      if(!nodes.has(end))nodes.set(end,{long:false,short:new Set()});const node=nodes.get(end);
      if(edge.long)node.long=true;else node.short.add(edge);
    }
    const remaining=new Set(entries.filter(edge=>!edge.long)),seen=new Set(),kept=new Set(entries.filter(edge=>edge.long));
    for(const edge of remaining){if(seen.has(edge))continue;
      const component=[],attachments=new Set(),pending=[edge];
      while(pending.length){const current=pending.pop();if(seen.has(current))continue;seen.add(current);component.push(current);
        for(const end of current.ends){const node=nodes.get(end);if(node.long)attachments.add(end);for(const neighbor of node.short)if(!seen.has(neighbor))pending.push(neighbor);}
      }
      if(attachments.size<2)continue;
      const active=new Set(component),queue=component.flatMap(current=>current.ends).filter(end=>!nodes.get(end).long&&nodes.get(end).short.size===1);
      while(queue.length){const end=queue.pop(),node=nodes.get(end);if(node.long)continue;
        const neighbors=Array.from(node.short).filter(current=>active.has(current));if(neighbors.length!==1)continue;
        const current=neighbors[0];active.delete(current);
        for(const other of current.ends)if(other!==end&&!nodes.get(other).long)queue.push(other);
      }
      for(const current of active)kept.add(current);
    }
    return entries.filter(edge=>kept.has(edge)).map(edge=>edge.points);
  }

  function planDefences(request,enclosures,innerEnclosures,streets,plazas,widths,metric,defenceGeometry){
    const {wallSpans,innerWallSpans}=defenceGeometry;
    const allSpans=[...wallSpans,...innerWallSpans],safeBase=streetsClearOfWalls(streets,allSpans,request,widths);
    const reservations=[...plazas,...cornerTowerSites(allSpans,request,metric).map(tower=>({points:tower.clearance}))];
    const {distance}=defenceMetric(request),radius=request.recipe.urban.radiusKm,
      approaches=(request.recipe.transport?.corridors||[]).filter(road=>road.kind==='road').flatMap(road=>[road.points[0],road.points.at(-1)])
        .filter(p=>distance(p,request.center)>radius*.9),population=request.population,
      capacity=population<1500?1:population<7000?2:population<30000?3:population<100000?4:population<300000?6:8,
      targets=approaches.length?approaches:Array.from({length:capacity},(_,i)=>({column:request.center.column+Math.cos(i*Math.PI*2/capacity)*request.radiusColumns*2,
        row:request.center.row+Math.sin(i*Math.PI*2/capacity)*request.radiusRows*2}));
    const outer=plannedGates(wallSpans,enclosures,safeBase,reservations,request,widths.arterial*metric*1.4,Math.min(capacity,Math.max(1,approaches.length)),targets,'outer',allSpans);
    const inner=plannedGates(innerWallSpans,innerEnclosures,safeBase,reservations,request,widths.arterial*metric*1.4,Math.min(4,capacity),targets,'inner',allSpans);
    return {wallSpans,innerWallSpans,enclosures,innerEnclosures,gates:[...outer.gates,...inner.gates],gateStreets:[...outer.streets,...inner.streets]};
  }

  function plannedGates(spans,enclosures,streets,plazas,request,widthKm,count,targets,layer,allSpans){
    const {m,distance,at,shift,project}=defenceMetric(request),gates=[],gateStreets=[],candidates=[],cornerMarginKm=widthKm*2.9+.012,
      polygons=enclosures.map(polygon=>polygon.map(p=>({x:p.column,y:p.row}))),inside=p=>polygons.some(polygon=>containsPoint(polygon,{x:p.column,y:p.row})),
      roadSegments=streets.filter(street=>street.kind!=='rail'&&!street.palacePerimeter).flatMap(street=>street.points.slice(1).map((b,i)=>({a:street.points[i],b,kind:street.kind}))),
      blocked=(a,b)=>plazas.some(plaza=>{const bounds=polygonBounds(plaza.points);
        return Math.max(a.column,b.column)>=bounds.west&&Math.min(a.column,b.column)<=bounds.east
          &&Math.max(a.row,b.row)>=bounds.north&&Math.min(a.row,b.row)<=bounds.south
          &&clipToDistricts({points:[a,b]},[plaza.points]).some(piece=>distance(piece.points[0],piece.points.at(-1))>1e-6);}),
      crosses=(a,b,except=null)=>allSpans.some(span=>{
        if(span===except)return false;const [c,d]=span,dx=b.column-a.column,dy=b.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=dx*sy-dy*sx;
        if(Math.abs(den)<1e-16)return false;const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*dy-(c.row-a.row)*dx)/den;
        return t>1e-7&&t<1-1e-7&&u>=-1e-7&&u<=1+1e-7;
      }),
      anchor=(portal,wantInside)=>roadSegments.map(segment=>({...segment,p:project(portal,segment.a,segment.b)}))
        .filter(segment=>inside(segment.p)===wantInside).sort((a,b)=>distance(portal,a.p)-distance(portal,b.p)).slice(0,24).find(segment=>{
          const length=distance(portal,segment.p);if(length>request.recipe.urban.radiusKm*.65||blocked(portal,segment.p)||crosses(portal,segment.p)||!segmentOnLand(portal,segment.p,request.recipe))return false;
          const steps=Math.max(2,Math.ceil(length/.04));return Array.from({length:steps+1},(_,i)=>at(portal,segment.p,i/steps)).every(p=>inside(p)===wantInside);
        });
    for(const [spanIndex,[a,b]] of spans.entries()){
      const length=distance(a,b);if(length<cornerMarginKm*2)continue;
      const tangent={x:(b.column-a.column)*m.column/length,y:(b.row-a.row)*m.row/length};
      const fractions=[.5,.25,.75,...targets.map(target=>{
        const p=project(target,a,b);return distance(a,p)/length;
      })].map(t=>Math.max(cornerMarginKm/length,Math.min(1-cornerMarginKm/length,t)));
      const used=[];
      for(const t of fractions){if(used.some(value=>Math.abs(value-t)*length<widthKm*2))continue;used.push(t);
        const center=at(a,b,t),normal={x:-tangent.y,y:tangent.x},probe=shift(center,normal.x*.006,normal.y*.006);
        const outward=inside(probe)?{x:-normal.x,y:-normal.y}:normal,depth=Math.max(.045,widthKm*3),
          innerPortal=shift(center,-outward.x*depth,-outward.y*depth),outerPortal=shift(center,outward.x*depth,outward.y*depth);
        if(!inside(innerPortal)||inside(outerPortal)||crosses(innerPortal,outerPortal,spans[spanIndex])||blocked(innerPortal,outerPortal)||!segmentOnLand(innerPortal,outerPortal,request.recipe))continue;
        const towers=[-1,1].map(side=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>shift(center,
          tangent.x*(widthKm*1.38*side+x*widthKm*.48)+outward.x*y*widthKm*.48,
          tangent.y*(widthKm*1.38*side+x*widthKm*.48)+outward.y*y*widthKm*.48)));
        if(tangent.x*outward.y-tangent.y*outward.x<0)towers.forEach(points=>points.reverse());
        if(towers.some(points=>points.some(p=>!segmentOnLand(p,p,request.recipe))||plazas.some(plaza=>polygonsOverlap(points,plaza.points))))continue;
        if(allSpans.some(span=>span!==spans[spanIndex]&&towers.some(points=>
          points.some(p=>distance(p,project(p,...span))<.003)||clipToDistricts({points:span},[points]).some(piece=>distance(piece.points[0],piece.points.at(-1))>1e-6))))continue;
        const inner=anchor(innerPortal,true),outer=layer==='inner'?anchor(outerPortal,false):null;
        if(!inner||layer==='inner'&&!outer)continue;
        const points=[inner.p,innerPortal,center,outerPortal,...(outer?[outer.p]:[])].filter((p,i,all)=>!i||distance(p,all[i-1])>1e-8);
        const ox=(center.column-request.center.column)*m.column,oy=(center.row-request.center.row)*m.row,direction=Math.abs(ox)>Math.abs(oy)?ox>0?'东':'西':oy>0?'南':'北';
        candidates.push({center,towers,points,outward,layer,widthKm,wallSpan:[a,b],cornerMarginKm,
          name:(layer==='inner'?'内城':'')+direction+(['fortress','pass'].includes(request.recipe.siteType)?'关门':'城门'),
          passage:[innerPortal,outerPortal],anchorLength:distance(inner.p,innerPortal)+(outer?distance(outer.p,outerPortal):0)});
      }
    }
    for(let i=0;i<count&&candidates.length;i++){
      const target=targets[Math.floor(i*targets.length/count)%targets.length],tx=(target.column-request.center.column)*m.column,ty=(target.row-request.center.row)*m.row;
      const score=candidate=>{const x=(candidate.center.column-request.center.column)*m.column,y=(candidate.center.row-request.center.row)*m.row;
        return 1-(x*tx+y*ty)/(Math.hypot(x,y)*Math.hypot(tx,ty))+candidate.anchorLength/request.recipe.urban.radiusKm*.4;};
      candidates.sort((a,b)=>score(a)-score(b));const chosen=candidates.shift(),id=layer+'-gate-'+i;
      const {points,anchorLength,...gate}=chosen;gates.push({...gate,id});gateStreets.push({id,kind:'collector',points,gateCenter:chosen.center,
        widthKm,wallSpan:chosen.wallSpan,outward:chosen.outward,layer});
      for(let j=candidates.length-1;j>=0;j--)if(distance(chosen.center,candidates[j].center)<Math.max(widthKm*7,request.recipe.urban.radiusKm*.22))candidates.splice(j,1);
    }
    return {gates,streets:gateStreets};
  }

  function wallSegmentsWithGates(a,b,gates,request){
    const {distance,at,project}=defenceMetric(request),length=distance(a,b),openings=[];
    if(length<1e-8)return [];
    for(const gate of gates)if(distance(gate.center,project(gate.center,a,b))<1e-6){
      const t=distance(a,project(gate.center,a,b))/length;openings.push([Math.max(0,t-gate.widthKm/length),Math.min(1,t+gate.widthKm/length)]);
    }
    openings.sort((a,b)=>a[0]-b[0]);const lines=[];let cursor=0;
    for(const [low,high] of openings){if(low>cursor)lines.push([at(a,b,cursor),at(a,b,low)]);cursor=Math.max(cursor,high);}
    if(cursor<1)lines.push([at(a,b,cursor),b]);return lines;
  }

  function streetsClearOfWalls(streets,walls,request,widths){
    return wallClearanceIndex(walls,request,widths).clip(streets);
  }

  function wallClearanceIndex(walls,request,widths){
    const {m,distance,shift}=defenceMetric(request),clearance=Math.max(.003,widths.collector*Math.sqrt(m.row*m.column)*.6);
    const intersectsBounds=(street,bounds)=>street.points.some((p,i)=>i&&Math.max(p.column,street.points[i-1].column)>=bounds.west
      &&Math.min(p.column,street.points[i-1].column)<=bounds.east&&Math.max(p.row,street.points[i-1].row)>=bounds.north&&Math.min(p.row,street.points[i-1].row)<=bounds.south);
    const obstacles=[];
    for(const [a,b] of walls){const length=distance(a,b);if(length<1e-8)continue;
      const x=(b.column-a.column)*m.column/length,y=(b.row-a.row)*m.row/length,
        polygon=[shift(a,-x*.001+y*clearance,-y*.001-x*clearance),shift(b,x*.001+y*clearance,y*.001-x*clearance),
          shift(b,x*.001-y*clearance,y*.001+x*clearance),shift(a,-x*.001-y*clearance,-y*.001+x*clearance)],bounds=polygonBounds(polygon);
      obstacles.push({points:polygon,bounds});
    }
    for(const tower of cornerTowerSites(walls,request,Math.sqrt(m.row*m.column))){const bounds=polygonBounds(tower.clearance);
      obstacles.push({points:tower.clearance,bounds});}
    const candidates=boundsIndex(obstacles,request.center,.075/Math.sqrt(m.row*m.column));
    return {clip(streets){return streets.flatMap(street=>{
      let pieces=[street];
      // Clipping is independent between streets. Keep obstacle order within
      // each original street, preserving both exact cuts and output order.
      for(const obstacle of candidates(polygonBounds(street.points)))pieces=pieces.flatMap(piece=>
        intersectsBounds(piece,obstacle.bounds)?streetOutsidePolygon(piece,obstacle.points):[piece]);
      return pieces;
    });}};
  }

  function polygonArea(points) {
    if(points.length<3)return 0;
    const origin=points[0];
    return Math.abs(points.reduce((sum, point, index) => { const next = points[(index + 1) % points.length];
      return sum+(point.x-origin.x)*(next.y-origin.y)-(next.x-origin.x)*(point.y-origin.y); }, 0)) * 0.5;
  }

  function polygonCentre(points) {
    return {x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length};
  }

  function clipHalfPlane(points, nx, ny, distance) {
    const result = [];
    for (let index = 0; index < points.length; index++) {
      const first = points[index], second = points[(index + 1) % points.length];
      const a = first.x * nx + first.y * ny - distance, b = second.x * nx + second.y * ny - distance;
      if (a <= 1e-12) result.push(first);
      if ((a < 0 && b > 0) || (a > 0 && b < 0)) {
        const t = a / (a - b);
        result.push({x: first.x + (second.x - first.x) * t, y: first.y + (second.y - first.y) * t});
      }
    }
    return result;
  }

  function bisectParcel(points, seed, channel, chaos, aspect=1) {
    const xs = points.map(point => point.x), ys = points.map(point => point.y);
    const horizontal = (Math.max(...xs) - Math.min(...xs))/aspect >= Math.max(...ys) - Math.min(...ys);
    const angle = (horizontal ? 0 : Math.PI / 2) + (random(seed, channel + 1) - 0.5) * chaos;
    const nx = Math.cos(angle), ny = Math.sin(angle);
    const projections = points.map(point => point.x * nx + point.y * ny);
    const low = Math.min(...projections), high = Math.max(...projections);
    const distance = low + (high - low) * (0.38 + random(seed, channel + 2) * 0.24);
    const first = clipHalfPlane(points, nx, ny, distance), second = clipHalfPlane(points, -nx, -ny, -distance);
    if (first.length < 3 || second.length < 3 || Math.min(polygonArea(first), polygonArea(second)) < 1e-10) return null;
    const cut = first.filter(point => Math.abs(point.x * nx + point.y * ny - distance) < 1e-9);
    return cut.length >= 2 ? {first, second, cut: [cut[0], cut[cut.length - 1]]} : null;
  }

  function insetPolygon(points, margin) {
    let result = points;
    for (let index = 0; index < points.length && result.length >= 3; index++) {
      const a = points[index], b = points[(index + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (length < 1e-12) continue;
      const nx = (b.y - a.y) / length, ny = (a.x - b.x) / length;
      result = clipHalfPlane(result, nx, ny, a.x * nx + a.y * ny - margin);
    }
    return result;
  }

  function clipToLand(points, recipe) {
    if(recipe.localSite)return clipToLocalLand(points.map(p=>({x:p.column,y:p.row})),recipe).map(polygon=>polygon.map(p=>({column:p.x,row:p.y})));
    const local = points.map(point => ({x: point.column, y: point.row}));
    const result = [];
    for (const [row, column] of recipe.terrain.buildable.allowedCells) {
      let polygon = clipHalfPlane(local, -1, 0, -column);
      polygon = clipHalfPlane(polygon, 1, 0, column + 1);
      polygon = clipHalfPlane(polygon, 0, -1, -row);
      polygon = clipHalfPlane(polygon, 0, 1, row + 1);
      if (polygon.length >= 3 && polygonArea(polygon) > 1e-12) result.push(...clipToLocalLand(polygon,recipe)
        .map(piece=>piece.map(point => ({row: point.y, column: point.x}))));
    }
    return result;
  }

  function clipRectangle(points, west, north, east, south) {
    let result=clipHalfPlane(points,-1,0,-west);
    result=clipHalfPlane(result,1,0,east);
    result=clipHalfPlane(result,0,-1,-north);
    return clipHalfPlane(result,0,1,south);
  }

  // Cut a forbidden convex area into disjoint convex remnants. Streets,
  // buildings and public squares share the same stream and slope mask.
  function subtractPlanes(polygon, planes) {
    const outside=[];let inside=polygon;
    for(const [nx,ny,distance] of planes){
      const piece=clipHalfPlane(inside,-nx,-ny,-distance);
      if(piece.length>=3&&polygonArea(piece)>1e-12)outside.push(piece);
      inside=clipHalfPlane(inside,nx,ny,distance);
      if(inside.length<3)break;
    }
    return outside;
  }

  function clipToLocalLand(polygon, recipe) {
    const site=recipe.localSite;if(!site)return [polygon];
    let pieces=[polygon];const surface=site.surface;
    if(surface){
      const {west,north,east,south}=surface.bounds,columns=surface.columns-1,rows=surface.rows-1;
      const dx=(east-west)/columns,dy=(south-north)/rows;
      const xs=polygon.map(point=>point.x),ys=polygon.map(point=>point.y);
      const box={west:Math.min(...xs),east:Math.max(...xs),north:Math.min(...ys),south:Math.max(...ys)},
        allAllowed=polygon.every(p=>surfaceAllows({column:p.x,row:p.y},surface,.20))
          &&!(surface.lakeTerrain||[]).some(field=>box.east>=field.bounds.west&&box.west<=field.bounds.east&&box.south>=field.bounds.north&&box.north<=field.bounds.south);
      if(!allAllowed){
        pieces=[];
        for(const vertices of global.WorldAtlasCitySite.surfaceTriangles(surface,box)){
          const triangle=vertices.map(p=>{
            const x=(p.column-west)/dx,y=(p.row-north)/dy,i=Math.min(columns-1,Math.floor(x)),j=Math.min(rows-1,Math.floor(y)),u=x-i,v=y-j,k=j*surface.columns+i,z=surface.slopes,
              slope=z[k]*(1-u)*(1-v)+z[k+1]*u*(1-v)+z[k+surface.columns]*(1-u)*v+z[k+surface.columns+1]*u*v;
            return {x:p.column,y:p.row,value:Math.min(p.height,(.20-slope)*1000,-p.depth)};
          }),dry=[];
          for(let edge=0;edge<3;edge++){const a=triangle[edge],b=triangle[(edge+1)%3];
            if(a.value>0)dry.push(a);if((a.value>0)!==(b.value>0)){const t=a.value/(a.value-b.value);dry.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}
          if(dry.length<3)continue;let piece=polygon;
          for(let edge=0;edge<dry.length;edge++){const a=dry[edge],b=dry[(edge+1)%dry.length],nx=b.y-a.y,ny=a.x-b.x;piece=clipHalfPlane(piece,nx,ny,a.x*nx+a.y*ny);}
          if(piece.length>=3&&polygonArea(piece)>1e-12)pieces.push(piece);
        }
      }
    }
    const metric=gridCellKilometres(recipe,recipe.urban.radiusRows,recipe.urban.radiusColumns);
    for(const channel of site.channels || [])for(let index=1;index<channel.points.length;index++){
      const a=channel.points[index-1],b=channel.points[index],dx=b.column-a.column,dy=b.row-a.row,length=Math.hypot(dx,dy);
      if(!length)continue;
      const clearance=(Math.max(a.widthMetres,b.widthMetres)*0.5+3)/(metric*1000);
      const planes=[[dy/length,-dx/length,(a.column*dy-a.row*dx)/length+clearance],
        [-dy/length,dx/length,(-a.column*dy+a.row*dx)/length+clearance],
        [-dx/length,-dy/length,(-a.column*dx-a.row*dy)/length+clearance],
        [dx/length,dy/length,(b.column*dx+b.row*dy)/length+clearance]];
      pieces=pieces.flatMap(piece=>{
        if(piece.every(point=>point.x<Math.min(a.column,b.column)-clearance)||piece.every(point=>point.x>Math.max(a.column,b.column)+clearance)
          ||piece.every(point=>point.y<Math.min(a.row,b.row)-clearance)||piece.every(point=>point.y>Math.max(a.row,b.row)+clearance))return [piece];
        return subtractPlanes(piece,planes);
      });
    }
    return pieces;
  }

  function nearestPoint(point, a, b) {
    const dx = b.column - a.column, dy = b.row - a.row;
    const t = Math.max(0, Math.min(1, ((point.column - a.column) * dx + (point.row - a.row) * dy) / (dx * dx + dy * dy || 1)));
    return {column: a.column + dx * t, row: a.row + dy * t};
  }

  function appendFortress(geometry, cityPlan) {
    const fort = cityPlan.fortress;
    const group = svg("g", {class: "city-fortress", "data-fortress-era": fort.era,'data-fortress-kind':fort.kind});
    group.appendChild(svg("path", {d: pathData(fort.points, true), fill: "#e9e2cf"}));
    group.appendChild(svg("path", {d: fort.walls.map(points => pathData(points, false)).join(" "), fill: "none", stroke: "#645547", "stroke-width": cityPlan.streetWidths.collector * 2.3}));
    group.appendChild(svg("path", {d: fort.towers.map(points => pathData(points, true)).join(" "), fill: "#71614f", stroke: "#f5ead3", "stroke-width": cityPlan.streetWidths.local * 0.4}));
    if(fort.kind==='castle')group.appendChild(svg("path", {d: pathData(fort.keep, true), fill: cityPlan.character.roof[0], stroke: "#76634d", "stroke-width": cityPlan.streetWidths.local}));
    else {
      for(const building of fort.interiors)group.appendChild(svg('path',{d:pathData(building.points,true),fill:cityPlan.character.roof[0],stroke:'#857563',
        'stroke-width':.55,'vector-effect':'non-scaling-stroke','data-fort-building':building.kind}));
      group.appendChild(svg('path',{d:fort.interiors.flatMap(b=>roofLines(b.points)).map(p=>pathData(p,false)).join(' '),fill:'none',stroke:'#f4ead6',
        'stroke-width':.6,'vector-effect':'non-scaling-stroke'}));
    }
    geometry.appendChild(group);
  }

  function containsPoint(polygon, point) {
    return polygon.every((a, index) => { const b = polygon[(index + 1) % polygon.length]; return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= -1e-12; });
  }

  function clipStreetToLand(street, recipe) {
    if(recipe.localSite)return street.points.slice(1).flatMap((point,index)=>clipStreetToLocalLand({...street,points:[street.points[index],point]},recipe));
    const result = [];
    for (let index = 1; index < street.points.length; index++) {
      const a = street.points[index - 1], b = street.points[index];
      for (const [row, column] of recipe.terrain.buildable.allowedCells) {
        let minimum = 0, maximum = 1;
        for (const [start, delta, low, high] of [[a.row, b.row - a.row, row, row + 1], [a.column, b.column - a.column, column, column + 1]]) {
          if (Math.abs(delta) < 1e-12) { if (start < low || start > high) maximum = -1; continue; }
          const t1 = (low - start) / delta, t2 = (high - start) / delta;
          minimum = Math.max(minimum, Math.min(t1, t2)); maximum = Math.min(maximum, Math.max(t1, t2));
        }
        if (maximum - minimum > 1e-10) result.push(...clipStreetToLocalLand({...street, points: [minimum, maximum].map(t => ({row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t}))},recipe));
      }
    }
    return result;
  }

  function streetCrossingsValid(street,recipe){
    const site=recipe.localSite;if(!site)return true;const m=recipe.urban.gridCellKilometres;
    for(let i=1;i<street.points.length;i++)for(const channel of site.channels)for(let j=1;j<channel.points.length;j++){
      const a=street.points[i-1],b=street.points[i],c=channel.points[j-1],d=channel.points[j],dx=b.column-a.column,dy=b.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=dx*sy-dy*sx;
      if(Math.abs(den)<1e-12)continue;const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*dy-(c.row-a.row)*dx)/den;
      if(t<0||t>1||u<0||u>1)continue;const p={column:a.column+dx*t,row:a.row+dy*t};
      if(!(site.bridges||[]).some(bridge=>Math.hypot((p.column-bridge.center.column)*m.column,(p.row-bridge.center.row)*m.row)<.018))return false;
    }return true;
  }

  function clipStreetToLocalLand(street, recipe) {
    if(!recipe.localSite)return [street];
    const a=street.points[0],b=street.points[1],dx=b.column-a.column,dy=b.row-a.row;
    let intervals=[[0,1]];
    const remove=planes=>{
      let minimum=0,maximum=1;
      for(const [nx,ny,distance] of planes){
        const start=a.column*nx+a.row*ny,delta=dx*nx+dy*ny;
        if(Math.abs(delta)<1e-12){if(start>distance+1e-12)return;continue;}
        const fraction=(distance-start)/delta;
        if(delta>0)maximum=Math.min(maximum,fraction);else minimum=Math.max(minimum,fraction);
      }
      if(maximum-minimum<1e-10)return;
      intervals=intervals.flatMap(([first,last])=>{
        if(maximum<=first||minimum>=last)return [[first,last]];
        const pieces=[];if(minimum-first>1e-10)pieces.push([first,Math.min(last,minimum)]);
        if(last-maximum>1e-10)pieces.push([Math.max(first,maximum),last]);return pieces;
      });
    };
    const surface=recipe.localSite.surface;
    if(surface){
      const cell=Math.min((surface.bounds.east-surface.bounds.west)/(surface.columns-1),(surface.bounds.south-surface.bounds.north)/(surface.rows-1)),
        steps=Math.max(2,Math.ceil(Math.hypot(dx,dy)/cell*5)),valid=[],at=t=>({column:a.column+dx*t,row:a.row+dy*t});
      let previous=surfaceAllows(a,surface,.20),start=0;
      for(let i=1;i<=steps;i++){
        const t=i/steps,allowed=surfaceAllows(at(t),surface,.20);
        if(allowed!==previous){let low=(i-1)/steps,high=t;for(let j=0;j<18;j++){
          const middle=(low+high)/2;if(surfaceAllows(at(middle),surface,.20)===previous)low=middle;else high=middle;}
          const edge=(low+high)/2;if(previous)valid.push([start,edge]);else start=edge;
        }previous=allowed;
      }if(previous)valid.push([start,1]);
      intervals=intervals.flatMap(([a,b])=>valid.map(([c,d])=>[Math.max(a,c),Math.min(b,d)]).filter(([a,b])=>b-a>1e-10));
    }
    const metric=gridCellKilometres(recipe,recipe.urban.radiusRows,recipe.urban.radiusColumns);
    for(const channel of recipe.localSite.channels || [])for(let index=1;index<channel.points.length;index++){
      const first=channel.points[index-1],last=channel.points[index],sx=last.column-first.column,sy=last.row-first.row,length=Math.hypot(sx,sy);
      if(!length)continue;const clearance=(Math.max(first.widthMetres,last.widthMetres)*0.5+3)/(metric*1000);
      remove([[sy/length,-sx/length,(first.column*sy-first.row*sx)/length+clearance],
        [-sy/length,sx/length,(-first.column*sy+first.row*sx)/length+clearance],
        [-sx/length,-sy/length,(-first.column*sx-first.row*sy)/length+clearance],
        [sx/length,sy/length,(last.column*sx+last.row*sy)/length+clearance]]);
    }
    for(const bridge of recipe.localSite.bridges||[])if(bridge.routeId===street.id||routeNear(bridge.center,[a,b],.02/metric)){
      const fractions=bridge.points.map(p=>((p.column-a.column)*dx+(p.row-a.row)*dy)/(dx*dx+dy*dy));
      const low=Math.max(0,Math.min(...fractions)),high=Math.min(1,Math.max(...fractions));
      if(high>low)intervals.push([low,high]);
    }
    intervals.sort((a,b)=>a[0]-b[0]);
    const connected=[];for(const interval of intervals){const last=connected.at(-1);
      if(last&&interval[0]<=last[1]+1e-9)last[1]=Math.max(last[1],interval[1]);else connected.push(interval);}
    return connected.map(([minimum,maximum])=>({...street,points:[minimum,maximum].map(t=>({row:a.row+dy*t,column:a.column+dx*t}))}));
  }

  function routeNear(point, points, clearance) {
    return points.slice(1).some((end, index) => { const near = nearestPoint(point, points[index], end); return Math.hypot(point.row - near.row, point.column - near.column) < clearance; });
  }

  function polygonNearRoute(polygon, points, clearance) {
    const bounds=polygonBounds(polygon);
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1], end = points[index];
      if(bounds.south<Math.min(start.row,end.row)-clearance||bounds.north>Math.max(start.row,end.row)+clearance
        ||bounds.east<Math.min(start.column,end.column)-clearance||bounds.west>Math.max(start.column,end.column)+clearance)continue;
      const dx = end.column - start.column, dy = end.row - start.row;
      const length = Math.hypot(dx, dy);
      if (!length) continue;
      // Intersect the building with the finite expanded transport corridor.
      let clipped = polygon.map(point => ({x: point.column-start.column, y: point.row-start.row}));
      for (const [nx, ny, distance] of [
        [dy / length, -dx / length, clearance],
        [-dy / length, dx / length, clearance],
        [-dx / length, -dy / length, clearance],
        [dx / length, dy / length, length + clearance],
      ]) clipped = clipHalfPlane(clipped, nx, ny, distance);
      if (polygonArea(clipped)>1e-14) return true;
    }
    return false;
  }

  const waterGroundCache=new WeakMap();
  function polygonNearWater(points,recipe){
    const site=recipe.localSite;if(!site?.channels?.length)return false;
    let water=waterGroundCache.get(site);
    if(!water){
      const fallback=gridCellKilometres(recipe,recipe.urban.radiusRows,recipe.urban.radiusColumns),
        m=recipe.urban.gridCellKilometres||{},row=m.row||fallback,column=m.column||fallback,
        origin=recipe.location,toMetres=p=>({column:(p.column-origin.column)*column*1000,row:(p.row-origin.row)*row*1000});
      water={toMetres,channels:site.channels.map(channel=>({
        points:channel.points.map(toMetres),clearance:Math.max(channel.widthMetres||2,...channel.points.map(p=>p.widthMetres||0))*.5+3}))};
      waterGroundCache.set(site,water);
    }
    // A native row and column can represent different physical distances.
    // Test the whole footprint in metres, using the same axes as the river banks.
    const footprint=points.map(water.toMetres);
    return water.channels.some(channel=>polygonNearRoute(footprint,channel.points,channel.clearance));
  }

  function segmentOnLand(start, end, recipe) {
    const allowed = new Set(recipe.terrain.buildable.allowedCells.map(cell => cell.join(",")));
    const surface=recipe.localSite?.surface;
    const cellSize=surface?Math.min((surface.bounds.east-surface.bounds.west)/(surface.columns-1),
      (surface.bounds.south-surface.bounds.north)/(surface.rows-1)):1;
    const steps = Math.max(2, Math.ceil(Math.hypot(end.row - start.row, end.column - start.column) / cellSize * 2));
    for (let index = 0; index <= steps; index++) {
      const t = index / steps;
      const row=start.row+(end.row-start.row)*t,column=start.column+(end.column-start.column)*t;
      if (!surface&&!allowed.has(Math.floor(row) + "," + Math.floor(column))) return false;
      if(surface&&!surfaceAllows({row,column},surface,.20))return false;
    }
    // Give the access segment a nonzero footprint so a lane cannot jump a
    // water corridor simply because both sampled endpoints are on dry ground.
    const dx=end.column-start.column,dy=end.row-start.row,length=Math.hypot(dx,dy);
    if(!length)return !polygonNearWater(rectangle(start,1e-8,1e-8),recipe);
    const x=-dy/length*1e-8,y=dx/length*1e-8;
    return !polygonNearWater([{row:start.row+y,column:start.column+x},{row:end.row+y,column:end.column+x},
      {row:end.row-y,column:end.column-x},{row:start.row-y,column:start.column-x}],recipe);
  }

  function surfaceAllows(p,f,maxSlope){
    const b=f.bounds;if(p.column<b.west||p.column>b.east||p.row<b.north||p.row>b.south)return false;
    const x=(p.column-b.west)/(b.east-b.west)*(f.columns-1),y=(p.row-b.north)/(b.south-b.north)*(f.rows-1),
      i=Math.min(f.columns-2,Math.floor(x)),j=Math.min(f.rows-2,Math.floor(y)),u=x-i,v=y-j,k=j*f.columns+i;
    const value=a=>(a[k]*(1-u)+a[k+1]*u)*(1-v)+(a[k+f.columns]*(1-u)+a[k+f.columns+1]*u)*v;
    return global.WorldAtlasCitySite.isDry(f,p)&&value(f.slopes)<maxSlope;
  }

  function streetWidthsInGrid(recipe, radiusRows, radiusColumns) {
    const declared = recipe.urban && recipe.urban.streetWidthsMetres || {};
    const fallback = { arterial: 12, collector: 5.5, local: 2.8 };
    const small=global.WorldAtlasCityCharacter.profile(recipe).small;
    const limits=small?{arterial:4.5,collector:3,local:1.8}:fallback;
    const scale = gridCellKilometres(recipe, radiusRows, radiusColumns);
    const toGrid = (kind) => (small?Math.min(limits[kind],finiteOr(declared[kind],limits[kind])):finiteOr(declared[kind],fallback[kind])) / (scale * 1000);
    return {
      arterial: toGrid('arterial'),
      collector: toGrid('collector'),
      local: toGrid('local'),
    };
  }

  function gridCellKilometres(recipe, radiusRows, radiusColumns) {
    const metrics = recipe.urban && recipe.urban.gridCellKilometres || {};
    const row = finiteOr(metrics.row, NaN);
    const column = finiteOr(metrics.column, NaN);
    if (row > 0 && column > 0) return (row + column) * 0.5;
    const radiusKm = finiteOr(recipe.urban && recipe.urban.radiusKm, 1);
    const radius = (Math.max(0.00001, radiusRows) + Math.max(0.00001, radiusColumns)) * 0.5;
    return Math.max(0.001, radiusKm / radius);
  }

  function pathData(points, closed) {
    if (!points.length) return "";
    const segments = points.map((point, index) => (index ? "L " : "M ") + Number(point.column.toFixed(7)) + " " + Number(point.row.toFixed(7)));
    return segments.join(" ") + (closed ? " Z" : "");
  }

  function svg(tag, attributes) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.keys(attributes).forEach((key) => {
      if (attributes[key] !== undefined && attributes[key] !== null) {
        node.setAttribute(key, String(attributes[key]));
      }
    });
    return node;
  }

  function validateRecipe(recipe) {
    if (!recipe || typeof recipe !== "object" || typeof recipe.id !== "string" || !recipe.id || !recipe.location) {
      throw new TypeError("a city recipe requires id and location");
    }
    if (!Number.isFinite(recipe.location.row) || !Number.isFinite(recipe.location.column)) {
      throw new TypeError("city recipe location must use finite world-grid coordinates");
    }
    if (!VALID_ERAS.has(recipe.era)) {
      throw new TypeError("city recipe requires a strict technology era");
    }
    const buildable = recipe.terrain && recipe.terrain.buildable;
    if (!buildable || buildable.coordinateSpace !== "world-grid-cells" || !Array.isArray(buildable.allowedCells) || !buildable.allowedCells.length) {
      throw new TypeError("city recipe requires non-empty native-grid buildable cells");
    }
    buildable.allowedCells.forEach((cell) => {
      if (!Array.isArray(cell) || cell.length !== 2 || !Number.isInteger(cell[0]) || !Number.isInteger(cell[1])) {
        throw new TypeError("city buildable cells must be [row, column] integer pairs");
      }
    });
  }

  function normalizeBuildable(buildable) {
    return {
      allowedCells: buildable.allowedCells.map((cell) => [cell[0], cell[1]]),
      bounds: buildable.bounds || null,
      precision: buildable.precision || "native-grid-cell",
    };
  }

  function clipIdentifier(recipe, prefix) {
    const safe = recipe.id.replace(/[^A-Za-z0-9_.-]/g, "-").slice(0, 72) || "city";
    const safePrefix = String(prefix).replace(/[^A-Za-z0-9_.-]/g, "-").slice(0, 72) || "city-detail";
    return safePrefix + "-" + safe + "-" + unsigned(recipe.seed).toString(36);
  }

  function normalizeGrid(grid) {
    if (!grid || typeof grid !== "object") return null;
    const width = finiteOr(grid.width, 0);
    const height = finiteOr(grid.height, 0);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  function finiteOr(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function unsigned(value) {
    return (Number(value) >>> 0);
  }

  function normalizeAngle(value) {
    const numeric = finiteOr(value, 0);
    return ((numeric % 360) + 360) % 360;
  }

  function random(seed, channel) {
    let value = (unsigned(seed) ^ Math.imul(unsigned(channel) + 0x9e3779b9, 0x85ebca6b)) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 0x7feb352d) >>> 0;
    value ^= value >>> 15;
    value = Math.imul(value, 0x846ca68b) >>> 0;
    value ^= value >>> 16;
    return (value >>> 0) / 4294967296;
  }

  const api = Object.freeze({ plan, render, streetNetwork });
  global.WorldAtlasCities = api;
})(typeof window !== "undefined" ? window : globalThis);
