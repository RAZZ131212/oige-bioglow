const WORKER="https://bioglow.robootikaring.workers.dev";
const $=id=>document.getElementById(id);
const go=id=>$(id)?.scrollIntoView({behavior:"smooth",block:"start"});
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c]));
const norm=s=>String(s||"").trim().toLowerCase().replace(/\s+/g," ");

let chosenPlant=null;
let chosenFile=null;
let chosenLocation=null;
let timer=null;
let marker=null;
let mapPickMode=false;
let toastTimer=null;

const EXTRA_NAMES={"saar":"Fraxinus excelsior","harilik saar":"Fraxinus excelsior","jalakas":"Ulmus glabra","harilik jalakas":"Ulmus glabra","paakspuu":"Frangula alnus","harilik paakspuu":"Frangula alnus","lodjapuu":"Viburnum opulus","harilik lodjapuu":"Viburnum opulus","sinilill":"Hepatica nobilis","nurmenukk":"Primula veris","metsmaasikas":"Fragaria vesca","raudrohi":"Achillea millefolium","valge ristik":"Trifolium repens","punane ristik":"Trifolium pratense","põdrakanep":"Chamaenerion angustifolium","harilik kuslapuu":"Lonicera xylosteum","kuslapuu":"Lonicera xylosteum"};
const aliasFor=q=>SIMPLE_NAMES[norm(q)]||EXTRA_NAMES[norm(q)];

const map=L.map("map",{zoomControl:true}).setView([58.65,25.1],7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);
map.on("click",e=>{if(mapPickMode){setLocation(e.latlng.lat,e.latlng.lng,"kaart");mapPickMode=false;$("mapModeBadge").textContent="Punkt valitud";toast("Asukoht valitud kaardilt.")}});

