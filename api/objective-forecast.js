/* Public, key-free U.S. feeds. No provider URL is accepted from clients. */
const USER_AGENT='MountainObjectivePlanner (https://mountain-objective-planning-tool-ct.vercel.app/)';
async function json(url){const r=await fetch(url,{headers:{'User-Agent':USER_AGENT,Accept:'application/geo+json, application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Source temporarily unavailable ('+r.status+')');return r.json();}
function ringContains(r,x,y){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function polygonContains(p,x,y){return p?.length&&ringContains(p[0],x,y)&&!p.slice(1).some(r=>ringContains(r,x,y));}
function contains(g,x,y){return g?.type==='Polygon'?polygonContains(g.coordinates,x,y):g?.type==='MultiPolygon'&&g.coordinates.some(p=>polygonContains(p,x,y));}
function safeLink(s,fallback){try{const u=new URL(s);return u.protocol==='https:'||u.protocol==='http:'?u.href:fallback;}catch(_){return fallback;}}
function zoneDay(iso,tz){if(!iso)return '';try{return new Intl.DateTimeFormat('en-CA',{timeZone:tz||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));}catch(_){return '';}}
function zonedISO(value,tz){
 if(!value)return null;
 if(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value))return Number.isFinite(Date.parse(value))?new Date(value).toISOString():null;
 const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match||!tz)return null;
 const nums=match.slice(1).map(Number),target=Date.UTC(nums[0],nums[1]-1,nums[2],nums[3],nums[4],nums[5]||0);let result=target;
 try{for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(result));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));result+=target-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);}return new Date(result).toISOString();}catch(_){return null;}
}
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Use GET'});
 const lat=Number(req.query.lat),lon=Number(req.query.lon);
 if(req.query.lat==null||req.query.lon==null||String(req.query.lat).trim()===''||String(req.query.lon).trim()===''||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return res.status(400).json({error:'Valid objective latitude and longitude are required.'});
 const retrieved=new Date().toISOString();
 const results=await Promise.allSettled([
  (async()=>{const point=await json('https://api.weather.gov/points/'+lat.toFixed(4)+','+lon.toFixed(4));const url=point.properties?.forecast;if(!url||!url.startsWith('https://api.weather.gov/'))throw new Error('NWS has no forecast coverage for these coordinates.');const f=await json(url),periods=f.properties?.periods;if(!periods?.length)throw new Error('No current NWS forecast periods.');return{source:'National Weather Service',url:'https://forecast.weather.gov/MapClick.php?lat='+lat+'&lon='+lon,issued:f.properties.updated||f.properties.generatedAt,retrieved,start:periods[0].startTime,end:periods.at(-1).endTime,startDay:periods[0].startTime.slice(0,10),endDay:periods.at(-1).endTime.slice(0,10),periods:periods.map(p=>({name:p.name,start:p.startTime,end:p.endTime,temperature:p.temperature,unit:p.temperatureUnit,wind:p.windSpeed,direction:p.windDirection,forecast:p.detailedForecast}))};})(),
  (async()=>{const data=await json('https://api.avalanche.org/v2/public/products/map-layer');const zones=(data.features||[]).filter(f=>contains(f.geometry,lon,lat));if(!zones.length)throw new Error('No U.S. avalanche forecast zone covers these coordinates.');const p=zones.sort((a,b)=>Number(b.properties?.danger_level||0)-Number(a.properties?.danger_level||0))[0].properties||{};return{source:'Avalanche.org / '+(p.center||p.center_id||'Local center'),zone:p.name||'Forecast zone',url:safeLink(p.link,safeLink(p.center_link,'https://avalanche.org/')),danger:Number(p.danger_level),dangerText:p.danger||'',start:zonedISO(p.start_date,p.timezone),end:zonedISO(p.end_date,p.timezone),startDay:zoneDay(zonedISO(p.start_date,p.timezone),p.timezone),endDay:zoneDay(zonedISO(p.end_date,p.timezone),p.timezone),retrieved,advice:p.travel_advice||'',warning:p.warning||''};})()
 ]);
 const payload={lat,lon,retrieved};['weather','avalanche'].forEach((k,i)=>{payload[k]=results[i].status==='fulfilled'?results[i].value:{error:results[i].reason.message,source:k==='weather'?'National Weather Service':'Avalanche.org'};});
 return res.status(200).json(payload);
};
module.exports.contains=contains;
