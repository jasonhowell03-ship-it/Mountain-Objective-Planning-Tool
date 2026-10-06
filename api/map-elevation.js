/* Terrain elevation at the objective pin, from USGS 3DEP / EPQS. */
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Use GET'});
 const a=String(req.query?.lat??''),b=String(req.query?.lon??''),lat=Number(a),lon=Number(b);
 if(!a.trim()||!b.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return res.status(400).json({error:'Invalid map point.'});
 const url='https://epqs.nationalmap.gov/v1/json?'+new URLSearchParams({x:String(lon),y:String(lat),units:'Feet',wkid:'4326',includeDate:'False'});
 try{
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Map elevation service unavailable. Try moving or reselecting the pin when connected.');
  const data=await response.json(),raw=data.value;
  if(raw==null||String(raw).trim()===''||!Number.isFinite(Number(raw))||Number(raw)<-1641||Number(raw)>29528)throw Error('No USGS terrain elevation available at this point.');
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=3600');
  return res.status(200).json({latitude:lat,longitude:lon,elevationM:Number(raw)*0.3048,source:'USGS 3DEP / Elevation Point Query Service',url,retrieved:new Date().toISOString()});
 }catch(e){return res.status(503).json({error:e.message||'Map elevation unavailable.'});}
};