function toast(message){const el=$("toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),2600)}
function setStatus(message,type=""){const el=$("status");el.textContent=message;el.className=`status-line ${type}`}
function matchesName(name,list){const n=norm(name);return list.some(x=>n===norm(x)||n.startsWith(norm(x)+" ")||norm(x).startsWith(n+" "))}
function isInvasive(name){return matchesName(name,INVASIVE)}
function protectedInfo(name){
  if(matchesName(name,PROTECTED_I))return{category:"I",common:null};
  if(matchesName(name,PROTECTED_II))return{category:"II",common:null};
  const n=norm(name);
  for(const [common,names] of PROTECTED_III){if(names.some(x=>n===norm(x)||n.startsWith(norm(x)+" ")||norm(x).startsWith(n+" ")))return{category:"III",common}}
  return null;
}
function protectionLabel(name){const p=protectedInfo(name);return p?`${p.category} kaitsekategooria`:"ei ole kaitsekategoorias"}
function quickPlant(name){$("plantInput").value=name;chosenPlant=null;$("clearPlant").classList.remove("hidden");loadSuggestions(name,true);go("analyze")}

$("plantInput").addEventListener("input",()=>{
  clearTimeout(timer);chosenPlant=null;renderChosenPlant();
  const q=$("plantInput").value.trim();$("clearPlant").classList.toggle("hidden",!q);
  if(q.length<2){$("suggest").classList.add("hidden");return}
  timer=setTimeout(()=>loadSuggestions(q,false),220);
});
$("clearPlant").onclick=()=>{$("plantInput").value="";chosenPlant=null;renderChosenPlant();$("suggest").classList.add("hidden");$("clearPlant").classList.add("hidden")};

async function gbifSuggest(q){const r=await fetch(`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&limit=10`);if(!r.ok)throw Error(`GBIF species HTTP ${r.status}`);const d=await r.json();return d.filter(x=>x.rank==="SPECIES"||x.rank==="SUBSPECIES")}
async function gbifMatch(name){const r=await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`);if(!r.ok)throw Error(`GBIF match HTTP ${r.status}`);const x=await r.json();if(!x.usageKey&&!x.speciesKey)return null;return{key:x.usageKey||x.speciesKey,canonicalName:x.canonicalName||x.scientificName||name,scientificName:x.scientificName||x.canonicalName||name,rank:x.rank||"SPECIES"}}
function suggestionButton(x,raw=""){const sci=x.canonicalName||x.scientificName||raw||"",friendly=DISPLAY[sci]||x.vernacularName||raw||"",key=x.key||x.usageKey;return `<button type="button" onclick="choosePlant(${key},'${encodeURIComponent(sci)}','${encodeURIComponent(friendly)}')"><b>${esc(friendly||sci)}</b>${friendly&&friendly!==sci?`<br><small>${esc(sci)}</small>`:""}</button>`}
async function loadSuggestions(q,autoPick=false){
  try{
    const alias=aliasFor(q);let items=[];
    if(alias){const exact=await gbifMatch(alias).catch(()=>null);if(exact)items.push(exact)}
    const suggested=await gbifSuggest(alias||q).catch(()=>[]),seen=new Set(items.map(x=>x.key||x.usageKey));
    for(const x of suggested){const k=x.key||x.usageKey;if(k&&!seen.has(k)){items.push(x);seen.add(k)}}
    if(autoPick&&items[0]){const x=items[0],sci=x.canonicalName||x.scientificName||alias||q;choosePlant(x.key||x.usageKey,encodeURIComponent(sci),encodeURIComponent(DISPLAY[sci]||x.vernacularName||q));return}
    $("suggest").innerHTML=items.slice(0,8).map(x=>suggestionButton(x,q)).join("")||'<button type="button" disabled>Ei leidnud vastet.</button>';
    $("suggest").classList.remove("hidden");
  }catch(e){console.error(e);$("suggest").innerHTML='<button type="button" disabled>Taimede otsing ebaõnnestus.</button>';$("suggest").classList.remove("hidden")}
}

function choosePlant(key,sciEnc,commonEnc){
  const scientific=decodeURIComponent(sciEnc),common=decodeURIComponent(commonEnc||"");
  chosenPlant={key:Number(key),scientific,common:common||DISPLAY[scientific]||scientific,media:""};
  $("plantInput").value=chosenPlant.common;$("clearPlant").classList.remove("hidden");$("suggest").classList.add("hidden");
  renderChosenPlant();loadSelectedPlantMedia();
}
async function resolveTypedPlant(){if(chosenPlant)return chosenPlant;const raw=$("plantInput").value.trim();if(!raw)return null;const alias=aliasFor(raw);try{let x=alias?await gbifMatch(alias):null;if(!x){const a=await gbifSuggest(alias||raw);x=a[0]||null}if(!x)return null;const sci=x.canonicalName||x.scientificName||alias||raw;choosePlant(x.key||x.usageKey,encodeURIComponent(sci),encodeURIComponent(DISPLAY[sci]||x.vernacularName||raw));return chosenPlant}catch(e){console.error(e);return null}}
async function loadSelectedPlantMedia(){if(!chosenPlant)return;const temp={key:chosenPlant.key,media:""};await mediaFor(temp);if(chosenPlant&&temp.media){chosenPlant.media=temp.media;renderChosenPlant()}}
function renderChosenPlant(){
  const box=$("chosen");if(!chosenPlant){box.classList.add("hidden");box.innerHTML="";return}
  const p=protectedInfo(chosenPlant.scientific),invasive=isInvasive(chosenPlant.scientific);
  const image=chosenPlant.media?`<img src="${esc(chosenPlant.media)}" alt="${esc(chosenPlant.common)}" referrerpolicy="no-referrer">`:'<div class="selected-placeholder">🌿</div>';
  let badge=invasive?'<span class="mini-badge mini-invasive">võõr-/invasiivne kontroll</span>':p?`<span class="mini-badge mini-protected">🛡 ${p.category} kaitsekategooria</span>`:'<span class="mini-badge mini-normal">tavapärane liik</span>';
  box.innerHTML=`${image}<div><div class="name">${esc(chosenPlant.common)}</div><div class="latin">${esc(chosenPlant.scientific)}</div><div class="selected-badges">${badge}</div></div>`;box.classList.remove("hidden")
}

$("files").onchange=()=>setFile($("files").files[0]);
$("drop").ondragover=e=>{e.preventDefault();$("drop").classList.add("drag")};
$("drop").ondragleave=()=>$("drop").classList.remove("drag");
$("drop").ondrop=e=>{e.preventDefault();$("drop").classList.remove("drag");setFile(e.dataTransfer.files[0])};
async function setFile(f){
  if(!f||!/\.jpe?g$/i.test(f.name)){chosenFile=null;setStatus("Kasuta JPG/JPEG fotot.","error");return}
  chosenFile=f;$("preview").src=URL.createObjectURL(f);$("photoPreviewWrap").classList.remove("hidden");$("photoMeta").textContent=`${f.name} · ${(f.size/1024/1024).toFixed(1)} MB`;setStatus("Foto lisatud. Loen GPS-i…");
  try{const ex=await exifr.parse(f,{gps:true})||{};if(ex.latitude!=null&&ex.longitude!=null){setLocation(ex.latitude,ex.longitude,"foto GPS");setStatus("Foto GPS leitud.","ok")}else{setStatus("Fotol GPS puudub — kasuta oma asukohta või vali punkt kaardilt.")}}catch(e){console.warn(e);setStatus("GPS-i ei saanud fotost lugeda — vali asukoht käsitsi.")}
}
function removePhoto(){chosenFile=null;$("files").value="";$("photoPreviewWrap").classList.add("hidden");$("preview").src="";setStatus("Foto eemaldatud.")}
function setLocation(lat,lon,source){
  chosenLocation={lat:Number(lat),lon:Number(lon),source};
  if(marker)map.removeLayer(marker);marker=L.marker([lat,lon]).addTo(map).bindPopup("Analüüsitav koht").openPopup();map.setView([lat,lon],14);
  $("coordsText").textContent=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;$("locationSource").textContent=source;$("locationState").textContent=`Asukoht valmis: ${source}`;$("mapModeBadge").textContent=source;
}
function enableMapPick(){mapPickMode=true;$("mapModeBadge").textContent="Klõpsa kaardil";toast("Klõpsa kaardil kohale, mida soovid analüüsida.");go("map")}
function useBrowserLocation(){
  if(!navigator.geolocation){toast("Brauser ei toeta asukoha määramist.");return}
  $("locationState").textContent="Otsin sinu asukohta…";
  navigator.geolocation.getCurrentPosition(p=>{setLocation(p.coords.latitude,p.coords.longitude,"seadme asukoht");toast("Asukoht leitud.")},()=>{$("locationState").textContent="Asukoha luba ei antud või asukohta ei leitud.";toast("Asukohta ei saanud kasutada.")},{enableHighAccuracy:true,timeout:10000,maximumAge:30000});
}

async function nearby(lat,lon){
  const u=new URL("https://api.gbif.org/v1/occurrence/search");u.searchParams.set("decimalLatitude",`${lat-.09},${lat+.09}`);u.searchParams.set("decimalLongitude",`${lon-.16},${lon+.16}`);u.searchParams.set("kingdomKey","6");u.searchParams.set("country","EE");u.searchParams.set("hasCoordinate","true");u.searchParams.set("limit","300");
  const r=await fetch(u);if(!r.ok)throw Error("GBIF HTTP "+r.status);const d=await r.json(),m=new Map();
  for(const x of d.results||[]){if(!x.speciesKey||!x.species)continue;let v=m.get(x.speciesKey)||{key:x.speciesKey,name:DISPLAY[x.species]||x.vernacularName||x.species,scientific:x.species,count:0,latest:"",media:"",license:"",creator:""};v.count++;if((x.eventDate||"")>v.latest)v.latest=x.eventDate||"";const med=(x.media||[]).find(z=>z.identifier);if(!v.media&&med){v.media=med.identifier;v.license=med.license||"";v.creator=med.creator||""}m.set(x.speciesKey,v)}
  return[...m.values()].sort((a,b)=>b.count-a.count)
}
async function mediaFor(x){if(x.media)return x;try{const r=await fetch(`https://api.gbif.org/v1/occurrence/search?taxon_key=${x.key}&media_type=StillImage&limit=8`),d=await r.json();for(const o of d.results||[]){const m=(o.media||[]).find(z=>z.identifier);if(m){x.media=m.identifier;x.license=m.license||"";x.creator=m.creator||"";break}}}catch(e){console.warn("media",e)}return x}
async function selectedCount(key,lat,lon){const u=new URL("https://api.gbif.org/v1/occurrence/search");u.searchParams.set("taxon_key",key);u.searchParams.set("decimalLatitude",`${lat-.09},${lat+.09}`);u.searchParams.set("decimalLongitude",`${lon-.16},${lon+.16}`);u.searchParams.set("country","EE");u.searchParams.set("hasCoordinate","true");u.searchParams.set("limit","0");const r=await fetch(u);if(!r.ok)throw Error(`GBIF count HTTP ${r.status}`);const d=await r.json();return d.count||0}
async function photoAI(f,gps){if(!f)return"Fotot ei kasutatud";try{const fd=new FormData();fd.append("image",f);fd.append("latitude",gps.lat);fd.append("longitude",gps.lon);const r=await fetch(WORKER+"/identify",{method:"POST",body:fd});if(!r.ok)throw Error(`AI HTTP ${r.status}`);const d=await r.json(),b=d.results?.[0];return b?.species?.commonNames?.[0]||b?.species?.scientificNameWithoutAuthor||"AI analüüs tehtud"}catch(e){console.warn(e);return"AI polnud saadaval"}}

function evidenceStrength(n,best){if(best<=0)return 0;return Math.max(0,Math.min(100,Math.round((n/best)*100)))}
function confidenceWord(v){return v>=70?"tugev":v>=35?"keskmine":v>0?"nõrk":"puudub"}
function selectedProtectionMessage(){const p=protectedInfo(chosenPlant.scientific);if(!p)return"";return p.category==="I"||p.category==="II"?`<div class="protection-callout"><b>🛡 ${p.category} kaitsekategooria.</b> BioGlow ei kuva selle liigi tundlikke täpseid kasvukohti ega käsitle seda tavapärase istutussoovitusena. Ära võta isendeid loodusest.</div>`:`<div class="protection-callout"><b>🛡 III kaitsekategooria.</b> Ära võta taime loodusest ümberistutamiseks; looduskaitse mõttes eelista olemasoleva kasvukoha hoidmist.</div>`}
function renderSuitability(n,best,totalObs,aiText){
  const p=protectedInfo(chosenPlant.scientific),invasive=isInvasive(chosenPlant.scientific),strength=evidenceStrength(n,best);let state="no",title="Ei sobi hästi",copy=`Selle taime kohta ei leitud lähialalt avalikku vaatlustõendit. Allpool on tugevama kohaliku andmetoega alternatiivid.`;
  if(invasive){title="Ära istuta loodusesse";copy="See liik on BioGlow võõr-/invasiivsete liikide kontrollnimekirjas. Kohalike vaatlusandmete olemasolu ei muuda seda tavaliseks istutussoovituseks."}
  else if(strength>=50){state="ok";title="Sobib";copy=`Valitud liigi kohta leiti lähialalt ${n} avalikku vaatlust. Kohalik levik toetab seda valikut.`}
  else if(n>0){state="maybe";title="Võib sobida";copy=`Valitud liigi kohta leiti lähialalt ${n} vaatlust, kuid teistel liikidel on siin tugevam kohalik andmetugi.`}
  const protection=p?`🛡 ${p.category} kaitsekategooria`:"kaitsekategooriat ei tuvastatud";
  $("verdict").className=`verdict-card verdict-${state}`;
  $("verdict").innerHTML=`<div class="verdict-top"><div><span class="verdict-state state-${state}">${invasive?"HOIATUS":state==="ok"?"SOBIVUS":state==="maybe"?"VAJAB KONTROLLI":"NÕRK SOBIVUS"}</span><h3>${title}</h3><div class="latin">${esc(chosenPlant.common)} · ${esc(chosenPlant.scientific)}</div></div></div><div class="result-badges"><span class="result-badge ${p?"badge-protected":"badge-normal"}">${esc(protection)}</span>${invasive?'<span class="result-badge badge-invasive">võõr-/invasiivse liigi hoiatus</span>':""}</div><div class="verdict-copy">${copy}</div>${selectedProtectionMessage()}`;
  $("obsEvidence").textContent=`${n} valitud liigi vaatlust · ${totalObs} kirjet kokku`;
  $("aiEvidence").textContent=aiText;
  $("protectionEvidence").textContent=protection;
  $("confidenceLabel").textContent=confidenceWord(strength);
  $("confidenceBar").style.width=`${strength}%`;
}

async function renderConservation(list){
  const hits=list.map(x=>({x,info:protectedInfo(x.scientific)})).filter(z=>z.info?.category==="III");
  if(!hits.length){$("conservation").innerHTML=`<div class="conserve-card"><div class="conserve-placeholder">🛡</div><div><span class="step-label">LOODUSKAITSE</span><h3>III kategooria taime ei leitud</h3><p>Avaliku lähiala päringu põhjal ei leitud III kaitsekategooria taime. I ja II kategooria tundlikke täpseid kasvukohti BioGlow ei kuva.</p></div></div>`;return}
  hits.sort((a,b)=>a.x.count-b.x.count);const h=hits[0];await mediaFor(h.x);const img=h.x.media?`<img src="${esc(h.x.media)}" alt="${esc(h.info.common||h.x.name)}" referrerpolicy="no-referrer">`:'<div class="conserve-placeholder">🛡</div>';
  $("conservation").innerHTML=`<div class="conserve-card">${img}<div><span class="step-label">LOODUSKAITSE VÕIMALUS</span><h3>${esc(h.info.common||h.x.name)}</h3><div class="latin">${esc(h.x.scientific)} · III kaitsekategooria</div><p>Avalikus lähiala päringus oli selle liigi kohta ${h.x.count} vaatlust. See ei ole üleskutse taime ümber istutada — parem mõte on toetada või taastada talle sobivat kasvukohta.</p></div></div>`
}
async function renderAlternatives(list){
  const good=list.filter(x=>!isInvasive(x.scientific)&&!protectedInfo(x.scientific)&&x.key!==chosenPlant.key).slice(0,6);await Promise.all(good.map(mediaFor));
  if(!good.length){$("plants").innerHTML='<div class="empty-result"><b>Alternatiive jäi väheks</b><p>Avalikust lähiala päringust ei leitud piisavalt tavapäraseid kandidaate.</p></div>';return}
  $("plants").innerHTML=good.map((x,i)=>{const image=x.media?`<img src="${esc(x.media)}" alt="${esc(x.name)}" loading="lazy" referrerpolicy="no-referrer">`:'<div class="plant-placeholder">🌿</div>';return `<article class="plant">${image}<div class="plant-body"><span class="plant-rank">${i===0?"TUGEVAM KANDIDAAT":`KANDIDAAT ${i+1}`}</span><h3>${esc(x.name)}</h3><div class="latin">${esc(x.scientific)}</div><div class="plant-evidence"><span>⌖</span><span>Kohalikke vaatlusi <b>${x.count}</b></span></div>${x.creator||x.license?`<div class="plant-meta">Pilt: GBIF${x.creator?` · ${esc(x.creator)}`:""}${x.license?` · ${esc(x.license)}`:""}</div>`:""}</div></article>`}).join("")
}

async function runCheck(){
  const btn=$("analyzeBtn");try{
    if(!await resolveTypedPlant()){setStatus("Ma ei leidnud seda taime. Proovi nt „kadakas” või täpsemat nime.","error");return}
    if(!chosenLocation&&chosenFile){try{const ex=await exifr.parse(chosenFile,{gps:true})||{};if(ex.latitude!=null&&ex.longitude!=null)setLocation(ex.latitude,ex.longitude,"foto GPS")}catch(e){}}
    if(!chosenLocation){setStatus("Lisa asukoht: foto GPS, sinu asukoht või punkt kaardilt.","error");return}
    btn.disabled=true;btn.innerHTML="Analüüsin…";setStatus("Kogun kohalikke andmeid…");$("emptyResult").classList.add("hidden");$("resultContent").classList.remove("hidden");$("verdict").innerHTML='<div class="verdict-copy">⏳ Arvutan tulemust…</div>';$("plants").innerHTML='<div class="empty-result"><p>⏳ Otsin sobivamaid taimi ja pilte…</p></div>';
    const [list,aiText]=await Promise.all([nearby(chosenLocation.lat,chosenLocation.lon),photoAI(chosenFile,chosenLocation)]);
    if(!list.length)throw Error("Selle koha ümbrusest ei saadud piisavalt avalikke taimevaatlusi.");
    const n=await selectedCount(chosenPlant.key,chosenLocation.lat,chosenLocation.lon).catch(()=>0),best=list[0]?.count||0,totalObs=list.reduce((s,x)=>s+x.count,0);
    renderSuitability(n,best,totalObs,aiText);await Promise.all([renderAlternatives(list),renderConservation(list)]);setStatus("Analüüs valmis.","ok");go("results")
  }catch(e){console.error(e);setStatus(e.message||"Analüüs ebaõnnestus. Proovi uuesti.","error");toast("Analüüs ebaõnnestus — vaata veateadet.")}
  finally{btn.disabled=false;btn.innerHTML='Analüüsi sobivust <span>→</span>'}
}

function resetAnalysis(){chosenPlant=null;chosenFile=null;chosenLocation=null;mapPickMode=false;$("plantInput").value="";$("clearPlant").classList.add("hidden");renderChosenPlant();removePhoto();if(marker){map.removeLayer(marker);marker=null}map.setView([58.65,25.1],7);$("coordsText").textContent="–";$("locationSource").textContent="–";$("locationState").textContent="Asukohta pole veel valitud.";$("mapModeBadge").textContent="GPS / kaart";$("resultContent").classList.add("hidden");$("emptyResult").classList.remove("hidden");setStatus("Vali taim ja koht.");go("analyze")}
