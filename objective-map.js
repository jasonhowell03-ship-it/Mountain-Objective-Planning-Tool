/* USGS topographic navigation; selected point feeds the existing NWS workflow. */
(()=>{
 
 window.mopStandardizeUnits=function(text){
  const rounded=n=>String(Math.round(n*10)/10);
  let result=String(text||'').replace(/(-?\d+(?:\.\d+)?)(?:\s*(?:to|–|-(?=\d))\s*(\d+(?:\.\d+)?))?\s*(km\/hr|km\/h|m\/s|kt|km)\b/g,(_,a,b,unit)=>{
   const factor={'km/hr':0.621371192,'km/h':0.621371192,'m/s':2.236936292,kt:1.150779448,km:0.621371192}[unit];
   return rounded(+a*factor)+(b==null?'':' to '+rounded(+b*factor))+' '+(unit==='km'?'mi':'mph');
  });
  result=result.replace(/(-?\d+(?:\.\d+)?)\s*°\s*C\b/g,(_,n)=>rounded(+n*1.8+32)+' °F');
  result=result.replace(/(-?[\d,]+(?:\.\d+)?)\s+m\b/g,(_,n)=>Math.round(+n.replace(/,/g,'')*3.280839895).toLocaleString('en-US')+' ft');
  return result;
 };
 function standardReports(){for(const id of ['forecastWeatherReport','weatherStationReport']){const old=v(id),next=window.mopStandardizeUnits(old);if(old!==next){$(id).value=next;notify(id);}}}

 const $=id=>document.getElementById(id),v=id=>$(id)?.value||'';
 const regionCenters={AL:[32.7,-86.7],AK:[64,-153],AZ:[34.3,-111.7],AR:[34.9,-92.4],CA:[37.2,-119.7],CO:[39,-105.5],CT:[41.6,-72.7],DE:[39,-75.5],DC:[38.9,-77],FL:[28,-82],GA:[32.6,-83.4],HI:[20.8,-156.4],ID:[44.2,-114.5],IL:[40,-89],IN:[40,-86.1],IA:[42.1,-93.5],KS:[38.5,-98.3],KY:[37.6,-85.3],LA:[31.1,-92],ME:[45.2,-69],MD:[39,-76.7],MA:[42.3,-71.8],MI:[44.3,-85.6],MN:[46,-94.5],MS:[32.7,-89.7],MO:[38.4,-92.5],MT:[47,-110],NE:[41.5,-99.8],NV:[39.3,-116.6],NH:[43.8,-71.6],NJ:[40.1,-74.5],NM:[34.5,-106],NY:[43,-75.5],NC:[35.6,-79.8],ND:[47.5,-100.5],OH:[40.3,-82.8],OK:[35.5,-97.5],OR:[44,-120.5],PA:[40.9,-77.8],RI:[41.7,-71.5],SC:[33.9,-80.9],SD:[44.4,-100.2],TN:[35.8,-86.4],TX:[31,-99],UT:[39.3,-111.7],VT:[44,-72.7],VA:[37.5,-79],WA:[47.4,-120.7],WV:[38.7,-80.6],WI:[44.6,-89.7],WY:[43,-107.5],AB:[54,-115],BC:[54,-125],MB:[55,-97],NB:[46.6,-66.4],NL:[53,-59],NS:[45,-63],NT:[65,-120],NU:[68,-95],ON:[50,-85],PE:[46.4,-63.2],QC:[53,-71],SK:[54,-106],YT:[64,-136]};
 let elevationRequest=0,elevationController;
 let map,pin,stations,request=0,controller,townRequest=0,townController,town;
 const valid=(a,b)=>a!==''&&b!==''&&a!=null&&b!=null&&Number.isFinite(+a)&&Number.isFinite(+b)&&Math.abs(+a)<=90&&Math.abs(+b)<=180;
 const pinned=()=>valid(v('latitude'),v('longitude'));
 function regionView(){const center=regionCenters[v('state')];if(map)map.setView(center|| (v('country').toLowerCase()==='canada'?[56,-106]:[39,-98]),center?(['AK','NT','NU','QC','ON','BC'].includes(v('state'))?5:6):4);}
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
  stations=L.layerGroup().addTo(map);L.control.scale({metric:false,imperial:true}).addTo(map);
  map.on('click',e=>select(e.latlng));renderPin();return true;
 }
 function elevationText(){
  const point=v('latitude')+','+v('longitude');
  if(pinned()&&v('objectiveElevationPoint')===point&&v('objectiveElevation')!==''&&Number.isFinite(+v('objectiveElevation')))return 'Map elevation: '+Math.round(+v('objectiveElevation')*3.280839895).toLocaleString()+' ft (USGS terrain estimate)\n'+v('objectiveElevationSource');
  return v('objectiveElevationStatus')||'Pin an objective to retrieve terrain elevation.';
 }
 function reportPoint(){
  $('mapPointReport').value=pinned()?'Objective pin: '+v('latitude')+', '+v('longitude')+'\nNWS point forecast: https://forecast.weather.gov/MapClick.php?lat='+v('latitude')+'&lon='+v('longitude')+'\n'+elevationText():'';
  $('mapElevation').textContent=elevationText();
 }
 
 function resetElevation(){
  ++elevationRequest;elevationController?.abort();
  for(const id of ['objectiveElevation','objectiveElevationPoint','objectiveElevationSource'])$(id).value='';
  $('objectiveElevationStatus').value=pinned()?'Retrieving map elevation…':'';
 }
 async function getElevation(){
  resetElevation();reportPoint();notify('mapPointReport');const token=elevationRequest;if(!pinned())return;
  elevationController=new AbortController();
  try{
   const r=await fetch('/api/map-elevation?'+new URLSearchParams({lat:v('latitude'),lon:v('longitude')}),{signal:elevationController.signal}),d=await r.json();
   if(token!==elevationRequest)return;if(!r.ok)throw Error(d.error||'Map elevation unavailable.');
   if(!Number.isFinite(d.elevationM))throw Error('Map elevation unavailable.');
   $('objectiveElevation').value=String(d.elevationM);$('objectiveElevationPoint').value=v('latitude')+','+v('longitude');$('objectiveElevationSource').value=d.source+'\n'+d.url;$('objectiveElevationStatus').value='Terrain elevation retrieved from map data.';
  }catch(e){if(e.name!=='AbortError'&&token===elevationRequest)$('objectiveElevationStatus').value=e.message;}
  finally{if(token===elevationRequest){reportPoint();for(const id of ['objectiveElevation','objectiveElevationPoint','objectiveElevationSource','objectiveElevationStatus','mapPointReport'])notify(id);}}
 }

 function select(point){
  $('latitude').value=point.lat.toFixed(5);$('longitude').value=(((point.lng+180)%360+360)%360-180).toFixed(5);
  $('forecastMode').value='Automatic Data';$('autoWeatherReview').value='';$('autoAvReview').value='';
  getElevation();renderPin();notify('forecastMode');notify('latitude');notify('longitude');notify('mapPointReport');
  status('Objective pinned at '+v('latitude')+', '+v('longitude')+'. Forecasts update in the Plan tab; review conditions for your route.');getStations();
 }
 function clearPin(){
  ++request;controller?.abort();$('latitude').value='';$('longitude').value='';resetElevation();$('weatherStationReport').value='';$('mapStations').textContent='Pin the objective to retrieve nearby NWS stations.';stations?.clearLayers();renderPin();reportPoint();notify('latitude');notify('longitude');notify('mapPointReport');notify('weatherStationReport');
 }
 function stationText(s){
  const age=s.timestamp?(Date.now()-Date.parse(s.timestamp))/3600000:Infinity;
  return s.name+' ('+s.id+') — '+(s.distanceKm*0.621371192).toFixed(1)+' mi; elevation '+(s.elevationM==null?'unknown':Math.round(s.elevationM*3.280839895)+' ft')+'\nObserved: '+(s.timestamp||'Unavailable')+(age>3?' • OLD / UNAVAILABLE':'')+'\n'+(s.description||'')+'; temperature '+(s.temperatureC==null?'unavailable':(s.temperatureC*9/5+32).toFixed(1)+' °F')+'; wind '+(window.mopStandardizeUnits(s.wind||'unavailable'))+'\n'+s.url;
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
  if(!code||!v('state')||!v('city')){status('Select country, state / province and town, then pin the mountain.');regionView();return;}
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
 function setup(){standardReports();
  document.addEventListener('mop-map-open',()=>{if(init()){if(pinned()&&!v('weatherStationReport'))getStations();else if(!pinned())centerTown(false);}});
  document.addEventListener('mop-town-selected',()=>centerTown(true));
  for(const id of ['country','state'])$(id).addEventListener('change',e=>{if(e.isTrusted){++townRequest;townController?.abort();town=null;clearPin();regionView();status('Select a town to center the map, then pin the objective.');}});
  for(const id of ['locationManualCity','locationManualState']){$(id).addEventListener('input',()=>{town=null;clearPin();status('Manual location updated. Locate and pin the objective on the map.');});$(id).addEventListener('change',()=>centerTown(false));}
  $('city').addEventListener('change',e=>{if(e.isTrusted&&!v('city')){town=null;clearPin();}});
  $('country').addEventListener('input',e=>{if(e.isTrusted){town=null;clearPin();}});
  $('mapCenterTown').onclick=()=>{centerTown(false).then(()=>{if(town&&map)map.setView([town.latitude,town.longitude],11);});};
  $('mapCenterPin').onclick=()=>{if(pinned()&&map)map.setView([+v('latitude'),+v('longitude')],13);else status('Tap the map to select a forecast point first.');};
  $('mapPinCenter').onclick=()=>{if(map)select(map.getCenter());};
  document.addEventListener('change',e=>{if(e.target?.id==='env'){standardReports();++townRequest;townController?.abort();town=null;++request;controller?.abort();stations?.clearLayers();reportPoint();renderPin();$('mapStations').textContent=v('weatherStationReport')||'Pin an objective for station observations.';getElevation();if(pinned()&&map){map.setView([+v('latitude'),+v('longitude')],12);getStations();}else centerTown(false);}});
  getElevation();if(!pinned())centerTown(false);if(!$('map').classList.contains('hide'))init();$('map').dataset.ready='true';
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1100));
})();
