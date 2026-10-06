/* USGS topographic navigation; selected point feeds the existing NWS workflow. */
(()=>{
 const $=id=>document.getElementById(id),v=id=>$(id)?.value||'';
 let map,pin,stations,request=0,controller,townRequest=0,townController,town;
 const valid=(a,b)=>a!==''&&b!==''&&a!=null&&b!=null&&Number.isFinite(+a)&&Number.isFinite(+b)&&Math.abs(+a)<=90&&Math.abs(+b)<=180;
 const pinned=()=>valid(v('latitude'),v('longitude'));
 const status=t=>{$('mapStatus').textContent=t;};
 const notify=id=>$(id).dispatchEvent(new Event('change',{bubbles:true}));
 function renderPin(){
  if(!map)return;if(pin){map.removeLayer(pin);pin=null;}
  if(!pinned())return;
  pin=L.marker([+v('latitude'),+v('longitude')],{draggable:true,icon:L.divIcon({className:'map-pin',html:'📍',iconSize:[32,36],iconAnchor:[16,34]}),title:'Objective forecast pin',alt:'Drag objective forecast pin'}).addTo(map);
  pin.on('dragend',()=>select(pin.getLatLng()));
 }
 function init(){
  if(map){map.invalidateSize();return true;}
  if(!window.L){status('Map library unavailable. Reload when connected; Manual Input remains available.');return false;}
  map=L.map('objectiveMap',{scrollWheelZoom:true}).setView(pinned()?[+v('latitude'),+v('longitude')]:town?[town.latitude,town.longitude]:[39,-105],pinned()?12:town?11:4);
  const topo=L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Topo: <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">USGS</a> | Weather: <a href="https://www.weather.gov/">NWS</a>'}).addTo(map);
  topo.on('tileerror',()=>status('Some topographic tiles are unavailable. Retry when connected. Forecast point: '+(pinned()?v('latitude')+', '+v('longitude'):'not selected')));
  stations=L.layerGroup().addTo(map);L.control.scale().addTo(map);
  map.on('click',e=>select(e.latlng));renderPin();return true;
 }
 function reportPoint(){
  $('mapPointReport').value=pinned()?'Objective pin: '+v('latitude')+', '+v('longitude')+'\nNWS point forecast: https://forecast.weather.gov/MapClick.php?lat='+v('latitude')+'&lon='+v('longitude'):'';
 }
 function select(point){
  $('latitude').value=point.lat.toFixed(5);$('longitude').value=(((point.lng+180)%360+360)%360-180).toFixed(5);
  $('forecastMode').value='Automatic Data';$('autoWeatherReview').value='';$('autoAvReview').value='';
  reportPoint();renderPin();notify('forecastMode');notify('latitude');notify('longitude');notify('mapPointReport');
  status('Objective pinned at '+v('latitude')+', '+v('longitude')+'. Forecasts update in the Plan tab; review conditions for your route.');getStations();
 }
 function clearPin(){
  ++request;controller?.abort();$('latitude').value='';$('longitude').value='';$('weatherStationReport').value='';$('mapStations').textContent='Pin the objective to retrieve nearby NWS stations.';stations?.clearLayers();renderPin();reportPoint();notify('latitude');notify('longitude');notify('mapPointReport');notify('weatherStationReport');
 }
 function stationText(s){
  const age=s.timestamp?(Date.now()-Date.parse(s.timestamp))/3600000:Infinity;
  return s.name+' ('+s.id+') — '+s.distanceKm.toFixed(1)+' km; elevation '+(s.elevationM==null?'unknown':Math.round(s.elevationM)+' m')+'\nObserved: '+(s.timestamp||'Unavailable')+(age>3?' • OLD / UNAVAILABLE':'')+'\n'+(s.description||'')+'; temperature '+(s.temperatureC==null?'unavailable':s.temperatureC.toFixed(1)+' °C')+'; wind '+(s.wind||'unavailable')+'\n'+s.url;
 }
 async function getStations(){
  ++request;controller?.abort();const token=request;
  stations?.clearLayers();if(!pinned())return;
  $('mapStations').textContent='Retrieving nearby NWS stations…';$('weatherStationReport').value='Retrieving nearby NWS stations…';notify('weatherStationReport');controller=new AbortController();
  try{
   const r=await fetch('/api/weather-stations?'+new URLSearchParams({lat:v('latitude'),lon:v('longitude')}),{signal:controller.signal});const d=await r.json();if(token!==request)return;if(!r.ok)throw Error(d.error||'Station observations unavailable.');
   const text='NWS station observations • Retrieved: '+d.retrieved+'\nObservations are reference data; compare elevation, distance and observation time.\n\n'+(d.stations.length?d.stations.map(stationText).join('\n\n'):'No nearby stations returned by NWS.');
   $('mapStations').textContent=text;$('weatherStationReport').value=text;
   for(const s of d.stations){if(stations&&valid(s.latitude,s.longitude)){const node=document.createElement('div');node.textContent=stationText(s);node.style.whiteSpace='pre-wrap';L.marker([s.latitude,s.longitude],{bubblingMouseEvents:false,icon:L.divIcon({className:'station-dot',iconSize:[14,14]}),title:s.name,alt:'Weather station '+s.name}).addTo(stations).bindPopup(node);}}
  }catch(e){if(e.name!=='AbortError'&&token===request){$('mapStations').textContent=e.message+' Station observations do not replace the point forecast.';$('weatherStationReport').value=$('mapStations').textContent;}}
  finally{if(token===request)notify('weatherStationReport');}
 }
 async function centerTown(clear){
  ++townRequest;townController?.abort();const token=townRequest;
  if(clear){town=null;clearPin();}
  const country=v('country').toLowerCase(),code=country==='canada'?'CA':['united states','us','usa'].includes(country)?'US':'';
  const label=$('state').selectedOptions[0]?.textContent||'',region=label.replace(/ \([A-Z]{2}\)$/,'').replace(' (saved location)','');
  if(!code||!v('state')||!v('city')){status('Select country, state / province and town, then pin the mountain.');if(map)map.setView(code==='CA'?[56,-106]:[39,-98],4);return;}
  const o=$('city').selectedOptions[0];
  if(valid(o?.dataset.latitude,o?.dataset.longitude)){town={latitude:+o.dataset.latitude,longitude:+o.dataset.longitude};}
  else{
   townController=new AbortController();status('Locating '+v('city')+'…');
   try{const r=await fetch('/api/location-search?'+new URLSearchParams({name:v('city').split(' — ')[0],country:code,region}),{signal:townController.signal});const d=await r.json();if(token!==townRequest)return;if(!r.ok)throw Error(d.error||'Town lookup unavailable.');const match=d.results?.find(x=>x.name===v('city').split(' — ')[0]&&(!v('city').includes(' — ')||v('city').endsWith(x.county)))||d.results?.find(x=>x.name===v('city'));if(!match)throw Error('Town could not be located. Pan the map and pin your objective.');town={latitude:match.latitude,longitude:match.longitude};}
   catch(e){if(e.name!=='AbortError'&&token===townRequest)status(e.message);return;}
  }
  if(map&&(clear||!pinned()))map.setView([town.latitude,town.longitude],11);
  status('Map centered on '+v('city')+'. Pin the mountain or route for its forecast.');
 }
 function setup(){
  document.addEventListener('mop-map-open',()=>{if(init()){if(pinned()&&!v('weatherStationReport'))getStations();else if(!pinned())centerTown(false);}});
  document.addEventListener('mop-town-selected',()=>centerTown(true));
  for(const id of ['country','state'])$(id).addEventListener('change',e=>{if(e.isTrusted){++townRequest;townController?.abort();town=null;clearPin();if(map)map.setView(v('country').toLowerCase()==='canada'?[56,-106]:[39,-98],4);status('Select a town to center the map, then pin the objective.');}});
  $('country').addEventListener('input',e=>{if(e.isTrusted){town=null;clearPin();}});
  $('mapCenterTown').onclick=()=>{centerTown(false).then(()=>{if(town&&map)map.setView([town.latitude,town.longitude],11);});};
  $('mapCenterPin').onclick=()=>{if(pinned()&&map)map.setView([+v('latitude'),+v('longitude')],13);else status('Tap the map to select a forecast point first.');};
  $('mapPinCenter').onclick=()=>{if(map)select(map.getCenter());};
  document.addEventListener('change',e=>{if(e.target?.id==='env'){++townRequest;townController?.abort();town=null;++request;controller?.abort();stations?.clearLayers();reportPoint();renderPin();$('mapStations').textContent=v('weatherStationReport')||'Pin an objective for station observations.';if(pinned()&&map){map.setView([+v('latitude'),+v('longitude')],12);getStations();}else centerTown(false);}});
  reportPoint();if(!pinned())centerTown(false);if(!$('map').classList.contains('hide'))init();$('map').dataset.ready='true';
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1100));
})();
