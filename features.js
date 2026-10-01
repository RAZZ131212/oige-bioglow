(() => {
  'use strict';

  const SUPABASE_URL = 'https://katkzrlbxrllspcgdxew.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_DF8nS5ZdH97_kTe32U_O1w_xZP8Qh52';
  const sb = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));

  const invasiveNames = [
    'sosnovski karuputk','heracleum sosnowskyi','hiid-karuputk','heracleum mantegazzianum',
    'kanada kuldvits','solidago canadensis','sügis-kuldvits','solidago gigantea',
    'kurdlehine kibuvits','rosa rugosa','verev lemmmalts','impatiens glandulifera'
  ];

  const TRAITS = {
    'juniperus communis': {season:'aastaringselt',pollinator:'keskmine',maintenance:'madal',size:'põõsas või väike puu, sageli 1–5 m',safety:'Marjad ei ole tavaliseks söömiseks; suurtes kogustes võivad olla kahjulikud.'},
    'quercus robur': {season:'aastaringselt',pollinator:'kõrge',maintenance:'madal',size:'suur puu, võib kasvada üle 20 m',safety:'Tõrud ei ole inimestele tavaliseks toiduks.'},
    'betula pendula': {season:'aastaringselt',pollinator:'keskmine',maintenance:'madal',size:'keskmine kuni suur puu, sageli 15–25 m',safety:'Õietolm võib tundlikel inimestel põhjustada allergiat.'},
    'pinus sylvestris': {season:'aastaringselt',pollinator:'madal',maintenance:'madal',size:'suur puu, sageli 20–30 m',safety:'Üldiselt madal ohurisk tavakasutuses.'},
    'picea abies': {season:'aastaringselt',pollinator:'madal',maintenance:'madal',size:'suur puu, sageli üle 20 m',safety:'Okkad ja oksad võivad vigastada paljast nahka.'},
    'taxus baccata': {season:'aastaringselt',pollinator:'madal',maintenance:'keskmine',size:'põõsas või puu, sageli 2–10 m',safety:'Mürgine taim; eriti seemned ja okkad. Hoida laste ja lemmikloomade eest.'},
    'allium ursinum': {season:'kevad',pollinator:'kõrge',maintenance:'madal',size:'rohttaim, tavaliselt alla 50 cm',safety:'Söödav liik, kuid seda võib segi ajada mürgiste sarnaste taimedega.'},
    'primula veris': {season:'kevad',pollinator:'kõrge',maintenance:'madal',size:'väike rohttaim, tavaliselt 10–30 cm',safety:'Üldiselt madal ohurisk tavakasutuses.'},
    'convallaria majalis': {season:'kevad–suvi',pollinator:'keskmine',maintenance:'madal',size:'väike rohttaim, tavaliselt alla 30 cm',safety:'Mürgine taim. Kõik osad võivad allaneelamisel olla ohtlikud.'},
    'digitalis purpurea': {season:'suvi',pollinator:'kõrge',maintenance:'keskmine',size:'rohttaim, sageli 0,5–1,5 m',safety:'Väga mürgine taim. Mitte tarvitada toiduks.'},
    'aconitum': {season:'suvi',pollinator:'keskmine',maintenance:'keskmine',size:'rohttaim, sageli 0,5–1,5 m',safety:'Väga mürgine taim; vältida allaneelamist ja käitlemisel kasutada ettevaatust.'},
    'solidago canadensis': {season:'suvi–sügis',pollinator:'kõrge',maintenance:'kõrge',size:'rohttaim, sageli 1–2 m',safety:'Probleemne võõrliik; loodusesse istutamist tuleb vältida.'}
  };

  let panelMap = null;
  let historyMap = null;
  let observationLayer = null;
  let lastNearby = [];
  let lastSnapshotKey = '';

  function coords(){
    const text = $('coordText')?.textContent || '';
    const match = text.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return match ? {lat:Number(match[1]), lon:Number(match[2])} : null;
  }

  function selectedPlant(){
    return {
      common: $('chosen')?.querySelector('b')?.textContent?.trim() || $('plantInput')?.value?.trim() || 'Taim',
      scientific: $('chosen')?.querySelector('em')?.textContent?.trim() || ''
    };
  }

  function currentAnalysis(){
    const c = coords();
    const plant = selectedPlant();
    const verdict = $('verdict')?.querySelector('h3')?.textContent?.trim() || '';
    const chipTexts = [...($('verdict')?.querySelectorAll('.result-chip') || [])].map(x => x.textContent.trim());
    const scoreChip = chipTexts.find(x => /%/.test(x));
    const score = scoreChip ? Number(scoreChip.match(/(\d+)%/)?.[1] || 0) : null;
    const evidence = [...($('evidenceList')?.querySelectorAll('.evidence-row') || [])].map(row => ({
      title: row.querySelector('small')?.textContent?.trim() || '',
      value: row.querySelector('b')?.textContent?.trim() || '',
      detail: row.querySelector('p')?.textContent?.trim() || ''
    }));
    const env = {};
    [['elevation','elevationValue','elevationDetail'],['land','landValue','landDetail'],['soil','soilValue','soilDetail'],['moisture','moistureValue','moistureDetail'],['light','lightValue','lightDetail']].forEach(([key,id,detail]) => {
      env[key] = {value:$(id)?.textContent?.trim() || '', detail:$(detail)?.textContent?.trim() || ''};
    });
    return {
      plant, coords:c, verdict, score, chips:chipTexts, evidence, env,
      image:$('preview')?.src || '', locationSource:$('mapBadge')?.textContent?.trim() || '',
      analyzedAt:new Date().toISOString()
    };
  }

  function confidence(a=currentAnalysis()){
    let available = 0;
    Object.values(a.env).forEach(x => { if(x.value && !['…','–','Pole saadaval'].includes(x.value)) available++; });
    const obs = a.evidence.find(x => /Kohalikud vaatlused/i.test(x.title));
    const hasObs = obs && !/peidetud|0 valitud/i.test(obs.value);
    const total = available + (hasObs ? 2 : 0) + (a.coords ? 1 : 0);
    if(total >= 7) return {label:'Kõrge', cls:'', text:'Otsus toetub mitmele keskkonnakihile ja kohalikele vaatlustele.'};
    if(total >= 4) return {label:'Keskmine', cls:'medium', text:'Osa olulisi andmeid on olemas, kuid kõiki kihte ei õnnestunud saada.'};
    return {label:'Madal', cls:'low', text:'Andmeid on vähe. Tulemust tasub käsitleda esialgse hinnanguna.'};
  }

  function simpleExplanation(a=currentAnalysis()){
    const lines = [];
    const map = {elevation:'Kõrgus',land:'Maastik',soil:'Muld',moisture:'Niiskus',light:'Valgus'};
    Object.entries(a.env).forEach(([key,val]) => {
      if(val.value && !['…','–','Pole saadaval'].includes(val.value)) lines.push({label:map[key], text:`${val.value}${val.detail ? ` — ${val.detail}` : ''}`});
    });
    a.evidence.forEach(e => { if(e.title) lines.push({label:e.title, text:`${e.value}${e.detail ? ` — ${e.detail}` : ''}`}); });
    return lines;
  }

  function traitFor(plant=selectedPlant()){
    const sci = (plant.scientific || '').toLowerCase();
    const common = (plant.common || '').toLowerCase();
    if(TRAITS[sci]) return TRAITS[sci];
    const prefix = Object.keys(TRAITS).find(key => key.endsWith(' ') ? sci.startsWith(key) : (key.indexOf(' ')<0 && sci.startsWith(key+' ')));
    if(prefix) return TRAITS[prefix];
    const isTree = /tamm|kask|mänd|kuusk|pärn|vaher|saar|jalakas|lepp|haab|pihlakas/.test(common);
    const isFlower = /lill|rohi|kellukas|ristik|nurmenukk|kanarbik|liivatee|pune|mailane|kannike/.test(common);
    return {
      season:isTree ? 'aastaringselt' : 'kevad–sügis',
      pollinator:isFlower ? 'kõrge' : isTree ? 'keskmine' : 'teadmata',
      maintenance:isTree ? 'madal kuni keskmine' : 'keskmine',
      size:isTree ? 'võib kujuneda suureks puuks; kontrolli liigi täpset kasvusuurust' : 'kontrolli liigi täpset kasvusuurust',
      safety:'BioGlow prototüübil puudub selle liigi kohta kontrollitud ohutusmärkus; enne istutamist kontrolli usaldusväärsest allikast.'
    };
  }

  function riskModel(a=currentAnalysis()){
    const moisture = `${a.env.moisture?.value || ''} ${a.env.moisture?.detail || ''}`.toLowerCase();
    const land = `${a.env.land?.value || ''} ${a.env.land?.detail || ''}`.toLowerCase();
    let drought='keskmine', flood='madal';
    if(/kuiv|madal niiskus|päikeseline/.test(moisture)) drought='kõrgem';
    if(/niiske|märg|vihm|kõrge niiskus/.test(moisture)) drought='madal';
    if(/märgala|soo|raba|vesi/.test(land) || /väga niiske|kõrge niiskus/.test(moisture)) flood='kõrgem';
    if(/hoonestatud|tööstus|äriala/.test(land)) flood='keskmine';
    return {drought,flood};
  }

  function biodiversityModel(a=currentAnalysis()){
    const t = traitFor(a.plant);
    const risky = invasiveNames.some(n => `${a.plant.common} ${a.plant.scientific}`.toLowerCase().includes(n));
    if(risky) return {score:1,label:'Madal',text:'Probleemse võõrliigi puhul ei käsitle BioGlow istutamist elurikkust toetava valikuna.'};
    let score=2;
    if(t.pollinator==='kõrge') score+=2; else if(t.pollinator==='keskmine') score+=1;
    if(a.score != null && a.score >= 25) score+=1;
    score=Math.max(1,Math.min(5,score));
    const label = score>=4 ? 'Kõrge potentsiaal' : score===3 ? 'Keskmine potentsiaal' : 'Madal/ebaselge potentsiaal';
    return {score,label,text:'See on BioGlow prototüübi hinnang, mis ühendab kohaliku vaatlusandme ja lihtsad liigipõhised tunnused.'};
  }

  function seasonModel(a=currentAnalysis()){
    const t=traitFor(a.plant);
    const month=new Date().getMonth()+1;
    const now = month>=3 && month<=5 ? 'kevad' : month>=6 && month<=8 ? 'suvi' : month>=9 && month<=11 ? 'sügis' : 'talv';
    const active = t.season==='aastaringselt' || t.season.includes(now);
    return {preferred:t.season,now,active};
  }

  async function getUser(){
    if(!sb) return null;
    const {data} = await sb.auth.getSession();
    return data?.session?.user || null;
  }

  function requireAnalysis(){
    const a = currentAnalysis();
    if(!$('resultContent') || $('resultContent').classList.contains('hidden') || !a.verdict){
      alert('Tee enne üks analüüs valmis.');
      return null;
    }
    return a;
  }

  async function saveCurrent(){
    const user = await getUser();
    if(!user){ alert('Analüüsi salvestamiseks logi kõigepealt sisse.'); return; }
    const a = requireAnalysis(); if(!a || !a.coords) return;
    const extras = buildExtraSnapshot(a);
    a.extras = extras;
    const {error} = await sb.from('saved_analyses').insert({
      user_id:user.id,
      plant_name:a.plant.common,
      scientific_name:a.plant.scientific || null,
      latitude:a.coords.lat,
      longitude:a.coords.lon,
      location_source:a.locationSource,
      verdict:a.verdict,
      score:Number.isFinite(a.score) ? a.score : null,
      title:`${a.plant.common} · ${new Date().toLocaleDateString('et-EE')}`,
      details:a
    });
    if(error){ console.error(error); alert('Salvestamine ebaõnnestus.'); return; }
    alert('Analüüs salvestatud.');
  }

  async function togglePlantFavorite(){
    const user = await getUser();
    if(!user){ alert('Lemmikute kasutamiseks logi sisse.'); return; }
    const p = selectedPlant();
    if(!p.common){ alert('Vali enne taim.'); return; }
    const {data:existing} = await sb.from('favorite_plants').select('id').eq('user_id',user.id).eq('plant_name',p.common).limit(1);
    if(existing?.length){
      await sb.from('favorite_plants').delete().eq('id',existing[0].id);
      alert('Taim eemaldati lemmikutest.');
    } else {
      const {error} = await sb.from('favorite_plants').insert({user_id:user.id,plant_name:p.common,scientific_name:p.scientific || null});
      if(error){ alert('Lemmikusse lisamine ebaõnnestus.'); return; }
      alert('Taim lisati lemmikutesse.');
    }
  }

  async function loadSaved(){
    const root = $('savedList');
    const user = await getUser();
    if(!user){ root.innerHTML = '<div class="feature-empty">Logi sisse, et näha oma analüüse.</div>'; return; }
    root.innerHTML = '<div class="feature-empty">Laadin…</div>';
    const {data,error} = await sb.from('saved_analyses').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50);
    if(error){ root.innerHTML = '<div class="feature-empty">Analüüse ei saanud laadida.</div>'; return; }
    if(!data?.length){ root.innerHTML = '<div class="feature-empty">Sul pole veel salvestatud analüüse.</div>'; return; }
    root.innerHTML = data.map(item => `<article class="feature-card" data-analysis-id="${item.id}"><small>${new Date(item.created_at).toLocaleString('et-EE')}</small><h3>${esc(item.plant_name)}</h3><div class="latin">${esc(item.scientific_name || '')}</div><p><b>${esc(item.verdict || 'Tulemus puudub')}</b>${item.score != null ? ` · ${item.score}% kohalik andmetugi` : ''}</p><p>📍 ${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}</p><div class="feature-actions"><button class="mini-btn primary" data-open-analysis="${item.id}">Ava</button><button class="mini-btn" data-share-saved="${item.id}">Jaga</button><button class="mini-btn danger" data-delete-analysis="${item.id}">Kustuta</button></div></article>`).join('');
    root.querySelectorAll('[data-delete-analysis]').forEach(btn => btn.onclick = async () => { if(confirm('Kustutan selle analüüsi?')){ await sb.from('saved_analyses').delete().eq('id',btn.dataset.deleteAnalysis); loadSaved(); }});
    root.querySelectorAll('[data-open-analysis]').forEach(btn => btn.onclick = () => showSavedDetails(data.find(x => String(x.id) === btn.dataset.openAnalysis)));
    root.querySelectorAll('[data-share-saved]').forEach(btn => btn.onclick = () => shareText(savedShareText(data.find(x => String(x.id) === btn.dataset.shareSaved))));
  }

  function showSavedDetails(item){
    const d = item?.details || {};
    $('savedDetail').innerHTML = `<div class="feature-card"><h3>${esc(item.plant_name)}</h3><div class="latin">${esc(item.scientific_name || '')}</div><div class="score-line"><span>Tulemus</span><strong>${esc(item.verdict || '–')}</strong></div><div class="score-line"><span>Asukoht</span><strong>${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}</strong></div>${item.score != null ? `<div class="score-line"><span>Kohalik andmetugi</span><strong>${item.score}%</strong></div>` : ''}<div class="explain-box">${Object.entries(d.env || {}).map(([key,v]) => `<div class="explain-item"><b>${esc(key)}</b><span>${esc(v?.value || '')} ${esc(v?.detail || '')}</span></div>`).join('')}</div></div>`;
  }

  function savedShareText(item){ return item ? `BioGlow analüüs: ${item.plant_name} — ${item.verdict || 'tulemus'}\nAsukoht: ${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}${item.score != null ? `\nKohalik andmetugi: ${item.score}%` : ''}` : ''; }

  async function shareText(text){
    if(!text) return;
    try{
      if(navigator.share) await navigator.share({title:'BioGlow analüüs',text});
      else { await navigator.clipboard.writeText(text); alert('Kokkuvõte kopeeriti.'); }
    } catch(error){ if(error?.name !== 'AbortError') console.error(error); }
  }

  function shareCurrent(){
    const a = requireAnalysis(); if(!a) return;
    const c = confidence(a);
    const bio=biodiversityModel(a);
    shareText(`BioGlow analüüs: ${a.plant.common}${a.plant.scientific ? ` (${a.plant.scientific})` : ''}\nTulemus: ${a.verdict}${a.score != null ? `\nKohalik andmetugi: ${a.score}%` : ''}\nUsaldusaste: ${c.label}\nElurikkuse potentsiaal: ${bio.label}${a.coords ? `\nAsukoht: ${a.coords.lat.toFixed(5)}, ${a.coords.lon.toFixed(5)}` : ''}`);
  }

  async function speciesMatch(name){
    const r = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`);
    if(!r.ok) throw new Error('Liiki ei leitud');
    return r.json();
  }

  async function occurrenceCount(key,c){
    const url = new URL('https://api.gbif.org/v1/occurrence/search');
    url.searchParams.set('taxon_key',key); url.searchParams.set('country','EE'); url.searchParams.set('hasCoordinate','true');
    url.searchParams.set('decimalLatitude',`${c.lat-.09},${c.lat+.09}`); url.searchParams.set('decimalLongitude',`${c.lon-.16},${c.lon+.16}`); url.searchParams.set('limit','0');
    const r = await fetch(url); const d = await r.json(); return Number(d.count || 0);
  }

  async function comparePlants(){
    const c = coords(); if(!c){ alert('Vali enne koht kaardilt.'); return; }
    const names = [$('cmp1').value,$('cmp2').value,$('cmp3').value].map(x=>x.trim()).filter(Boolean);
    if(names.length < 2){ alert('Sisesta vähemalt kaks taime.'); return; }
    const root = $('compareResult'); root.innerHTML = '<div class="feature-empty">Võrdlen kohalikke vaatlusi…</div>';
    const results = [];
    for(const name of names){
      try{ const m = await speciesMatch(name); const count = m.usageKey ? await occurrenceCount(m.usageKey,c) : 0; results.push({name,scientific:m.canonicalName || m.scientificName || name,count}); }
      catch{ results.push({name,scientific:name,count:0}); }
    }
    const max = Math.max(1,...results.map(x=>x.count));
    root.innerHTML = results.sort((a,b)=>b.count-a.count).map(x => `<div class="compare-bar"><div><b>${esc(x.name)}</b><small>${esc(x.scientific)}</small></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(x.count/max*100)}%"></div></div><strong>${x.count}</strong></div>`).join('') + '<p class="share-note">Võrdlus näitab kohalike avalike vaatluste hulka, mitte absoluutset kasvugarantiid.</p>';
  }

  async function nearbyCandidates(){
    const c = coords(); if(!c) return [];
    const url = new URL('https://api.gbif.org/v1/occurrence/search');
    url.searchParams.set('decimalLatitude',`${c.lat-.09},${c.lat+.09}`); url.searchParams.set('decimalLongitude',`${c.lon-.16},${c.lon+.16}`); url.searchParams.set('kingdomKey','6'); url.searchParams.set('country','EE'); url.searchParams.set('hasCoordinate','true'); url.searchParams.set('limit','300');
    const d = await (await fetch(url)).json();
    const map = new Map();
    for(const row of d.results || []){
      if(!row.speciesKey || !row.species) continue;
      const key = row.speciesKey; const cur = map.get(key) || {key,name:row.vernacularName || row.species,scientific:row.species,count:0,media:''}; cur.count++;
      const media = (row.media || []).find(x=>x.identifier); if(!cur.media && media) cur.media = media.identifier; map.set(key,cur);
    }
    return [...map.values()].filter(x => !invasiveNames.some(n => `${x.name} ${x.scientific}`.toLowerCase().includes(n))).sort((a,b)=>b.count-a.count);
  }

  async function whatGrowsHere(){
    const root = $('growHereResult');
    if(!coords()){ root.innerHTML='<div class="feature-empty">Vali enne kaartilt koht.</div>'; return; }
    root.innerHTML = '<div class="feature-empty">Otsin kohaliku vaatlusandmega taimi…</div>';
    const list = await nearbyCandidates().catch(()=>[]); lastNearby = list;
    if(!list.length){ root.innerHTML = '<div class="feature-empty">Selle koha kohta ei leitud piisavalt andmeid.</div>'; return; }
    root.innerHTML = list.slice(0,12).map((x,i)=>`<article class="native-card"><span class="plant-rank">${i<3?'TUGEV KOHALIK ANDMETUGI':'KANDIDAAT'}</span><b>${esc(x.name)}</b><div class="latin">${esc(x.scientific)}</div><p>GBIF kohalikke vaatlusi: <strong>${x.count}</strong></p>${x.media?`<img class="native-thumb" src="${esc(x.media)}" alt="${esc(x.name)}" loading="lazy">`:''}</article>`).join('') + '<p class="share-note">Kohalik vaatlusandmestik ei tõesta, et taim sobib igasse mikrokasvukohta. Kaitse- ja võõrliikide kontroll tuleb teha eraldi.</p>';
  }

  function renderExplain(){
    const root = $('explainResult'); const a = requireAnalysis(); if(!a){ root.innerHTML = ''; return; }
    const c = confidence(a); const lines = simpleExplanation(a);
    root.innerHTML = `<div class="feature-card"><div class="confidence ${c.cls}">Usaldusaste: ${c.label}</div><p>${esc(c.text)}</p><h3>Miks BioGlow nii ütles?</h3><div class="explain-box">${lines.map(x=>`<div class="explain-item"><b>${esc(x.label)}</b><span>${esc(x.text)}</span></div>`).join('')}</div><p><b>Kokkuvõte:</b> ${esc(a.verdict)}. BioGlow ühendab kohaliku leviku ja keskkonnaandmed; ükski kiht ei tõesta üksi, et taim kindlasti kasvab.</p></div>`;
  }

  function renderWarning(){
    const root = $('warningResult'); const p = selectedPlant(); const v = $('verdict')?.textContent || '';
    const text = `${p.common} ${p.scientific} ${v}`.toLowerCase();
    const invasive = invasiveNames.some(n => text.includes(n));
    const protectedHit = /kaitsekategooria|kaitsealune/.test(text);
    const trait=traitFor(p);
    root.innerHTML = `${invasive ? '<div class="warning-box danger"><b>⚠️ Invasiivse või probleemse liigi hoiatus</b><p>Seda taime ei tohiks loodusesse istutada. Kontrolli enne istutamist ametlikke Eesti võõrliikide nõudeid.</p></div>' : protectedHit ? '<div class="warning-box"><b>🛡️ Kaitsealuse liigi hoiatus</b><p>Ära võta kaitsealuseid taimi loodusest ega jaga tundlikke leiukohti. BioGlow ei käsitle neid tavapärase istutussoovitusena.</p></div>' : '<div class="warning-box"><b>✓ Eraldi kaitse- või invasiivsushäiret ei tuvastatud</b><p>See ei asenda ametlikku liigikaitse kontrolli.</p></div>'}<div class="warning-box soft"><b>Ohutuse prototüübi märkus</b><p>${esc(trait.safety)}</p></div>`;
  }

  function sourcesHtml(){
    return `<div class="source-list"><div class="source-row"><div><b>GBIF</b><small>Liikide nimed, fotod ja avalikud vaatlused</small></div><a href="https://www.gbif.org" target="_blank" rel="noopener">Ava ↗</a></div><div class="source-row"><div><b>Open-Meteo</b><small>Ilma- ja keskkonna mudelandmed</small></div><a href="https://open-meteo.com" target="_blank" rel="noopener">Ava ↗</a></div><div class="source-row"><div><b>SoilGrids</b><small>Mulla pH ja lõimise mudel</small></div><a href="https://soilgrids.org" target="_blank" rel="noopener">Ava ↗</a></div><div class="source-row"><div><b>Maa- ja Ruumiamet</b><small>Mullastiku ja maakatte kaardikihid</small></div><a href="https://geoportaal.maaamet.ee" target="_blank" rel="noopener">Ava ↗</a></div><div class="source-row"><div><b>eElurikkus / PlutoF</b><small>Eesti elurikkuse täiendavad allikad; BioGlow näitab need eraldi, kui integratsioon on aktiivne</small></div><a href="https://elurikkus.ee" target="_blank" rel="noopener">Ava ↗</a></div></div>`;
  }

  async function initFeatureMap(){
    const c = coords(); if(!c || !window.L || !$('featureMap')) return;
    if(panelMap){ panelMap.remove(); panelMap = null; }
    panelMap = L.map('featureMap').setView([c.lat,c.lon],14);
    const base=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(panelMap);
    const soil = L.tileLayer.wms('https://kaart.maaamet.ee/wms/alus-geo?',{layers:'mullaraster',format:'image/png',transparent:true,version:'1.1.1'});
    const land = L.tileLayer.wms('https://kaart.maaamet.ee/wms/alus-geo?',{layers:'BK_METS,BK_LAGE,BK_SOO,BK_RABA,BK_POLD,BK_POOSASTIK,BK_ASUSTUS,BK_HALJASALA',format:'image/png',transparent:true,version:'1.1.1'});
    observationLayer = L.layerGroup().addTo(panelMap);
    L.marker([c.lat,c.lon]).addTo(panelMap).bindPopup('Analüüsitav koht');
    L.control.layers({'OpenStreetMap':base},{'Mullakaart':soil,'Maakate':land,'Taimevaatlused':observationLayer}).addTo(panelMap);
    const list = lastNearby.length ? lastNearby : await nearbyCandidates().catch(()=>[]);
    list.slice(0,30).forEach((x,i) => { const angle=(i/Math.max(1,list.length))*Math.PI*2; const radius=.005+.001*(i%5); L.circleMarker([c.lat+Math.sin(angle)*radius,c.lon+Math.cos(angle)*radius],{radius:4}).bindPopup(`${esc(x.name)}<br>${esc(x.scientific)}`).addTo(observationLayer); });
    setTimeout(()=>panelMap.invalidateSize(),100);
  }

  function renderPhotoMap(){
    const root = $('photoMapView'); const src = $('preview')?.src;
    root.innerHTML = `<div class="photo-map-grid"><div class="photo-box">${src ? `<img src="${esc(src)}" alt="Koha foto">` : '<div>📷 Koha fotot pole lisatud</div>'}</div><div id="featureMap" class="mini-map"></div></div><p class="share-note">Kaardil saab sisse lülitada mullakihi, maakatte ja kohalike vaatluste kihi.</p>`;
    initFeatureMap();
  }

  async function loadFavorites(){
    const root = $('favoritesList'); const user = await getUser();
    if(!user){ root.innerHTML='<div class="feature-empty">Logi sisse, et näha lemmikuid.</div>'; return; }
    const {data} = await sb.from('favorite_plants').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
    root.innerHTML = data?.length ? data.map(x=>`<div class="feature-card"><b>★ ${esc(x.plant_name)}</b><div class="latin">${esc(x.scientific_name||'')}</div><div class="feature-actions"><button class="mini-btn" data-use-fav="${esc(x.plant_name)}">Kasuta analüüsis</button><button class="mini-btn danger" data-del-fav="${x.id}">Eemalda</button></div></div>`).join('') : '<div class="feature-empty">Lemmikuid pole veel.</div>';
    root.querySelectorAll('[data-del-fav]').forEach(btn=>btn.onclick=async()=>{await sb.from('favorite_plants').delete().eq('id',btn.dataset.delFav);loadFavorites();});
    root.querySelectorAll('[data-use-fav]').forEach(btn=>btn.onclick=()=>{ $('plantInput').value=btn.dataset.useFav; closePanel(); $('plantInput').dispatchEvent(new Event('input',{bubbles:true})); document.getElementById('analyze')?.scrollIntoView({behavior:'smooth'}); });
  }

  function renderSeasonRisk(){
    const root=$('seasonRiskView'); const a=requireAnalysis(); if(!a){root.innerHTML='';return;}
    const season=seasonModel(a), risk=riskModel(a), trait=traitFor(a.plant), bio=biodiversityModel(a);
    root.innerHTML=`<div class="metric-grid"><div class="metric-card"><small>HOOAJALISUS</small><b>${esc(season.preferred)}</b><p>Praegu on ${esc(season.now)}. ${season.active?'See sobib prototüübi hooajalisuse hinnanguga.':'See ei pruugi olla liigi kõige tüüpilisem aktiivne periood.'}</p></div><div class="metric-card"><small>KUIVUSRISK</small><b>${esc(risk.drought)}</b><p>Hinnang põhineb praegustel niiskus- ja keskkonnaandmetel.</p></div><div class="metric-card"><small>LIIGNIISKUSE / ÜLEUJUTUSE RISK</small><b>${esc(risk.flood)}</b><p>Hinnang arvestab maastikku ja niiskusinfot.</p></div><div class="metric-card"><small>TOLMELDAJATE KASU</small><b>${esc(trait.pollinator)}</b><p>Prototüübi liigipõhine hinnang; ei ole ametlik ökoloogiline klassifikatsioon.</p></div><div class="metric-card"><small>ELURIKKUSE POTENTSIAAL</small><b>${bio.score}/5 · ${esc(bio.label)}</b><p>${esc(bio.text)}</p></div><div class="metric-card"><small>HOOLDUSVAJADUS</small><b>${esc(trait.maintenance)}</b><p>Prototüübi praktiline hinnang.</p></div><div class="metric-card"><small>KASVUSUURUS</small><b>${esc(trait.size)}</b><p>Kontrolli enne istutamist täpse liigi lõplikku kasvusuurust.</p></div><div class="metric-card"><small>OHUTUS</small><b>Kontrolli enne istutamist</b><p>${esc(trait.safety)}</p></div></div>`;
  }

  function renderAvoid(){
    const root=$('avoidView'); const a=requireAnalysis(); if(!a){root.innerHTML='';return;}
    const risk=riskModel(a); const p=a.plant; const isInv=invasiveNames.some(n=>`${p.common} ${p.scientific}`.toLowerCase().includes(n));
    const items=[];
    if(isInv) items.push('Ära istuta valitud liiki loodusesse: BioGlow tuvastas probleemse võõrliigi hoiatuse.');
    if(/Ei sobi/i.test(a.verdict)) items.push(`Valitud ${p.common} ei saanud selles kohas tugevat sobivushinnangut.`);
    if(risk.drought==='kõrgem') items.push('Väldi väga suure veevajadusega taimi, kui kastmist ei ole võimalik tagada.');
    if(risk.flood==='kõrgem') items.push('Väldi liike, mis ei talu liigniiskust või ajutist üleujutust.');
    items.push('Väldi kaitsealuste taimede loodusest ümberistutamist.');
    items.push('Väldi tundmatu päritoluga invasiivseid või kiiresti levivaid aiataimi looduse läheduses.');
    root.innerHTML=`<div class="feature-card"><h3>Mida selles kohas vältida?</h3><ul class="avoid-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="share-note">See on BioGlow prototüübi riskiloend, mitte ametlik aiandus- või looduskaitse otsus.</p></div>`;
  }

  function renderConsidered(){
    const root=$('consideredView'); const a=requireAnalysis(); if(!a){root.innerHTML='';return;}
    const c=confidence(a), risk=riskModel(a), bio=biodiversityModel(a);
    const rows=[
      ['Asukoht',a.coords?`${a.coords.lat.toFixed(5)}, ${a.coords.lon.toFixed(5)}`:'puudub'],
      ['Muld',a.env.soil?.value||'pole saadaval'],['Niiskus',a.env.moisture?.value||'pole saadaval'],['Valgus',a.env.light?.value||'pole saadaval'],
      ['Maastik',a.env.land?.value||'pole saadaval'],['Kõrgus',a.env.elevation?.value||'pole saadaval'],
      ['Kohalikud vaatlused',a.evidence.find(x=>/Kohalikud vaatlused/i.test(x.title))?.value||'pole saadaval'],
      ['Kaitsestaatus',a.evidence.find(x=>/Kaitsestaatus/i.test(x.title))?.value||'kontrollitud'],
      ['Kuivusrisk',risk.drought],['Liigniiskuse risk',risk.flood],['Elurikkuse potentsiaal',`${bio.score}/5`],['Usaldusaste',c.label]
    ];
    root.innerHTML=`<div class="feature-card"><h3>Mida BioGlow arvestas?</h3><div class="explain-box">${rows.map(([k,v])=>`<div class="explain-item"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div></div>`;
  }

  async function loadHistoryMap(){
    const root=$('historyMapWrap'); const user=await getUser();
    if(!user){root.innerHTML='<div class="feature-empty">Logi sisse, et näha oma analüüside kaarti.</div>';return;}
    const {data,error}=await sb.from('saved_analyses').select('id,plant_name,scientific_name,latitude,longitude,verdict,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
    if(error||!data?.length){root.innerHTML='<div class="feature-empty">Salvestatud kohti pole veel.</div>';return;}
    root.innerHTML='<div id="historyMap" class="history-map"></div>';
    if(historyMap){historyMap.remove();historyMap=null;}
    historyMap=L.map('historyMap').setView([58.65,25.1],7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(historyMap);
    const bounds=[];
    data.forEach(item=>{const ll=[Number(item.latitude),Number(item.longitude)];bounds.push(ll);L.marker(ll).addTo(historyMap).bindPopup(`<b>${esc(item.plant_name)}</b><br>${esc(item.verdict||'')}<br>${new Date(item.created_at).toLocaleDateString('et-EE')}`);});
    if(bounds.length>1) historyMap.fitBounds(bounds,{padding:[25,25]}); else historyMap.setView(bounds[0],14);
    setTimeout(()=>historyMap.invalidateSize(),100);
  }

  function renderFreshness(){
    const root=$('freshnessView'); const a=requireAnalysis(); if(!a){root.innerHTML='';return;}
    const now=new Date();
    root.innerHTML=`<div class="feature-card"><h3>Andmete värskus</h3><div class="explain-box"><div class="explain-item"><b>BioGlow analüüs</b><span>${now.toLocaleString('et-EE')}</span></div><div class="explain-item"><b>GBIF vaatlused</b><span>Päriti analüüsi ajal; GBIF kirjed võivad pärineda eri aastatest.</span></div><div class="explain-item"><b>Open-Meteo</b><span>Päriti analüüsi ajal kasutatud mudelist.</span></div><div class="explain-item"><b>SoilGrids</b><span>Staatilisem mullamudel; ei ole reaalajas mõõtmine.</span></div><div class="explain-item"><b>MaRu kihid</b><span>Kaardikiht kuvatakse teenusest; uuendussagedus sõltub allikast.</span></div></div><p class="share-note">BioGlow eristab reaalajas päringuid, mudelandmeid ja ajaloolisi vaatlusandmeid.</p></div>`;
  }

  function buildExtraSnapshot(a=currentAnalysis()){
    return {confidence:confidence(a),season:seasonModel(a),risk:riskModel(a),traits:traitFor(a.plant),biodiversity:biodiversityModel(a)};
  }

  function reportLines(a){
    const ex=buildExtraSnapshot(a);
    return [
      ['Taim',`${a.plant.common}${a.plant.scientific?` (${a.plant.scientific})`:''}`],['Tulemus',a.verdict],['Usaldusaste',ex.confidence.label],
      ['Asukoht',a.coords?`${a.coords.lat.toFixed(5)}, ${a.coords.lon.toFixed(5)}`:'–'],['Muld',a.env.soil?.value||'–'],['Niiskus',a.env.moisture?.value||'–'],['Valgus',a.env.light?.value||'–'],['Maastik',a.env.land?.value||'–'],['Kõrgus',a.env.elevation?.value||'–'],
      ['Hooajalisus',ex.season.preferred],['Kuivusrisk',ex.risk.drought],['Liigniiskuse risk',ex.risk.flood],['Tolmeldajate kasu',ex.traits.pollinator],['Elurikkuse potentsiaal',`${ex.biodiversity.score}/5`],['Hooldusvajadus',ex.traits.maintenance],['Kasvusuurus',ex.traits.size],['Ohutus',ex.traits.safety]
    ];
  }

  function generatePdf(){
    const a=requireAnalysis(); if(!a) return;
    const jsPDF=window.jspdf?.jsPDF;
    if(!jsPDF){ window.print(); return; }
    const doc=new jsPDF({unit:'mm',format:'a4'}); let y=18;
    doc.setFontSize(20); doc.text('BioGlow analüüsiraport',18,y); y+=10;
    doc.setFontSize(10); doc.text(`Koostatud: ${new Date().toLocaleString('et-EE')}`,18,y); y+=8;
    reportLines(a).forEach(([k,v])=>{ doc.setFont(undefined,'bold'); doc.text(`${k}:`,18,y); doc.setFont(undefined,'normal'); const lines=doc.splitTextToSize(String(v||'–'),150); doc.text(lines,55,y); y+=Math.max(7,lines.length*5); if(y>275){doc.addPage();y=18;} });
    y+=3; doc.setFontSize(9); const note='Märkus: BioGlow on prototüüp. Keskkonna- ja liigihinnangud ei asenda ametlikku looduskaitse, aianduse ega ohutuse nõuannet.'; doc.text(doc.splitTextToSize(note,175),18,y);
    doc.save(`BioGlow-${(a.plant.common||'raport').replace(/[^a-zA-Z0-9õäöüÕÄÖÜ_-]+/g,'-')}.pdf`);
  }

  async function submitFeedback(rating){
    const a=requireAnalysis(); if(!a) return;
    const user=await getUser(); if(!user){alert('Tagasiside saatmiseks logi sisse.');return;}
    const comment=$('feedbackComment')?.value?.trim()||null;
    const {error}=await sb.from('analysis_feedback').insert({user_id:user.id,analysis_title:`${a.plant.common} · ${a.verdict}`,plant_name:a.plant.common,latitude:a.coords?.lat||null,longitude:a.coords?.lon||null,rating,comment});
    if(error){console.error(error);alert('Tagasiside saatmine ebaõnnestus.');return;}
    $('feedbackStatus').textContent='Aitäh! Tagasiside salvestati.';
  }

  function renderFeedback(){
    $('feedbackView').innerHTML=`<div class="feature-card"><h3>Kas BioGlow soovitus tundus mõistlik?</h3><p>Tagasiside aitab prototüüpi testida. See ei muuda automaatselt teadusandmeid.</p><textarea id="feedbackComment" class="feature-textarea" placeholder="Soovi korral kirjuta, mis oli hea või vale…"></textarea><div class="feature-actions"><button class="mini-btn primary" id="feedbackYes">👍 Tundus õige</button><button class="mini-btn" id="feedbackNo">👎 Tundus vale</button></div><div id="feedbackStatus" class="share-note"></div></div>`;
    $('feedbackYes').onclick=()=>submitFeedback('helpful'); $('feedbackNo').onclick=()=>submitFeedback('not_helpful');
  }

  function setMode(mode){
    document.body.dataset.bioglowMode=mode;
    localStorage.setItem('bioglow_mode',mode);
    $('modeToggle').textContent=mode==='expert'?'Eksperdirežiim':'Koolirežiim';
  }

  function renderOfflineState(){
    let banner=$('offlineBanner');
    if(!banner){banner=document.createElement('div');banner.id='offlineBanner';banner.className='offline-banner hidden';document.body.appendChild(banner);}
    if(navigator.onLine){banner.classList.add('hidden');}
    else {banner.textContent='Oled offline. BioGlow näitab viimati salvestatud lehe- ja analüüsiandmeid; uued veebipäringud ei pruugi töötada.';banner.classList.remove('hidden');}
  }

  function persistSnapshot(){
    const a=currentAnalysis(); if(!a.verdict) return;
    const key=`${a.plant.common}|${a.verdict}|${a.coords?.lat||''}|${a.coords?.lon||''}`;
    if(key===lastSnapshotKey) return;
    lastSnapshotKey=key;
    a.extras=buildExtraSnapshot(a);
    localStorage.setItem('bioglow_last_analysis',JSON.stringify(a));
  }

  function buildUI(){
    if($('featurePanel')) return;
    const launcher = document.createElement('div');
    launcher.className='feature-launcher';
    launcher.innerHTML='<button class="btn secondary" id="growHereBtn">🌱 Mis siin kasvaks?</button><button class="btn secondary" id="compareBtn">⇄ Võrdle taimi</button><button class="btn primary" id="myBioGlowBtn">✦ Minu BioGlow</button>';
    document.body.appendChild(launcher);

    const panel = document.createElement('div');
    panel.id='featurePanel'; panel.className='feature-panel hidden';
    panel.innerHTML=`<div class="feature-shell"><button class="feature-close" id="featureClose">×</button><div class="feature-topline"><div><span class="eyebrow">BIOGLOW+</span><h2 id="featureTitle">Minu BioGlow</h2></div><button class="mini-btn" id="modeToggle">Koolirežiim</button></div><div class="feature-tabs"><button class="feature-tab active" data-tab="saved">Minu analüüsid</button><button class="feature-tab" data-tab="history">Ajalugu kaardil</button><button class="feature-tab" data-tab="favorites">Lemmikud</button><button class="feature-tab" data-tab="compare">Võrdlus</button><button class="feature-tab" data-tab="grow">Mis siin kasvaks?</button><button class="feature-tab" data-tab="explain">Miks?</button><button class="feature-tab" data-tab="season">Kasvukoha lisahinnang</button><button class="feature-tab" data-tab="avoid">Mida vältida?</button><button class="feature-tab expert-only" data-tab="layers">Foto + kaart</button><button class="feature-tab expert-only" data-tab="considered">Mida arvestati?</button><button class="feature-tab expert-only" data-tab="freshness">Andmete värskus</button><button class="feature-tab expert-only" data-tab="sources">Andmeallikad</button><button class="feature-tab" data-tab="warning">Hoiatused</button><button class="feature-tab" data-tab="feedback">Tagasiside</button></div>
    <section class="feature-view" data-view="saved"><div class="feature-toolbar"><button class="mini-btn primary" id="saveCurrentBtn">Salvesta praegune analüüs</button><button class="mini-btn" id="shareCurrentBtn">Jaga tulemust</button><button class="mini-btn" id="pdfBtn">PDF raport</button></div><div class="feature-grid"><div id="savedList"></div><div id="savedDetail"></div></div></section>
    <section class="feature-view hidden" data-view="history"><div id="historyMapWrap"></div></section>
    <section class="feature-view hidden" data-view="favorites"><div class="feature-toolbar"><button class="mini-btn primary" id="favoriteCurrentBtn">★ Lisa valitud taim lemmikuks</button></div><div id="favoritesList" class="feature-grid"></div></section>
    <section class="feature-view hidden" data-view="compare"><p>Võrdle 2–3 taime sama koha kohalike vaatlusandmete põhjal.</p><div class="feature-toolbar"><input id="cmp1" class="feature-input" placeholder="nt kadakas"><input id="cmp2" class="feature-input" placeholder="nt tamm"><input id="cmp3" class="feature-input" placeholder="soovi korral kolmas"><button class="mini-btn primary" id="runCompareBtn">Võrdle</button></div><div id="compareResult" class="compare-result"></div></section>
    <section class="feature-view hidden" data-view="grow"><p>BioGlow otsib valitud koha ümbrusest tugevama kohaliku vaatlusandmega taimi. Tuntud probleemsed võõrliigid filtreeritakse välja.</p><button class="mini-btn primary" id="runGrowBtn">Otsi kohalikke kandidaate</button><div id="growHereResult" class="native-grid" style="margin-top:14px"></div></section>
    <section class="feature-view hidden" data-view="explain"><div id="explainResult"></div></section>
    <section class="feature-view hidden" data-view="season"><div id="seasonRiskView"></div></section>
    <section class="feature-view hidden" data-view="avoid"><div id="avoidView"></div></section>
    <section class="feature-view hidden" data-view="layers"><div id="photoMapView"></div></section>
    <section class="feature-view hidden" data-view="considered"><div id="consideredView"></div></section>
    <section class="feature-view hidden" data-view="freshness"><div id="freshnessView"></div></section>
    <section class="feature-view hidden" data-view="sources">${sourcesHtml()}</section>
    <section class="feature-view hidden" data-view="warning"><div id="warningResult"></div></section>
    <section class="feature-view hidden" data-view="feedback"><div id="feedbackView"></div></section></div>`;
    document.body.appendChild(panel);

    const accountMenu = $('accountMenu');
    if(accountMenu && !$('openMyAnalyses')){ const b=document.createElement('button'); b.id='openMyAnalyses'; b.className='btn secondary'; b.type='button'; b.textContent='Minu analüüsid'; accountMenu.insertBefore(b,$('logoutButton')); b.onclick=()=>openPanel('saved'); }
    injectResultActions();

    $('featureClose').onclick=closePanel; panel.addEventListener('click',e=>{if(e.target===panel) closePanel();});
    document.querySelectorAll('.feature-tab').forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));
    $('saveCurrentBtn').onclick=saveCurrent; $('shareCurrentBtn').onclick=shareCurrent; $('favoriteCurrentBtn').onclick=togglePlantFavorite; $('runCompareBtn').onclick=comparePlants; $('runGrowBtn').onclick=whatGrowsHere; $('pdfBtn').onclick=generatePdf;
    $('myBioGlowBtn').onclick=()=>openPanel('saved'); $('growHereBtn').onclick=()=>openPanel('grow'); $('compareBtn').onclick=()=>openPanel('compare');
    $('modeToggle').onclick=()=>setMode(document.body.dataset.bioglowMode==='expert'?'school':'expert');
    setMode(localStorage.getItem('bioglow_mode')||'school');
  }

  function injectResultActions(){
    const head = document.querySelector('.results-head'); if(!head || $('extraAnalysisActions')) return;
    const wrap=document.createElement('div'); wrap.id='extraAnalysisActions'; wrap.className='analysis-actions'; wrap.innerHTML='<button class="btn secondary" id="quickSaveBtn">♡ Salvesta</button><button class="btn secondary" id="quickWhyBtn">? Miks?</button><button class="btn secondary" id="quickShareBtn">↗ Jaga</button><button class="btn secondary" id="quickFavoriteBtn">★ Lemmik</button><button class="btn secondary" id="quickPdfBtn">PDF</button>';
    head.appendChild(wrap);
    $('quickSaveBtn').onclick=saveCurrent; $('quickWhyBtn').onclick=()=>openPanel('explain'); $('quickShareBtn').onclick=shareCurrent; $('quickFavoriteBtn').onclick=togglePlantFavorite; $('quickPdfBtn').onclick=generatePdf;
  }

  function openPanel(tab='saved'){ $('featurePanel').classList.remove('hidden'); document.body.classList.add('modal-open'); switchTab(tab); }
  function closePanel(){ $('featurePanel')?.classList.add('hidden'); document.body.classList.remove('modal-open'); }
  function switchTab(tab){
    document.querySelectorAll('.feature-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
    document.querySelectorAll('.feature-view').forEach(x=>x.classList.toggle('hidden',x.dataset.view!==tab));
    if(tab==='saved') loadSaved();
    if(tab==='history') loadHistoryMap();
    if(tab==='favorites') loadFavorites();
    if(tab==='explain') renderExplain();
    if(tab==='warning') renderWarning();
    if(tab==='layers') renderPhotoMap();
    if(tab==='season') renderSeasonRisk();
    if(tab==='avoid') renderAvoid();
    if(tab==='considered') renderConsidered();
    if(tab==='freshness') renderFreshness();
    if(tab==='feedback') renderFeedback();
  }

  function observeAnalysis(){
    const target=$('resultContent'); if(!target) return;
    const observer=new MutationObserver(()=>{
      if(!target.classList.contains('hidden') && $('verdict')?.querySelector('h3')){
        injectResultActions(); persistSnapshot();
      }
    });
    observer.observe(target,{subtree:true,childList:true,attributes:true});
  }

  function registerOffline(){
    if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(err=>console.debug('[BioGlow offline]',err)); }
    window.addEventListener('online',renderOfflineState); window.addEventListener('offline',renderOfflineState); renderOfflineState();
  }

  function init(){
    buildUI(); observeAnalysis(); registerOffline();
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && !$('featurePanel')?.classList.contains('hidden')) closePanel();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
