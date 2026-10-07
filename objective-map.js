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
 let elevationRequest=0,elevationController;
 let map,pin,stations;
 const valid=(a,b)=>a!==''&&b!==''&&a!=null&&b!=null&&Number.isFinite(+a)&&Number.isFinite(+b)&&Math.abs(+a)<=90&&Math.abs(+b)<=180;
 const pinned=()=>valid(v('latitude'),v('longitude'));
 const status=t=>{$('mapStatus').textContent=t;};
 const notify=id=>$(id)?.dispatchEvent(new Event('change',{bubbles:true}));
 function renderPin(){
  if(!map)return;if(pin){map.removeLayer(pin);pin=null;}
  if(!pinned())return;
  pin=L.marker([+v('latitude'),+v('longitude')],{draggable:true,icon:L.divIcon({className:'map-pin',html:'📍',iconSize:[32,36],iconAnchor:[16,34]}),title:'Objective forecast pin',alt:'Drag objective forecast pin'}).addTo(map);
  pin.on('dragend',()=>select(pin.getLatLng()));
 }
 function init(){
  if(map){map.invalidateSize();return true;}
  if(!window.L){status('Map library unavailable. Reload when connected; Manual Input remains available.');return false;}
  map=L.map('objectiveMap',{scrollWheelZoom:true}).setView(pinned()?[+v('latitude'),+v('longitude')]:[39,-105],pinned()?12:4);
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
  $('forecastMode').value='Manual Input';
  getElevation();renderPin();notify('forecastMode');notify('latitude');notify('longitude');notify('mapPointReport');
  status('Objective pinned at '+v('latitude')+', '+v('longitude')+'. Enter the forecast manually in the Plan tab.');
 }
 function setup(){standardReports();
  document.addEventListener('mop-map-open',()=>init());
  $('mapCenterPin').onclick=()=>{if(pinned()&&map)map.setView([+v('latitude'),+v('longitude')],13);else status('Tap the map to select an objective point first.');};
  $('mapPinCenter').onclick=()=>{if(map)select(map.getCenter());};
  document.addEventListener('change',e=>{if(e.target?.id==='env'){standardReports();reportPoint();renderPin();getElevation();if(pinned()&&map)map.setView([+v('latitude'),+v('longitude')],12);}});
  getElevation();if(!$('map').classList.contains('hide'))init();$('map').dataset.ready='true';
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,1100));
})();
