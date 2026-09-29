/* BioGlow V6 — Eesti kaitsealuste taimede staatus
   Allikad: Riigi Teataja kehtiv I/II nimekiri (23.05.2025 redaktsioon)
   + olemasolev PROTECTED_III nimekiri plant-data.js failis.
*/

const PROTECTED_I_SCI = [
  "Asplenium septentrionale","Asplenium viride","Botrychium matricariifolium","Botrychium virginianum",
  "Cystopteris sudetica","Equisetum x trachyodon","Isoetes echinospora","Polystichum aculeatum",
  "Polystichum braunii","Polystichum lonchitis","Aconitum lasiostomum","Astragalus arenarius",
  "Cerastium alpinum","Coeloglossum viride","Dactylorhiza praetermissa","Dactylorhiza ruthei",
  "Dactylorhiza sambucina","Epipogium aphyllum","Hemipilia cucullata","Neottianthe cucullata",
  "Juncus squarrosus","Laserpitium prutenicum","Ligularia sibirica","Littorella uniflora",
  "Najas flexilis","Oxytropis campestris","Peucedanum oreoselinum","Pulmonaria angustifolia",
  "Radiola linoides","Ranunculus lanuginosus","Saxifraga adscendens","Swertia perennis"
];

const PROTECTED_II_SCI = [
  "Asplenium ruta-muraria","Asplenium trichomanes","Equisetum x moorei","Equisetum scirpoides",
  "Isoetes lacustris","Selaginella selaginoides","Taxus baccata","Ajuga pyramidalis","Agrimonia pilosa",
  "Ajuga reptans","Alisma gramineum","Allium vineale","Alyssum montanum subsp. gmelinii",
  "Alyssum montanum subsp. Gmelinii","Anacamptis pyramidalis","Angelica palustris","Arctium nemorosum",
  "Arenaria procera","Artemisia maritima","Berula erecta","Bidens radiata","Botrychium multifidum",
  "Bromus benekenii","Bupleurum tenuissimum","Carex heleonastes","Carex irrigua","Carex extensa",
  "Carex glareosa","Carex ligerica","Carex mackenziei","Carex rhizina","Carex rhyncophysa",
  "Carex rhynchophysa","Carex disperma","Cephalanthera longifolia","Cephalanthera rubra",
  "Cerastium pumilum","Chaerophyllum temulum","Cinna latifolia","Circaea lutetiana","Cochlearia danica",
  "Corallorhiza trifida","Corydalis intermedia","Crepis mollis","Cruciata glabra","Cyperus fuscus",
  "Cypripedium calceolus","Dactylorhiza cruenta","Dactylorhiza osiliensis","Dactylorhiza russowii",
  "Dianthus arenarius","Dianthus superbus","Dracocephalum ruyschiana","Elatine hydropiper",
  "Elytrigia junceiformis","Eriophorum gracile","Eryngium maritimum","Festuca altissima",
  "Gentiana pneumonanthe","Geranium columbinum","Geranium lucidum","Gladiolus imbricatus",
  "Glyceria lithuanica","Gymnadenia odoratissima","Halimione pedunculata","Hedera helix",
  "Helichrysum arenarium","Herminium monorchis","Holcus mollis","Hydrocotyle vulgaris",
  "Hypericum montanum","Jovibarba sobolifera","Juncus stygius","Juncus subnodulosus","Koeleria gracilis",
  "Lathyrus niger","Leersia oryzoides","Liparis loeselii","Listera cordata","Neottia cordata",
  "Lobelia dortmanna","Lycopodiella inundata","Malaxis monophyllos","Malaxis paludosa",
  "Moehringia lateriflora","Mulgedium sibiricum","Myriophyllum alterniflorum",
  "Najas marina subsp. intermedia","Onobrychis arenaria","Ophrys insectifera","Orchis mascula",
  "Orchis morio","Anacamptis morio","Orchis ustulata","Neotinea ustulata","Oxytropis pilosa",
  "Pedicularis sceptrum-carolinum","Pinguicula alpina","Pleurospermum austriacum","Poa alpina",
  "Polygonum oxyspermum","Potamogeton trichoides","Prunus spinosa","Pulsatilla patens",
  "Ranunculus nemorosus","Rhinanthus osiliensis","Rhynchospora fusca","Rubus arcticus","Sagina maritima",
  "Salix repens","Samolus valerandi","Saussurea alpina subsp. esthonica","Saxifraga hirculus",
  "Schoenus nigricans","Scirpus radicans","Silene chlorantha","Sisymbrium supinum","Sorbus rupicola",
  "Sparganium angustifolium","Sparganium gramineum","Spergularia media","Suaeda maritima",
  "Thesium ebracteatum","Trifolium campestre","Trisetum sibiricum","Veronica dillenii",
  "Vicia lathyroides","Vicia tenuifolia","Viola elatior","Viola pumila","Viola selkirkii"
];

const PROTECTED_COMMON = {
  "harilik jugapuu": {category:"II", scientific:"Taxus baccata"},
  "jugapuu": {category:"II", scientific:"Taxus baccata"},
  "kaunis kuldking": {category:"II", scientific:"Cypripedium calceolus"},
  "kuldking": {category:"II", scientific:"Cypripedium calceolus"},
  "palu-karukell": {category:"II", scientific:"Pulsatilla patens"},
  "karulauk": {category:"III", scientific:"Allium ursinum"},
  "künnapuu": {category:"III", scientific:"Ulmus laevis"},
  "aas-karukell": {category:"III", scientific:"Pulsatilla pratensis"},
  "kahelehine käokeel": {category:"III", scientific:"Platanthera bifolia"},
  "rohekas käokeel": {category:"III", scientific:"Platanthera chlorantha"}
};

