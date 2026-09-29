// BioGlow V9 compatibility and UX fixes
(function(){
  function safeEl(id){ return document.getElementById(id); }

  // Keep selected plant preview compact and predictable.
  renderChosenPlant = function(){
    const box=safeEl("chosen");
    if(!box) return;
    if(!chosenPlant){ box.classList.add("hidden"); box.innerHTML=""; return; }
    const p=protectedInfo(chosenPlant.scientific), invasive=isInvasive(chosenPlant.scientific);
    const image=chosenPlant.media
      ? `<div class="chosen-photo"><img src="${esc(chosenPlant.media)}" alt="${esc(chosenPlant.common)}" loading="lazy" referrerpolicy="no-referrer"></div>`
      : `<div class="chosen-photo"><div class="selected-placeholder">🌿</div></div>`;
    const badge=invasive
      ? '<span class="tag danger">võõr-/invasiivne kontroll</span>'
      : p
        ? `<span class="tag protect">🛡 ${p.category} kaitsekategooria</span>`
        : '<span class="tag neutral">tavapärane liik</span>';
    box.innerHTML=`${image}<div class="chosen-copy"><small>VALITUD TAIM</small><b>${esc(chosenPlant.common)}</b><span>${esc(chosenPlant.scientific)}</span>${badge}</div>`;
    box.classList.remove("hidden");
  };

  window.clearPlantInput = function(){
    const input=safeEl("plantInput");
    if(input) input.value="";
    chosenPlant=null;
    renderChosenPlant();
    safeEl("suggest")?.classList.add("hidden");
    safeEl("clearPlant")?.classList.add("hidden");
  };

  // Use the IDs that actually exist in V8/V9 HTML.
  setLocation = function(lat,lon,source="kaart"){
    lat=Number(lat); lon=Number(lon);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)){
      setStatus("Asukoha koordinaadid ei ole õiged.","error");
      return;
    }
    chosenLocation={lat,lon,source};
    if(marker) map.removeLayer(marker);
    marker=L.marker([lat,lon]).addTo(map).bindPopup("Analüüsitav koht").openPopup();
    map.setView([lat,lon],15);
    setTimeout(()=>map.invalidateSize(),80);
    const coord=safeEl("coordText");
    if(coord) coord.textContent=`${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const state=safeEl("locationState");
    if(state) state.innerHTML=`<span class="dot ready"></span><span>Asukoht valmis: ${esc(source)}</span>`;
    const badge=safeEl("mapModeBadge");
    if(badge) badge.textContent=source;
    setStatus(`Asukoht valitud: ${source}.`,"ready");
  };

  enableMapPick = function(){
    mapPickMode=true;
    const badge=safeEl("mapModeBadge");
    if(badge) badge.textContent="Klõpsa kaardil";
    toast("Klõpsa kaardil soovitud asukohale.");
    go("map");
    setTimeout(()=>map.invalidateSize(),250);
  };

  // Clicking the map now always chooses a point; no hidden mode is required.
  map.off("click");
  map.on("click",e=>{
    setLocation(e.latlng.lat,e.latlng.lng,"kaardilt valitud");
    mapPickMode=false;
    toast("Asukoht valitud kaardilt.");
  });

  window.useDeviceLocation = function(){
    if(!navigator.geolocation){
      setStatus("See brauser ei toeta asukoha määramist. Vali punkt kaardilt.","error");
      toast("Brauser ei toeta asukohta.");
      return;
    }
    const state=safeEl("locationState");
    if(state) state.innerHTML='<span class="dot"></span><span>Otsin sinu asukohta…</span>';
    navigator.geolocation.getCurrentPosition(
      p=>{
        setLocation(p.coords.latitude,p.coords.longitude,"seadme asukoht");
        toast("Seadme asukoht leitud.");
      },
      err=>{
        const msg=err.code===1
          ? "Asukoha luba on brauseris keelatud. Luba asukoht või vali punkt kaardilt."
          : err.code===2
            ? "Seadme asukohta ei õnnestunud leida. Vali punkt kaardilt."
            : "Asukoha otsimine aegus. Vali punkt kaardilt.";
        if(state) state.innerHTML=`<span class="dot"></span><span>${esc(msg)}</span>`;
        setStatus(msg,"warn");
        toast("Kasuta kaardilt valimist.");
      },
      {enableHighAccuracy:true,timeout:15000,maximumAge:60000}
    );
  };
  // Backwards-compatible alias.
  useBrowserLocation = window.useDeviceLocation;

  setFile = async function(f){
    if(!f||!/\.jpe?g$/i.test(f.name)){
      chosenFile=null;
      setStatus("Kasuta JPG/JPEG fotot.","error");
      return;
    }
    chosenFile=f;
    const preview=safeEl("preview");
    if(preview) preview.src=URL.createObjectURL(f);
    safeEl("photoRow")?.classList.remove("hidden");
    if(safeEl("photoName")) safeEl("photoName").textContent=f.name;
    if(safeEl("photoMeta")) safeEl("photoMeta").textContent=`${(f.size/1024/1024).toFixed(1)} MB · GPS-i kontroll…`;
    setStatus("Foto lisatud. Loen GPS-i…");
    try{
      const ex=await exifr.parse(f,{gps:true})||{};
      if(ex.latitude!=null&&ex.longitude!=null){
        setLocation(ex.latitude,ex.longitude,"foto GPS");
        if(safeEl("photoMeta")) safeEl("photoMeta").textContent=`${(f.size/1024/1024).toFixed(1)} MB · GPS leitud`;
      }else{
        if(safeEl("photoMeta")) safeEl("photoMeta").textContent=`${(f.size/1024/1024).toFixed(1)} MB · GPS puudub`;
        setStatus("Fotol GPS puudub — vali punkt kaardilt või kasuta seadme asukohta.","warn");
      }
    }catch(e){
      console.warn("EXIF",e);
      if(safeEl("photoMeta")) safeEl("photoMeta").textContent=`${(f.size/1024/1024).toFixed(1)} MB · GPS-i ei saanud lugeda`;
      setStatus("GPS-i ei saanud fotost lugeda — vali asukoht käsitsi.","warn");
    }
  };

  removePhoto = function(){
    chosenFile=null;
    const files=safeEl("files"); if(files) files.value="";
    safeEl("photoRow")?.classList.add("hidden");
    const preview=safeEl("preview"); if(preview) preview.src="";
    if(safeEl("photoName")) safeEl("photoName").textContent="";
    if(safeEl("photoMeta")) safeEl("photoMeta").textContent="";
    setStatus(chosenLocation?"Foto eemaldatud. Asukoht jääb alles.":"Foto eemaldatud.");
  };

  runCheck = async function(){
    const btn=safeEl("analyzeBtn");
    try{
      if(!await resolveTypedPlant()){
        setStatus("Ma ei leidnud seda taime. Proovi nt „kadakas” või täpsemat nime.","error");
        return;
      }
      if(!chosenLocation&&chosenFile){
        try{
          const ex=await exifr.parse(chosenFile,{gps:true})||{};
          if(ex.latitude!=null&&ex.longitude!=null) setLocation(ex.latitude,ex.longitude,"foto GPS");
        }catch(e){}
      }
      if(!chosenLocation){
        setStatus("Vali asukoht: klõpsa kaardil, kasuta seadme asukohta või lisa GPS-iga foto.","error");
        enableMapPick();
        return;
      }
      if(btn){ btn.disabled=true; btn.innerHTML="Analüüsin…"; }
      setStatus("Kogun kohalikke andmeid…");
      safeEl("resultEmpty")?.classList.add("hidden");
      safeEl("resultContent")?.classList.remove("hidden");
      if(safeEl("verdict")) safeEl("verdict").innerHTML='<div class="verdict-copy">⏳ Arvutan tulemust…</div>';
      if(safeEl("plants")) safeEl("plants").innerHTML='<div class="empty-result"><p>⏳ Otsin sobivamaid taimi ja pilte…</p></div>';
      const [list,aiText]=await Promise.all([nearby(chosenLocation.lat,chosenLocation.lon),photoAI(chosenFile,chosenLocation)]);
      if(!list.length) throw Error("Selle koha ümbrusest ei saadud piisavalt avalikke taimevaatlusi.");
      const n=await selectedCount(chosenPlant.key,chosenLocation.lat,chosenLocation.lon).catch(()=>0);
      const best=list[0]?.count||0,totalObs=list.reduce((s,x)=>s+x.count,0);
      renderSuitability(n,best,totalObs,aiText);
      await Promise.all([renderAlternatives(list),renderConservation(list)]);
      setStatus("Analüüs valmis.","ready");
      go("results");
    }catch(e){
      console.error(e);
      setStatus(e.message||"Analüüs ebaõnnestus. Proovi uuesti.","error");
      toast("Analüüs ebaõnnestus — vaata veateadet.");
    }finally{
      if(btn){ btn.disabled=false; btn.innerHTML='Analüüsi sobivust <span>→</span>'; }
    }
  };

  resetAnalysis = function(){
    chosenPlant=null; chosenFile=null; chosenLocation=null; mapPickMode=false;
    const input=safeEl("plantInput"); if(input) input.value="";
    safeEl("clearPlant")?.classList.add("hidden");
    renderChosenPlant();
    removePhoto();
    if(marker){ map.removeLayer(marker); marker=null; }
    map.setView([58.65,25.1],7);
    if(safeEl("coordText")) safeEl("coordText").textContent="Koordinaadid puuduvad";
    if(safeEl("locationState")) safeEl("locationState").innerHTML='<span class="dot"></span><span>Asukohta pole veel valitud</span>';
    if(safeEl("mapModeBadge")) safeEl("mapModeBadge").textContent="GPS / kaart";
    safeEl("resultContent")?.classList.add("hidden");
    safeEl("resultEmpty")?.classList.remove("hidden");
    setStatus("Vali taim ja koht.");
    go("analyze");
  };

  // Rebind file input after replacing setFile.
  const files=safeEl("files");
  if(files) files.onchange=()=>setFile(files.files[0]);
})();