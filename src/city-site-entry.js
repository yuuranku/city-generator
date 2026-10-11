import Flatbush from 'flatbush';
import polygonClipping from 'polygon-clipping';

/* Generate one city's hills, drainage and fields from its saved parent terrain. */
(() => {
  'use strict';
  const M = Math;
  const clamp = (value, low, high) => M.max(low, M.min(high, value));
  const round = value => M.round(value * 1e7) / 1e7;

  function polygonBounds(points,tolerance=0) {
    const columns=points.map(p=>p.column),rows=points.map(p=>p.row),
      west=M.min(...columns),east=M.max(...columns),north=M.min(...rows),south=M.max(...rows),
      xMargin=(east-west)*tolerance+1e-12,yMargin=(south-north)*tolerance+1e-12;
    return {west:west-xMargin,east:east+xMargin,north:north-yMargin,south:south+yMargin};
  }

  function boundsCandidates(boxes) {
    if(!boxes.length)return ()=>[];
    const index=new Flatbush(boxes.length);
    for(const box of boxes)index.add(box.west,box.north,box.east,box.south);
    index.finish();
    return box=>index.search(box.west,box.north,box.east,box.south).sort((a,b)=>a-b);
  }

  function dryGroundPath(paths) {
    if(!paths.length)return '';
    let merged=[];
    // Union the exact encoded triangles once. The shared dry-ground mask is
    // reused by woods and roads; sending every interior edge to each SVG clip
    // makes their rasterization much more expensive than their visible outline.
    for(let start=0;start<paths.length;start+=512){
      const batch=paths.slice(start,start+512).map(points=>{
        const ring=[...points,[...points[0]]];return [ring];
      });
      merged.push(polygonClipping.union(...batch));
    }
    while(merged.length>1){
      const next=[];
      for(let i=0;i<merged.length;i+=2)next.push(i+1<merged.length?polygonClipping.union(merged[i],merged[i+1]):merged[i]);
      merged=next;
    }
    // Polygon-clipping returns CCW shells and CW holes for nonzero SVG fill.
    // Do not round newly created intersections or simplify their geometry.
    return merged[0].map(polygon=>polygon.map(ring=>'M'+ring.slice(0,-1).map(p=>p.join(' ')).join('L')+'Z').join('')).join('');
  }
  const random = (seed, salt) => {
    let value = (seed ^ M.imul(salt + 1, 0x9e3779b9)) >>> 0;
    value = M.imul(value ^ value >>> 16, 0x21f0aaad);
    value = M.imul(value ^ value >>> 15, 0x735a2d97);
    return ((value ^ value >>> 15) >>> 0) / 4294967296;
  };

  function sample(values, rows, columns, bounds, row, column) {
    const x = clamp((column - bounds.west) / (bounds.east - bounds.west) * (columns - 1), 0, columns - 1);
    const y = clamp((row - bounds.north) / (bounds.south - bounds.north) * (rows - 1), 0, rows - 1);
    const x0 = M.floor(x), y0 = M.floor(y), x1 = M.min(columns - 1, x0 + 1), y1 = M.min(rows - 1, y0 + 1);
    const fx = x - x0, fy = y - y0;
    return (values[y0 * columns + x0] * (1 - fx) + values[y0 * columns + x1] * fx) * (1 - fy)
      + (values[y1 * columns + x0] * (1 - fx) + values[y1 * columns + x1] * fx) * fy;
  }

  function nearest(values, rows, columns, bounds, point) {
    const x = clamp(M.round((point.column - bounds.west) / (bounds.east - bounds.west) * (columns - 1)), 0, columns - 1);
    const y = clamp(M.round((point.row - bounds.north) / (bounds.south - bounds.north) * (rows - 1)), 0, rows - 1);
    return values[y * columns + x];
  }

  const lineCache=new WeakMap();
  function distanceToLine(point, points, metric) {
    let cached=lineCache.get(points);
    if(!cached||cached.rowMetric!==metric.row||cached.columnMetric!==metric.column){
      const lines=points.slice(1).map((b,i)=>{const a=points[i],dx=(b.column-a.column)*metric.column,dy=(b.row-a.row)*metric.row;
        return {a,b,dx,dy,length:dx*dx+dy*dy||1,minDx:M.min(0,dx),maxDx:M.max(0,dx),minDy:M.min(0,dy),maxDy:M.max(0,dy)};});
      const origin=points[0];let index=null;
      if(lines.length>=64){
        index=new Flatbush(lines.length);
        for(const {a,b} of lines){
          const x0=(a.column-origin.column)*metric.column,x1=(b.column-origin.column)*metric.column,
            y0=(a.row-origin.row)*metric.row,y1=(b.row-origin.row)*metric.row;
          index.add(M.min(x0,x1),M.min(y0,y1),M.max(x0,x1),M.max(y0,y1));
        }index.finish();
      }
      cached={lines,index,origin,last:0,rowMetric:metric.row,columnMetric:metric.column};lineCache.set(points,cached);
    }
    const {lines,index,origin}=cached;
    if(!lines.length)return {distance:Infinity,elevation:0,widthMetres:0};
    const first=lines[cached.last],
      firstX=(point.column-first.a.column)*metric.column,firstY=(point.row-first.a.row)*metric.row,
      firstT=clamp((firstX*first.dx+firstY*first.dy)/first.length,0,1),
      firstDx=firstX-first.dx*firstT,firstDy=firstY-first.dy*firstT;
    // A previously nearby segment gives a measured bound for this new query.
    // Every possible closer segment and every earlier exact tie is rechecked.
    let best=firstDx*firstDx+firstDy*firstDy,height=0,widthMetres=0,bestIndex=cached.last,bestT=firstT,candidates=null;
    if(index){
      const x=(point.column-origin.column)*metric.column,y=(point.row-origin.row)*metric.row,
        radius=M.hypot(firstDx,firstDy)+1e-9;
      candidates=index.search(x-radius,y-radius,x+radius,y+radius);
    }
    for(let i=0;i<(candidates?candidates.length:lines.length);i++){
      const sourceIndex=candidates?candidates[i]:i,{a,b,dx,dy,length,minDx,maxDx,minDy,maxDy}=lines[sourceIndex];
      const px=(point.column-a.column)*metric.column,py=(point.row-a.row)*metric.row;
      const bx=px<minDx?minDx-px:px>maxDx?px-maxDx:0,by=py<minDy?minDy-py:py>maxDy?py-maxDy:0;
      const bound=bx*bx+by*by;
      if(bound>best||bound===best&&sourceIndex>bestIndex)continue;
      const t=clamp((px*dx+py*dy)/length,0,1),x=px-dx*t,y=py-dy*t,d=x*x+y*y;
      if(d<best||d===best&&sourceIndex<bestIndex){best=d;bestIndex=sourceIndex;bestT=t;}
    }
    if(Number.isFinite(bestIndex)){
      const {a,b}=lines[bestIndex],t=bestT;
      height=(a.elevationMetres||0)*(1-t)+(b.elevationMetres||0)*t;
      widthMetres=(a.widthMetres||0)*(1-t)+(b.widthMetres||0)*t;
      cached.last=bestIndex;
    }
    return {distance:M.sqrt(best),elevation:height,widthMetres};
  }

  // This is the same diagonal used by the rendered terrain triangles.
  function elevationAt(surface,point,values=surface.elevationMetres){
    if(surface.lakeTerrain&&(values===surface.elevationMetres||values===surface.lakeDepths)){
      let depth=-1000;
      for(const field of surface.lakeTerrain){const b=field.bounds;
        if(point.column<b.west||point.column>b.east||point.row<b.north||point.row>b.south)continue;
        if(values===surface.elevationMetres)return elevationAt(field,point);
        depth=M.max(depth,elevationAt(field,point,field.lakeDepths));
      }
      if(values===surface.lakeDepths)return depth;
    }
    const b=surface.bounds,n=surface.columns,m=surface.rows,
      x=clamp((point.column-b.west)/(b.east-b.west)*(n-1),0,n-1),
      y=clamp((point.row-b.north)/(b.south-b.north)*(m-1),0,m-1),
      i=M.min(n-2,M.floor(x)),j=M.min(m-2,M.floor(y)),u=x-i,v=y-j,k=j*n+i,z=values;
    return u>=v?z[k]*(1-u)+z[k+1]*(u-v)+z[k+n+1]*v:z[k]*(1-v)+z[k+n]*(v-u)+z[k+n+1]*u;
  }
  function isDry(surface,point){return elevationAt(surface,point)>0&&(!surface.lakeDepths||elevationAt(surface,point,surface.lakeDepths)<0);}

  // Rendering and parcel clipping use the same locally refined lake mesh.
  // The rest of the city keeps its existing terrain resolution.
  function* surfaceTriangles(surface,box=surface.bounds){
    const b=surface.bounds,n=surface.columns,m=surface.rows,dx=(b.east-b.west)/(n-1),dy=(b.south-b.north)/(m-1),
      x0=clamp(M.floor((box.west-b.west)/dx),0,n-2),x1=clamp(M.floor((box.east-b.west)/dx),0,n-2),
      y0=clamp(M.floor((box.north-b.north)/dy),0,m-2),y1=clamp(M.floor((box.south-b.north)/dy),0,m-2);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const field=surface.lakeTerrain?.find(f=>x>=f.nativeBounds.west&&x<f.nativeBounds.east&&y>=f.nativeBounds.north&&y<f.nativeBounds.south),
        grid=field||surface,s=field?field.subdivisions:1,
        firstX=field?(x-field.nativeBounds.west)*s:x,firstY=field?(y-field.nativeBounds.north)*s:y,
        gx=(grid.bounds.east-grid.bounds.west)/(grid.columns-1),gy=(grid.bounds.south-grid.bounds.north)/(grid.rows-1),
        at=i=>{const point={column:grid.bounds.west+i%grid.columns*gx,row:grid.bounds.north+M.floor(i/grid.columns)*gy};
          return {...point,height:grid.elevationMetres[i],depth:field?elevationAt(surface,point,surface.lakeDepths):(surface.lakeDepths?.[i]??-1000)};};
      const startX=M.max(firstX,M.floor((box.west-grid.bounds.west)/gx)),endX=M.min(firstX+s-1,M.floor((box.east-grid.bounds.west)/gx)),
        startY=M.max(firstY,M.floor((box.north-grid.bounds.north)/gy)),endY=M.min(firstY+s-1,M.floor((box.south-grid.bounds.north)/gy));
      for(let row=startY;row<=endY;row++)for(let column=startX;column<=endX;column++){
        const i=row*grid.columns+column;
        yield [i,i+1,i+grid.columns+1].map(at);yield [i,i+grid.columns+1,i+grid.columns].map(at);
      }
    }
  }

  function generate(recipe, context, {seed} = {}) {
    if (!context || context.schema !== 'city-site-context-v1' || !Number.isSafeInteger(seed)) {
      throw new TypeError('City terrain needs its saved metre context and a generation seed');
    }
    const count = context.rows * context.columns;
    if (!Array.isArray(context.elevationMetres) || context.elevationMetres.length !== count
        || !context.elevationMetres.every(Number.isFinite) || !Array.isArray(context.water) || context.water.length !== count) {
      throw new TypeError('Invalid saved city terrain samples');
    }
    seed >>>= 0;
    const character=window.WorldAtlasCityCharacter.profile(recipe);
    if(character.settlementRadiusKm){
      const ratio=character.settlementRadiusKm/recipe.urban.radiusKm;
      recipe={...recipe,urban:{...recipe.urban,radiusKm:character.settlementRadiusKm,
        radiusRows:recipe.urban.radiusRows*ratio,radiusColumns:recipe.urban.radiusColumns*ratio,
        coreZones:(recipe.urban.coreZones||[]).map(zone=>({...zone,
          row:recipe.location.row+(zone.row-recipe.location.row)*ratio,
          column:recipe.location.column+(zone.column-recipe.location.column)*ratio,radiusKm:zone.radiusKm*ratio})),
        streetWidthsMetres:{arterial:M.min(4.5,recipe.urban.streetWidthsMetres?.arterial||4.5),
          collector:M.min(3,recipe.urban.streetWidthsMetres?.collector||3),local:M.min(1.8,recipe.urban.streetWidthsMetres?.local||1.8)}}};
    }
    recipe={...recipe,seed};
    const SIZE=recipe.harbor||context.source.kind==='river'&&context.source.referenceWidthMetres>=18||context.radiusKm/M.max(.15,recipe.urban.radiusKm)>10?129:65;
    const bounds = {...context.bounds}, metric = context.gridCellKilometres;
    const center = recipe.location, radiusKm = context.radiusKm, cityRadius = recipe.urban.radiusKm;
    const form=landform(recipe,context);
    const widthKm = (bounds.east - bounds.west) * metric.column;
    const heightKm = (bounds.south - bounds.north) * metric.row;
    const stepKm = M.max(widthKm, heightKm) / (SIZE - 1);
    const elevation = [], parent = [], land = [], coordinates = [];
    const phase = random(seed, 17) * M.PI * 2;
    const parentRange = M.max(...context.elevationMetres) - M.min(...context.elevationMetres);
    const amplitude = clamp(8 + parentRange * .12, 8, 90);
    for (let row = 0; row < SIZE; row++) for (let column = 0; column < SIZE; column++) {
      const u = column / (SIZE - 1), v = row / (SIZE - 1);
      const point = {row: bounds.north + v * (bounds.south - bounds.north), column: bounds.west + u * (bounds.east - bounds.west)};
      const original = sample(context.elevationMetres, context.rows, context.columns, bounds, point.row, point.column);
      const dry = original > 0;
      const envelope = M.sin(M.PI * u) ** 2 * M.sin(M.PI * v) ** 2;
      let detail = amplitude * envelope * (
        M.sin(u * 7.2 + phase) * M.cos(v * 5.4 - phase) * .65
        + M.sin(u * 13.1 + v * 9.5 + phase * 2) * .22
        + M.sin(u * 26.3 - phase) * M.cos(v * 22.7 + phase) * .09
        + M.sin(u * 42.4 + v * 33.5 - phase) * .04);
      const x=(point.column-center.column)*metric.column,y=(point.row-center.row)*metric.row,
        across=-M.sin(form.axisRadians)*x+M.cos(form.axisRadians)*y;
      if(form.kind==='valley')detail+=envelope*M.min(90,parentRange*.22)*(1-M.exp(-((across/M.max(.25,cityRadius*.38))**2)));
      if(form.kind==='ridge')detail+=envelope*M.min(60,parentRange*.12)*M.exp(-((across/M.max(.3,cityRadius*.42))**2));
      // Only interior dry ground is refined. Zero-height coastline and the
      // patch boundary retain the exact parent field; water is never displaced.
      elevation.push(dry ? M.max(.01, original + detail*M.min(1,original/35)) : original);
      parent.push(original); land.push(dry); coordinates.push(point);
    }
    const coastal=coastalDetail(recipe,context,elevation,coordinates,metric,seed,stepKm);
    for(let i=0;i<land.length;i++)land[i]=elevation[i]>0;

    const source = context.source;
    const groundwater = source.kind === 'groundwater';
    const riverMode=!groundwater&&recipe.siteType==='river-city'&&recipe.population?.estimate>=3000
      &&['plain','hills','valley'].includes(form.kind)&&random(seed,403)>.32?'through':'edge';
    const channels = [],confluences=[];
    let lakes=[],lakeTerrain=[],waterMask=new Array(SIZE*SIZE).fill(0),lakeDepths=new Array(SIZE*SIZE).fill(-1000);
    if (!groundwater) {
      let dx = (source.location.column - center.column) * metric.column;
      let dy = (source.location.row - center.row) * metric.row;
      if (M.hypot(dx, dy) < .001) {
        dx = sample(elevation, SIZE, SIZE, bounds, center.row, bounds.west) - sample(elevation, SIZE, SIZE, bounds, center.row, bounds.east);
        dy = sample(elevation, SIZE, SIZE, bounds, bounds.north, center.column) - sample(elevation, SIZE, SIZE, bounds, bounds.south, center.column);
      }
      const length = M.hypot(dx, dy) || 1;
      if (M.hypot(dx, dy) < .001) {dx = M.cos(phase); dy = M.sin(phase);}
      else {dx /= length; dy /= length;}
      if(form.kind==='valley'){dx=M.cos(form.axisRadians);dy=M.sin(form.axisRadians);}
      const extent = M.hypot(widthKm,heightKm);
      // Put the valley on the side opposite the main road approaches. Without
      // a verified bridge, a supply creek must not divide the settlement.
      const roadSide=(recipe.transport.corridors||[]).filter(route=>route.kind==='road').reduce((sum,route)=>sum+route.points.reduce((total,p)=>
        total+(p.column-center.column)*metric.column*dy-(p.row-center.row)*metric.row*dx,0),0);
      const bank=roadSide>0?-1:1;
      const terrain={rows:SIZE,columns:SIZE,bounds,elevationMetres:elevation};
      const points=riverCourse(terrain,metric,center,{dx,dy,extent,stepKm,cityRadius,form,riverMode,bank,
        harbor:recipe.harbor,referenceWidthMetres:source.referenceWidthMetres||.5*M.sqrt(radiusKm*radiusKm*.6),phase});
      const runs=landRuns(points,terrain,metric,stepKm);
      // An island supply stream starts on high ground; two ocean endpoints
      // cannot force a channel through the whole island at sea level.
      for(let run of runs){
        if(elevationAt(terrain,run[0])<.05&&elevationAt(terrain,run.at(-1))<.05){
          const summit=run.reduce((best,p,i)=>p.elevationMetres>run[best].elevationMetres?i:best,0);
          const left=run.slice(0,summit+1).reverse(),right=run.slice(summit);
          run=distanceToLine(center,left,metric).distance<distanceToLine(center,right,metric).distance?left:right;
        }else if(run[0].elevationMetres<run.at(-1).elevationMetres)run.reverse();
        if(run.length<2)continue;
        let previous=Infinity;
        const reference=M.max(2,source.referenceWidthMetres||.5*M.sqrt(radiusKm*radiusKm*.6));
        for(let i=0;i<run.length;i++){
          const p=run[i],t=i/(run.length-1),z=elevationAt(terrain,p),
            ahead=run[M.min(run.length-1,i+1)],behind=run[M.max(0,i-1)],
            reach=M.hypot((ahead.column-behind.column)*metric.column,(ahead.row-behind.row)*metric.row),
            grade=M.abs(ahead.elevationMetres-behind.elevationMetres)/M.max(1,reach*1000),
            confinement=clamp(1-grade*2.5,.55,1.12),mouth=run.at(-1).elevationMetres<.05?1+M.exp(-(((1-t)/.10)**2))*.6:1;
          p.widthMetres=reference*(.8+.24*t)*confinement*mouth*(1+.10*M.sin(t*12+phase)+.035*M.sin(t*29-phase));
          p.elevationMetres=z<=0?0:M.max(.02,M.min(z-M.min(4,z*.12),previous));previous=p.elevationMetres;
        }
        channels.push({points:run,widthMetres:M.max(...run.map(p=>p.widthMetres)),kind:source.kind==='river'?'river':'stream',
          widthModel:'catchment-reference-with-local-confinement',mouth:run.at(-1).elevationMetres===0});
      }
      if(source.kind==='river'&&recipe.population?.estimate>=3000&&random(seed,2318)>.42){
        const junction=tributary(channels,elevation,SIZE,bounds,metric,center,cityRadius,seed);
        if(junction)confluences.push(junction);
      }
      const reservoirs=basinLakes(elevation,SIZE,bounds,metric,channels,center,cityRadius),
        reservoirSurface={rows:SIZE,columns:SIZE,bounds,elevationMetres:elevation,lakeDepths:reservoirs.lakeDepths,lakeTerrain:reservoirs.lakeTerrain};
      for(const channel of channels){
        for(const lake of reservoirs.lakes)for(const p of channel.points)if(elevationAt(reservoirSurface,p,reservoirs.lakeDepths)>0
          &&M.hypot((p.column-lake.anchor.column)*metric.column,(p.row-lake.anchor.row)*metric.row)<M.sqrt(lake.areaKm2)*2)
          p.elevationMetres=M.max(p.elevationMetres,lake.spillElevationMetres);
        // A reservoir raises its upstream water surface; it cannot create an
        // uphill reach. Carve the outlet at the spill sill, then recompute the
        // actual lake shore against the resulting terrain.
        for(let i=channel.points.length-2;i>=0;i--)channel.points[i].elevationMetres=M.max(channel.points[i].elevationMetres,channel.points[i+1].elevationMetres);
      }
      const drainage=channels.flatMap(ch=>ch.points);
      const valleyWidthKm = M.max(.09, cityRadius * .18);
      for (let index = 0; index < elevation.length; index++) {
        if (!land[index]||waterMask[index]||!drainage.length) continue;
        const point = coordinates[index], near = channels.map(ch=>distanceToLine(point,ch.points,metric)).reduce((a,b)=>a.distance<b.distance?a:b);
        const u = (point.column - bounds.west) / (bounds.east - bounds.west), v = (point.row - bounds.north) / (bounds.south - bounds.north);
        const envelope = M.sin(M.PI * u) ** 2 * M.sin(M.PI * v) ** 2;
        const valley = M.exp(-((near.distance / valleyWidthKm) ** 2)) * M.min(1, envelope * 4);
        elevation[index] = M.max(.01, elevation[index] - M.max(0, elevation[index] - near.elevation) * valley);
      }
      // Reclip against the final terrain after valley carving and rounding.
      terrain.elevationMetres=elevation.map(z=>M.round(z*100)/100);
      const clipped=channels.flatMap((ch,sourceIndex)=>landRuns(ch.points,terrain,metric,stepKm)
        .map(run=>({sourceIndex,channel:{...ch,points:run,mouth:run.at(-1).elevationMetres===0}}))),bindings=[];
      for(const junction of confluences){
        const tributaryChannel=clipped.findIndex(part=>part.sourceIndex===junction.tributaryChannel
          &&M.hypot((part.channel.points.at(-1).column-junction.anchor.column)*metric.column,
            (part.channel.points.at(-1).row-junction.anchor.row)*metric.row)<1e-6);
        if(tributaryChannel<0)continue;
        const anchor=clipped[tributaryChannel].channel.points.at(-1),mainChannel=clipped.findIndex(part=>
          part.sourceIndex===junction.mainChannel&&distanceToLine(anchor,part.channel.points,metric).distance<1e-6);
        if(mainChannel>=0)bindings.push({anchor:{...anchor},mainChannel,tributaryChannel});
      }
      channels.splice(0,channels.length,...clipped.map(part=>part.channel));
      confluences.splice(0,confluences.length,...bindings);
      ({lakes,waterMask,lakeDepths,lakeTerrain}=basinLakes(terrain.elevationMetres,SIZE,bounds,metric,channels,center,cityRadius));
    }
    const buildable = [], slopes = [], roadBuildable=[];
    for (let row = 0; row < SIZE; row++) for (let column = 0; column < SIZE; column++) {
      const index = row * SIZE + column;
      const gradientX = (elevation[row * SIZE + M.min(SIZE - 1, column + 1)] - elevation[row * SIZE + M.max(0, column - 1)]) / (widthKm / (SIZE - 1) * 2000);
      const gradientY = (elevation[M.min(SIZE - 1, row + 1) * SIZE + column] - elevation[M.max(0, row - 1) * SIZE + column]) / (heightKm / (SIZE - 1) * 2000);
      const slope = M.hypot(gradientX, gradientY);
      const floodplain = channels.some(channel => {const near=distanceToLine(coordinates[index],channel.points,metric);
        return near.distance<M.max(near.widthMetres/1000*1.5,stepKm*.72);});
      land[index]=land[index]&&!waterMask[index];
      slopes.push(slope); buildable.push(Number(land[index] && slope < .20 && !floodplain));
      roadBuildable.push(Number(land[index]&&slope<.65));
    }
    const surface = {rows: SIZE, columns: SIZE, bounds, elevationMetres: elevation.map(value => M.round(value * 100) / 100), slopes,buildable,roadBuildable,waterMask,lakeDepths,lakeTerrain};
    if(channels.length&&['hillside','valley','ridge'].includes(form.kind)){
      const ch=channels.reduce((a,b)=>a.points.length>b.points.length?a:b),a=ch.points[0],z=ch.points.at(-1);
      form.kind='valley';form.axisRadians=M.atan2((z.row-a.row)*metric.row,(z.column-a.column)*metric.column);
      form.crossScale=.27;form.alongScale=1.75;form.label='沿河谷与河岸台地';
    }else if(channels.length&&!recipe.harbor&&!['fortress','pass','oasis'].includes(recipe.siteType)){
      const ch=channels.reduce((a,b)=>a.points.length>b.points.length?a:b),a=ch.points[0],z=ch.points.at(-1);
      form.kind='riverbank';form.axisRadians=M.atan2((z.row-a.row)*metric.row,(z.column-a.column)*metric.column);
      form.crossScale=.62;form.alongScale=1.6;form.label='河岸缓坡台地';
    }
    if(recipe.harbor){
      const saved=recipe.harbor,n=saved.outward,at=d=>({column:saved.shore.column+n.x*d/metric.column,row:saved.shore.row+n.y*d/metric.row}),
        z=d=>elevationAt(surface,at(d));
      let low=-M.max(.6,stepKm*2,saved.distanceKm*.8),high=M.max(.6,stepKm*2);
      if(z(low)>0&&z(high)<=0){
        for(let k=0;k<24;k++){const mid=(low+high)/2;if(z(mid)>0)low=mid;else high=mid;}
        const shift=(low+high)/2,shore=at(shift),landPoint=at(shift-.07),seaPoint=at(shift+.12),harbor={...saved,shore,landPoint,seaPoint,
          setting:coastal.setting,access:[center,landPoint]};
        if(saved.sailing?.length){
          const a=seaPoint,z=saved.sailing[0],wet=Array.from({length:33},(_,i)=>interpolate(a,z,i/32)).every(p=>elevationAt(surface,p)<=0);
          harbor.sailing=wet?[seaPoint,...saved.sailing]:[];
        }
        recipe={...recipe,harbor,transport:{...recipe.transport,corridors:recipe.transport.corridors.map(route=>route.id===recipe.id+'-harbor-access'?{...route,points:harbor.access}:route)}};
      }
    }
    if(!recipe.harbor&&source.kind==='river'&&recipe.population?.estimate>=3000){
      const harbor=inlandHarbor(recipe,surface,channels,confluences,metric,context.nameRoots,seed);
      if(harbor)recipe={...recipe,harbor,transport:{...recipe.transport,corridors:[...recipe.transport.corridors,
        {id:recipe.id+'-harbor-access',kind:'road',points:harbor.access}]}};
    }
    if(recipe.harbor){
      const h=recipe.harbor,n=h.outward,t={x:-n.y,y:n.x},factor=clamp(M.sqrt(recipe.population.estimate/22000),.34,1.8),
        capacity=M.max(1,M.min(7,M.round(M.sqrt(recipe.population.estimate/1600)))),span=recipe.population.estimate<1800?.10:.22+capacity*.016,
        at=(x,y)=>({column:h.shore.column+(t.x*x+n.x*y)*factor/metric.column,row:h.shore.row+(t.y*x+n.y*y)*factor/metric.row});
      const half=span+.05;
      recipe={...recipe,harbor:{...h,berthLayout:{scale:factor,capacity,span},
        reservedLand:[[-half,-.14],[-half,.012],[half,.012],[half,-.14]].map(([x,y])=>at(x,y))}};
    }
    const relief = contourPaths(coordinates, elevation, land, metric,surface);
    const waterSource = groundwater
      ? {kind: 'groundwater', label: recipe.siteType === 'oasis' ? '绿洲井泉' : '山泉与井水', location: {...center}}
      : {kind: source.kind === 'lake' ? 'lake' : source.kind === 'river' ? 'tributary' : 'spring-fed-stream',
          label: source.kind === 'lake' ? '湖泊与溪流供水' : source.kind === 'river' ? '河谷支流供水' : '山泉溪流供水',
          location: channels.length ? channels[0].points[M.floor(channels[0].points.length / 2)] : {...center}};
    if(riverMode==='through'&&channels.length){
      const line=channels[0].points,a=line[0],b=line.at(-1),dx=(b.column-a.column)*metric.column,dy=(b.row-a.row)*metric.row,len=M.hypot(dx,dy),
        across={x:-dy/len,y:dx/len};
      const points=[-1,1].map(sign=>({column:center.column+across.x*cityRadius*1.4*sign/metric.column,
        row:center.row+across.y*cityRadius*1.4*sign/metric.row}));
      recipe={...recipe,transport:{...recipe.transport,corridors:[...recipe.transport.corridors,{id:'urban-river-spine',kind:'road',points}]}};
    }
    const bridges=crossings(recipe,surface,context,channels);
    const streetPlan=window.WorldAtlasCities.streetNetwork({...recipe,
      localSite:{form,riverMode,surface,channels,bridges}});
    const network=ruralNetwork(recipe,surface,slopes,channels,metric,seed,bridges,streetPlan),ruralRoads=network.ruralRoads;
    const approaches=[...network.corridors,...ruralRoads].filter(route=>route.kind==='road');
    const usedGates=new Set(streetPlan.gates.filter(gate=>gate.layer==='inner'||approaches.some(route=>
      distanceToLine(gate.center,route.points,metric).distance<=gate.widthKm)).map(gate=>gate.id));
    streetPlan.gates=streetPlan.gates.filter(gate=>usedGates.has(gate.id));
    streetPlan.gateStreets=streetPlan.gateStreets.filter(street=>usedGates.has(street.id));
    recipe={...recipe,transport:{...recipe.transport,corridors:network.corridors}};
    if(recipe.harbor){const route=network.corridors.find(r=>(r.sourceId||r.id)===recipe.id+'-harbor-access');
      recipe={...recipe,harbor:{...recipe.harbor,access:route?.points||[]}};}
    const roadRecipe={...recipe,localSite:{form},transport:{...recipe.transport,corridors:[...network.corridors,...ruralRoads]}};
    const farmland=fields(roadRecipe,surface,slopes,metric,channels,seed);
    const localSite = {schema: 'city-local-site-v1', bounds, radiusKm, form,riverMode,...relief,coastal,channels,lakes,confluences,waterSource, surface,
      gateStreets:streetPlan.gateStreets,gates:streetPlan.gates,enclosures:streetPlan.enclosures,wallSpans:streetPlan.wallSpans,
      innerEnclosures:streetPlan.innerEnclosures,innerWallSpans:streetPlan.innerWallSpans,reservedCompounds:streetPlan.reservedCompounds,
      nameRoots:context.nameRoots,latitudeDegrees:context.latitudeDegrees,
      farmland, ruralRoads, bridges,...landscape(roadRecipe,surface,slopes,coordinates,land,seed,farmland,channels),
      model: {kind: 'generated-local-refinement', parent: 'saved-world-metre-terrain', boundaryBlended: true, coastlinePreserved: !coastal.refined},
    };
    localSite.annotations=geographicNames(recipe,context,localSite,metric);
    return {...recipe, seed, localSite};
  }

  function interpolate(a,b,t){return {row:a.row+(b.row-a.row)*t,column:a.column+(b.column-a.column)*t,
    elevationMetres:(a.elevationMetres||0)+(b.elevationMetres-a.elevationMetres||0)*t,
    widthMetres:(a.widthMetres||0)+((b.widthMetres||0)-(a.widthMetres||0))*t};}

  function inlandHarbor(recipe,surface,channels,confluences,metric,roots,seed){
    const distance=(a,b)=>M.hypot((a.column-b.column)*metric.column,(a.row-b.row)*metric.row),
      target=confluences[0]?.anchor||recipe.location;
    const candidates=channels.flatMap(channel=>channel.points.slice(1,-1).map((p,i)=>({p,i:i+1,channel})))
      .filter(c=>c.p.widthMetres>=25).sort((a,b)=>distance(a.p,target)-distance(b.p,target));
    for(const {p,i,channel} of candidates.slice(0,24)){
      if(distance(p,recipe.location)>recipe.urban.radiusKm*1.7)continue;
      const a=channel.points[i-1],z=channel.points[i+1],dx=(z.column-a.column)*metric.column,dy=(z.row-a.row)*metric.row,len=M.hypot(dx,dy),half=p.widthMetres/2000;
      if(!len)continue;
      for(const sign of [-1,1]){
        const outward={x:dy/len*sign,y:-dx/len*sign},at=d=>({column:p.column-outward.x*d/metric.column,row:p.row-outward.y*d/metric.row}),
          shore=at(half),landPoint=at(half+.035),seaPoint=at(half*.25);
        if(!isDry(surface,landPoint)||channels.some(ch=>{const q=distanceToLine(landPoint,ch.points,metric);return q.distance<q.widthMetres/2000+.015;}))continue;
        return {kind:'river',name:roots[M.floor(random(seed,9021)*roots.length)]+'埠',shore,landPoint,seaPoint,outward,
          setting:confluences.length?'confluence':'riverbank',shelter:.8,channelWidthMetres:p.widthMetres,
          distanceKm:distance(shore,recipe.location),access:[recipe.location,landPoint],sailing:[]};
      }
    }return null;
  }

  function priorityQueue(){
    const heap=[];
    return {get length(){return heap.length;},put(index,cost){let i=heap.length;heap.push([index,cost]);while(i){const p=(i-1)>>1;
      if(heap[p][1]<=cost)break;heap[i]=heap[p];i=p;}heap[i]=[index,cost];},take(){const first=heap[0],last=heap.pop();
      if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1][1]<heap[j][1])j++;
        if(heap[j][1]>=last[1])break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;}};
  }

  function basinLakes(elevation,n,bounds,metric,channels,center,radius){
    const fill=new Float64Array(n*n).fill(Infinity),queue=priorityQueue(),visited=new Uint8Array(n*n),waterMask=new Array(n*n).fill(0),lakeDepths=new Array(n*n).fill(-1000),lakes=[];
    const dx=(bounds.east-bounds.west)*metric.column/(n-1),dy=(bounds.south-bounds.north)*metric.row/(n-1),
      at=i=>({column:bounds.west+i%n/(n-1)*(bounds.east-bounds.west),row:bounds.north+M.floor(i/n)/(n-1)*(bounds.south-bounds.north)});
    for(let i=0;i<n*n;i++)if(i%n===0||i%n===n-1||i<n||i>=n*(n-1)||elevation[i]<=0){fill[i]=elevation[i];queue.put(i,fill[i]);}
    while(queue.length){const [i,h]=queue.take();if(h!==fill[i])continue;const x=i%n,y=M.floor(i/n);
      for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        if(x+sx<0||x+sx>=n||y+sy<0||y+sy>=n)continue;const j=i+sy*n+sx,next=M.max(h,elevation[j]);
        if(next<fill[j]){fill[j]=next;queue.put(j,next);}
      }
    }
    const candidates=Array.from({length:n*n},(_,i)=>i).filter(i=>fill[i]-elevation[i]>2.5&&elevation[i]>0)
      .sort((a,b)=>(fill[b]-elevation[b])-(fill[a]-elevation[a]));
    for(const seed of candidates){
      if(visited[seed]||lakes.length>=3)continue;const level=fill[seed]-.05,component=[seed];visited[seed]=1;
      for(let k=0;k<component.length;k++){const i=component[k],x=i%n,y=M.floor(i/n);
        for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(x+sx<=0||x+sx>=n-1||y+sy<=0||y+sy>=n-1)continue;
          const j=i+sy*n+sx;if(!visited[j]&&elevation[j]>0&&elevation[j]<level){visited[j]=1;component.push(j);}}
      }
      const area=component.length*dx*dy,anchor=at(seed),distance=M.hypot((anchor.column-center.column)*metric.column,(anchor.row-center.row)*metric.row);
      if(area<.02||area>4||distance<radius*.80||distance>radius*4.5
        ||!channels.some(ch=>distanceToLine(anchor,ch.points,metric).distance<M.max(dx,dy)*2+ch.widthMetres/1000))continue;
      const cells=new Set(component);
      const spill=component.flatMap(i=>{const x=i%n,y=M.floor(i/n);return [[1,0],[-1,0],[0,1],[0,-1]]
        .filter(([sx,sy])=>x+sx>=0&&x+sx<n&&y+sy>=0&&y+sy<n).map(([sx,sy])=>i+sy*n+sx);})
        .filter(i=>!cells.has(i)).sort((a,b)=>elevation[a]-elevation[b])[0];
      lakes.push({anchor,waterLevelMetres:level,spillElevationMetres:fill[seed],
        outlet:at(spill),areaKm2:area,maximumDepthMetres:level-elevation[seed],kind:'basin-lake',component,seed});
    }
    let lakeTerrain=refineLakeTerrain(elevation,n,bounds,lakes);
    const acceptedWater=new Map(lakeTerrain.map(field=>[field,new Uint8Array(field.rows*field.columns)]));
    for(const lake of lakes){
      const field=lakeTerrain.find(f=>lake.seed%n>=f.nativeBounds.west&&lake.seed%n<=f.nativeBounds.east
        &&M.floor(lake.seed/n)>=f.nativeBounds.north&&M.floor(lake.seed/n)<=f.nativeBounds.south),
        {columns,rows}=field,s=field.subdivisions,first=((M.floor(lake.seed/n)-field.nativeBounds.north)*s)*columns+(lake.seed%n-field.nativeBounds.west)*s,
        level=M.min(lake.waterLevelMetres,field.spillHeights[first]-.05),wet=new Uint8Array(rows*columns),component=[first];wet[first]=1;
      if(acceptedWater.get(field)[first]||level<=field.elevationMetres[first]+2.5){delete lake.component;delete lake.seed;continue;}
      for(let k=0;k<component.length;k++){const i=component[k],x=i%columns,y=M.floor(i/columns);
        for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          if(x+sx<0||x+sx>=columns||y+sy<0||y+sy>=rows)continue;const j=i+sy*columns+sx,z=field.elevationMetres[j];
          if(!wet[j]&&z>0&&z<level){wet[j]=1;component.push(j);}
        }
      }
      const tiles=new Set(component.flatMap(i=>[i,i-1,i-columns,i-columns-1])),patches=[],depths=new Map(),
        atFine=i=>({column:field.bounds.west+i%columns/(columns-1)*(field.bounds.east-field.bounds.west),
          row:field.bounds.north+M.floor(i/columns)/(rows-1)*(field.bounds.south-field.bounds.north)});
      let areaKm2=0,maximumDepthMetres=0;
      for(const i of tiles){if(i<0||i>=columns*(rows-1)||i%columns===columns-1)continue;
        for(const tri of [[i,i+1,i+columns+1],[i,i+columns+1,i+columns]]){
          const vertices=tri.map(j=>({...atFine(j),value:wet[j]?level-field.elevationMetres[j]:-M.max(1e-9,M.abs(field.elevationMetres[j]-level))})),poly=[];
          for(let k=0;k<3;k++){depths.set(tri[k],vertices[k].value);maximumDepthMetres=M.max(maximumDepthMetres,vertices[k].value);
            const a=vertices[k],b=vertices[(k+1)%3];if(a.value>0)poly.push(a);
            if((a.value>0)!==(b.value>0))poly.push(interpolate(a,b,a.value/(a.value-b.value)));}
          if(poly.length>=3){patches.push(poly);const p=poly[0];
            areaKm2+=M.abs(poly.reduce((sum,a,k)=>{const b=poly[(k+1)%poly.length];
              return sum+(a.column-p.column)*(b.row-p.row)-(b.column-p.column)*(a.row-p.row);},0))*metric.column*metric.row/2;
          }
        }
      }
      delete lake.component;delete lake.seed;
      if(areaKm2<.02||areaKm2>4)continue;
      for(const [i,depth] of depths)field.lakeDepths[i]=M.max(field.lakeDepths[i],depth);
      const covered=acceptedWater.get(field);for(const i of component)covered[i]=1;
      lake.patches=patches;lake.areaKm2=areaKm2;lake.maximumDepthMetres=maximumDepthMetres;
      lake.waterLevelMetres=level;lake.spillElevationMetres=level+.05;
    }
    lakeTerrain=lakeTerrain.filter(field=>field.lakeDepths.some(depth=>depth>0));
    for(const field of lakeTerrain){
      delete field.spillHeights;
      const b=field.nativeBounds,s=field.subdivisions;
      for(let y=b.north;y<=b.south;y++)for(let x=b.west;x<=b.east;x++){
        const i=y*n+x,j=(y-b.north)*s*field.columns+(x-b.west)*s;
        lakeDepths[i]=M.max(lakeDepths[i],field.lakeDepths[j]);waterMask[i]=Number(lakeDepths[i]>0);
      }
    }
    return {lakes:lakes.filter(lake=>lake.patches),waterMask,lakeDepths,lakeTerrain};
  }

  function refineLakeTerrain(elevation,n,bounds,lakes){
    const regions=lakes.map(lake=>({west:M.max(0,M.min(...lake.component.map(i=>i%n))-2),
      east:M.min(n-1,M.max(...lake.component.map(i=>i%n))+2),north:M.max(0,M.min(...lake.component.map(i=>M.floor(i/n)))-2),
      south:M.min(n-1,M.max(...lake.component.map(i=>M.floor(i/n)))+2)}));
    // Nearby basins share a mesh, so their shores cannot disagree in overlap.
    for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){
      const a=regions[i],b=regions[j];if(a.east<b.west||b.east<a.west||a.south<b.north||b.south<a.north)continue;
      regions[i]={west:M.min(a.west,b.west),east:M.max(a.east,b.east),north:M.min(a.north,b.north),south:M.max(a.south,b.south)};
      regions.splice(j,1);i=-1;break;
    }
    const native={columns:n,rows:n,bounds,elevationMetres:elevation},at=(x,y)=>({column:bounds.west+x/(n-1)*(bounds.east-bounds.west),row:bounds.north+y/(n-1)*(bounds.south-bounds.north)}),
      node=(x,y)=>elevation[clamp(y,0,n-1)*n+clamp(x,0,n-1)],
      cubic=(a,b,c,d,t)=>{
        const slope=(u,v)=>u*v<=0?0:2*u*v/(u+v),v=c-b,m0=slope(b-a,v),m1=slope(v,d-c),t2=t*t,t3=t2*t;
        return (2*t3-3*t2+1)*b+(t3-2*t2+t)*m0+(-2*t3+3*t2)*c+(t3-t2)*m1;
      };
    return regions.map(region=>{
      const subdivisions=8,columns=(region.east-region.west)*subdivisions+1,rows=(region.south-region.north)*subdivisions+1,
        lo=at(region.west,region.north),hi=at(region.east,region.south),
        field={columns,rows,subdivisions,nativeBounds:region,bounds:{west:lo.column,east:hi.column,north:lo.row,south:hi.row},
          elevationMetres:[],lakeDepths:new Array(rows*columns).fill(-1000)};
      for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
        const x=region.west+column/subdivisions,y=region.north+row/subdivisions,i=M.floor(x),j=M.floor(y),u=x-i,v=y-j,
          z=cubic(...[-1,0,1,2].map(d=>cubic(node(i-1,j+d),node(i,j+d),node(i+1,j+d),node(i+2,j+d),u)),v),
          nativeHeight=elevationAt(native,at(x,y)),blend=clamp(M.min(x-region.west,region.east-x,y-region.north,region.south-y),0,1);
        field.elevationMetres.push(nativeHeight+(z-nativeHeight)*blend);
      }
      const heights=new Float64Array(rows*columns).fill(Infinity),queue=priorityQueue();
      for(let i=0;i<heights.length;i++)if(i%columns===0||i%columns===columns-1||i<columns||i>=columns*(rows-1)||field.elevationMetres[i]<=0){
        heights[i]=field.elevationMetres[i];queue.put(i,heights[i]);}
      while(queue.length){const [i,h]=queue.take();if(h!==heights[i])continue;const x=i%columns,y=M.floor(i/columns);
        for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
          if(x+sx<0||x+sx>=columns||y+sy<0||y+sy>=rows)continue;const j=i+sy*columns+sx,cost=M.max(h,field.elevationMetres[j]);
          if(cost<heights[j]){heights[j]=cost;queue.put(j,cost);}
        }
      }
      field.spillHeights=heights;return field;
    });
  }

  function riverCourse(surface,metric,center,{dx,dy,extent,stepKm,cityRadius,form,riverMode,bank,harbor,referenceWidthMetres,phase}){
    const widthKm=M.max(.002,referenceWidthMetres/1000),
      wavelength=M.max(6.5*(widthKm*3280.84)**1.1/3280.84,stepKm*8),
      edge=form.kind==='plain'?harbor?1.42:.80:M.max(.36,form.crossScale*1.35),
      baseline=bank*cityRadius*(riverMode==='through'?.26:edge),
      available=cityRadius*form.crossScale*({plain:.8,hills:.7,valley:.6,ridge:.25,hillside:.2,'coastal-slope':.2}[form.kind]||.2),
      maximum=M.min(widthKm*2.2,available,cityRadius*(riverMode==='through'?.38:edge*.42)),
      count=M.max(128,M.ceil(extent*2/M.min(stepKm*.6,wavelength/40))),points=[],
      at=(along,side)=>({row:center.row+(dy*along+dx*side)/metric.row,column:center.column+(dx*along-dy*side)/metric.column}),
      height=(along,side)=>elevationAt(surface,at(along,side)),probe=M.max(widthKm*2,stepKm*2);
    // Leopold & Wolman (USGS PP 282-B, p.59) give wavelength = 6.5*w^1.1
    // with both lengths in feet. It supplies a reach scale, not a fixed form.
    // The saved local terrain limits how
    // far its centerline can migrate; a narrow or steep valley stays subdued.
    // This is a terrain-constrained local course, not a hydraulic simulation.
    for(let index=0;index<=count;index++){
      const along=(index/count*2-1)*extent,z=height(along,baseline),
        rise=M.max(0,height(along,baseline-probe)-z,height(along,baseline+probe)-z),
        grade=M.abs(height(along-probe,baseline)-height(along+probe,baseline))/(probe*2000),
        freedom=1/(1+rise/25+grade*20),
        bend=maximum*freedom*(.75*M.sin(along/wavelength*M.PI*2+phase)
          +.25*M.sin(along/(wavelength*.67)*M.PI*2-phase)),
        point=at(along,baseline+bend);
      point.elevationMetres=elevationAt(surface,point);points.push(point);
    }return points;
  }

  function refineTributary(points,surface,metric,main,join){
    const distance=(a,b)=>M.hypot((a.column-b.column)*metric.column,(a.row-b.row)*metric.row),
      stepKm=M.max((surface.bounds.east-surface.bounds.west)*metric.column,
        (surface.bounds.south-surface.bounds.north)*metric.row)/(surface.columns-1),
      corridor=points.map(p=>({...p,elevationMetres:elevationAt(surface,p)})),
      terminal=M.max(.25,join.widthMetres/1000*1.1),b=surface.bounds;
    let travelled=0;
    const source=points.map((p,i)=>{if(i)travelled+=distance(points[i-1],p);return {...p,alongKm:travelled};}),
      safe=p=>{
        if(p.column<b.west-1e-10||p.column>b.east+1e-10||p.row<b.north-1e-10||p.row>b.south+1e-10)return false;
        const z=elevationAt(surface,p),near=distanceToLine(p,corridor,metric);
        if(z<=0||z<join.elevationMetres-1e-8||near.distance>stepKm*.85
          ||z>near.elevation+M.max(4,stepKm*8))return false;
        return distance(p,join)<=terminal||distanceToLine(p,main.points,metric).distance>=join.widthMetres/2000+.05;
      },
      safeSegment=(a,z)=>{
        const count=M.max(1,M.ceil(distance(a,z)/(stepKm*.25)));
        for(let i=1;i<count;i++)if(!safe(interpolate(a,z,i/count)))return false;
        return true;
      },
      separation=(p,a,z)=>{
        const dx=(z.column-a.column)*metric.column,dy=(z.row-a.row)*metric.row,
          px=(p.column-a.column)*metric.column,py=(p.row-a.row)*metric.row,
          t=clamp((px*dx+py*dy)/(dx*dx+dy*dy||1),0,1);
        return M.hypot(px-dx*t,py-dy*t);
      },knots=[source[0]];
    function simplify(first,last){
      if(last-first===1){knots.push(source[last]);return;}
      let split=first+1,deviation=-1;
      for(let i=first+1;i<last;i++){const d=separation(source[i],source[first],source[last]);if(d>deviation){deviation=d;split=i;}}
      if(deviation<=stepKm*.6&&safeSegment(source[first],source[last]))knots.push(source[last]);
      else{if(deviation<1e-9)split=M.floor((first+last)/2);simplify(first,split);simplify(split,last);}
    }
    simplify(0,source.length-1);
    const out=[knots[0]],lerp=(a,z,t)=>({...interpolate(a,z,t),alongKm:a.alongKm+(z.alongKm-a.alongKm)*t});
    // Round the D8 valley route in physical kilometres before carving it.
    // Tangent arcs stay in the original dry valley corridor; they are not a
    // separate cosmetic spline over a straight carved river.
    for(let i=1;i<knots.length-1;i++){
      const a=knots[i-1],p=knots[i],z=knots[i+1],before=distance(a,p),after=distance(p,z);
      let cut=M.min(before*.3,after*.3,M.max(stepKm*2,p.widthMetres/1000*5)),arc=null;
      for(let attempt=0;attempt<5&&cut>stepKm*.025;attempt++,cut*=.5){
        const entry=lerp(a,p,1-cut/before),exit=lerp(p,z,cut/after),samples=M.max(6,M.ceil(cut*2/(stepKm*.3))),candidate=[];
        for(let k=0;k<=samples;k++){
          const t=k/samples,q=1-t;
          candidate.push({...lerp(entry,exit,t),column:q*q*entry.column+2*q*t*p.column+t*t*exit.column,
            row:q*q*entry.row+2*q*t*p.row+t*t*exit.row});
        }
        if(candidate.every(safe)&&safeSegment(out.at(-1),entry)&&candidate.slice(1).every((q,k)=>safeSegment(candidate[k],q))){arc=candidate;break;}
      }
      if(arc)out.push(...arc);else out.push(p);
    }out.push(source.at(-1));
    const refined=[out[0]];
    for(let i=1;i<out.length;i++){
      const a=out[i-1],z=out[i],count=M.max(1,M.ceil(distance(a,z)/(stepKm*.4)));
      for(let k=1;k<=count;k++)refined.push(lerp(a,z,k/count));
    }
    let segment=1,previous=points[0].elevationMetres;
    return refined.map((p,i)=>{
      if(i===0)return {...points[0]};
      if(i===refined.length-1)return {...points.at(-1)};
      while(segment<source.length-1&&source[segment].alongKm<p.alongKm)segment++;
      const a=source[segment-1],z=source[segment],t=clamp((p.alongKm-a.alongKm)/(z.alongKm-a.alongKm||1),0,1),profile=interpolate(a,z,t),
        height=M.max(join.elevationMetres,M.min(previous,profile.elevationMetres,elevationAt(surface,p)));
      previous=height;
      return {column:p.column,row:p.row,elevationMetres:height,widthMetres:profile.widthMetres};
    });
  }

  function tributary(channels,elevation,n,bounds,metric,center,radius,seed){
    if(!channels.length)return null;const main=channels.reduce((a,b)=>a.points.length>b.points.length?a:b),
      distance=(a,b)=>M.hypot((a.column-b.column)*metric.column,(a.row-b.row)*metric.row),
      join=main.points.slice(2,-2).sort((a,b)=>distance(a,center)-distance(b,center))[0];
    if(!join||join.widthMetres<18)return null;
    const at=i=>({column:bounds.west+i%n/(n-1)*(bounds.east-bounds.west),row:bounds.north+M.floor(i/n)/(n-1)*(bounds.south-bounds.north)}),
      index=p=>clamp(M.round((p.row-bounds.north)/(bounds.south-bounds.north)*(n-1)),0,n-1)*n+clamp(M.round((p.column-bounds.west)/(bounds.east-bounds.west)*(n-1)),0,n-1),
      start=index(join),cost=new Float64Array(n*n).fill(Infinity),parent=new Int32Array(n*n).fill(-1),queue=priorityQueue(),
      coordinates=Array.from({length:n*n},(_,i)=>at(i)),mainDistance=new Float64Array(n*n);
    // A river enters from outside this local map. Internal high ground alone
    // is not a modeled spring, so it cannot manufacture a wide headwater.
    for(let i=0;i<n*n;i++)mainDistance[i]=elevation[i]>0?distanceToLine(coordinates[i],main.points,metric).distance:Infinity;
    cost[start]=0;queue.put(start,0);
    while(queue.length){const [i,d]=queue.take();if(d!==cost[i])continue;const x=i%n,y=M.floor(i/n),p=coordinates[i];
      for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        if(x+sx<0||x+sx>=n||y+sy<0||y+sy>=n)continue;const j=i+sy*n+sx,q=coordinates[j],length=distance(p,q);
        if(elevation[j]<=0||elevation[j]<join.elevationMetres
          ||distance(q,join)>.25&&mainDistance[j]<join.widthMetres/2000+.05)continue;
        const descent=M.max(0,elevation[i]-elevation[j]),next=d+length*(1+descent/8+(M.abs(elevation[j]-elevation[i])/(length*1000))**2*5);
        if(next<cost[j]){cost[j]=next;parent[j]=i;queue.put(j,next);}
      }
    }
    let best=-1,score=-Infinity;
    for(let i=0;i<n*n;i++){const x=i%n,y=M.floor(i/n);if(x!==0&&x!==n-1&&y!==0&&y!==n-1)continue;
      if(!Number.isFinite(cost[i])||elevation[i]<=0||elevation[i]<M.max(elevation[start],join.elevationMetres)+5)continue;
      const value=(elevation[i]-elevation[start])/(cost[i]+.5)*(1+random(seed,i+2870)*.1);if(value>score){score=value;best=i;}}
    if(best<0)return null;
    const points=[];for(let i=best;i>=0&&i!==start;i=parent[i])points.push({...at(i),elevationMetres:elevation[i]});points.push({...join});
    if(points.length<4)return null;
    let previous=Infinity;
    for(let i=0;i<points.length;i++){points[i].elevationMetres=M.min(previous,points[i].elevationMetres);previous=points[i].elevationMetres;
      points[i].widthMetres=M.max(3,join.widthMetres*(.12+.25*i/(points.length-1)));}
    const refined=refineTributary(points,{rows:n,columns:n,bounds,elevationMetres:elevation},metric,main,join);
    channels.push({points:refined,widthMetres:refined.at(-1).widthMetres,kind:'river',widthModel:'tributary-catchment',mouth:false});
    return {anchor:{...join},mainChannel:channels.indexOf(main),tributaryChannel:channels.length-1};
  }

  function landRuns(points,surface,metric,stepKm){
    const runs=[];let run=[];
    const flush=()=>{if(run.length>1)runs.push(run);run=[];};
    for(let i=1;i<points.length;i++){
      const edge=clipEdge(points[i-1],points[i],surface.bounds);if(!edge){flush();continue;}
      const [a,b]=edge,len=M.hypot((b.column-a.column)*metric.column,(b.row-a.row)*metric.row),count=M.max(1,M.ceil(len/(stepKm*.4)));
      for(let j=1;j<=count;j++){
        const p=interpolate(a,b,(j-1)/count),q=interpolate(a,b,j/count),zp=elevationAt(surface,p),zq=elevationAt(surface,q);
        if(zp<=0&&zq<=0){flush();continue;}
        if((zp>0)!==(zq>0)){
          let low=0,high=1;for(let k=0;k<22;k++){const t=(low+high)/2;if((elevationAt(surface,interpolate(p,q,t))>0)===(zp>0))low=t;else high=t;}
          const mouth=interpolate(p,q,(low+high)/2);mouth.elevationMetres=0;
          if(zp>0){if(!run.length)run.push(p);run.push(mouth);flush();}else{flush();run.push(mouth,q);}
        }else{if(!run.length)run.push(p);run.push(q);}
      }
    }flush();return runs;
  }

  function coastalDetail(recipe,context,elevation,coordinates,metric,seed,stepKm){
    const harbor=recipe.harbor,result={refined:false,setting:harbor?.setting||'open-coast',islands:[]};
    if(!harbor||harbor.kind!=='sea')return result;
    const b=context.bounds,c=recipe.location,n=harbor.outward,t={x:-n.y,y:n.x},r=recipe.urban.radiusKm,
      relief=M.max(...context.elevationMetres)-M.min(...context.elevationMetres),
      rugged=relief>180&&['steep','escarpment','rolling'].includes(recipe.terrain?.slopeClass),
      inlet=rugged&&(harbor.shelter>.58||random(seed,2101)<.40),
      setback=M.hypot((harbor.shore.column-c.column)*metric.column,(harbor.shore.row-c.row)*metric.row),
      length=M.min(setback*.48,M.max(stepKm*2,r*.52)),halfWidth=M.max(stepKm*1.2,M.min(r*.24,.30));
    if(inlet&&length>stepKm){
      for(let i=0;i<coordinates.length;i++){
        const p=coordinates[i],x=(p.column-harbor.shore.column)*metric.column,y=(p.row-harbor.shore.row)*metric.row,
          along=x*n.x+y*n.y,across=x*t.x+y*t.y;
        if(along< -length||along>stepKm*2||M.abs(across)>halfWidth*2||M.hypot((p.column-c.column)*metric.column,(p.row-c.row)*metric.row)<r*.24)continue;
        const taper=clamp((along+length)/(length+stepKm),0,1),w=halfWidth*M.sqrt(taper),
          edge=M.abs(across)-w,depth=clamp(edge/halfWidth*24,-24,24);
        elevation[i]=M.min(elevation[i],depth);
      }
      result.refined=true;result.setting=context.latitudeDegrees>45&&relief>300?'fjord':'sheltered-inlet';
    }
    // Skerries are refinements of shallow coastal seabed on rugged coasts.
    // The berth, entrance and saved sailing corridor remain open water.
    if(!rugged&&recipe.siteType!=='island-port')return result;
    const count=1+M.floor(random(seed,2110)*6);
    for(let k=0;k<count;k++){
      const salt=2111+k*71,across=(random(seed,salt)*2-1)*M.max(1.4,r*3.8),along=M.max(.3,r*.4)*(1+random(seed,salt+1)*3.8),
        p={column:harbor.shore.column+(n.x*along+t.x*across)/metric.column,row:harbor.shore.row+(n.y*along+t.y*across)/metric.row},
        depth=sample(context.elevationMetres,context.rows,context.columns,b,p.row,p.column),
        rx=M.max(stepKm*2,M.min(.85,r*(.12+random(seed,salt+2)*.48))),ry=rx*(.25+random(seed,salt+3)*.68),
        heading=random(seed,salt+4)*M.PI*2,cos=M.cos(heading),sin=M.sin(heading),family=M.floor(random(seed,salt+5)*4),
        phase=random(seed,salt+6)*M.PI*2;
      if(depth>=-2||depth< -100||p.column<b.west+rx/metric.column||p.column>b.east-rx/metric.column||p.row<b.north+rx/metric.row||p.row>b.south-rx/metric.row
        ||result.islands.some(island=>M.hypot((island.anchor.column-p.column)*metric.column,(island.anchor.row-p.row)*metric.row)<rx+island.radiusKm)
        ||harbor.sailing&&distanceToLine(p,harbor.sailing,metric).distance<rx+.15)continue;
      const peak=7+random(seed,salt+7)*57;let dryCount=0;
      for(let i=0;i<coordinates.length;i++){
        const q=coordinates[i],dx=(q.column-p.column)*metric.column,dy=(q.row-p.row)*metric.row,u=(dx*cos+dy*sin)/rx,v=(-dx*sin+dy*cos)/ry,
          angle=M.atan2(v,u),lobes=1+.18*M.sin(angle*(2+family)+phase)+.09*M.sin(angle*7-phase*1.7),
          rho=M.hypot(u,v)/lobes;
        let z=peak*(1-rho*rho);
        if(family===1)z=M.min(z,peak*(M.hypot(u-.43,v-.28)/.78-1));
        if(family===2)z=M.max(z,peak*.68*(1-((u+.72)**2/.55+(v-.36)**2/.66)));
        if(family===3)z=peak*(1-M.abs(v)/lobes-.63*M.abs(u)**1.7);
        if(z>0&&elevation[i]<=0&&(!harbor.sailing?.length||distanceToLine(q,harbor.sailing,metric).distance>.10)){
          elevation[i]=z;dryCount++;
        }
      }
      if(dryCount){
        const summit=coordinates.map((q,i)=>({q,i,d:M.hypot((q.column-p.column)*metric.column,(q.row-p.row)*metric.row)}))
          .filter(v=>v.d<rx*1.3&&elevation[v.i]>0).sort((a,z)=>elevation[z.i]-elevation[a.i])[0];
        result.islands.push({anchor:summit.q,heightMetres:M.round(peak),radiusKm:rx,shape:['skerry','crescent','paired-ridge','long-ridge'][family],shapeSeed:salt,
          areaKm2:dryCount*stepKm*stepKm});result.refined=true;
      }
    }return result;
  }

  function clipEdge(a,b,bounds){
    let low=0,high=1;const dx=b.column-a.column,dy=b.row-a.row;
    for(const [p,q] of [[-dx,a.column-bounds.west],[dx,bounds.east-a.column],[-dy,a.row-bounds.north],[dy,bounds.south-a.row]]){
      if(M.abs(p)<1e-12){if(q<0)return null;continue;}
      const t=q/p;if(p<0)low=M.max(low,t);else high=M.min(high,t);if(low>high)return null;
    }return [interpolate(a,b,low),interpolate(a,b,high)];
  }

  function ruralNetwork(recipe,surface,slopes,channels,metric,seed,bridges,streetPlan){
    const b=surface.bounds,n=surface.columns,c=recipe.location,r=recipe.urban.radiusKm;
    const {streets:urbanStreets,gateStreets,enclosures,wallSpans,innerWallSpans,reservedCompounds}=streetPlan,
      portals=gateStreets.filter(street=>street.layer==='outer'),fortified=wallSpans.length>0,allWallSpans=[...wallSpans,...innerWallSpans];
    const inPolygon=(p,polygon)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],z=polygon[j];if((a.row>p.row)!==(z.row>p.row)&&p.column<(z.column-a.column)*(p.row-a.row)/(z.row-a.row)+a.column)inside=!inside;}return inside;};
    const compoundBounds=reservedCompounds.map(compound=>polygonBounds(compound.points,1e-8)),
      enclosureBounds=enclosures.map(polygon=>polygonBounds(polygon)),
      wallBounds=allWallSpans.map(span=>polygonBounds(span,1e-8)),
      contains=(bounds,p)=>p.column>=bounds.west&&p.column<=bounds.east&&p.row>=bounds.north&&p.row<=bounds.south,
      overlaps=(a,z)=>a.east>=z.west&&a.west<=z.east&&a.south>=z.north&&a.north<=z.south,
      edgeBounds=(a,z)=>{const dx=M.abs(z.column-a.column)*1e-8+1e-12,dy=M.abs(z.row-a.row)*1e-8+1e-12;
        return {west:M.min(a.column,z.column)-dx,east:M.max(a.column,z.column)+dx,
          north:M.min(a.row,z.row)-dy,south:M.max(a.row,z.row)+dy};},
      occupied=p=>reservedCompounds.some((compound,i)=>contains(compoundBounds[i],p)&&inPolygon(p,compound.points)),
      insideCity=p=>enclosures.some((polygon,i)=>contains(enclosureBounds[i],p)&&inPolygon(p,polygon));
    const index=p=>clamp(M.round((p.row-b.north)/(b.south-b.north)*(n-1)),0,n-1)*n+clamp(M.round((p.column-b.west)/(b.east-b.west)*(n-1)),0,n-1);
    const nodes=Array.from({length:n*n},(_,i)=>({row:b.north+M.floor(i/n)/(n-1)*(b.south-b.north),column:b.west+(i%n)/(n-1)*(b.east-b.west)}));
    const point=i=>nodes[i];
    const distance=(a,b)=>M.hypot((a.column-b.column)*metric.column,(a.row-b.row)*metric.row);
    const cost=new Float64Array(n*n).fill(Infinity),parent=new Int32Array(n*n).fill(-1),anchors=new Map(),heap=[];
    const put=(i,d)=>{heap.push([i,d]);let k=heap.length-1;while(k){const p=(k-1)>>1;if(heap[p][1]<=d)break;heap[k]=heap[p];k=p;}heap[k]=[i,d];};
    const take=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1][1]<heap[j][1])j++;if(heap[j][1]>=last[1])break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
    const allowed=Array.from({length:n*n},(_,i)=>surface.roadBuildable[i]===1&&!occupied(point(i))&&(!fortified||!insideCity(point(i)))
      &&!channels.some(ch=>{const near=distanceToLine(point(i),ch.points,metric);return near.distance<near.widthMetres/2000+.025;}));
    const links=new Map(),bridgeEdges=new Map();
    const waterEdges=channels.flatMap(ch=>ch.points.slice(1).map((z,i)=>({a:ch.points[i],z})));
    const waterBins=new Map(),binX=p=>clamp(M.floor((p.column-b.west)/(b.east-b.west)*(n-1)),0,n-1),
      binY=p=>clamp(M.floor((p.row-b.north)/(b.south-b.north)*(n-1)),0,n-1);
    const bins=(a,z)=>{const keys=[];for(let y=M.min(binY(a),binY(z));y<=M.max(binY(a),binY(z));y++)for(let x=M.min(binX(a),binX(z));x<=M.max(binX(a),binX(z));x++)keys.push(y*n+x);return keys;};
    for(const edge of waterEdges)for(const key of bins(edge.a,edge.z)){if(!waterBins.has(key))waterBins.set(key,[]);waterBins.get(key).push(edge);}
    const crossesWater=(a,z)=>bins(a,z).some(key=>(waterBins.get(key)||[]).some(({a:c,z:d})=>{
      if(M.max(a.column,z.column)<M.min(c.column,d.column)||M.min(a.column,z.column)>M.max(c.column,d.column)
        ||M.max(a.row,z.row)<M.min(c.row,d.row)||M.min(a.row,z.row)>M.max(c.row,d.row))return false;
      const dx=z.column-a.column,dy=z.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=dx*sy-dy*sx;
      if(M.abs(den)<1e-14)return false;const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*dy-(c.row-a.row)*dx)/den;
      return t>=0&&t<=1&&u>=0&&u<=1;
    }));
    const bankNode=(p,opposite)=>{let best=-1,d=Infinity;for(let i=0;i<n*n;i++)if(allowed[i]){const q=point(i);
      if(opposite){const mx=(p.column+opposite.column)/2,my=(p.row+opposite.row)/2;
        if((q.column-mx)*(p.column-mx)*metric.column**2+(q.row-my)*(p.row-my)*metric.row**2<=0)continue;}
      const v=distance(q,p);if(v<d){best=i;d=v;}}return best;};
    const dx=(b.east-b.west)*metric.column/(n-1),dy=(b.south-b.north)*metric.row/(n-1);
    const crossing=(a,z,p,q)=>{
      const x=z.column-a.column,y=z.row-a.row,sx=q.column-p.column,sy=q.row-p.row,den=x*sy-y*sx;
      if(M.abs(den)<1e-14)return null;
      const t=((p.column-a.column)*sy-(p.row-a.row)*sx)/den,u=((p.column-a.column)*y-(p.row-a.row)*x)/den;
      return t>=-1e-8&&t<=1+1e-8&&u>=-1e-8&&u<=1+1e-8?interpolate(a,z,clamp(t,0,1)):null;
    };
    const crossesCompoundBoundary=(a,z)=>{const bounds=edgeBounds(a,z);
      return reservedCompounds.some((compound,i)=>overlaps(bounds,compoundBounds[i])
        &&compound.points.some((p,j)=>crossing(a,z,p,compound.points[(j+1)%compound.points.length])));},
      crossesReserved=(a,z)=>occupied(a)||occupied(z)||crossesCompoundBoundary(a,z);
    const crossesWall=(a,z)=>{const bounds=edgeBounds(a,z);
      return allWallSpans.some((span,i)=>{if(!overlaps(bounds,wallBounds[i]))return false;
        const hit=crossing(a,z,span[0],span[1]);
        return hit&&!gateStreets.some(portal=>distance(hit,portal.gateCenter)<=portal.widthKm);});};
    const safeAccess=(a,z)=>{
      if(crossesWater(a,z)||crossesReserved(a,z)||crossesWall(a,z))return false;
      const length=distance(a,z),steps=M.max(4,M.ceil(length/.025));
      let previous=elevationAt(surface,a);
      for(let k=0;k<=steps;k++){
        const p=interpolate(a,z,k/steps),height=elevationAt(surface,p);
        if(!isDry(surface,p)||k&&M.abs(height-previous)/(M.max(length/steps,.0001)*1000)>.12
          ||channels.some(ch=>{const near=distanceToLine(p,ch.points,metric);return near.distance<near.widthMetres/2000+.004;}))return false;
        previous=height;
      }return true;
    };
    for(const bridge of bridges){
      const a=bankNode(bridge.points[0],bridge.points[1]),z=bankNode(bridge.points[1],bridge.points[0]);
      if(a<0||z<0||a===z||crossesReserved(...bridge.points)||crossesWall(...bridge.points)
        ||!safeAccess(point(a),bridge.points[0])||!safeAccess(point(z),bridge.points[1]))continue;
      if(!links.has(a))links.set(a,[]);if(!links.has(z))links.set(z,[]);links.get(a).push(z);links.get(z).push(a);
      bridgeEdges.set(a+':'+z,bridge.points);bridgeEdges.set(z+':'+a,bridge.points.slice().reverse());
    }
    // Every eligible street frontage is an outward routing source. The urban
    // graph connects these junctions; countryside roads never need a common hub.
    const sources=fortified?portals:urbanStreets;
    for(const street of sources)for(let k=fortified?street.points.length-1:1;k<street.points.length;k++){
      const a=street.points[k-1],z=street.points[k],sx=(z.column-a.column)*metric.column,sy=(z.row-a.row)*metric.row,squared=sx*sx+sy*sy;
      const minX=M.max(0,M.min(index(a)%n,index(z)%n)-1),maxX=M.min(n-1,M.max(index(a)%n,index(z)%n)+1),
        minY=M.max(0,M.min(M.floor(index(a)/n),M.floor(index(z)/n))-1),maxY=M.min(n-1,M.max(M.floor(index(a)/n),M.floor(index(z)/n))+1);
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const i=y*n+x;if(!allowed[i])continue;const p=point(i),t=clamp(((p.column-a.column)*metric.column*sx+(p.row-a.row)*metric.row*sy)/(squared||1),0,1),q=fortified?z:interpolate(a,z,t),d=distance(p,q);
        if(d>M.hypot(dx,dy)*.8||d>=cost[i]||!safeAccess(q,p))continue;
        cost[i]=d;anchors.set(i,fortified?street.points.slice():[q]);put(i,d);
      }
    }
    while(heap.length){const [i,d]=take();if(d!==cost[i])continue;const x=i%n,y=M.floor(i/n);
      for(const j of links.get(i)||[]){const next=d+distance(point(i),point(j))*1.2;
        if(next<cost[j]){cost[j]=next;parent[j]=i;put(j,next);}}
      for(const [sx,sy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],
        [1,2],[-1,2],[1,-2],[-1,-2],[2,1],[-2,1],[2,-1],[-2,-1]]){
        if(x+sx<0||x+sx>=n||y+sy<0||y+sy>=n)continue;const j=i+sy*n+sx;
        if(!allowed[j]||sx&&sy&&(!allowed[i+sx]||!allowed[i+sy*n]))continue;
        // Both accepted graph nodes have already passed the occupied test.
        // Their connecting edge still needs the exact compound-boundary test.
        if(crossesWater(point(i),point(j))||crossesCompoundBoundary(point(i),point(j))||crossesWall(point(i),point(j)))continue;
        const length=M.hypot(sx*dx,sy*dy),grade=M.abs(surface.elevationMetres[i]-surface.elevationMetres[j])/(length*1000);
        if(grade>.12)continue;const next=d+length*(1+(grade/.035)**2*2+random(seed,j+67000)*.18);
        if(next<cost[j]){cost[j]=next;parent[j]=i;put(j,next);}
      }
    }
    const chainTo=i=>{const chain=[];for(;i>=0;i=parent[i])chain.push(i);chain.reverse();return chain;};
    const pathTo=i=>{const chain=chainTo(i),points=anchors.get(chain[0]).slice();
      if(distance(points.at(-1),point(chain[0]))>1e-8)points.push(point(chain[0]));
      for(let k=1;k<chain.length;k++){
        const bridge=bridgeEdges.get(chain[k-1]+':'+chain[k]);if(bridge)points.push(...bridge);points.push(point(chain[k]));}return points;};
    const streetFrontage=(end,maximumDistance)=>{
      let frontage=null;
      for(const street of urbanStreets)for(let k=1;k<street.points.length;k++){
        const a=street.points[k-1],z=street.points[k],sx=(z.column-a.column)*metric.column,sy=(z.row-a.row)*metric.row,
          squared=sx*sx+sy*sy,t=clamp(((end.column-a.column)*metric.column*sx+(end.row-a.row)*metric.row*sy)/(squared||1),0,1),
          q=interpolate(a,z,t),d=distance(q,end);
        if(d<=maximumDistance&&(!frontage||d<frontage.distance)&&safeAccess(q,end))frontage={point:q,distance:d,segment:[a,z]};
      }return frontage;
    };
    const corridors=[];
    for(const route of recipe.transport.corridors){
      if(route.kind!=='road'){corridors.push(route);continue;}
      const clipped=route.points.slice(1).flatMap((p,i)=>clipEdge(route.points[i],p,b)||[]);if(clipped.length<2)continue;
      const ends=[clipped[0],clipped.at(-1)],paths=[];
      for(const end of ends){
        if(distance(end,c)<=1e-8)continue;
        const frontage=streetFrontage(end,M.hypot(dx,dy)*.8);
        // Only an endpoint already on a real street is fulfilled. Nearby
        // destinations still need a short, verified connection to that street.
        if(frontage?.distance<=1e-8){
          // A port already on a village lane still needs its real drawable
          // access retained; reuse that lane instead of clearing the entrance.
          if(recipe.harbor&&distance(end,recipe.harbor.landPoint)<=1e-8){
            const other=frontage.segment.reduce((best,p)=>distance(p,end)>distance(best,end)?p:best,frontage.segment[0]);
            if(distance(other,end)>1e-8)paths.push([other,end]);
          }continue;
        }
        if(frontage&&frontage.distance<M.hypot(dx,dy)*.8&&safeAccess(frontage.point,end)){
          paths.push([frontage.point,end]);continue;
        }
        const node=bankNode(end);
        if(node<0||!Number.isFinite(cost[node])||distance(point(node),end)>M.hypot(dx,dy)*1.8)continue;
        const tail=point(node);if(!safeAccess(tail,end))continue;
        const points=pathTo(node);if(distance(points.at(-1),end)>1e-8)points.push(end);paths.push(points);
      }
      for(const [arm,points] of paths.entries())corridors.push({...route,id:route.id+'-approach-'+arm,sourceId:route.id,points});
    }
    // A cross-river street must retain its actual bridge and both bank portals,
    // even when each bank has its own urban routing sources.
    for(const [i,bridge] of bridges.entries()){
      if(crossesReserved(...bridge.points)||crossesWall(...bridge.points))continue;
      const bankPaths=bridge.points.map((bank,k)=>{
        const frontage=streetFrontage(bank,r*.7);
        if(frontage&&frontage.distance<r*.7)return [frontage.point,bank];
        const node=bankNode(bank,bridge.points[1-k]);
        if(node<0||!Number.isFinite(cost[node])||!safeAccess(point(node),bank))return null;
        return pathTo(node).concat(bank);
      });
      if(bankPaths.every(Boolean)&&bankPaths.some(path=>insideCity(path[0]))){
        corridors.push({id:bridge.routeId+'-bridge-'+i,sourceId:bridge.routeId,kind:'road',
          points:bankPaths[0].concat(bankPaths[1].slice().reverse())});
        continue;
      }
      const a=bankNode(bridge.points[0],bridge.points[1]),z=bankNode(bridge.points[1],bridge.points[0]);
      if(a<0||z<0||!Number.isFinite(cost[a])||!Number.isFinite(cost[z])||!bridgeEdges.has(a+':'+z))continue;
      if(chainTo(a).includes(z)||chainTo(z).includes(a))continue;
      corridors.push({id:bridge.routeId+'-bridge-'+i,sourceId:bridge.routeId,kind:'road',
        points:pathTo(a).concat(bridge.points,pathTo(z).slice().reverse())});
    }
    const roads=[],used=new Set();
    const roadCount=M.max(2,M.min(10,M.ceil(M.sqrt((recipe.population?.estimate||1000)/1000))));
    for(let k=0;k<roadCount;k++){
      const angle=(k+random(seed,k+67100)*.55)*M.PI*2/roadCount,reach=r*(2.3+random(seed,k+67200)*1.6),target={row:c.row+M.sin(angle)*reach/metric.row,column:c.column+M.cos(angle)*reach/metric.column};
      let best=-1,score=Infinity;for(let i=0;i<n*n;i++)if(Number.isFinite(cost[i])){const d=distance(point(i),target);if(d<score){score=d;best=i;}}
      if(best<0||score>r*.8||distance(point(best),c)<r*1.4)continue;
      const chain=chainTo(best);
      let anchor=anchors.get(chain[0]);
      let run=[];const flush=()=>{if(run.length>1)roads.push({id:'country-road-'+roads.length,kind:'road',local:true,points:run});run=[];};
      for(let i=1;i<chain.length;i++){
        const a=chain[i-1],z=chain[i],key=[M.min(a,z),M.max(a,z)].join(':');
        if(used.has(key)||bridgeEdges.has(a+':'+z)){flush();anchor=null;continue;}used.add(key);if(!run.length){if(anchor)run.push(...anchor);run.push(point(a));}run.push(point(z));anchor=null;
      }flush();
    }
    for(const route of [...roads,...corridors].filter(route=>route.kind==='road')){
      const points=[];for(const p of route.points)if(!points.length||distance(points.at(-1),p)>1e-8)points.push(p);route.points=points;
    }
    const graph=new Map(),key=p=>`${round(p.column)}:${round(p.row)}`;
    for(const route of [...roads,...corridors].filter(r=>r.kind==='road'))for(let i=1;i<route.points.length;i++){
      const a=key(route.points[i-1]),z=key(route.points[i]);if(!graph.has(a))graph.set(a,new Set());if(!graph.has(z))graph.set(z,new Set());
      graph.get(a).add(z);graph.get(z).add(a);
    }
    const safeCurve=(a,z)=>{if(crossesWater(a,z)||crossesReserved(a,z)||crossesWall(a,z))return false;const length=distance(a,z);if(length<1e-6)return true;
      if(M.abs(elevationAt(surface,a)-elevationAt(surface,z))/(length*1000)>.12)return false;
      const steps=M.max(4,M.ceil(length/.025));let previous=elevationAt(surface,a);
      for(let k=1;k<=steps;k++){const p=interpolate(a,z,k/steps),height=elevationAt(surface,p);
        if(!isDry(surface,p)||M.abs(height-previous)/(length/steps*1000)>.12||channels.some(ch=>{const near=distanceToLine(p,ch.points,metric);return near.distance<near.widthMetres/2000+.010;}))return false;
        previous=height;
      }return true;};
    const portalVertices=new Set(gateStreets.flatMap(street=>street.points.map(key)));
    const curve=route=>{
      if(route.kind!=='road'||route.points.length<3)return route;
      // Remove grid stair steps only where a continuous terrain check permits
      // the shortcut. Every junction and bridgehead remains a shared vertex.
      const fixed=p=>graph.get(key(p))?.size!==2||portalVertices.has(key(p))||bridges.some(bridge=>distanceToLine(p,bridge.points,metric).distance<.035);
      const points=[route.points[0]];
      for(let i=1;i<route.points.length;){
        let far=i;
        while(far+1<route.points.length&&!fixed(route.points[far])&&distance(route.points[i-1],route.points[far+1])<.38
          &&safeCurve(points.at(-1),route.points[far+1]))far++;
        points.push(route.points[far]);i=far+1;
      }
      const out=[points[0]];
      for(let i=1;i<points.length-1;i++){
        const a=points[i-1],p=points[i],z=points[i+1];
        if(fixed(p)){out.push(p);continue;}
        const first=interpolate(p,a,.42),last=interpolate(p,z,.42),arc=[first];
        for(let k=1;k<=5;k++){const t=k/5,q=1-t;arc.push({column:q*q*first.column+2*q*t*p.column+t*t*last.column,row:q*q*first.row+2*q*t*p.row+t*t*last.row});}
        if(safeCurve(out.at(-1),first)&&arc.slice(1).every((q,k)=>safeCurve(arc[k],q)))out.push(...arc);else out.push(p);
      }out.push(points.at(-1));return {...route,points:out};
    };
    const curved=route=>{
      const result=curve(route),points=[];
      for(const p of result.points)if(!points.length||distance(points.at(-1),p)>1e-8)points.push(p);
      return {...result,points};
    };
    return {ruralRoads:roads.map(curved),corridors:corridors.map(curved)};
  }

  function landform(recipe,context) {
    const b=context.bounds,c=recipe.location,m=context.gridCellKilometres,r=M.max(.5,recipe.urban.radiusKm),
      z=(x,y)=>sample(context.elevationMetres,context.rows,context.columns,b,c.row+y/m.row,c.column+x/m.column),h=z(0,0),
      dx=z(r,0)-z(-r,0),dy=z(0,r)-z(0,-r),cx=z(r,0)+z(-r,0)-2*h,cy=z(0,r)+z(0,-r)-2*h;
    const grade=M.hypot(dx,dy)/(r*2000),steep=['steep','escarpment'].includes(recipe.terrain?.slopeClass)||grade>.065,
      rolling=recipe.terrain?.slopeClass==='rolling'||grade>.018;
    const mixed=(z(r,r)+z(-r,-r)-z(r,-r)-z(-r,r))/4,delta=M.hypot(cx-cy,2*mixed),
      high=(cx+cy+delta)/2,low=(cx+cy-delta)/2,acrossAxis=M.atan2(2*mixed,cx-cy)/2;
    const valley=high>M.max(10,M.hypot(dx,dy)*.12)&&low<high*.5;
    const ridge=low< -15;
    const coast=['port','island-port'].includes(recipe.siteType)&&steep;
    const kind=coast?'coastal-slope':valley?'valley':ridge?'ridge':steep?'hillside':rolling?'hills':'plain';
    const axisRadians=kind==='valley'||kind==='ridge'?acrossAxis+M.PI/2:kind==='plain'?(recipe.morphology?.orientationDegrees||0)*M.PI/180:M.atan2(dx,-dy);
    const crossScale={plain:.92,hills:.64,hillside:.30,valley:.22,ridge:.33,'coastal-slope':.26}[kind];
    return {kind,axisRadians,crossScale,alongScale:['valley','hillside','coastal-slope'].includes(kind)?1.32:kind==='ridge'?1.08:.95,
      label:{plain:'缓坡平原',hills:'丘陵与缓坡',hillside:'山坡台地',valley:'狭长河谷',ridge:'山脊与高台','coastal-slope':'沿海陡坡台地'}[kind]};
  }

  function crossings(recipe,surface,context,channels) {
    const result=[],metric=context.gridCellKilometres,bounds=surface.bounds,roadWidth=M.max(5,recipe.urban.streetWidthsMetres?.arterial||8),
      clearance=p=>channels.reduce((best,ch)=>{const near=distanceToLine(p,ch.points,metric);
        return M.min(best,near.distance-near.widthMetres/2000);},Infinity),
      setback=M.max(.012,roadWidth/1000);
    for(const route of recipe.transport.corridors)if(route.kind==='road')for(let segment=1;segment<route.points.length;segment++){
      const a=route.points[segment-1],b=route.points[segment],dx=(b.column-a.column)*metric.column,dy=(b.row-a.row)*metric.row,length=M.hypot(dx,dy);
      if(length<.001)continue;
      for(const channel of channels)for(let index=1;index<channel.points.length;index++){
        const c=channel.points[index-1],d=channel.points[index],sx=(d.column-c.column)*metric.column,sy=(d.row-c.row)*metric.row,
          qx=(c.column-a.column)*metric.column,qy=(c.row-a.row)*metric.row,denominator=dx*sy-dy*sx;
        if(M.abs(denominator)<1e-9)continue;
        const t=(qx*sy-qy*sx)/denominator,u=(qx*dy-qy*dx)/denominator;
        if(t<0||t>1||u<0||u>1)continue;
        const point={row:a.row+(b.row-a.row)*t,column:a.column+(b.column-a.column)*t};
        if(result.some(bridge=>M.hypot((bridge.center.column-point.column)*metric.column,(bridge.center.row-point.row)*metric.row)<.08))continue;
        const widthMetres=c.widthMetres+(d.widthMetres-c.widthMetres)*u;
        const bank=(sign,axis)=>{
          const vx=axis.x*sign,vy=axis.y*sign,
            limit=M.min(vx>0?(bounds.east-point.column)*metric.column/vx:vx<0?(bounds.west-point.column)*metric.column/vx:Infinity,
              vy>0?(bounds.south-point.row)*metric.row/vy:vy<0?(bounds.north-point.row)*metric.row/vy:Infinity),
            at=d=>({row:point.row+vy*d/metric.row,column:point.column+vx*d/metric.column}),
            dry=d=>{
              const p=at(d);if(!isDry(surface,p)||clearance(p)<setback)return false;
              return [-1,1].every(side=>{
                const corner={column:p.column-vy*roadWidth/2000*side/metric.column,row:p.row+vx*roadWidth/2000*side/metric.row};
                return corner.column>=bounds.west&&corner.column<=bounds.east&&corner.row>=bounds.north&&corner.row<=bounds.south
                  &&isDry(surface,corner)&&clearance(corner)>=.004;
              });
            },
            step=M.max(.004,M.min(.025,widthMetres/1000*.1));
          let low=0;
          // A local width/sine estimate cannot find the far bank of a bent
          // reach or joined tributary. Search the actual combined water band
          // along the road, then share these exact portals with both networks.
          for(let high=M.min(step,limit);high>low;high=M.min(high+step,limit)){
            if(dry(high)){
              for(let k=0;k<22;k++){const mid=(low+high)/2;if(dry(mid))high=mid;else low=mid;}
              return {point:at(high),distanceKm:high};
            }low=high;
          }return null;
        },roadAxis={x:dx/length,y:dy/length},solve=axis=>{
          const banks=[bank(-1,axis),bank(1,axis)];if(banks.some(p=>!p))return null;
          const points=banks.map(p=>p.point),heights=points.map(p=>elevationAt(surface,p)),span=banks.reduce((sum,p)=>sum+p.distanceKm,0),
            grade=M.abs(heights[1]-heights[0])/(span*1000);
          return grade<=.12?{points,heights,span,grade,axis}:null;
        },nearby=channels.map(ch=>({ch,near:distanceToLine(point,ch.points,metric)})).filter(({near})=>near.distance<near.widthMetres/2000+setback),
          localWidth=M.max(widthMetres,...nearby.map(({near})=>near.widthMetres))/1000;
        let solved=solve(roadAxis);
        if(!solved||solved.span>M.max(.06,localWidth*2.5)){
          // A nearly parallel road approaches a transverse bridge instead of
          // becoming kilometres of deck along the river. At a confluence the
          // combined channel normals also provide the diagonal escape axes.
          const normals=nearby.map(({ch})=>{
            let best=Infinity,normal=null;
            for(let i=1;i<ch.points.length;i++){
              const a=ch.points[i-1],z=ch.points[i],x=(z.column-a.column)*metric.column,y=(z.row-a.row)*metric.row,
                px=(point.column-a.column)*metric.column,py=(point.row-a.row)*metric.row,l=M.hypot(x,y);
              if(l<1e-9)continue;const t=clamp((px*x+py*y)/(l*l),0,1),d=M.hypot(px-x*t,py-y*t);
              if(d<best){best=d;normal={x:-y/l,y:x/l};}
            }return normal;
          }).filter(Boolean),axes=normals.slice();
          for(let i=0;i<normals.length;i++)for(let j=i+1;j<normals.length;j++)for(const sign of [-1,1]){
            const x=normals[i].x+normals[j].x*sign,y=normals[i].y+normals[j].y*sign,l=M.hypot(x,y);
            if(l>1e-8)axes.push({x:x/l,y:y/l});
          }
          const score=result=>result.span*(1+(1-M.abs(result.axis.x*roadAxis.x+result.axis.y*roadAxis.y))*.25);
          for(let axis of axes){
            if(axis.x*roadAxis.x+axis.y*roadAxis.y<0)axis={x:-axis.x,y:-axis.y};
            const candidate=solve(axis);if(candidate&&(!solved||score(candidate)<score(solved)))solved=candidate;
          }
        }
        if(!solved)continue;
        result.push({id:'bridge-'+result.length,routeId:route.id,center:point,points:solved.points,widthMetres:roadWidth,
          name:Array.from(recipe.name||'当地').slice(0,3).join('')+'溪桥'+(result.length?String(result.length+1):''),
          grade:solved.grade,bankHeightsMetres:solved.heights});
      }
    }
    return result;
  }

  function contourPaths(points, heights, land, metric,surface) {
    const SIZE=M.round(M.sqrt(points.length));
    const dryHeights = heights.filter((_, index) => land[index]);
    if (!dryHeights.length) return {terrainBands: [], contours: []};
    const minimum = M.min(...dryHeights), maximum = M.max(...dryHeights);
    const span = M.max(1, maximum - minimum);
    const colours=Array.from({length:16},(_,index)=>{
      const t=index/15;
      return '#'+[231+t*9,242-t*6,207+t*11].map(value=>M.round(value).toString(16).padStart(2,'0')).join('');
    });
    const levels = colours.map((_, index) => minimum + span * index / (colours.length-1));
    const interval=[5,10,20,25,50,100,200,500].find(v=>span/v<=20)||1000;
    const contourLevels=Array.from({length:M.floor(maximum/interval)-M.ceil(minimum/interval)+1},(_,i)=>(M.ceil(minimum/interval)+i)*interval);
    const bandPaths = levels.map(() => []);
    const lines=contourLevels.map(()=>[]),lineSegments=contourLevels.map(()=>[]);
    const shadePaths=Array.from({length:33},()=>[]),waterPaths=[],dryPaths=[];
    const gradients=[],slopes=[];
    for(let row=0;row<SIZE-1;row++)for(let column=0;column<SIZE-1;column++){
      const a=row*SIZE+column,b=a+1,c=a+SIZE,d=c+1;
      if(![a,b,c,d].every(i=>land[i])){gradients.push(null);continue;}
      const dx=(heights[b]+heights[d]-heights[a]-heights[c])/((points[b].column-points[a].column)*metric.column*2000),
        dy=(heights[c]+heights[d]-heights[a]-heights[b])/((points[c].row-points[a].row)*metric.row*2000);
      gradients.push({dx,dy});slopes.push(M.hypot(dx,dy));
    }
    slopes.sort((a,b)=>a-b);
    const exaggeration=clamp(.45/(slopes[M.floor(slopes.length*.8)]||1),1,8);
    const fmt = point => `${round(point.column)} ${round(point.row)}`;
    const clip = (polygon, level) => {
      const result = [];
      for (let index = 0; index < polygon.length; index++) {
        const a = polygon[index], b = polygon[(index + 1) % polygon.length];
        if (a.height >= level) result.push(a);
        if ((a.height >= level) !== (b.height >= level)) {
          const t = (level - a.height) / (b.height - a.height);
          result.push({row: a.row + (b.row - a.row) * t, column: a.column + (b.column - a.column) * t, height: level});
        }
      }
      return result;
    };
    for (let row = 0; row < SIZE - 1; row++) for (let column = 0; column < SIZE - 1; column++) {
      const a = row * SIZE + column, b = a + 1, c = a + SIZE, d = c + 1;
      const gradient=gradients[row*(SIZE-1)+column];
      if(gradient){
        // A 315-degree, 45-degree light reads real slopes; north fill keeps
        // ridges legible without turning every hillside into a dark polygon.
        const nx=-gradient.dx*exaggeration,ny=-gradient.dy*exaggeration,length=M.hypot(nx,ny,1),
          light=(.78*(nx*-.5+ny*-.5+.70710678)+.22*(ny*-.70710678+.70710678))/length;
        const shade=clamp(M.round((light-.70710678)*24)+16,0,32);
        shadePaths[shade].push(`M${[a,b,d,c].map(i=>fmt(points[i])).join('L')}Z`);
      }
    }
    for(const triangle of surfaceTriangles(surface)){
        if(triangle.some(point=>point.height<=0)){
          const wet=clip(triangle.map(p=>({...p,height:-p.height})),0);
          if(wet.length>=3)waterPaths.push(`M${wet.map(fmt).join('L')}Z`);
        }
        const dry=clip(triangle,0);if(dry.length<3)continue;
        const min=M.min(...triangle.map(p=>p.height)),max=M.max(...triangle.map(p=>p.height)),
          ring=dry.map(p=>[round(p.column)+0,round(p.row)+0]),full=`M${ring.map(p=>p.join(' ')).join('L')}Z`;
        dryPaths.push(ring);
        for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
          const level = levels[levelIndex];if(level<=min){bandPaths[levelIndex].push(full);continue;}if(level>max)continue;
          const polygon = clip(dry, level);
          if (polygon.length >= 3) bandPaths[levelIndex].push(`M${polygon.map(fmt).join('L')}Z`);
        }
        for(let levelIndex=0;levelIndex<contourLevels.length;levelIndex++){
          const level=contourLevels[levelIndex];
          if(level<=min||level>=max)continue;
          const intersections = [];
          for (let edge = 0; edge < 3; edge++) {
            const first = triangle[edge], last = triangle[(edge + 1) % 3];
            if ((first.height < level) === (last.height < level)) continue;
            const t = (level - first.height) / (last.height - first.height);
            intersections.push({row: first.row + (last.row - first.row) * t, column: first.column + (last.column - first.column) * t});
          }
          if (intersections.length === 2) {lines[levelIndex].push(`M${fmt(intersections[0])}L${fmt(intersections[1])}`);lineSegments[levelIndex].push(intersections);}
        }
    }
    return {terrainBands: bandPaths.map((paths, index) => ({d: paths.join(''), fill: colours[index], elevation: M.round(levels[index])})).filter(band => band.d),
      contours: lines.map((paths,index)=>({d:paths.join(''),elevation:contourLevels[index],major:index%4===0,
        anchor:lineSegments[index][M.floor(lineSegments[index].length*.47)]?.[0]})).filter(line=>line.d),
      hillshade:shadePaths.map((paths,index)=>({d:paths.join(''),fill:index<16?'#52675e':'#ffffff',
        opacity:index<16?(16-index)*.021:(index-16)*.024})).filter(p=>p.d&&p.opacity),
      elevationRange:{minimum:M.round(minimum),maximum:M.round(maximum),interval},
      waterArea:waterPaths.join(''),dryArea:dryGroundPath(dryPaths)};
  }

  function fields(recipe, surface, slopes, metric, channels, seed) {
    const SIZE=surface.rows;
    const roads=recipe.transport.corridors.filter(r=>r.kind==='road'&&r.points.length>1),c=recipe.location,r=recipe.urban.radiusKm,b=surface.bounds;
    const local=p=>({x:(p.column-c.column)*metric.column,y:(p.row-c.row)*metric.row});
    const world=p=>({column:c.column+p.x/metric.column,row:c.row+p.y/metric.row});
    const box={west:(b.west-c.column)*metric.column,east:(b.east-c.column)*metric.column,
      north:(b.north-c.row)*metric.row,south:(b.south-c.row)*metric.row};
    const form=recipe.localSite?.form||landform(recipe,{bounds:b,gridCellKilometres:metric,rows:surface.rows,columns:surface.columns,elevationMetres:surface.elevationMetres});
    const check=p=>{
      if(p.column<b.west||p.column>b.east||p.row<b.north||p.row>b.south)return false;
      const s=sample(slopes,SIZE,SIZE,b,p.row,p.column),q=local(p),
        along=q.x*M.cos(form.axisRadians)+q.y*M.sin(form.axisRadians),across=-q.x*M.sin(form.axisRadians)+q.y*M.cos(form.axisRadians);
      return isDry(surface,p)&&s<.16&&M.hypot(along/(form.alongScale*r),across/(form.crossScale*r))>1.12
        &&!channels.some(ch=>{const near=distanceToLine(p,ch.points,metric);return near.distance<near.widthMetres/2000+.035;})
        &&!roads.some(road=>distanceToLine(p,road.points,metric).distance<.018);
    };
    const clip=(polygon,nx,ny,d)=>{const out=[];for(let i=0;i<polygon.length;i++){
      const a=polygon[i],z=polygon[(i+1)%polygon.length],da=d-a.x*nx-a.y*ny,dz=d-z.x*nx-z.y*ny;
      if(da>=0)out.push(a);if((da>=0)!==(dz>=0)){const t=da/(da-dz);out.push({x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t});}}return out;};
    const area=p=>M.abs(p.reduce((s,a,i)=>{const z=p[(i+1)%p.length];return s+a.x*z.y-z.x*a.y;},0))/2;
    const centre=p=>({x:p.reduce((s,a)=>s+a.x,0)/p.length,y:p.reduce((s,a)=>s+a.y,0)/p.length});
    // One landscape-wide partition: holdings share boundaries, with no repeated
    // hexagon or nine-cell stamp. Fertility and access leave woodland and pasture.
    const sites=[],limit=recipe.population?.estimate<1800?52:115;
    for(let trial=0;trial<900&&sites.length<limit;trial++){
      const q={x:box.west+(box.east-box.west)*random(seed,70000+trial*3),y:box.north+(box.south-box.north)*random(seed,70001+trial*3)},p=world(q);
      const spacing=clamp(r*.22,.17,.55)*(0.65+random(seed,70002+trial*3));
      if(sites.some(a=>M.hypot(a.x-q.x,a.y-q.y)<spacing))continue;
      sites.push(q);
    }
    const results=[];
    for(let holding=0;holding<sites.length;holding++){
      const a=sites[holding],p=world(a);
      if(!check(p))continue;
      const roadDistance=M.min(...roads.map(road=>distanceToLine(p,road.points,metric).distance));
      if(roadDistance>M.max(.6,r*.85))continue;
      const fertility=M.sin(a.x/(r*.65+.2)+random(seed,811)*6)*M.cos(a.y/(r*.47+.3)-random(seed,812)*6);
      let polygon=[{x:box.west,y:box.north},{x:box.east,y:box.north},{x:box.east,y:box.south},{x:box.west,y:box.south}];
      for(let j=0;j<sites.length&&polygon.length>=3;j++)if(j!==holding){const z=sites[j];
        polygon=clip(polygon,z.x-a.x,z.y-a.y,(z.x*z.x+z.y*z.y-a.x*a.x-a.y*a.y)/2);}
      if(polygon.length<3)continue;
      const slope=sample(slopes,SIZE,SIZE,b,p.row,p.column),delta=.03,
        gx=sample(surface.elevationMetres,SIZE,SIZE,b,p.row,p.column+delta/metric.column)-sample(surface.elevationMetres,SIZE,SIZE,b,p.row,p.column-delta/metric.column),
        gy=sample(surface.elevationMetres,SIZE,SIZE,b,p.row+delta/metric.row,p.column)-sample(surface.elevationMetres,SIZE,SIZE,b,p.row-delta/metric.row,p.column);
      const target=clamp(r*r*.028,.050,.16)*(0.70+random(seed,holding+75000)*1.0),parcels=[];
      const divide=(poly,depth,salt)=>{
        if(depth>9||area(poly)<target){parcels.push(poly);return;}
        const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y),angle=
          (M.max(...xs)-M.min(...xs)>M.max(...ys)-M.min(...ys)?0:M.PI/2)+(random(seed,salt)-.5)*.7,
          nx=M.cos(angle),ny=M.sin(angle),v=poly.map(p=>p.x*nx+p.y*ny),d=M.min(...v)+(M.max(...v)-M.min(...v))*(.40+random(seed,salt+1)*.20),
          first=clip(poly,nx,ny,d),second=clip(poly,-nx,-ny,-d);
        if(first.length<3||second.length<3){parcels.push(poly);return;}divide(first,depth+1,salt*2+1);divide(second,depth+1,salt*2+2);
      };divide(polygon,0,76000+holding*83);
      const quota=M.max(8,M.floor(1100/sites.length));
      const selected=parcels.map((poly,i)=>({poly,score:random(seed,holding*2048+i+91000)})).sort((a,b)=>a.score-b.score).slice(0,quota).map(p=>p.poly);
      for(let index=0;index<selected.length;index++){
        let poly=selected[index];const mid=centre(poly),use=M.sin(mid.x/(r*.65+.2)+random(seed,811)*6)*M.cos(mid.y/(r*.47+.3)-random(seed,812)*6)
          +M.sin(mid.x/(r*.19+.16)-mid.y/(r*.27+.18))*.32;
        if(use<-.32||random(seed,holding*71+index+74000)<.11)continue;
        const perimeter=poly.reduce((s,a,i)=>s+M.hypot(a.x-poly[(i+1)%poly.length].x,a.y-poly[(i+1)%poly.length].y),0);
        if(area(poly)<.007||area(poly)/(perimeter*perimeter)<.035)continue;
        const midWorld=world(mid),localSlope=sample(slopes,SIZE,SIZE,b,midWorld.row,midWorld.column),
          dx=sample(surface.elevationMetres,SIZE,SIZE,b,midWorld.row,midWorld.column+delta/metric.column)-sample(surface.elevationMetres,SIZE,SIZE,b,midWorld.row,midWorld.column-delta/metric.column),
          dy=sample(surface.elevationMetres,SIZE,SIZE,b,midWorld.row+delta/metric.row,midWorld.column)-sample(surface.elevationMetres,SIZE,SIZE,b,midWorld.row-delta/metric.row,midWorld.column);
        const terrace=localSlope>.028;
        const theta=terrace?M.atan2(dx,-dy):random(seed,holding+index+78000)*M.PI,
          ux=M.cos(theta),uy=M.sin(theta),vx=-uy,vy=ux;
        // Cross-sections follow actual sampled heights, giving curved contour
        // terraces rather than straight strips pasted over rising terrain.
        const contour=level=>{
          const projected=poly.map(q=>({x:q.x*ux+q.y*uy,y:q.x*vx+q.y*vy})),lo=M.min(...projected.map(q=>q.x)),hi=M.max(...projected.map(q=>q.x)),out=[];
          const count=M.max(8,M.ceil((hi-lo)/.025));
          for(let k=1;k<count;k++){
            const x=lo+(hi-lo)*k/count,cuts=[];
            for(let j=0;j<projected.length;j++){const a=projected[j],z=projected[(j+1)%projected.length];if((a.x>x)!==(z.x>x))cuts.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}
            if(cuts.length!==2)continue;cuts.sort((a,b)=>a-b);let low=cuts[0],high=cuts[1];
            const at=y=>({x:x*ux+y*vx,y:x*uy+y*vy}),height=y=>elevationAt(surface,world(at(y))),za=height(low),zb=height(high);
            if(level<M.min(za,zb)||level>M.max(za,zb))continue;
            for(let step=0;step<17;step++){const y=(low+high)/2;if((height(y)<level)===(za<zb))low=y;else high=y;}
            out.push(at((low+high)/2));
          }return out;
        };
        let rowLevels=[];
        if(terrace){
          const heights=poly.map(q=>elevationAt(surface,world(q))),lo=M.min(...heights),hi=M.max(...heights),middle=elevationAt(surface,midWorld),
            rise=clamp(localSlope*70,1.8,5),bottom=M.max(lo,middle-rise*.5),top=M.min(hi,middle+rise*.5),
            lower=contour(bottom),upper=contour(top);
          if(lower.length<4||upper.length<4)continue;
          const strip=[...lower,...upper.reverse()];
          if(area(strip)<.004)continue;
          poly=strip;rowLevels=[.25,.5,.75].map(t=>bottom+(top-bottom)*t);
        }
        const border=poly.map(q=>({x:mid.x+(q.x-mid.x)*.985,y:mid.y+(q.y-mid.y)*.985})),outline=[];
        for(let edge=0;edge<border.length;edge++){
          const a=border[edge],z=border[(edge+1)%border.length];outline.push(a);
          for(const fraction of terrace?[]:[.33,.67]){const p={x:a.x+(z.x-a.x)*fraction,y:a.y+(z.y-a.y)*fraction},amount=.001+random(seed,holding*201+index*23+edge)*.003,
            dx=mid.x-p.x,dy=mid.y-p.y,len=M.hypot(dx,dy)||1;outline.push({x:p.x+dx/len*amount,y:p.y+dy/len*amount});}
        }
        const points=outline.map(world);
        if(!points.every(check)||!check(world(mid)))continue;
        let safe=true;for(let i=0;i<points.length&&safe;i++){const a=points[i],z=points[(i+1)%points.length],length=M.hypot((a.column-z.column)*metric.column,(a.row-z.row)*metric.row);
          for(let t=.12;t<length;t+=.12)if(!check(interpolate(a,z,t/length))){safe=false;break;}}
        if(!safe)continue;
        const intersects=(a,z,p,q)=>{const dx=z.column-a.column,dy=z.row-a.row,sx=q.column-p.column,sy=q.row-p.row,den=dx*sy-dy*sx;
          if(M.abs(den)<1e-12)return false;const t=((p.column-a.column)*sy-(p.row-a.row)*sx)/den,u=((p.column-a.column)*dy-(p.row-a.row)*dx)/den;
          return t>=0&&t<=1&&u>=0&&u<=1;};
        if(roads.some(road=>road.points.some(p=>{const q=local(p);return poly.length>=3&&poly.reduce((hit,a,i)=>{const z=poly[(i+1)%poly.length];return (a.y>q.y)!==(z.y>q.y)&&q.x<(z.x-a.x)*(q.y-a.y)/(z.y-a.y)+a.x?!hit:hit;},false);})
          ||road.points.slice(1).some((q,j)=>points.some((p,i)=>intersects(p,points[(i+1)%points.length],road.points[j],q)))))continue;
        const kind=use<-.08?'meadow':terrace?'terrace':random(seed,holding*37+index+77000)<.16?'orchard':'field';
        const projected=poly.map(q=>({x:q.x*ux+q.y*uy,y:q.x*vx+q.y*vy})),low=M.min(...projected.map(q=>q.y)),high=M.max(...projected.map(q=>q.y)),lines=[];
        if(terrace&&kind!=='meadow')for(const level of rowLevels){const line=contour(level);if(line.length>1)lines.push(line.map(world));}
        const count=terrace||kind==='meadow'?0:kind==='orchard'?3:4;
        for(let row=1;row<=count;row++){
          const y=low+(high-low)*row/(count+1),cuts=[];
          for(let i=0;i<projected.length;i++){const a=projected[i],z=projected[(i+1)%projected.length];if((a.y>y)!==(z.y>y))cuts.push(a.x+(z.x-a.x)*(y-a.y)/(z.y-a.y));}
          if(cuts.length===2)lines.push(cuts.sort((a,b)=>a-b).map(x=>world({x:x*ux+y*vx,y:x*uy+y*vy})));
        }
        let access=null,best=Infinity;for(const road of roads)for(let i=1;i<road.points.length;i++){
          const a=local(road.points[i-1]),z=local(road.points[i]),dx=z.x-a.x,dy=z.y-a.y,t=clamp(((mid.x-a.x)*dx+(mid.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),q={x:a.x+t*dx,y:a.y+t*dy},d=M.hypot(q.x-mid.x,q.y-mid.y);
          if(d<best){best=d;access=world(q);}}
        results.push({points,lines,center:world(mid),access:[world(mid),access],kind,slope:localSlope,areaKm2:area(poly),
          fill:kind==='meadow'?'#c8d5b4':kind==='orchard'?'#c0cba4':['#d5d1aa','#dce0b9','#e3ddba','#d1d9b0'][M.floor(random(seed,holding*71+index+79000)*4)]});
      }
    }return results;
  }

  function landscape(recipe,surface,slopes,coordinates,land,seed,farmland,channels) {
    const SIZE=surface.rows;
    const metric=recipe.urban.gridCellKilometres||{row:10,column:10},center=recipe.location,radius=recipe.urban.radiusKm;
    const trees=[],rocks=[],woods=[];
    const inside=(p,polygon)=>{let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];if((a.row>p.row)!==(b.row>p.row)&&p.column<(b.column-a.column)*(p.row-a.row)/(b.row-a.row)+a.column)result=!result;}return result;};
    const roads=recipe.transport.corridors.filter(r=>r.kind==='road');
    const fieldBoxes=farmland.map(field=>({field,boundary:field.points.concat(field.points[0]),west:M.min(...field.points.map(p=>p.column)),east:M.max(...field.points.map(p=>p.column)),
      north:M.min(...field.points.map(p=>p.row)),south:M.max(...field.points.map(p=>p.row))}));
    const stepKm=M.min((surface.bounds.east-surface.bounds.west)*metric.column,
      (surface.bounds.south-surface.bounds.north)*metric.row)/(SIZE-1),
      fieldCandidates=boundsCandidates(fieldBoxes.map(b=>({west:b.west-stepKm/metric.column,east:b.east+stepKm/metric.column,
        north:b.north-stepKm/metric.row,south:b.south+stepKm/metric.row}))),
      groundAvailable=p=>nearest(surface.buildable,SIZE,SIZE,surface.bounds,p)===1
        &&M.hypot((p.column-center.column)*metric.column,(p.row-center.row)*metric.row)>radius*1.12
        &&!fieldCandidates(polygonBounds([p])).some(i=>{const b=fieldBoxes[i];
          return p.column>=b.west&&p.column<=b.east&&p.row>=b.north&&p.row<=b.south&&inside(p,b.field.points);}),
      available=p=>groundAvailable(p)&&!roads.some(r=>distanceToLine(p,r.points,metric).distance<.07),
      roadBlocked=new Uint8Array(coordinates.length),riverside=new Uint8Array(coordinates.length);
    const noise=(u,v)=>M.sin(u*19+random(seed,90)*6)*M.cos(v*15+random(seed,91)*6)+M.sin(u*31-v*24)*.35;
    // Clip the continuous cover signal, rather than discarding an entire cell
    // when one corner meets a road, field or slope boundary.
    const cover=coordinates.map((p,i)=>{
      let value=M.min(noise((i%SIZE)/(SIZE-1),M.floor(i/SIZE)/(SIZE-1))-.5,
        sample(surface.buildable,SIZE,SIZE,surface.bounds,p.row,p.column)-.5,
        (M.hypot((p.column-center.column)*metric.column,(p.row-center.row)*metric.row)-radius*1.12)/stepKm,
        surface.elevationMetres[i]/10);
      if(surface.lakeDepths)value=M.min(value,-surface.lakeDepths[i]/10);
      for(const road of roads){const distance=distanceToLine(p,road.points,metric).distance;
        value=M.min(value,(distance-.07)/stepKm);if(distance<.07)roadBlocked[i]=1;}
      for(const channel of channels){const near=distanceToLine(p,channel.points,metric);
        value=M.min(value,(near.distance-near.widthMetres/2000-.02)/stepKm);if(near.distance<.18)riverside[i]=1;}
      for(const fieldIndex of fieldCandidates(polygonBounds([p]))){const b=fieldBoxes[fieldIndex];
        if(p.column<b.west-stepKm/metric.column||p.column>b.east+stepKm/metric.column
          ||p.row<b.north-stepKm/metric.row||p.row>b.south+stepKm/metric.row)continue;
        const polygon=b.field.points,distance=distanceToLine(p,b.boundary,metric).distance;
        value=M.min(value,(inside(p,polygon)?-distance:distance)/stepKm);
      }
      return value;
    });
    const free=coordinates.map((p,i)=>land[i]&&groundAvailable(p)&&!roadBlocked[i]);
    for(let row=1;row<SIZE-2;row++)for(let column=1;column<SIZE-2;column++){
      const index=row*SIZE+column;
      for(const triangle of [[index,index+1,index+SIZE+1],[index,index+SIZE+1,index+SIZE]]){
        if(triangle.every(i=>cover[i]<=0))continue;
        const polygon=[];
        for(let edge=0;edge<3;edge++){
          const first=triangle[edge],last=triangle[(edge+1)%3],a=coordinates[first],b=coordinates[last],va=cover[first],vb=cover[last];
          if(va>0)polygon.push(a);
          if((va>0)!==(vb>0)){const t=va/(va-vb);
            polygon.push({row:a.row+(b.row-a.row)*t,column:a.column+(b.column-a.column)*t});}
        }
        if(polygon.length>=3)woods.push(polygon);
      }
    }
    for(let row=1;row<SIZE-2;row++)for(let column=1;column<SIZE-2;column++){
      const index=row*SIZE+column,p=coordinates[index],u=column/(SIZE-1),v=row/(SIZE-1);
      if(!free[index])continue;
      const value=noise(u,v)+(slopes[index]>.04?.25:0);
      if(value>.30||riverside[index]){
        const count=value>.5?4:2;
        for(let n=0;n<count;n++){
          const x=column+(random(seed,index*9+n)-.5)*.85,y=row+(random(seed,index*9+n+4)-.5)*.85;
          const point={row:surface.bounds.north+y/(SIZE-1)*(surface.bounds.south-surface.bounds.north),column:surface.bounds.west+x/(SIZE-1)*(surface.bounds.east-surface.bounds.west)};
          if(available(point)&&trees.length<5000)trees.push({point,radiusMetres:9+random(seed,index+n)*11});
        }
      }else if(slopes[index]>.035&&random(seed,index)<.18)rocks.push({row:p.row,column:p.column});
    }
    return {woodland:woods,trees,rocks};
  }

  function geographicNames(recipe,context,site,metric){
    const prefix=Array.from(recipe.name||'当地').slice(0,3).join(''),result=[],c=recipe.location,f=site.surface,b=f.bounds;
    const SIZE=f.rows;
    const roots=context.nameRoots||[],used=new Set();
    const name=(suffix,salt)=>{
      if(!roots.length)return prefix+suffix;
      const start=M.floor(random(recipe.seed||0,salt)*roots.length);
      for(let i=0;i<roots.length;i++){const candidate=roots[(start+i)%roots.length]+suffix;if(!used.has(candidate)){used.add(candidate);return candidate;}}
      throw new RangeError('City landscape name inventory exhausted');
    };
    for(const feature of context.namedFeatures||[])result.push({id:'world-'+feature.id,name:feature.name,
      kind:feature.kind==='river'?'river':'terrain',anchor:feature.location,priority:4,detailLevel:0});
    for(const [i,ch] of site.channels.entries()){
      const anchor=ch.points[M.floor(ch.points.length*.53)],riverName=name(ch.kind==='river'?'河':'溪',5100+i);
      result.push({id:'supply-river-'+i,name:riverName,kind:'river',anchor,priority:2,detailLevel:0});ch.name=riverName;
    }
    for(const [i,lake] of site.lakes.entries()){
      lake.name=name('湖',5119+i);result.push({id:'local-lake-'+i,name:lake.name,kind:'river',anchor:lake.anchor,priority:1,detailLevel:0});
    }
    const candidates=[];
    for(let y=3;y<SIZE-3;y++)for(let x=3;x<SIZE-3;x++){
      const i=y*SIZE+x,z=f.elevationMetres[i];if(z<=site.elevationRange.minimum+30)continue;
      if([-SIZE-1,-SIZE,-SIZE+1,-1,1,SIZE-1,SIZE,SIZE+1].some(d=>f.elevationMetres[i+d]>z))continue;
      const p={row:b.north+y/(SIZE-1)*(b.south-b.north),column:b.west+x/(SIZE-1)*(b.east-b.west)};
      if(M.hypot((p.row-c.row)*metric.row,(p.column-c.column)*metric.column)<recipe.urban.radiusKm*.9)continue;
      candidates.push({p,z});
    }
    const peaks=[];for(const peak of candidates.sort((a,z)=>z.z-a.z)){
      if(peaks.some(p=>M.hypot((p.p.row-peak.p.row)*metric.row,(p.p.column-peak.p.column)*metric.column)<site.radiusKm*.35))continue;
      peaks.push(peak);if(peaks.length===3)break;
    }
    for(const [i,peak] of peaks.entries())result.push({id:'local-peak-'+i,name:name(i===0&&recipe.culture?.holyReligion?.tradition==='mountain-vow'?'圣山':i?'岭':'山',5200+i)+' · '+M.round(peak.z)+' m',
      kind:'terrain',anchor:peak.p,priority:3,detailLevel:0,spot:true});
    const cells=new Map();
    for(const polygon of site.woodland){const p={row:polygon.reduce((s,p)=>s+p.row,0)/polygon.length,column:polygon.reduce((s,p)=>s+p.column,0)/polygon.length},
      x=M.floor((p.column-b.west)/(b.east-b.west)*(SIZE-1)),y=M.floor((p.row-b.north)/(b.south-b.north)*(SIZE-1));cells.set(y*SIZE+x,p);}
    const woods=[];while(cells.size){const first=cells.keys().next().value,queue=[first],points=[];cells.delete(first);
      for(let k=0;k<queue.length;k++){const i=queue[k],x=i%SIZE,y=M.floor(i/SIZE);points.push({row:b.north+(y+.5)/(SIZE-1)*(b.south-b.north),column:b.west+(x+.5)/(SIZE-1)*(b.east-b.west)});
        for(const d of [-1,1,-SIZE,SIZE])if(cells.has(i+d)){cells.delete(i+d);queue.push(i+d);}}
      if(points.length>5)woods.push(points);
    }
    for(const [i,wood] of woods.sort((a,z)=>z.length-a.length).slice(0,4).entries()){
      const mid={row:wood.reduce((s,p)=>s+p.row,0)/wood.length,column:wood.reduce((s,p)=>s+p.column,0)/wood.length},
        anchor=wood.reduce((a,p)=>M.hypot(p.row-mid.row,p.column-mid.column)<M.hypot(a.row-mid.row,a.column-mid.column)?p:a,wood[0]);
      result.push({id:'local-wood-'+i,name:name('林',5300+i),kind:'forest',anchor,priority:5,detailLevel:0});
    }
    for(const [i,island] of (site.coastal.islands||[]).entries())result.push({id:'local-island-'+i,name:name('岛',5400+i),kind:'terrain',anchor:island.anchor,priority:2,detailLevel:0});
    for(const [i,line] of site.contours.entries())if(line.major&&line.anchor)result.push({id:'contour-'+i,name:line.elevation+' m',kind:'elevation',anchor:line.anchor,priority:8,detailLevel:0});
    return result;
  }

  window.WorldAtlasCitySite = {generate,elevationAt,isDry,surfaceTriangles,distanceToChannel:(point,channel,metric)=>distanceToLine(point,channel.points,metric)};
})();
