/* Forecast provenance and date coverage are shared by the matrix and PDF. */
(()=>{
 const $=id=>document.getElementById(id),v=id=>$(id)?.value||'',put=(id,value)=>{if($(id))$(id).value=value||'';};
 const coords=()=>[v('latitude'),v('longitude')].join(',');
 const validCoords=()=>v('latitude').trim()!==''&&v('longitude').trim()!==''&&Number.isFinite(+v('latitude'))&&Number.isFinite(+v('longitude'))&&Math.abs(+v('latitude'))<=90&&Math.abs(+v('longitude'))<=180;
 const day=iso=>String(iso||'').slice(0,10),endDay=iso=>{if(!iso)return '';if(iso.slice(11,19)==='00:00:00'||iso.slice(11)==='00:00'){const d=new Date(day(iso)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}return day(iso);};
 function covers(start,end,startDay,endDayValue){const from=v('sd'),to=v('ed')||from,now=Date.now();if(!from||to<from)return 'Enter valid objective dates';if(!start||!end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))return 'Forecast validity dates required';if(Date.parse(end)<=now)return 'Forecast expired';if(Date.parse(start)>Date.parse(end))return 'Invalid forecast validity dates';if(from<startDay||to>endDayValue)return 'Forecast does not cover objective dates';return '';}
 window.mopForecastEligibility=function(key){
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
 function modeUI(){if(!['Automatic Data','Manual Input'].includes(v('forecastMode')))put('forecastMode','Manual Input');const automatic=v('forecastMode')==='Automatic Data';for(const [suffix,active] of [['Auto',automatic],['Manual',!automatic]]){const b=$('forecast'+suffix+'Tab');b.setAttribute('aria-selected',String(active));b.className=active?'btn':'btn secondary';$('forecast'+suffix+'Panel').classList.toggle('hide',!active);}providerLinks();status();}

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

 function providerLinks(){const box=$('forecastProviderLinks');box.replaceChildren();if(!validCoords())return;for(const [name,url] of [['NWS','https://forecast.weather.gov/MapClick.php?lat='+v('latitude')+'&lon='+v('longitude')],['Windy','https://www.windy.com/?'+v('latitude')+','+v('longitude')+',8'],['meteoblue','https://www.meteoblue.com/en/weather/week/'+Math.abs(+v('latitude'))+(+v('latitude')<0?'S':'N')+Math.abs(+v('longitude'))+(+v('longitude')<0?'W':'E')],['Avalanche centers','https://avalanche.org/']]){const a=document.createElement('a');a.textContent=name;a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.marginRight='12px';box.append(a);}}
 let request=0,controller,timer;
 async function refresh(){
  if(v('forecastMode')!=='Automatic Data')return;
  const serial=++request;controller?.abort();controller=new AbortController();
  put('forecastCoordinates','');put('autoWeatherReview','');put('autoAvReview','');
  for(const prefix of ['forecastWeather','forecastAv'])for(const suffix of ['Start','End','StartDay','EndDay'])put(prefix+suffix,'');
  status();emit();if(!validCoords()){put('forecastWeatherReport','Pin the objective on the Map tab to retrieve U.S. forecasts.');put('forecastAvReport','Pin the objective on the Map tab to find the local forecast zone.');return;}
  put('forecastWeatherReport','Retrieving NWS forecast…');put('forecastAvReport','Retrieving local avalanche zone…');$('forecastRefresh').disabled=true;
  try{
   const r=await fetch('/api/objective-forecast?lat='+encodeURIComponent(v('latitude'))+'&lon='+encodeURIComponent(v('longitude')),{signal:controller.signal});if(!r.ok)throw new Error('Forecast service unavailable. Use Manual Input.');const data=await r.json();if(serial!==request)return;put('forecastCoordinates',coords());
   const w=data.weather;if(w&&!w.error){put('forecastWeatherStart',w.start);put('forecastWeatherEnd',w.end);put('forecastWeatherStartDay',w.startDay);put('forecastWeatherEndDay',endDay(w.end));put('weatherlink',w.url);const localTime=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';};put('weatherdate',localTime(w.retrieved));put('weathervalid',localTime(w.end));put('forecastWeatherReport',w.source+'\n'+w.url+'\nRetrieved: '+w.retrieved+'\nIssued: '+(w.issued||'Unknown')+'\nValid: '+w.start+' to '+w.end+'\n'+w.periods.map(p=>p.name+' ('+p.start+' to '+p.end+'): '+p.temperature+'°'+p.unit+'; wind '+p.direction+' '+p.wind+' — '+p.forecast).join('\n'));}else put('forecastWeatherReport',w?.error||'Weather data unavailable');
   const a=data.avalanche;if(a&&!a.error){const validDanger=Number.isInteger(a.danger)&&a.danger>=1&&a.danger<=5;put('forecastAvReport',a.source+'\nZone: '+a.zone+'\n'+a.url+'\nRetrieved: '+a.retrieved+'\nValid: '+(a.start||'Unknown')+' to '+(a.end||'Unknown')+'\nDanger: '+(validDanger?a.danger+' — '+a.dangerText:'No current danger rating')+'\n'+(a.advice||'')+'\n'+(a.warning?'Warning: '+JSON.stringify(a.warning):'')+'\nZone summary only. Open the local bulletin for problem, aspect, elevation, likelihood and size.');if(validDanger){put('forecastAvStart',a.start);put('forecastAvEnd',a.end);put('forecastAvStartDay',a.startDay);put('forecastAvEndDay',a.endDay);const danger=$('av_danger');if(danger){danger.value=[...danger.options].find(o=>o.value.includes('('+a.danger+')'))?.value||'';danger.dispatchEvent(new Event('change',{bubbles:true}));}}else put('av_danger','');}else{put('forecastAvReport',a?.error||'Avalanche data unavailable');put('av_danger','');}
  }catch(e){if(e.name!=='AbortError'&&serial===request){put('forecastWeatherReport',e.message);put('forecastAvReport',e.message);}}
  finally{if(serial===request){$('forecastRefresh').disabled=false;status();emit();}}
 }
 function setup(){
  $('forecastAutoTab').onclick=()=>{put('forecastMode','Automatic Data');modeUI();emit();refresh();};
  $('forecastManualTab').onclick=()=>{++request;controller?.abort();$('forecastRefresh').disabled=false;put('forecastMode','Manual Input');modeUI();emit();};
  $('forecastRefresh').onclick=refresh;
  document.addEventListener('change',e=>{if(['forecastMode','env'].includes(e.target?.id))modeUI();if(['state','country','env'].includes(e.target?.id))avalancheSources();status();if(['latitude','longitude','sd','ed','env'].includes(e.target?.id)){++request;controller?.abort();$('forecastRefresh').disabled=false;providerLinks();clearTimeout(timer);timer=setTimeout(refresh,600);}});
  document.addEventListener('input',e=>{if(['state','country'].includes(e.target?.id))avalancheSources();status();if(['latitude','longitude','sd','ed','env'].includes(e.target?.id)){++request;controller?.abort();providerLinks();clearTimeout(timer);timer=setTimeout(refresh,1000);}});
  avalancheSources();modeUI();emit();if(v('forecastMode')==='Automatic Data')refresh();
  setInterval(()=>{status();emit();},60000);
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,750));
})();
