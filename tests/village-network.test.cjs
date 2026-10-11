const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class Element{constructor(tag){this.tag=tag;this.attrs={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}appendChild(node){this.children.push(node);return node;}}
const scope={window:{},console,document:{createElementNS:(_ns,tag)=>new Element(tag)}};
for(const name of ['city-site.js','city-character.js','city-detail.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets',name),'utf8'),scope,{filename:name});
const cities=scope.window.WorldAtlasCities;
const fixture=(population,type='village')=>({id:'village-network',name:'榆川',seed:24017,era:'preindustrial',tier:'site',siteType:type,
 location:{row:10.5,column:10.5},population:{estimate:population},culture:{style:'timber-frame',government:'maritime-republic'},
 urban:{radiusKm:.7,radiusRows:.7,radiusColumns:.7,gridCellKilometres:{row:1,column:1},streetWidthsMetres:{arterial:12,collector:6,local:3},
  bounds:{north:9.8,south:11.2,west:9.8,east:11.2},coreZones:[{id:'government',role:'local-government',row:10.5,column:10.5,radiusKm:.13}]},
 terrain:{slopeClass:'flat',buildable:{coordinateSpace:'world-grid-cells',bounds:{north:8,south:13,west:8,east:13},allowedCells:Array.from({length:25},(_,i)=>[8+Math.floor(i/5),8+i%5]),blockedCells:[],clipCityGeometry:true}},
 morphology:{streetPattern:'organic',streetIrregularity:.3},transport:{corridors:[{id:'approach',kind:'road',points:[{row:10.5,column:9.6},{row:10.5,column:11.4}]}]}});
function verify(recipe,plan){
 const m=recipe.urban.gridCellKilometres,distance=(a,b)=>Math.hypot((a.column-b.column)*m.column,(a.row-b.row)*m.row),
  edges=plan.streets.flatMap(street=>street.points.slice(1).map((b,i)=>[street.points[i],b])),parent=edges.map((_,i)=>i),root=i=>parent[i]===i?i:parent[i]=root(parent[i]);
 const project=(p,a,b)=>{const x=(b.column-a.column)*m.column,y=(b.row-a.row)*m.row,t=Math.max(0,Math.min(1,((p.column-a.column)*m.column*x+(p.row-a.row)*m.row*y)/(x*x+y*y||1)));return {column:a.column+(b.column-a.column)*t,row:a.row+(b.row-a.row)*t};};
 const crossing=(a,b,c,d)=>{const x=b.column-a.column,y=b.row-a.row,sx=d.column-c.column,sy=d.row-c.row,den=x*sy-y*sx;if(Math.abs(den)<1e-18)return false;const t=((c.column-a.column)*sy-(c.row-a.row)*sx)/den,u=((c.column-a.column)*y-(c.row-a.row)*x)/den;return t>1e-8&&t<1-1e-8&&u>1e-8&&u<1-1e-8;};
 for(let i=0;i<edges.length;i++)for(let j=0;j<i;j++){
  const [a,b]=edges[i],[c,d]=edges[j];if(crossing(a,b,c,d)||Math.min(distance(a,project(a,c,d)),distance(b,project(b,c,d)),distance(c,project(c,a,b)),distance(d,project(d,a,b)))<1e-5)parent[root(i)]=root(j);
 }
 assert.equal(new Set(edges.map((_,i)=>root(i))).size,1,'a village has one connected street graph instead of disconnected block wedges');
 assert.equal(plan.blocks.length,0,'villages do not inherit metropolitan BSP block fills');
 assert.ok(plan.buildings.length>0,'a garrison village retains civilian households');
 if(!plan.fortress)assert.ok(plan.buildings.length>=plan.character.buildingCount*.6,'civilian village frontage supports its household budget');
 for(const home of plan.buildings){
  assert.ok(home.access?.length>=2,'each household has a real doorway path');
  assert.ok(Math.min(...edges.map(([a,b])=>distance(home.access.at(-1),project(home.access.at(-1),a,b))))<1e-5,'each path reaches a rendered street');
 }
 for(const [a,b] of edges)for(const [c,d] of plan.walls.concat(plan.innerWalls))assert.equal(crossing(a,b,c,d),false,'village lanes never cross closed wall segments');
 if(plan.fortress)for(const [a,b] of edges)for(let i=0;i<plan.fortress.points.length;i++)assert.equal(crossing(a,b,plan.fortress.points[i],plan.fortress.points[(i+1)%plan.fortress.points.length]),false,'residential lanes cannot pass through the garrison');
 const rendered=cities.render(recipe),nodes=[];const walk=node=>{nodes.push(node);node.children.forEach(walk);};walk(rendered);
 assert.ok(nodes.some(node=>node.attrs.class==='city-household-access'&&node.attrs.d.includes('L')),'household connections are actually drawn');
 assert.ok(Number(nodes.find(node=>node.attrs.class==='city-street-ground').attrs['fill-opacity'])<.2,'village ground does not become white metropolitan block plates');
 return {population:recipe.population.estimate,homes:plan.buildings.length,streets:plan.streets.length,gates:plan.gates.length};
}
const report={villages:[],forts:[],saved:[]};
for(const population of [120,600,3600]){
 const recipe=fixture(population);report.villages.push(verify(recipe,cities.plan(recipe)));
 const fort=fixture(population,'fortress'),plan=cities.plan(fort);assert.ok(plan.fortress&&plan.walls.length,'military villages keep modest garrisons and real enclosing walls');report.forts.push(verify(fort,plan));
}
assert.ok(report.forts[0].homes<report.forts[1].homes&&report.forts[1].homes<report.forts[2].homes,'civilian frontage grows with a military settlement population');
for(const filename of process.argv.slice(2)){
 const saved=JSON.parse(fs.readFileSync(filename)),recipe=scope.window.WorldAtlasCitySite.generate(saved.recipe,saved.siteContext,{seed:saved.recipe.seed}),plan=cities.plan(recipe,{grid:saved.grid});
 if(!plan.character.small)continue;
 const checked=verify(recipe,plan);
 if(recipe.harbor){assert.ok(recipe.harbor.access.length>=2,'a landing already reached by the village graph retains drawable access');assert.ok(recipe.harbor.access.some(p=>Math.hypot((p.column-recipe.harbor.landPoint.column)*recipe.urban.gridCellKilometres.column,(p.row-recipe.harbor.landPoint.row)*recipe.urban.gridCellKilometres.row)<1e-6),'landing access reaches its real refined entrance');}
 report.saved.push({id:recipe.id,...checked,harborAccess:recipe.harbor?.access.length});
}
console.log(JSON.stringify({ok:true,...report}));
