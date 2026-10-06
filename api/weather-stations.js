const headers={'User-Agent':'MountainObjectivePlanner (mountain-objective-planning-tool-ct.vercel.app)','Accept':'application/geo+json'};
async function json(url){const response=await fetch(url,{headers,signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('NWS station service unavailable for this location.');return response.json();}
const distance=(a,b,c,d)=>{const rad=x=>x*Math.PI/180,h=Math.sin(rad(c-a)/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(rad(d-b)/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));};
const quantity=q=>q&&typeof q.value==='number'&&Number.isFinite(q.value)?q.value:null;
const metres=q=>{const value=quantity(q);return value==null?null:q.unitCode==='wmoUnit:m'?value:q.unitCode==='wmoUnit:ft'?value*0.3048:null;};
const celsius=q=>{const value=quantity(q);return value==null?null:q.unitCode==='wmoUnit:degC'?value:q.unitCode==='wmoUnit:degF'?(value-32)*5/9:null;};
const wind=q=>{const value=quantity(q);if(value==null)return null;const labels={'wmoUnit:km_h-1':'km/h','wmoUnit:m_s-1':'m/s','wmoUnit:mi_h-1':'mph','wmoUnit:kn':'kt'};return labels[q.unitCode]?value.toFixed(1)+' '+labels[q.unitCode]:null;};
module.exports=async(req,res)=>{
 const a=String(req.query?.lat??''),b=String(req.query?.lon??''),lat=Number(a),lon=Number(b);
 if(!a.trim()||!b.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return res.status(400).json({error:'Invalid forecast point.'});
 try{
  const point=await json('https://api.weather.gov/points/'+lat.toFixed(4)+','+lon.toFixed(4)),url=point.properties?.observationStations;
  if(!url||!/^https:\/\/api\.weather\.gov\/gridpoints\/[A-Z]{3}\/\d+,\d+\/stations$/.test(url))throw Error('NWS station coverage unavailable. Use local sources in Manual Input.');
  const collection=await json(url),nearby=(collection.features||[]).map(f=>{const p=f.properties||{},coordinates=f.geometry?.coordinates;return {id:p.stationIdentifier,name:p.name||p.stationIdentifier,latitude:coordinates?.[1],longitude:coordinates?.[0],elevationM:metres(p.elevation)};}).filter(s=>/^[A-Z0-9]{3,12}$/.test(s.id)&&Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).map(s=>({...s,distanceKm:distance(lat,lon,s.latitude,s.longitude)})).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,5);
  const stations=await Promise.all(nearby.map(async s=>{let p={};try{p=(await json('https://api.weather.gov/stations/'+s.id+'/observations/latest')).properties||{};}catch{}return {...s,timestamp:p.timestamp||null,description:p.textDescription||null,temperatureC:celsius(p.temperature),wind:wind(p.windSpeed),url:'https://forecast.weather.gov/data/obhistory/'+s.id+'.html'};}));
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=60');return res.status(200).json({retrieved:new Date().toISOString(),stations});
 }catch(e){return res.status(503).json({error:e.message||'NWS station observations unavailable.'});}
};
