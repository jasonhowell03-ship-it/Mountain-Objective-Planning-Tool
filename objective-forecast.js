/* Forecast provenance and date coverage are shared by the matrix and PDF. */
(()=>{
 const $=id=>document.getElementById(id),v=id=>$(id)?.value||'',put=(id,value)=>{if($(id))$(id).value=value||'';};
 const snow=()=>['Snow / Glacier','Ski Tour','Ski Mountaineering','Ice Climb','Mountain Expedition','Mixed Climb / Other'].includes(v('env'));
 function snowUI(){document.querySelectorAll('.snowForecast').forEach(e=>e.classList.toggle('hide',!snow()||(e.dataset.forecastMode&&e.dataset.forecastMode!==v('forecastMode'))));}
 const coords=()=>[v('latitude'),v('longitude')].join(',');
 const validCoords=()=>v('latitude').trim()!==''&&v('longitude').trim()!==''&&Number.isFinite(+v('latitude'))&&Number.isFinite(+v('longitude'))&&Math.abs(+v('latitude'))<=90&&Math.abs(+v('longitude'))<=180;
 const day=iso=>String(iso||'').slice(0,10),endDay=iso=>{if(!iso)return '';if(iso.slice(11,19)==='00:00:00'||iso.slice(11)==='00:00'){const d=new Date(day(iso)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}return day(iso);};
 function covers(start,end,startDay,endDayValue){const from=v('sd'),to=v('ed')||from,now=Date.now();if(!from||to<from)return 'Enter valid objective dates';if(!start||!end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))return 'Forecast validity dates required';if(Date.parse(end)<=now)return 'Forecast expired';if(Date.parse(start)>Date.parse(end))return 'Invalid forecast validity dates';if(from<startDay||to>endDayValue)return 'Forecast does not cover objective dates';return '';}
 window.mopForecastEligibility=function(key){
  if(key==='avalanche'&&!snow())return {complete:false,why:'Not applicable to Rock / Alpine'};
  if(!['weatherRisk','avalanche'].includes(key))return {complete:true};
  const wx=key==='weatherRisk',prefix=wx?'forecastWeather':'forecastAv';let reason='';
  if(v(wx?'manualWeatherBasis':'manualAvalancheBasis')!=='Verified forecast for objective dates')reason='Planning assumptions / awaiting verified forecast';
  else if(!v(wx?'weatherlink':'manualAvLink'))reason='Forecast source link required';
  else {const start=v(wx?'weatherdate':'manualAvStart'),end=v(wx?'weathervalid':'manualAvEnd');reason=covers(start,end,day(start),endDay(end));}
  if(!reason&&!wx&&(!v('av_danger')||v('av_danger').startsWith('No current')))reason='Current avalanche danger rating required';
  return{complete:!reason,why:reason||'Verified forecast covers objective dates; review exact timing and elevation.'};
 };
 const emit=()=>$('forecastMode').dispatchEvent(new Event('change',{bubbles:true}));
 function status(){for(const [key,id] of [['weatherRisk','forecastWeatherStatus'],['avalanche','forecastAvStatus']]){const r=window.mopForecastEligibility(key);put(id,r.complete?'Verified for objective dates':r.why);$(id).style.backgroundColor=r.complete?'#e7f1e9':'#60717a';$(id).style.color=r.complete?'#17374d':'#fff';}}
 function modeUI(){put('forecastMode','Manual Input');snowUI();status();}
 const avalancheCenters=[["CO","Colorado",[["Colorado Avalanche Information Center","https://avalanche.state.co.us/"],["Crested Butte Avalanche Center","https://cbavalanchecenter.org/"]]],["CA","California",[["Sierra Avalanche Center","https://www.sierraavalanchecenter.org/"],["Eastern Sierra Avalanche Center","https://www.esavalanche.org/"],["Mount Shasta Avalanche Center","https://www.shastaavalanche.org/"],["Bridgeport Avalanche Center","https://bridgeportavalanchecenter.org/"]]],["OR","Oregon",[["Northwest Avalanche Center (Mt. Hood / northern Oregon)","https://nwac.us/"],["Central Oregon Avalanche Center","https://coavalanche.org/"],["Wallowa Avalanche Center","https://wallowaavalanchecenter.org/"]]],["WA","Washington",[["Northwest Avalanche Center","https://nwac.us/"],["Idaho Panhandle Avalanche Center (eastern Washington)","https://www.idahopanhandleavalanche.org/"]]],["ID","Idaho",[["Sawtooth Avalanche Center","https://www.sawtoothavalanche.com/"],["Payette Avalanche Center","https://payetteavalanche.org/"],["Idaho Panhandle Avalanche Center","https://www.idahopanhandleavalanche.org/"]]],["AK","Alaska",[["Chugach Avalanche Center","https://www.cnfaic.org/"],["Hatcher Pass Avalanche Center","https://hpavalanche.org/"],["Valdez Avalanche Center","https://alaskasnow.org/valdez/"],["Haines Avalanche Center","https://alaskasnow.org/haines/"],["Cordova Avalanche Center — observations / resources","https://alaskasnow.org/cordova/"],["Eastern Alaska Range Avalanche Center — snowpack / observations","https://alaskasnow.org/eastern-ak-range/"],["Alaska Avalanche Information Center — regional directory","https://alaskasnow.org/"]]],["MT","Montana",[["Gallatin National Forest Avalanche Center","https://www.mtavalanche.com/"],["Flathead Avalanche Center","https://www.flatheadavalanche.org/"],["West Central Montana / Missoula Avalanche","https://missoulaavalanche.org/"],["Idaho Panhandle Avalanche Center (western Montana)","https://www.idahopanhandleavalanche.org/"]]],["BC","British Columbia",[["Avalanche Canada — forecast map","https://avalanche.ca/map"]]],["WY","Wyoming",[["Bridger-Teton Avalanche Center","https://bridgertetonavalanchecenter.org/"],["Eastern Wyoming Avalanche Information Exchange","https://ewyoavalanche.org/"]]]];
 function avalancheSources(){
  const card=$('avalancheCard');if(!card)return;
  let block=$('avForecastCenters');
  if(!block){
   block=document.createElement('div');block.id='avForecastCenters';block.style.cssText='padding:12px;background:#edf3f6;border-radius:8px;margin:10px 0';
   const heading=document.createElement('h4');heading.textContent='Official Avalanche Forecast Centers';heading.style.margin='0 0 8px';block.append(heading);
   const hint=document.createElement('p');hint.className='small';hint.textContent='Choose the exact forecast zone on the center’s map. These links are source references; opening them does not fill risk criteria. U.S. Automatic Data uses coordinate-matched Avalanche.org zones. BC: use Manual Input until the Avalanche Canada feed is connected.';block.append(hint);
   const list=document.createElement('div');list.id='avForecastCenterList';block.append(list);
   const links=document.createElement('textarea');links.id='av_forecastSources';links.readOnly=true;links.style.display='none';block.append(links);
   card.querySelector('.mopSoWhat')?.after(block);
  }
  const state=v('state').trim().toUpperCase(),match=avalancheCenters.find(([code,name])=>code===state||name.toUpperCase()===state);
  const ordered=[...avalancheCenters].sort((a,b)=>Number(b===match)-Number(a===match));
  const list=$('avForecastCenterList');list.replaceChildren();
  for(const [code,name,sources] of ordered){
   const detail=document.createElement('details');detail.style.cssText='padding:8px 0;border-top:1px solid #cbd8df';detail.open=code===match?.[0];
   const summary=document.createElement('summary');summary.textContent=code+' — '+name+(code===match?.[0]?' (objective state/province)':'');summary.style.cssText='cursor:pointer;font-weight:700;font-size:13px';detail.append(summary);
   for(const [label,url] of sources){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';a.style.cssText='display:block;padding:8px 0;color:#176d9c;font-size:13px';detail.append(a);}
   list.append(detail);
  }
  put('av_forecastSources',ordered.map(([code,name,sources])=>code+' — '+name+'\n'+sources.map(([label,url])=>label+': '+url).join('\n')).join('\n\n'));
 }

 const activityWeather={
  'Rock / Alpine':{base:'Rock / alpine: match the weather window to the approach, exposed pitches, ridge and rappels. Rain or verglas can reduce friction; wind affects balance and rope handling. Set a retreat time before exposed terrain becomes difficult to escape.',wet:'Wet rock may compromise friction on the crux and descent. Review a dry alternative or postpone exposed climbing.',frozen:'Snow or verglas may change a rock route into a technical winter objective. Reassess protection, traction and rappel access.',cold:'Cold reduces hand dexterity for climbing, belaying and rappelling. Review glove changes, pace and retreat margin.'},
  'Snow / Glacier':{base:'Snow / glacier: match freezing, warming and visibility to snow travel, crevasse crossings and descent. Reassess snow bridges and travel pace; maintain navigation and rope-team options for reduced visibility.',wet:'Rain or warming may weaken snow bridges and increase wet-snow concerns. Reassess crossing timing and retreat.',frozen:'New snow may conceal crevasses or tracks; wind can change loading and navigation. Check the avalanche bulletin for snow-covered slopes.',cold:'Cold can slow rope-team transitions and affect gloves, hydration and rescue endurance.'},
  'Ski Tour':{base:'Ski tour: assess new snow, wind loading, visibility and temperature changes along the uptrack and ski descent. Use the separate avalanche bulletin to select terrain; keep a lower-angle return option and realistic turnaround margin.',wet:'Rain or warming may change snow support and wet-snow instability. Reassess descent timing and terrain.',frozen:'New snow, wind transport or crust may change avalanche exposure and ski control. Match slope choices to the local bulletin and team ability.',cold:'Cold affects skins, bindings, transitions and recovery. Review spare gloves, shelter and turnaround timing.'},
  'Ice Climb':{base:'Ice climb: assess warming, rain, cold and wind against ice quality, falling ice, belay exposure and descent. Reassess screws, anchors and ice bonding on arrival; account for spindrift and slow transitions.',wet:'Rain or warming can change ice bonding, water flow and falling-ice exposure. Reassess whether the climb and descent remain viable.',frozen:'Snow and wind may increase spindrift, hide anchors and load overhead slopes. Assess the approach and overhead avalanche terrain separately.',cold:'Cold may increase ice brittleness and reduce dexterity at screws, belays and rappels. Review glove changes and transition pace.'},
  'Ski Mountaineering':{base:'Ski mountaineering: match the weather window to exposed bootpacks, technical transitions, summit terrain and steep descent. Reassess wind loading, surface changes and ski control; preserve a viable retreat before commitment.',wet:'Rain or warming may change steep-snow stability and descent support. Reassess entry timing and bailout options.',frozen:'New snow, wind loading or hard surfaces may change the steep line and bootpack. Check avalanche problems, traction and descent ability.',cold:'Cold slows crampon, rope and ski transitions. Add time and glove margin before committing to exposed terrain.'},
  'Mountain Expedition':{base:'Mountain expedition: match the weather window to acclimatization, carries, camp exposure, summit travel and retreat. Consider storm duration, cold, wind and resupply limits; preserve shelter and descent options before advancing camps.',wet:'Precipitation may degrade camp protection, route surfaces and load-carry pace. Reassess camp security and movement windows.',frozen:'New snow or prolonged storms may affect fixed lines, navigation, camp loading and escape. Reassess avalanche terrain separately.',cold:'Cold increases exposure during carries, camp tasks and summit travel. Review protection, shelter and retreat endurance.'},
  'Mixed Climb / Other':{base:'Mixed climb / other: match conditions to the actual rock, ice and steep-snow sections. Reassess verglas, ice bonding, protection and snow loading at transitions; allow time for equipment changes and retreat.',wet:'Rain or warming may change both rock friction and ice bonding. Reassess the crux, protection and descent.',frozen:'New snow, verglas or wind loading may change mixed moves, anchors and steep-snow exposure. Check the local avalanche bulletin where applicable.',cold:'Cold reduces dexterity during tool, rope and traction changes. Review gloves, transition time and retreat margin.'}
 };
 const activity=()=>activityWeather[v('env')]||activityWeather['Mixed Climb / Other'];
 function updateActivityImpact(){const p=$('riskCard_weatherRisk')?.querySelector('.mopSoWhat p');if(p)p.textContent=activity().base;}
 function joinWeather(){
  const host=$('joinedWeatherMatrix'),matrix=$('riskCard_weatherRisk');if(host&&matrix&&!host.contains(matrix)){matrix.classList.remove('card');matrix.style.cssText='border-top:1px solid #bccbd2;margin-top:14px;padding-top:10px';host.append(matrix);}
  const av=$('avalancheCard');if(av&&!$('joinedAvalancheData')){
   const block=document.createElement('div');block.id='joinedAvalancheData';
   for(const e of [...document.querySelectorAll('#forecastInputs .snowForecast')]){
    if(e.closest('#forecastAutoPanel'))e.dataset.forecastMode='Automatic Data';else if(e.closest('#forecastManualPanel'))e.dataset.forecastMode='Manual Input';block.append(e);
   }
   av.querySelector('h3')?.after(block);
  }
  updateActivityImpact();
 }

 function setup(){
  joinWeather();modeUI();avalancheSources();
  document.addEventListener('change',e=>{
   if(['forecastMode','env'].includes(e.target?.id)){joinWeather();modeUI();}
   if(['state','country','env'].includes(e.target?.id))avalancheSources();
   status();
  });
  document.addEventListener('input',e=>{if(['state','country'].includes(e.target?.id))avalancheSources();status();});
  setInterval(()=>{status();emit();},60000);
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,750));
})();
