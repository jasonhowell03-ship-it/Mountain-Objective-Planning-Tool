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
  if(v('forecastMode')==='Automatic Data'){
   if(!validCoords()||v('forecastCoordinates')!==coords())reason='Refresh forecasts for objective coordinates';
   else reason=covers(v(prefix+'Start'),v(prefix+'End'),v(prefix+'StartDay'),v(prefix+'EndDay'));
   if(!reason&&v(wx?'autoWeatherReview':'autoAvReview')!=='Reviewed for this objective')reason='Review source data and route-specific criteria';
  }else{
   if(v(wx?'manualWeatherBasis':'manualAvalancheBasis')!=='Verified forecast for objective dates')reason='Planning assumptions / awaiting verified forecast';
   else if(!v(wx?'weatherlink':'manualAvLink'))reason='Forecast source link required';
   else {const start=v(wx?'weatherdate':'manualAvStart'),end=v(wx?'weathervalid':'manualAvEnd');reason=covers(start,end,day(start),endDay(end));}
  }
  if(!reason&&!wx&&(!v('av_danger')||v('av_danger').startsWith('No current')))reason='Current avalanche danger rating required';
  return{complete:!reason,why:reason||'Verified forecast covers objective dates; review exact timing and elevation.'};
 };
 const emit=()=>$('forecastMode').dispatchEvent(new Event('change',{bubbles:true}));
 function status(){for(const [key,id] of [['weatherRisk','forecastWeatherStatus'],['avalanche','forecastAvStatus']]){const r=window.mopForecastEligibility(key);put(id,r.complete?'Verified for objective dates':r.why);$(id).style.backgroundColor=r.complete?'#e7f1e9':'#60717a';$(id).style.color=r.complete?'#17374d':'#fff';}}
 function modeUI(){snowUI();if(!['Automatic Data','Manual Input'].includes(v('forecastMode')))put('forecastMode','Manual Input');const automatic=v('forecastMode')==='Automatic Data';for(const [suffix,active] of [['Auto',automatic],['Manual',!automatic]]){const b=$('forecast'+suffix+'Tab');b.setAttribute('aria-selected',String(active));b.className=active?'btn':'btn secondary';$('forecast'+suffix+'Panel').classList.toggle('hide',!active);}providerLinks();status();}

 const avalancheCenters=[["CO","Colorado",[["Colorado Avalanche Information Center","https://avalanche.state.co.us/"],["Crested Butte Avalanche Center","https://cbavalanchecenter.org/"]]],["CA","California",[["Sierra Avalanche Center","https://www.sierraavalanchecenter.org/"],["Eastern Sierra Avalanche Center","https://www.esavalanche.org/"],["Mount Shasta Avalanche Center","https://www.shastaavalanche.org/"],["Bridgeport Avalanche Center","https://bridgeportavalanchecenter.org/"]]],["OR","Oregon",[["Northwest Avalanche Center (Mt. Hood / northern Oregon)","https://nwac.us/"],["Central Oregon Avalanche Center","https://coavalanche.org/"],["Wallowa Avalanche Center","https://wallowaavalanchecenter.org/"]]],["WA","Washington",[["Northwest Avalanche Center","https://nwac.us/"],["Idaho Panhandle Avalanche Center (eastern Washington)","https://www.idahopanhandleavalanche.org/"]]],["AK","Alaska",[["Chugach Avalanche Center","https://www.cnfaic.org/"],["Hatcher Pass Avalanche Center","https://hpavalanche.org/"],["Alaska Avalanche Information Center (regional centers)","https://alaskasnow.org/"]]],["MT","Montana",[["Gallatin National Forest Avalanche Center","https://www.mtavalanche.com/"],["Flathead Avalanche Center","https://www.flatheadavalanche.org/"],["West Central Montana / Missoula Avalanche","https://missoulaavalanche.org/"],["Idaho Panhandle Avalanche Center (western Montana)","https://www.idahopanhandleavalanche.org/"]]],["BC","British Columbia",[["Avalanche Canada — forecast map","https://avalanche.ca/map"]]],["WY","Wyoming",[["Bridger-Teton Avalanche Center","https://bridgertetonavalanchecenter.org/"],["Eastern Wyoming Avalanche Information Exchange","https://ewyoavalanche.org/"]]]];
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

 function providerLinks(){const box=$('forecastProviderLinks');box.replaceChildren();if(!validCoords())return;for(const [name,url] of [['NWS','https://forecast.weather.gov/MapClick.php?lat='+v('latitude')+'&lon='+v('longitude')],['Windy','https://www.windy.com/?'+v('latitude')+','+v('longitude')+',8'],['meteoblue','https://www.meteoblue.com/en/weather/week/'+Math.abs(+v('latitude'))+(+v('latitude')<0?'S':'N')+Math.abs(+v('longitude'))+(+v('longitude')<0?'W':'E')],['Avalanche centers','https://avalanche.org/']]){if(name==='Avalanche centers'&&!snow())continue;const a=document.createElement('a');a.textContent=name;a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.marginRight='12px';box.append(a);}}


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

 function preserveWeatherNotes(){
  const prior=v('weather').trim(),notes=v('weatherTeamNotes').trim();
  if(prior&&!prior.startsWith('AUTO WEATHER BRIEF')&&!notes.includes(prior))put('weatherTeamNotes',[notes,prior].filter(Boolean).join('\n\n'));
 }
 function clearWeatherBlock(message){
  preserveWeatherNotes();for(const id of ['weatherdate','weathervalid','weatherlink'])put(id,'');
  put('trend','Uncertain');put('light','Lightning: Unknown / unavailable');put('weather','AUTO WEATHER BRIEF — '+message+'\nReview required before completing the weather matrix.');
  put('weatherlinks',v('weatherlinks').split('\n').filter(line=>!line.startsWith('AUTO SOURCE — ')).join('\n').trim());
 }
 function buildWeatherBlock(w){
  preserveWeatherNotes();
  const from=v('sd'),to=v('ed')||from,periods=(w.periods||[]).filter(p=>!from||(day(p.start)<=to&&endDay(p.end)>=from));
  const coverage=covers(w.start,w.end,day(w.start),endDay(w.end));
  const header=['AUTO WEATHER BRIEF — '+v('env')+' / NWS point forecast','Objective: '+(v('name')||v('loc')||'Map pin')+' • '+coords(),'Objective dates: '+(from?[from,to].join(' to '):'Not selected'),'Source: '+w.url,'Issued: '+(w.issued||'Unknown')+' • Retrieved: '+w.retrieved,'Forecast valid: '+w.start+' to '+w.end];
  if(!periods.length||to<from){put('trend','Uncertain');put('light','Lightning: Unknown / unavailable');put('weather',header.concat(['COVERAGE GAP: '+(coverage||'No forecast periods overlap objective dates.'),'SO WHAT: '+activity().base+' No trip-specific forecast is available yet; reassess when dates enter coverage. Weather matrix remains Incomplete.']).join('\n'));return;}
  const temp=p=>typeof p.temperature==='number'&&Number.isFinite(p.temperature)?(p.unit==='C'?p.temperature*1.8+32:p.temperature):null;
  const wind=p=>{const numbers=window.mopStandardizeUnits(p.wind||'').match(/\d+(?:\.\d+)?/g);return numbers?Math.max(...numbers.map(Number)):null;};
  const text=p=>String(p.forecast||'').toLowerCase();
  const thunder=periods.filter(p=>/thunder|lightning/.test(text(p))),rain=periods.filter(p=>/rain|showers/.test(text(p))),snowPeriods=periods.filter(p=>/snow|sleet|freezing rain|ice pellets/.test(text(p))),visibility=periods.filter(p=>/fog|blizzard|visibility/.test(text(p)));
  const temps=periods.map(temp).filter(n=>n!==null),winds=periods.map(wind).filter(n=>n!==null);
  const lightning=thunder.length?(thunder.some(p=>/likely|definite|thunderstorms\./.test(text(p))&&!/slight chance|chance of|isolated|possible/.test(text(p)))?'Lightning: Likely':'Lightning: Possible'):'Lightning: Low';
  put('light',lightning);
  const severity=p=>{const t=temp(p),ws=wind(p),desc=text(p);return (ws==null?0:ws>=40?2:ws>=25?1:0)+(t==null?0:t<=0?2:t<=20?1:0)+(/thunder|lightning/.test(desc)?2:0)+(/snow|rain|showers/.test(desc)?1:0)+(/freezing rain|blizzard/.test(desc)?2:0);};
  const daily=new Map();for(const p of periods){const date=day(p.start);daily.set(date,Math.max(daily.get(date)||0,severity(p)));}
  const scores=[...daily.values()],first=scores[0],last=scores.at(-1);
  const trend=periods.some(p=>temp(p)===null||wind(p)===null)||scores.length<2?'Uncertain':scores.every(s=>s===first)?'Stable':last>first&&scores.every((s,i)=>!i||s>=scores[i-1])?'Deteriorating':last<first&&scores.every((s,i)=>!i||s<=scores[i-1])?'Improving':'Uncertain';
  put('trend',trend);
  const brief=header.concat(coverage?['COVERAGE GAP: '+coverage+'. Summary covers available overlapping periods only; weather matrix remains Incomplete.']:['Coverage: forecast overlaps selected objective dates; review exact hours and elevation.']);
  brief.push('Conditions: '+(temps.length?Math.round(Math.min(...temps))+' to '+Math.round(Math.max(...temps))+' °F':'Temperature unavailable')+'; '+(winds.length?'forecast wind up to '+Math.round(Math.max(...winds))+' mph':'Wind unavailable')+'. Gusts may exceed listed wind speeds.');
  brief.push('Trend estimate: '+trend+' • Lightning flag: '+lightning.replace('Lightning: ','')+'. These are automated screening estimates from forecast text, wind and temperature; confirm against the bulletin.');
  brief.push('Planning periods:');
  const summaries=new Map();for(const p of periods){const date=from&&day(p.start)<from?from:day(p.start);if(!summaries.has(date))summaries.set(date,[]);summaries.get(date).push(p);}
  for(const [date,rows] of summaries){const ts=rows.map(temp).filter(n=>n!==null),ws=rows.map(wind).filter(n=>n!==null),signals=[];const desc=rows.map(text).join(' ');if(/thunder|lightning/.test(desc))signals.push('thunderstorms');if(/snow|sleet|freezing rain/.test(desc))signals.push('snow / frozen precipitation');else if(/rain|showers/.test(desc))signals.push('rain / showers');if(/fog|visibility|blizzard/.test(desc))signals.push('visibility concerns');brief.push(date+': '+(ts.length?Math.round(Math.min(...ts))+'–'+Math.round(Math.max(...ts))+' °F':'temperature unavailable')+'; '+(ws.length?'wind up to '+Math.round(Math.max(...ws))+' mph':'wind unavailable')+'; '+(signals.join(', ')||'no precipitation / thunder signal in forecast text')+'.');}
  brief.push('SO WHAT — '+v('env')+': '+activity().base);
  if(thunder.length)brief.push('Storm timing: '+thunder.map(p=>p.name).join(', ')+'. Leave exposed terrain before storm development; set a bail trigger for thunder.');
  else brief.push('Lightning: no thunderstorm mention in these periods; continue to reassess exposed travel.');
  if(winds.some(n=>n>=25))brief.push('Wind: reassess exposed movement, handling of ropes or skis, and cold exposure against team limits.');
  if(temps.some(n=>n<=32))brief.push(activity().cold);
  if(snowPeriods.length)brief.push(activity().frozen);else if(rain.length)brief.push(activity().wet);
  if(visibility.length)brief.push('Visibility: confirm offline navigation, rendezvous and retreat options for this activity.');
  brief.push('DECISION: confirm route elevation and critical hours; record team weather limits and bail time below. Review the weather matrix before marking Reviewed.');
  put('weather',brief.join('\n'));
  const refs=[...$('forecastProviderLinks').querySelectorAll('a')].filter(a=>a.textContent!=='Avalanche centers').map(a=>'AUTO SOURCE — '+a.textContent+': '+a.href);
  const retained=v('weatherlinks').split('\n').filter(line=>!line.startsWith('AUTO SOURCE — ')).join('\n').trim();put('weatherlinks',[retained,...refs].filter(Boolean).join('\n'));
 }

 let request=0,controller,timer;
 async function refresh(){
  if(v('forecastMode')!=='Automatic Data')return;
  const serial=++request;controller?.abort();controller=new AbortController();
  put('forecastCoordinates','');put('autoWeatherReview','');put('autoAvReview','');
  for(const prefix of ['forecastWeather','forecastAv'])for(const suffix of ['Start','End','StartDay','EndDay'])put(prefix+suffix,'');
  clearWeatherBlock('Awaiting updated forecast for the selected map point and dates.');status();emit();if(!validCoords()){put('forecastWeatherReport','Pin the objective on the Map tab to retrieve U.S. forecasts.');put('forecastAvReport','Pin the objective on the Map tab to find the local forecast zone.');return;}
  put('forecastWeatherReport','Retrieving NWS forecast…');put('forecastAvReport','Retrieving local avalanche zone…');$('forecastRefresh').disabled=true;
  try{
   const r=await fetch('/api/objective-forecast?lat='+encodeURIComponent(v('latitude'))+'&lon='+encodeURIComponent(v('longitude'))+'&avalanche='+(snow()?'1':'0'),{signal:controller.signal});if(!r.ok)throw new Error('Forecast service unavailable. Use Manual Input.');const data=await r.json();if(serial!==request)return;put('forecastCoordinates',coords());
   const w=data.weather;if(w&&!w.error){put('forecastWeatherStart',w.start);put('forecastWeatherEnd',w.end);put('forecastWeatherStartDay',w.startDay);put('forecastWeatherEndDay',endDay(w.end));put('weatherlink',w.url);const localTime=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';};put('weatherdate',localTime(w.retrieved));put('weathervalid',localTime(w.end));put('forecastWeatherReport',w.source+'\n'+w.url+'\nRetrieved: '+w.retrieved+'\nIssued: '+(w.issued||'Unknown')+'\nValid: '+w.start+' to '+w.end+'\n'+w.periods.map(p=>p.name+' ('+p.start+' to '+p.end+'): '+(p.temperature==null?'Unavailable':Math.round(p.unit==='C'?p.temperature*1.8+32:p.temperature))+'°F'+'; wind '+p.direction+' '+window.mopStandardizeUnits(p.wind)+' — '+window.mopStandardizeUnits(p.forecast)).join('\n'));buildWeatherBlock(w);}else {put('forecastWeatherReport',w?.error||'Weather data unavailable');clearWeatherBlock(w?.error||'Weather data unavailable');}
   if(snow()){const a=data.avalanche;if(a&&!a.error){const validDanger=Number.isInteger(a.danger)&&a.danger>=1&&a.danger<=5;put('forecastAvReport',a.source+'\nZone: '+a.zone+'\n'+a.url+'\nRetrieved: '+a.retrieved+'\nValid: '+(a.start||'Unknown')+' to '+(a.end||'Unknown')+'\nDanger: '+(validDanger?a.danger+' — '+a.dangerText:'No current danger rating')+'\n'+(a.advice||'')+'\n'+(a.warning?'Warning: '+JSON.stringify(a.warning):'')+'\nZone summary only. Open the local bulletin for problem, aspect, elevation, likelihood and size.');if(validDanger){put('forecastAvStart',a.start);put('forecastAvEnd',a.end);put('forecastAvStartDay',a.startDay);put('forecastAvEndDay',a.endDay);const danger=$('av_danger');if(danger){danger.value=[...danger.options].find(o=>o.value.includes('('+a.danger+')'))?.value||'';danger.dispatchEvent(new Event('change',{bubbles:true}));}}else put('av_danger','');}else{put('forecastAvReport',a?.error||'Avalanche data unavailable');put('av_danger','');}}
  }catch(e){if(e.name!=='AbortError'&&serial===request){put('forecastWeatherReport',e.message);put('forecastAvReport',e.message);clearWeatherBlock(e.message);}}
  finally{if(serial===request){$('forecastRefresh').disabled=false;status();emit();}}
 }
 function setup(){joinWeather();
  $('forecastAutoTab').onclick=()=>{put('forecastMode','Automatic Data');modeUI();emit();refresh();};
  $('forecastManualTab').onclick=()=>{++request;controller?.abort();$('forecastRefresh').disabled=false;put('forecastMode','Manual Input');modeUI();emit();};
  $('forecastRefresh').onclick=refresh;
  document.addEventListener('change',e=>{if(['forecastMode','env'].includes(e.target?.id)){joinWeather();modeUI();}if(['state','country','env'].includes(e.target?.id))avalancheSources();status();if(['latitude','longitude','sd','ed','env'].includes(e.target?.id)){++request;controller?.abort();$('forecastRefresh').disabled=false;providerLinks();clearTimeout(timer);timer=setTimeout(refresh,600);}});
  document.addEventListener('input',e=>{if(['state','country'].includes(e.target?.id))avalancheSources();status();if(['latitude','longitude','sd','ed','env'].includes(e.target?.id)){++request;controller?.abort();providerLinks();clearTimeout(timer);timer=setTimeout(refresh,1000);}});
  avalancheSources();modeUI();emit();if(v('forecastMode')==='Automatic Data')refresh();
  setInterval(()=>{status();emit();},60000);
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,750));
})();
