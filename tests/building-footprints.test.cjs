const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const scope={window:{},console};
for(const name of ['city-site.js','city-character.js','city-detail.js']){
 let source=fs.readFileSync(path.join(__dirname,'../assets',name),'utf8');
 if(name==='city-detail.js')source=source.replace('const api = Object.freeze({ plan, render, streetNetwork });',
  'global.CityBuildingTest = {frontageBuilding, completeBuildingGround}; const api = Object.freeze({ plan, render, streetNetwork });');
 vm.runInNewContext(source,scope,{filename:name});
}
const cities=scope.window.WorldAtlasCities;
function fixture(population,style,metrics={row:1,column:1}){
 const c={row:10.5,column:10.5},at=(x,y)=>({column:c.column+x/metrics.column,row:c.row+y/metrics.row});
 return {id:'building-footprint',name:'石庭',seed:31459,tier:'city',siteType:'market',era:'preindustrial',location:c,population:{estimate:population},
  culture:{style,government:'city-republic'},urban:{radiusKm:1.1,radiusRows:1.1/metrics.row,radiusColumns:1.1/metrics.column,gridCellKilometres:metrics,
   streetWidthsMetres:{arterial:12,collector:6,local:3},bounds:{north:c.row-1.1/metrics.row,south:c.row+1.1/metrics.row,west:c.column-1.1/metrics.column,east:c.column+1.1/metrics.column},
   coreZones:[{id:'hall',role:'local-government',...at(-.2,-.1),radiusKm:.15}]},morphology:{kind:'plain-organic',streetPattern:'organic',orientationDegrees:21,streetIrregularity:.35},
  terrain:{slopeClass:'flat',buildable:{coordinateSpace:'world-grid-cells',bounds:{north:8,south:13,west:8,east:13},allowedCells:Array.from({length:25},(_,i)=>[8+Math.floor(i/5),8+i%5]),blockedCells:[],clipCityGeometry:true}},
  transport:{corridors:[{id:'approach',kind:'road',points:[at(-1.8,0),at(1.8,0)]}]}};
}
function verify(recipe,plan){
 const m=recipe.urban.gridCellKilometres,toMetres=p=>({x:(p.column-recipe.location.column)*m.column*1000,y:(p.row-recipe.location.row)*m.row*1000}),
  distance=(a,b)=>Math.hypot((a.column-b.column)*m.column,(a.row-b.row)*m.row),
  project=(p,a,b)=>{const x=(b.column-a.column)*m.column,y=(b.row-a.row)*m.row,t=Math.max(0,Math.min(1,((p.column-a.column)*m.column*x+(p.row-a.row)*m.row*y)/(x*x+y*y||1)));return {column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t};},
  edges=plan.streets.flatMap(s=>s.points.slice(1).map((b,i)=>[s.points[i],b]));
 assert.ok(plan.buildings.length>=Math.min(100,plan.character.buildingCount*.5),'population still supports a visible inhabited town');
 assert.ok(plan.buildings.length<=plan.character.buildingCount,'real household allocation stays within its population budget');
 let minEdge=Infinity,minArea=Infinity,maxArea=0;
 for(const home of plan.buildings){
  assert.equal(home.points.length,4,'an ordinary household remains one complete four-sided footprint');
  const p=home.points.map(toMetres),area=Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%4];return sum+a.x*b.y-a.y*b.x;},0))*.5;
  minArea=Math.min(minArea,area);maxArea=Math.max(maxArea,area);
  const lengths=p.map((a,i)=>Math.hypot(a.x-p[(i+1)%4].x,a.y-p[(i+1)%4].y));minEdge=Math.min(minEdge,...lengths);
  assert.ok(Math.min(...lengths)>=4.99,'ordinary housing cannot shrink below a habitable five metre side');
  assert.ok(area>=44.99&&area<1600,'ordinary roof areas have physical household scale');
  for(let i=0;i<4;i++){
   const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4],dot=(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y);
   assert.ok(Math.abs(dot)<lengths[i]*lengths[(i+1)%4]*1e-5,'housing has true metre-orthogonal facades on unequal native axes');
  }
  assert.ok(scope.window.CityBuildingTest.completeBuildingGround(home.points,recipe),'whole housing footprints stay on dry buildable terrain');
  assert.ok(home.access?.length>=2,'every ordinary household has a precise street frontage');
  assert.ok(Math.min(...edges.map(([a,b])=>distance(home.access.at(-1),project(home.access.at(-1),a,b))))<1e-6,'the doorway path reaches an actual rendered street');
 }
 return {count:plan.buildings.length,expected:plan.character.buildingCount,minEdgeMetres:minEdge,minAreaMetres2:minArea,maxAreaMetres2:maxArea};
}
const report={fixtures:[],saved:[]};
for(const [population,style,metric] of [[12000,'stone-masonry',{row:1,column:1}],[12000,'courtyard',{row:18.47996,column:14.82733}],[600,'timber-frame',{row:420,column:340}]]){
 const source=fixture(population,style,metric),original=JSON.stringify(source),plan=cities.plan(source);
 report.fixtures.push({population,style,...verify(source,plan)});assert.equal(JSON.stringify(source),original,'physical housing leaves saved recipe unchanged');
}
// A coastline crossing a household excludes that entire roof. It cannot
// manufacture habitable buildings from the small surviving terrain triangles.
const coast=fixture(12000,'stone-masonry'),bounds={north:9.5,south:11.5,west:9.5,east:11.5};
coast.localSite={surface:{rows:3,columns:3,bounds,elevationMetres:[-1,1,3,-1,1,3,-1,1,3],slopes:Array(9).fill(0)},channels:[]};
assert.equal(scope.window.CityBuildingTest.completeBuildingGround([{row:10.4,column:9.8},{row:10.4,column:10.8},{row:10.6,column:10.8},{row:10.6,column:9.8}],coast),false,'a partially flooded household is never split into clipped fragments');
assert.equal(scope.window.CityBuildingTest.completeBuildingGround([{row:10.4,column:10.4},{row:10.4,column:10.8},{row:10.6,column:10.8},{row:10.6,column:10.4}],coast),true,'safe complete households remain available near a coast');
for(const filename of process.argv.slice(2)){
 const saved=JSON.parse(fs.readFileSync(filename)),recipe=scope.window.WorldAtlasCitySite.generate(saved.recipe,saved.siteContext,{seed:saved.recipe.seed}),plan=cities.plan(recipe,{grid:saved.grid});
 report.saved.push({id:recipe.id,...verify(recipe,plan)});
}
console.log(JSON.stringify({ok:true,...report}));
