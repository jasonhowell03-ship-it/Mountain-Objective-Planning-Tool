/* Geocoded town candidates, restricted by explicit country and subdivision. */
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).json({error:'Use GET'});
 const name=String(req.query.name||'').trim(),country=String(req.query.country||'').trim().toUpperCase(),region=String(req.query.region||'').trim();
 if(name.length<2||name.length>100||region.length>80||name.includes(',')||region.includes(',')||!['US','CA'].includes(country))return res.status(400).json({error:'Choose United States or Canada and enter at least two characters of a town name or postal code.'});
 const params=new URLSearchParams({name:name+(region?', '+region:''),countryCode:country,count:'100',language:'en',format:'json'});
 try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?'+params,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Town search temporarily unavailable');const data=await r.json();if(data.error)throw Error('Town search temporarily unavailable');const results=(data.results||[]).filter(p=>p.country_code===country&&/^PPL/.test(p.feature_code||'')&&(!region||String(p.admin1||'').toLowerCase()===region.toLowerCase())).map(p=>({id:p.id,name:p.name,region:p.admin1,county:p.admin2||'',country:p.country_code,latitude:p.latitude,longitude:p.longitude}));return res.status(200).json({results,source:'Open-Meteo / GeoNames'});}catch(_){return res.status(503).json({error:'Town search unavailable. Retry or use manual town entry.'});}
};
