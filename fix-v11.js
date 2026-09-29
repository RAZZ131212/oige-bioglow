// BioGlow V11 — fix result rendering against current HTML
(function(){
  const safe=id=>document.getElementById(id);
  const strength=(n,best)=>best>0?Math.max(0,Math.min(100,Math.round((n/best)*100))):0;
  const strengthWord=v=>v>=70?"tugev":v>=35?"keskmine":v>0?"nõrk":"puudub";

  // V8 app.js expected old IDs like obsEvidence/confidenceBar that no longer exist.
  // Render everything into the current verdict + evidenceList elements instead.
  renderSuitability=function(n,best,totalObs,aiText){
    const root=safe("verdict"), evidence=safe("evidenceList");
    if(!root||!evidence){
      console.warn("BioGlow V11: result container missing");
      return;
    }
    const p=protectedInfo(chosenPlant.scientific);
    const invasive=isInvasive(chosenPlant.scientific);
    const score=strength(n,best);
    let state="bad", title="Ei sobi hästi", copy="Selle taime kohta ei leitud lähialalt piisavalt tugevat vaatlustõendit. Vaata allpool tugevamaid alternatiive.";
    if(invasive){
      title="Ära istuta loodusesse";
      copy="See liik on BioGlow invasiivsuse kontrollnimekirjas. Kohalik esinemine ei muuda seda tavaliseks istutussoovituseks.";
    }else if(score>=50){
      state="good"; title="Sobib";
      copy=`Valitud liigi kohta leiti lähialalt ${n} avalikku vaatlust. Kohalik levik toetab seda valikut.`;
    }else if(n>0){
      state="maybe"; title="Võib sobida";
      copy=`Valitud liigi kohta leiti lähialalt ${n} vaatlust, kuid teistel liikidel on siin tugevam kohalik andmetugi.`;
    }
    const protection=p?`${p.category} kaitsekategooria`:"kaitsekategooriat ei tuvastatud";
    const safety=p?`<div class="safety-note"><b>🛡 ${p.category} kaitsekategooria.</b> Ära võta kaitsealust taime loodusest ümberistutamiseks. BioGlow käsitleb seda looduskaitselise infona, mitte tavapärase istutussoovitusena.</div>`:"";
    root.className=`verdict-card ${state}`;
    root.innerHTML=`
      <div class="verdict-top">
        <div class="verdict-icon">${invasive?"!":state==="good"?"✓":state==="maybe"?"~":"×"}</div>
        <div><small>BIOGLOW HINNANG</small><h3>${esc(title)}</h3></div>
      </div>
      <div class="selected-result"><b>${esc(chosenPlant.common)}</b><span>${esc(chosenPlant.scientific)}</span></div>
      <p>${esc(copy)}</p>
      <div class="result-chips">
        <span class="result-chip">${n} kohalikku vaatlust</span>
        <span class="result-chip">andmetugi ${score}%</span>
        <span class="result-chip ${p?"protect":""}">${esc(protection)}</span>
      </div>${safety}`;

    evidence.innerHTML=`
      <div class="evidence-row"><span>⌖</span><div><small>KOHALIKUD VAATLUSED</small><b>${n} valitud liigi vaatlust</b><p>${totalObs} taimekirjet analüüsitud piirkonnas.</p></div></div>
      <div class="evidence-row"><span>◉</span><div><small>FOTO AI</small><b>${esc(aiText||"Fotot ei kasutatud")}</b><p>Foto annab lisakonteksti, kuid ei otsusta tulemust üksi.</p></div></div>
      <div class="evidence-row"><span>🛡</span><div><small>KAITSESTAATUS</small><b>${esc(protection)}</b><p>Kaitsealuseid liike ei kuvata tavaliste alternatiividena.</p></div></div>
      <div class="evidence-row"><span>▰</span><div><small>ANDMETOE TUGEVUS</small><b>${score}% · ${strengthWord(score)}</b><p>See on võrdlus piirkonna tugevaima vaatlusarvuga, mitte ellujäämise tõenäosus.</p></div></div>`;
  };

  // Safety net: never leave the alternatives section on an endless spinner after an error.
  const previousRun=runCheck;
  runCheck=async function(){
    try{
      return await previousRun();
    }catch(e){
      console.error("BioGlow V11 run",e);
      const plants=safe("plants");
      if(plants&&/Otsin sobivamaid taimi/.test(plants.textContent||"")){
        plants.innerHTML='<div class="alt-empty"><span>!</span><div><b>Alternatiive ei saanud laadida</b><p>Proovi analüüsi uuesti. Põhitulemus ei tohiks enam selle vea tõttu kaduda.</p></div></div>';
      }
      throw e;
    }
  };

  window.addEventListener("error",e=>{
    const msg=String(e.message||"");
    if(msg.includes("Cannot set properties of null")){
      console.warn("BioGlow V11 intercepted old DOM mismatch:",msg);
    }
  });
})();