if (typeof SIMPLE_NAMES !== "undefined") {
  Object.assign(SIMPLE_NAMES, {
    "jugapuu":"Taxus baccata",
    "harilik jugapuu":"Taxus baccata",
    "kuldking":"Cypripedium calceolus",
    "kaunis kuldking":"Cypripedium calceolus",
    "palu-karukell":"Pulsatilla patens",
    "aas-karukell":"Pulsatilla pratensis",
    "kahelehine käokeel":"Platanthera bifolia",
    "rohekas käokeel":"Platanthera chlorantha"
  });
}

function _matchesScientific(name, list){
  const n = norm(name);
  return list.find(x => n === norm(x) || n.startsWith(norm(x) + " ") || norm(x).startsWith(n + " ")) || null;
}

function protectionInfo(name){
  const raw = String(name || "").trim();
  const common = PROTECTED_COMMON[norm(raw)];
  if(common) return {category:common.category, common:norm(raw), scientific:common.scientific};

  const i = _matchesScientific(raw, PROTECTED_I_SCI);
  if(i) return {category:"I", scientific:i};

  const ii = _matchesScientific(raw, PROTECTED_II_SCI);
  if(ii) return {category:"II", scientific:ii};

  if (typeof PROTECTED_III !== "undefined") {
    const n = norm(raw);
    for (const [commonName, sciNames] of PROTECTED_III) {
      if (n === norm(commonName) || sciNames.some(s => n === norm(s) || n.startsWith(norm(s)+" ") || norm(s).startsWith(n+" "))) {
        return {category:"III", common:commonName, scientific:sciNames[0]};
      }
    }
  }
  return null;
}

try { protectedInfo = protectionInfo; } catch(e) { window.protectedInfo = protectionInfo; }

function protectionMessage(info){
  if(!info) return {
    cls:"prot-none",
    title:"🌿 Kaitsekategooriat ei tuvastatud",
    text:"BioGlow ei leidnud selle liigi kohta Eesti I, II ega III kaitsekategooria vastet."
  };
  const levelText = info.category === "I"
    ? "I kaitsekategooria on kõige rangem kaitsetase."
    : info.category === "II"
      ? "II kaitsekategooria liik vajab tugevat kaitset."
      : "III kaitsekategooria liik on riikliku kaitse all.";
  return {
    cls:`prot-${info.category.toLowerCase()}`,
    title:`🛡️ ${info.category} kaitsekategooria liik`,
    text:`${levelText} BioGlow ei käsitle seda tavapärase istutussoovitusena. Ära võta kaitsealust taime loodusest ümberistutamiseks; eelista olemasoleva kasvukoha hoidmist ja ametlikest nõuetest lähtumist.`
  };
}

function addSelectedProtectionStatus(){
  const target = document.getElementById("verdict");
  if(!target) return;
  target.querySelectorAll(".protection-status").forEach(x=>x.remove());
  const raw = (typeof chosenPlant !== "undefined" && chosenPlant?.name) ? chosenPlant.name : document.getElementById("plantInput")?.value;
  const info = protectionInfo(raw);
  const m = protectionMessage(info);
  const div = document.createElement("div");
  div.className = `protection-status ${m.cls}`;
  div.innerHTML = `<b>${m.title}</b><div>${m.text}</div>${info?.scientific ? `<small>${esc(info.scientific)}</small>` : ""}`;
  target.appendChild(div);
}

if (typeof renderVerdict === "function") {
  const _renderVerdictV5 = renderVerdict;
  renderVerdict = function(...args){
    const out = _renderVerdictV5.apply(this,args);
    addSelectedProtectionStatus();
    return out;
  };
}

if (typeof renderAlternatives === "function") {
  const _renderAlternativesV5 = renderAlternatives;
  renderAlternatives = async function(list, selectedKey){
    const safe = (list || []).filter(x => !protectionInfo(x.scientific || x.name));
    return _renderAlternativesV5.call(this, safe, selectedKey);
  };
}

const _runButton = document.querySelector('button[onclick="runCheck()"]');
if(_runButton){
  _runButton.addEventListener("click",()=>setTimeout(addSelectedProtectionStatus,1200));
}

const protectionStyle=document.createElement("style");
protectionStyle.textContent=`
.protection-status{margin-top:14px;padding:14px 15px;border-radius:14px;border:1px solid transparent;line-height:1.55}
.protection-status b{display:block;font-size:16px;margin-bottom:4px}
.protection-status small{display:block;margin-top:6px;opacity:.75;font-style:italic}
.prot-i{background:#ffe2e2;color:#7d2020;border-color:#efb6b6}
.prot-ii{background:#fff0da;color:#7b4a12;border-color:#efd0a4}
.prot-iii{background:#e7f0ff;color:#284f7c;border-color:#c8daf2}
.prot-none{background:#f1f5f1;color:#536157;border-color:#dce5dc}
`;
document.head.appendChild(protectionStyle);
