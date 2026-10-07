(() => {
  'use strict';

  const WORKER = 'https://bioglow.robootikaring.workers.dev';
  const $ = id => document.getElementById(id);
  const norm = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const esc = value => String(value ?? '').replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));

  const EXTRA_NAMES = {
    'saar':'Fraxinus excelsior','harilik saar':'Fraxinus excelsior','jalakas':'Ulmus glabra','harilik jalakas':'Ulmus glabra',
    'paakspuu':'Frangula alnus','harilik paakspuu':'Frangula alnus','lodjapuu':'Viburnum opulus','harilik lodjapuu':'Viburnum opulus',
    'sinilill':'Hepatica nobilis','nurmenukk':'Primula veris','metsmaasikas':'Fragaria vesca','raudrohi':'Achillea millefolium',
    'valge ristik':'Trifolium repens','punane ristik':'Trifolium pratense','põdrakanep':'Chamaenerion angustifolium',
    'harilik kuslapuu':'Lonicera xylosteum','kuslapuu':'Lonicera xylosteum'
  };

  const GENERAL_BY_GENUS = {
    Quercus:'tamm',Juniperus:'kadakas',Betula:'kask',Salix:'paju',Pinus:'mänd',Picea:'kuusk',Acer:'vaher',Tilia:'pärn',
    Sorbus:'pihlakas',Alnus:'lepp',Populus:'haab',Corylus:'sarapuu',Prunus:'toomingas',Malus:'õunapuu',Pyrus:'pirnipuu',
    Rosa:'kibuvits',Fraxinus:'saar',Ulmus:'jalakas',Frangula:'paakspuu',Viburnum:'lodjapuu',Lonicera:'kuslapuu',
    Calluna:'kanarbik',Vaccinium:'mustikas / pohl',Achillea:'raudrohi',Trifolium:'ristik',Fragaria:'maasikas',
    Primula:'nurmenukk',Hepatica:'sinilill',Chamaenerion:'põdrakanep',Epilobium:'pajulill',Allium:'lauk',Myrica:'porss',
    Iris:'võhumõõk',Platanthera:'käokeel',Dactylorhiza:'sõrmkäpp',Epipactis:'neiuvaip',Orchis:'käpp',Pulsatilla:'karukell',
    Nymphaea:'vesiroos',Nuphar:'vesikupp',Potamogeton:'penikeel',Carex:'tarn',Juncus:'luga',Festuca:'aruhein',Poa:'nurmikas',
    Rubus:'murakas / vaarikas',Viola:'kannike',Geranium:'kurereha',Artemisia:'puju',Hypericum:'naistepuna',Lathyrus:'seahernes',
    Vicia:'hiirehernes',Lotus:'nõiahammas',Thalictrum:'ängelhein',Potentilla:'maran',Dasiphora:'maran',Cornus:'kukits',
    Euonymus:'kikkapuu',Lycopodium:'kold',Huperzia:'kold',Goodyera:'öövilge',Gymnadenia:'käoraamat',Neottia:'käopõll / pesajuur',
    Lamium:'iminõges',Ficaria:'kanakoole',Anemone:'ülane',Bellis:'kirikakar',Chelidonium:'vereurmarohi',Urtica:'nõges',
    Ranunculus:'tulikas',Taraxacum:'võilill',Plantago:'teeleht',Galium:'madar',Veronica:'mailane',Stellaria:'tähthein',
    Cerastium:'kadakkaer',Myosotis:'meelespea',Glechoma:'maajalg',Aegopodium:'naat',Anthriscus:'harakputk',Heracleum:'karuputk',
    Daucus:'porgand',Rumex:'oblikas',Polygonum:'kirburohi',Persicaria:'kirburohi',Chenopodium:'hanemalts',Atriplex:'malts',
    Cirsium:'ohakas',Carduus:'ohakas',Sonchus:'piimohakas',Leontodon:'seanupp',Hypochaeris:'seanupp',Crepis:'koeratubakas',
    Hieracium:'hunditubakas',Pilosella:'karutubakas',Arctium:'takjas',Centaurea:'jumikas',Matricaria:'kummel',
    Tripleurospermum:'kummel',Tanacetum:'soolikarohi',Tussilago:'paiseleht',Solidago:'kuldvits',Campanula:'kellukas',
    Knautia:'äiatar',Scabiosa:'tähtpea',Succisa:'peetrileht',Medicago:'lutsern',Melilotus:'mesikas',Astragalus:'hundihammas',
    Oxytropis:'hundihammas',Oenothera:'kuningakepp',Filipendula:'angervaks',Alchemilla:'kortsleht',Geum:'maajalg',
    Sanguisorba:'punnpea',Agrimonia:'maarjalepp',Lysimachia:'metstarn',Lythrum:'kukesaba',Mentha:'münt',Thymus:'liivatee',
    Origanum:'pune',Prunella:'käbihein',Ajuga:'akakapsas',Salvia:'salvei',Stachys:'nõianõges',Galeopsis:'kõrvik',
    Scutellaria:'kilbuk',Erodium:'kurereha',Oxalis:'jänesekapsas',Caltha:'varsakabi',Aquilegia:'kurekell',Aconitum:'käoking',
    Convallaria:'maikelluke',Maianthemum:'laanelill',Paris:'ussilakk',Polygonatum:'kuutõverohi',Asarum:'metspipar',
    Pulmonaria:'kopsurohi',Symphytum:'varemerohi',Digitalis:'sõrmkübar',Linaria:'käokannus',Melampyrum:'härghein',
    Rhinanthus:'robirohi',Euphrasia:'silmarohi',Pedicularis:'kuuskjalg',Orobanche:'soomukas',Equisetum:'osi',
    Dryopteris:'sõnajalg',Athyrium:'sõnajalg',Gymnocarpium:'kolmissõnajalg',Pteridium:'kilpjalg',Polypodium:'kiviürt',
    Asplenium:'raunjalg',Luzula:'piiphein',Eriophorum:'villpea',Eleocharis:'alss',Scirpus:'kõrkjas',Schoenoplectus:'kõrkjas',
    Typha:'hundinui',Phragmites:'pilliroog',Phalaris:'paelrohi',Deschampsia:'kastik',Agrostis:'kastehein',Dactylis:'kerahein',
    Phleum:'timut',Alopecurus:'rebasesaba',Bromus:'luste',Elymus:'orashein'
  };

  const LAND_LABELS = {
    wetland:'Märgala',wood:'Mets',forest:'Mets',meadow:'Niit / rohumaa',grass:'Rohumaa',farmland:'Põllumaa',
    orchard:'Viljapuuaed',heath:'Nõmm',scrub:'Põõsastik',residential:'Hoonestatud ala',industrial:'Tööstusala',
    commercial:'Äriala',cemetery:'Haljasala',recreation_ground:'Haljasala'
  };

  const state = {
    plant: null,
    file: null,
    location: null,
    marker: null,
    map: null,
    toastTimer: null,
    searchTimer: null,
    analysisId: 0
  };

  function debug(...args){ console.debug('[BioGlow]', ...args); }
  function scrollToId(id){ $(id)?.scrollIntoView({behavior:'smooth', block:'start'}); }
  function setStatus(message, type=''){
    const node = $('status');
    if(!node) return;
    node.textContent = message;
    node.className = `status ${type}`;
  }
  function toast(message){
    const node = $('toast');
    if(!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.add('hidden'), 2600);
  }
  function matchesName(name, list){
    const n = norm(name);
    return list.some(item => {
      const i = norm(item);
      return n === i || n.startsWith(i + ' ') || i.startsWith(n + ' ');
    });
  }
  function isInvasive(name){ return matchesName(name, INVASIVE); }
  function protectedInfo(name){
    if(matchesName(name, PROTECTED_I)) return {category:'I', common:null};
    if(matchesName(name, PROTECTED_II)) return {category:'II', common:null};
    const n = norm(name);
    for(const [common, names] of PROTECTED_III){
      if(names.some(item => {
        const i = norm(item);
        return n === i || n.startsWith(i + ' ') || i.startsWith(n + ' ');
      })) return {category:'III', common};
    }
    return null;
  }
  function generalName(scientific, shown=''){
    const sci = String(scientific || '').trim();
    const genus = sci.split(/\s+/)[0];
    if(GENERAL_BY_GENUS[genus]) return GENERAL_BY_GENUS[genus];
    let name = String(shown || '').trim().toLowerCase();
    if(name.startsWith('harilik ')) name = name.slice(8);
    const exact = {
      'arukask':'kask','sookask':'kask','sanglepp':'lepp','hall lepp':'lepp','harilik haab':'haab',
      'harilik sarapuu':'sarapuu','harilik toomingas':'toomingas','harilik vaher':'vaher','harilik pärn':'pärn','harilik pihlakas':'pihlakas'
    };
    if(exact[name]) return exact[name];
    if(/^[A-Z][a-z-]+\s+[a-z]/.test(String(shown || ''))) return genus || 'taim';
    return name || shown || scientific || 'taim';
  }
  function aliasFor(query){ return SIMPLE_NAMES[norm(query)] || EXTRA_NAMES[norm(query)] || null; }

  async function fetchWithTimeout(url, options={}, timeoutMs=6000){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try{
      const response = await fetch(url, {...options, signal: controller.signal});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
  async function fetchJson(url, options={}, timeoutMs=6000){
    return (await fetchWithTimeout(url, options, timeoutMs)).json();
  }

  function initMap(){
    if(!window.L){
      debug('Leaflet puudub');
      $('map').innerHTML = '<div class="empty-result"><b>Kaarti ei saanud laadida</b><p>Värskenda lehte või kontrolli internetiühendust.</p></div>';
      return;
    }
    state.map = L.map('map', {zoomControl:true}).setView([58.65, 25.1], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap'}).addTo(state.map);
    state.map.on('click', event => {
      setLocation(event.latlng.lat, event.latlng.lng, 'kaardilt valitud');
      toast('Asukoht valitud kaardilt.');
    });
    try{
      const soil = L.tileLayer.wms('https://kaart.maaamet.ee/wms/alus-geo?', {
        layers:'mullaraster',format:'image/png',transparent:true,version:'1.1.1',attribution:'Mullastik, Maa- ja Ruumiamet'
      });
      const land = L.tileLayer.wms('https://kaart.maaamet.ee/wms/alus-geo?', {
        layers:'BK_METS,BK_LAGE,BK_SOO,BK_RABA,BK_POLD,BK_POOSASTIK,BK_ASUSTUS,BK_HALJASALA',
        format:'image/png',transparent:true,version:'1.1.1',attribution:'Maakate, Maa- ja Ruumiamet'
      });
      L.control.layers({}, {'MaRu mullakaart':soil,'MaRu maakate':land}, {collapsed:true}).addTo(state.map);
    } catch(error){ debug('MaRu kihid ei laadinud', error); }
  }

  const addressSearch = {id:0, controller:null, cache:new Map()};
  const addressText = key => window.BioGlowI18n?.t('address.' + key) || ({
    short:'Sisesta vähemalt 3 märki.', loading:'Otsin aadressi…',
    empty:'Aadressi ei leitud. Lisa linn või vald või vali koht kaardilt.',
    results:'Vali allpool õige aadress.',
    selected:'Aadress valitud. Täpsusta istutuskoht kaardil, näiteks aias või peenras.',
    error:'Aadressiotsing ei vasta. Proovi uuesti või vali koht kaardilt.'
  })[key];

  function cancelAddressSearch(clearInput = false){
    addressSearch.id++;
    addressSearch.controller?.abort();
    addressSearch.controller = null;
    $('addressSearchBtn').disabled = false;
    $('addressForm').removeAttribute('aria-busy');
    $('addressResults').replaceChildren();
    $('addressResults').classList.add('hidden');
    $('addressStatus').textContent = '';
    if(clearInput) $('addressInput').value = '';
  }

  async function searchAddress(event){
    event.preventDefault();
    cancelAddressSearch();
    const query = $('addressInput').value.trim();
    if(query.length < 3){
      $('addressStatus').textContent = addressText('short');
      return;
    }
    const id = addressSearch.id;
    const controller = new AbortController();
    addressSearch.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    $('addressSearchBtn').disabled = true;
    $('addressForm').setAttribute('aria-busy', 'true');
    $('addressStatus').textContent = addressText('loading');
    try{
      const key = norm(query);
      let rows = addressSearch.cache.get(key);
      if(!rows){
        const url = new URL('https://aks.geoportaal.ee/inaks/inaadress/gazetteer');
        url.searchParams.set('address', query);
        url.searchParams.set('results', '8');
        const response = await fetch(url, {signal:controller.signal});
        if(!response.ok) throw new Error('Address search HTTP ' + response.status);
        const data = await response.json();
        if(!Array.isArray(data.addresses)) throw new Error('Invalid address response');
        const seen = new Set();
        rows = data.addresses.map(row => ({
          label:row.ipikkaadress || row.pikkaadress || row.taisaadress,
          lat:parseFloat(row.viitepunkt_b), lon:parseFloat(row.viitepunkt_l)
        })).filter(row => {
          if(!row.label || !Number.isFinite(row.lat) || !Number.isFinite(row.lon) ||
             Math.abs(row.lat) > 90 || Math.abs(row.lon) > 180) return false;
          const identity = row.label + ':' + row.lat + ':' + row.lon;
          if(seen.has(identity)) return false;
          seen.add(identity);
          return true;
        }).slice(0, 8);
        if(addressSearch.cache.size >= 30) addressSearch.cache.delete(addressSearch.cache.keys().next().value);
        addressSearch.cache.set(key, rows);
      }
      if(id !== addressSearch.id) return;
      $('addressStatus').textContent = addressText(rows.length ? 'results' : 'empty');
      for(const row of rows){
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = row.label;
        button.addEventListener('click', () => {
          setLocation(row.lat, row.lon, 'aadress');
          $('addressInput').value = row.label;
          $('addressStatus').textContent = addressText('selected');
          $('addressInput').focus();
        });
        item.append(button);
        $('addressResults').append(item);
      }
      $('addressResults').classList.toggle('hidden', !rows.length);
    } catch(error){
      if(id === addressSearch.id) $('addressStatus').textContent = addressText('error');
    } finally {
      clearTimeout(timeout);
      if(id === addressSearch.id){
        addressSearch.controller = null;
        $('addressSearchBtn').disabled = false;
        $('addressForm').removeAttribute('aria-busy');
      }
    }
  }

  function setLocation(lat, lon, source){
    lat = Number(lat); lon = Number(lon);
    if(!Number.isFinite(lat) || !Number.isFinite(lon)){
      setStatus('Asukoha koordinaadid ei ole õiged.', 'error');
      return;
    }
    cancelAddressSearch(true);
    state.location = {lat, lon, source};
    if(state.map){
      if(state.marker) state.map.removeLayer(state.marker);
      state.marker = L.marker([lat, lon]).addTo(state.map).bindPopup('Analüüsitav koht').openPopup();
      state.map.setView([lat, lon], 15);
      setTimeout(() => state.map?.invalidateSize(), 80);
    }
    $('coordText').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    $('mapBadge').textContent = source;
    $('locationState').innerHTML = `<span class="dot ready"></span><span>Asukoht valmis: ${esc(source)}</span>`;
    setStatus(`Asukoht valitud: ${source}.`, 'ok');
  }

  function useDeviceLocation(){
    if(!navigator.geolocation){
      setStatus('Brauser ei toeta asukoha määramist. Vali punkt kaardilt.', 'error');
      return;
    }
    $('locationState').innerHTML = '<span class="dot"></span><span>Otsin sinu asukohta…</span>';
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation(pos.coords.latitude, pos.coords.longitude, 'seadme asukoht'); toast('Asukoht leitud.'); },
      error => {
        const message = error.code === 1 ? 'Asukoha luba on keelatud. Vali punkt kaardilt.' : 'Asukohta ei saanud leida. Vali punkt kaardilt.';
        $('locationState').innerHTML = `<span class="dot"></span><span>${esc(message)}</span>`;
        setStatus(message, 'warn');
      },
      {enableHighAccuracy:true, timeout:12000, maximumAge:60000}
    );
  }

  async function readPhoto(file){
    if(!file || !/\.jpe?g$/i.test(file.name)){
      setStatus('Kasuta JPG või JPEG fotot.', 'error');
      return;
    }
    state.file = file;
    $('preview').src = URL.createObjectURL(file);
    $('photoName').textContent = file.name;
    $('photoMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · GPS-i kontroll…`;
    $('photoRow').classList.remove('hidden');
    if(!window.exifr){
      $('photoMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · GPS-lugeja pole saadaval`;
      return;
    }
    try{
      const exif = await exifr.parse(file, {gps:true}) || {};
      if(exif.latitude != null && exif.longitude != null){
        setLocation(exif.latitude, exif.longitude, 'foto GPS');
        $('photoMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · GPS leitud`;
      } else {
        $('photoMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · GPS puudub`;
        setStatus('Fotol GPS puudub — vali asukoht kaardilt või seadmest.', 'warn');
      }
    } catch(error){
      debug('EXIF viga', error);
      $('photoMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · GPS-i ei saanud lugeda`;
    }
  }

  function removePhoto(){
    state.file = null;
    $('files').value = '';
    $('photoRow').classList.add('hidden');
    $('preview').src = '';
    $('photoName').textContent = '';
    $('photoMeta').textContent = '';
    setStatus(state.location ? 'Foto eemaldatud. Asukoht jääb alles.' : 'Foto eemaldatud.');
  }

  async function gbifMatch(name){
    const data = await fetchJson(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`, {}, 5000);
    if(!data.usageKey && !data.speciesKey) return null;
    return {
      key:data.usageKey || data.speciesKey,
      scientific:data.canonicalName || data.scientificName || name,
      vernacular:data.vernacularName || ''
    };
  }
  async function gbifSuggest(query){
    const data = await fetchJson(`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&limit=10`, {}, 5000);
    return (data || []).filter(item => item.rank === 'SPECIES' || item.rank === 'SUBSPECIES');
  }
  function setChosenPlant(plant){
    state.plant = {...plant, common:plant.common || DISPLAY[plant.scientific] || plant.vernacular || plant.scientific, media:''};
    $('plantInput').value = state.plant.common;
    $('clearPlant').classList.remove('hidden');
    $('suggest').classList.add('hidden');
    renderChosenPlant();
    loadChosenPlantImage(state.plant.key);
  }
  function renderChosenPlant(){
    const root = $('chosen');
    if(!state.plant){ root.classList.add('hidden'); root.innerHTML = ''; return; }
    const protection = protectedInfo(state.plant.scientific);
    const invasive = isInvasive(state.plant.scientific);
    const badge = invasive
      ? '<span class="tag danger">võõr-/invasiivse liigi kontroll</span>'
      : protection
        ? `<span class="tag protected">🛡 ${protection.category} kaitsekategooria</span>`
        : '<span class="tag normal">tavapärane liik</span>';
    const image = state.plant.media
      ? `<div class="chosen-photo"><img src="${esc(state.plant.media)}" alt="${esc(state.plant.common)}" loading="lazy" referrerpolicy="no-referrer"></div>`
      : '<div class="chosen-photo">🌿</div>';
    root.innerHTML = `${image}<div><small>VALITUD TAIM</small><b>${esc(state.plant.common)}</b><em>${esc(state.plant.scientific)}</em>${badge}</div>`;
    root.classList.remove('hidden');
  }
  async function loadChosenPlantImage(key){
    const selectionKey = key;
    try{
      const data = await fetchJson(`https://api.gbif.org/v1/occurrence/search?taxon_key=${key}&media_type=StillImage&limit=8`, {}, 3500);
      const media = (data.results || []).flatMap(item => item.media || []).find(item => item.identifier);
      if(media?.identifier && state.plant?.key === selectionKey){
        state.plant.media = media.identifier;
        renderChosenPlant();
      }
    } catch(error){ debug('Valitud taime pilt puudub', error); }
  }
  async function loadSuggestions(query, autoPick=false){
    const alias = aliasFor(query);
    try{
      const items = [];
      const seen = new Set();
      if(alias){
        const exact = await gbifMatch(alias).catch(() => null);
        if(exact){ items.push(exact); seen.add(exact.key); }
      }
      const suggestions = await gbifSuggest(alias || query).catch(() => []);
      for(const item of suggestions){
        const key = item.key || item.usageKey;
        if(!key || seen.has(key)) continue;
        seen.add(key);
        items.push({key, scientific:item.canonicalName || item.scientificName || query, vernacular:item.vernacularName || ''});
      }
      if(autoPick && items[0]){
        const item = items[0];
        setChosenPlant({...item, common:DISPLAY[item.scientific] || item.vernacular || query});
        return;
      }
      const root = $('suggest');
      if(!items.length){ root.innerHTML = '<button type="button" disabled>Ei leidnud vastet.</button>'; root.classList.remove('hidden'); return; }
      root.innerHTML = items.slice(0,8).map((item, index) => {
        const common = DISPLAY[item.scientific] || item.vernacular || query;
        return `<button type="button" data-suggestion="${index}"><b>${esc(common)}</b><small>${esc(item.scientific)}</small></button>`;
      }).join('');
      root.classList.remove('hidden');
      root.querySelectorAll('[data-suggestion]').forEach(button => {
        button.addEventListener('click', () => {
          const item = items[Number(button.dataset.suggestion)];
          setChosenPlant({...item, common:DISPLAY[item.scientific] || item.vernacular || query});
        });
      });
    } catch(error){
      debug('Taimeotsingu viga', error);
      $('suggest').innerHTML = '<button type="button" disabled>Taimede otsing ebaõnnestus.</button>';
      $('suggest').classList.remove('hidden');
    }
  }
  async function resolveTypedPlant(){
    if(state.plant) return state.plant;
    const raw = $('plantInput').value.trim();
    if(!raw) return null;
    const alias = aliasFor(raw);
    try{
      let item = alias ? await gbifMatch(alias).catch(() => null) : null;
      if(!item){
        const suggestions = await gbifSuggest(alias || raw);
        const first = suggestions[0];
        if(first) item = {key:first.key || first.usageKey, scientific:first.canonicalName || first.scientificName || raw, vernacular:first.vernacularName || ''};
      }
      if(!item) return null;
      setChosenPlant({...item, common:DISPLAY[item.scientific] || item.vernacular || raw});
      return state.plant;
    } catch(error){ debug('Kirjutatud taime lahendamine ebaõnnestus', error); return null; }
  }

  async function nearbyPlants(lat, lon){
    const url = new URL('https://api.gbif.org/v1/occurrence/search');
    url.searchParams.set('decimalLatitude', `${lat - .09},${lat + .09}`);
    url.searchParams.set('decimalLongitude', `${lon - .16},${lon + .16}`);
    url.searchParams.set('kingdomKey', '6');
    url.searchParams.set('country', 'EE');
    url.searchParams.set('hasCoordinate', 'true');
    url.searchParams.set('limit', '300');
    const data = await fetchJson(url, {}, 7000);
    const species = new Map();
    for(const row of data.results || []){
      if(!row.speciesKey || !row.species) continue;
      const current = species.get(row.speciesKey) || {
        key:row.speciesKey,
        name:DISPLAY[row.species] || row.vernacularName || row.species,
        scientific:row.species,
        count:0,media:'',creator:'',license:''
      };
      current.count += 1;
      const media = (row.media || []).find(item => item.identifier);
      if(!current.media && media){ current.media = media.identifier; current.creator = media.creator || ''; current.license = media.license || ''; }
      species.set(row.speciesKey, current);
    }
    return [...species.values()].sort((a,b) => b.count - a.count);
  }
  async function selectedPlantCount(key, lat, lon){
    const url = new URL('https://api.gbif.org/v1/occurrence/search');
    url.searchParams.set('taxon_key', key);
    url.searchParams.set('decimalLatitude', `${lat - .09},${lat + .09}`);
    url.searchParams.set('decimalLongitude', `${lon - .16},${lon + .16}`);
    url.searchParams.set('country', 'EE');
    url.searchParams.set('hasCoordinate', 'true');
    url.searchParams.set('limit', '0');
    const data = await fetchJson(url, {}, 5500);
    return Number(data.count || 0);
  }
  async function photoAI(file, location){
    if(!file) return 'Fotot ei kasutatud';
    try{
      const form = new FormData();
      form.append('image', file);
      form.append('latitude', location.lat);
      form.append('longitude', location.lon);
      const data = await (await fetchWithTimeout(`${WORKER}/identify`, {method:'POST', body:form}, 6500)).json();
      const top = data.results?.[0];
      return top?.species?.commonNames?.[0] || top?.species?.scientificNameWithoutAuthor || top?.species?.scientificName || 'AI analüüs tehtud';
    } catch(error){ debug('Foto AI polnud saadaval', error); return 'AI polnud saadaval'; }
  }

  function renderResult(selectedCount, nearby, aiText){
    const root = $('verdict');
    const evidence = $('evidenceList');
    const protection = protectedInfo(state.plant.scientific);
    const invasive = isInvasive(state.plant.scientific);
    const best = nearby[0]?.count || 0;
    const strength = best > 0 && selectedCount != null ? Math.max(0, Math.min(100, Math.round(selectedCount / best * 100))) : 0;
    let kind = 'bad', title = 'Ei sobi hästi', label = 'NÕRK SOBIVUS', copy = 'Selle taime kohta ei leitud siin piisavalt kohalikku vaatlustõendit. Vaata allpool tugevama kohaliku andmetoega alternatiive.';

    if(invasive){
      title = 'Ära istuta loodusesse'; label = 'HOIATUS'; copy = 'See liik on BioGlow võõr-/invasiivsete liikide kontrollnimekirjas. Kohalike vaatluste olemasolu ei muuda seda tavaliseks istutussoovituseks.';
    } else if(protection?.category === 'I' || protection?.category === 'II'){
      kind = 'maybe'; title = 'Kaitsealune liik'; label = `${protection.category} KAITSEKATEGOORIA`; copy = 'BioGlow ei anna I–II kaitsekategooria liigile tavapärast istutussoovitust ega kuva tundlikku lähileviku infot. Ära võta taimi loodusest.';
    } else if(strength >= 50){
      kind = 'good'; title = 'Sobib'; label = 'SOBIB'; copy = `Valitud liigi kohta leiti lähialalt ${selectedCount} avalikku vaatlust. Kohalik levik toetab seda valikut.`;
    } else if(selectedCount > 0){
      kind = 'maybe'; title = 'Võib sobida'; label = 'VAJAB KONTROLLI'; copy = `Valitud liigi kohta leiti lähialalt ${selectedCount} vaatlust, kuid teistel liikidel on tugevam kohalik andmetugi.`;
    }

    const countChip = selectedCount == null ? '<span class="result-chip">lähileviku detail peidetud</span>' : `<span class="result-chip">${selectedCount} vaatlust</span>`;
    root.className = `verdict-card ${kind}`;
    root.innerHTML = `
      <div class="verdict-top"><div class="verdict-icon">${kind === 'good' ? '✓' : kind === 'maybe' ? '?' : '!'}</div><div><small>${esc(label)}</small><h3>${esc(title)}</h3></div></div>
      <div class="selected-result"><b>${esc(state.plant.common)}</b><span>${esc(state.plant.scientific)}</span></div>
      <p>${esc(copy)}</p>
      <div class="result-chips">${countChip}${selectedCount != null ? `<span class="result-chip">kohalik andmetugi ${strength}%</span>` : ''}${protection ? `<span class="result-chip protect">🛡 ${protection.category} kaitsekategooria</span>` : ''}</div>
      ${protection ? '<div class="safety-note">Kaitsealust taime ei käsitleta tavapärase istutussoovitusena. Ära võta taimi loodusest.</div>' : ''}`;

    const total = nearby.reduce((sum, item) => sum + item.count, 0);
    evidence.innerHTML = `
      <div class="evidence-row"><span>⌖</span><div><small>Kohalikud vaatlused</small><b>${selectedCount == null ? 'Tundlik detail peidetud' : `${selectedCount} valitud liigi vaatlust`}</b><p>${total} avalikku taimekirjet ümbruses</p></div></div>
      <div class="evidence-row"><span>◎</span><div><small>Foto AI</small><b>${esc(aiText)}</b><p>Visuaalne lisakontekst; ei otsusta tulemust üksinda</p></div></div>
      <div class="evidence-row"><span>🛡</span><div><small>Kaitsestaatus</small><b>${protection ? `${protection.category} kaitsekategooria` : 'Ei tuvastatud'}</b><p>${invasive ? 'Võõr-/invasiivse liigi hoiatus' : 'Kontrollitud'}</p></div></div>`;
  }

  function renderAlternatives(nearby){
    const root = $('plants');
    const unique = [];
    const seen = new Set();
    for(const item of nearby){
      if(item.key === state.plant.key || isInvasive(item.scientific) || protectedInfo(item.scientific)) continue;
      const simple = generalName(item.scientific, item.name);
      const key = norm(simple);
      if(seen.has(key)) continue;
      seen.add(key);
      unique.push({...item, simple});
      if(unique.length === 6) break;
    }
    if(!unique.length){
      root.innerHTML = '<div class="empty-result"><b>Alternatiive ei leitud piisavalt</b><p>Proovi mõnda teist lähedast punkti.</p></div>';
      return;
    }
    root.innerHTML = unique.map((item, index) => `
      <article class="plant-card">
        <div id="alt-image-${index}" class="plant-media">${item.media ? `<img src="${esc(item.media)}" alt="${esc(item.simple)}" loading="lazy" referrerpolicy="no-referrer">` : '<div class="plant-placeholder">🌿<small>Pilt laadib…</small></div>'}</div>
        <div class="plant-body"><span class="plant-rank">${index === 0 ? 'TUGEVAM KANDIDAAT' : `KANDIDAAT ${index + 1}`}</span><h4>${esc(item.simple)}</h4><div class="latin">${esc(item.name !== item.scientific ? `${item.name} · ${item.scientific}` : item.scientific)}</div><div class="plant-evidence"><span>⌖</span><span>Kohalikke vaatlusi <b>${item.count}</b></span></div></div>
      </article>`).join('');
    unique.forEach((item, index) => { if(!item.media) loadAlternativeImage(item, index); });
  }

  async function loadAlternativeImage(item, index){
    const rootId = `alt-image-${index}`;
    try{
      const data = await fetchJson(`https://api.gbif.org/v1/occurrence/search?taxon_key=${item.key}&media_type=StillImage&limit=5`, {}, 3000);
      const media = (data.results || []).flatMap(row => row.media || []).find(row => row.identifier);
      const root = $(rootId);
      if(!root) return;
      root.innerHTML = media?.identifier
        ? `<img src="${esc(media.identifier)}" alt="${esc(item.simple)}" loading="lazy" referrerpolicy="no-referrer">`
        : '<div class="plant-placeholder">🌿<small>Pilt pole saadaval</small></div>';
    } catch(error){
      const root = $(rootId);
      if(root) root.innerHTML = '<div class="plant-placeholder">🌿<small>Pilt pole saadaval</small></div>';
    }
  }

  function renderConservation(nearby){
    const root = $('conservation');
    const hits = nearby.map(item => ({item, info:protectedInfo(item.scientific)})).filter(row => row.info?.category === 'III');
    if(!hits.length){
      root.innerHTML = '<div class="conservation-card"><div class="conservation-symbol">🛡️</div><div><small>LOODUSKAITSE</small><b>III kaitsekategooria taime ei leitud</b><p>Avalikest lähivaatlustest ei leitud sobivat III kategooria liiki. See ei tähenda, et kaitsealuseid liike piirkonnas pole.</p></div></div>';
      return;
    }
    hits.sort((a,b) => a.item.count - b.item.count);
    const hit = hits[0];
    root.innerHTML = `<div class="conservation-card"><div class="conservation-symbol">🛡️</div><div><small>LOODUSKAITSE VÕIMALUS</small><b>${esc(hit.info.common || hit.item.name)}</b><span>${esc(hit.item.scientific)} · III kaitsekategooria</span><p>Seda liiki oli avalikus lähiala päringus ${hit.item.count} vaatlust. BioGlow soovitab toetada olemasolevat kasvukohta, mitte võtta taime loodusest.</p></div></div>`;
  }

  const average = values => {
    const valid = (values || []).map(Number).filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  };

  async function environmentElevation(lat, lon){
    const data = await fetchJson(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, {}, 4500);
    const value = Number(data.elevation?.[0]);
    return Number.isFinite(value) ? {label:`${Math.round(value)} m`, detail:'Copernicus DEM GLO-90'} : null;
  }
  async function environmentWeather(lat, lon){
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat); url.searchParams.set('longitude', lon);
    url.searchParams.set('hourly', 'soil_moisture_0_to_7cm,shortwave_radiation,cloud_cover');
    url.searchParams.set('past_days', '7'); url.searchParams.set('forecast_days', '1');
    const data = await fetchJson(url, {}, 5000);
    const moisture = average(data.hourly?.soil_moisture_0_to_7cm);
    const radiation = average((data.hourly?.shortwave_radiation || []).filter(value => Number(value) > 0));
    const cloud = average(data.hourly?.cloud_cover);
    return {
      moisture: moisture == null ? null : {label:moisture < .18 ? 'Pigem kuiv' : moisture < .30 ? 'Keskmine' : 'Pigem niiske', detail:`${moisture.toFixed(2)} m³/m³ · ~7 päeva`},
      light: radiation == null ? null : {label:radiation < 120 ? 'Vähe valgust' : radiation < 260 ? 'Keskmine' : 'Palju valgust', detail:`${Math.round(radiation)} W/m²${cloud != null ? ` · pilvisus ${Math.round(cloud)}%` : ''}`}
    };
  }
  async function environmentLand(lat, lon){
    const query = `[out:json][timeout:5];(way(around:120,${lat},${lon})["landuse"];relation(around:120,${lat},${lon})["landuse"];way(around:120,${lat},${lon})["natural"];relation(around:120,${lat},${lon})["natural"];);out tags center 30;`;
    const data = await fetchJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {}, 5000);
    const values = (data.elements || []).map(item => item.tags?.natural || item.tags?.landuse).filter(Boolean);
    const priority = ['wetland','wood','forest','meadow','grass','farmland','heath','scrub','orchard','residential','recreation_ground','cemetery','industrial','commercial'];
    const value = priority.find(item => values.includes(item)) || values[0];
    return value ? {label:LAND_LABELS[value] || value.replaceAll('_',' '), detail:'OpenStreetMap · ~120 m ümbrus'} : null;
  }
  function soilUrl(property, layer, lat, lon){
    const d = .01;
    const params = new URLSearchParams({
      map:`/map/${property}.map`,SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetFeatureInfo',
      BBOX:`${lat-d},${lon-d},${lat+d},${lon+d}`,CRS:'EPSG:4326',WIDTH:'101',HEIGHT:'101',LAYERS:layer,STYLES:'',
      FORMAT:'image/tiff',QUERY_LAYERS:layer,INFO_FORMAT:'text/html',I:'50',J:'50',FEATURE_COUNT:'1'
    });
    return `https://maps.isric.org/mapserv?${params}`;
  }
  async function soilValue(property, layer, lat, lon){
    const text = await (await fetchWithTimeout(soilUrl(property, layer, lat, lon), {}, 4500)).text();
    const stripped = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const numbers = [...stripped.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0])).filter(Number.isFinite);
    return numbers.length ? numbers[numbers.length - 1] / 10 : null;
  }
  async function environmentSoil(lat, lon){
    const [ph, clay, sand] = await Promise.all([
      soilValue('phh2o','phh2o_0-5cm_Q0.5',lat,lon).catch(() => null),
      soilValue('clay','clay_0-5cm_Q0.5',lat,lon).catch(() => null),
      soilValue('sand','sand_0-5cm_Q0.5',lat,lon).catch(() => null)
    ]);
    if(ph == null && clay == null && sand == null) return null;
    let label = 'Mulla lõimis';
    if(clay != null && sand != null) label = clay >= 40 ? 'Savine' : sand >= 70 ? 'Liivane' : clay >= 25 ? 'Saviliiv / liivsavi' : 'Keskmise lõimisega';
    const parts = [];
    if(ph != null) parts.push(`pH ${ph.toFixed(1)}`);
    if(sand != null) parts.push(`liiv ${Math.round(sand)}%`);
    if(clay != null) parts.push(`savi ${Math.round(clay)}%`);
    return {label, detail:parts.join(' · ') || 'SoilGrids 250 m mudel'};
  }
  function setEnv(id, detailId, data, fallback){
    $(id).textContent = data?.label || 'Pole saadaval';
    $(detailId).textContent = data?.detail || fallback;
  }
  async function loadEnvironment(lat, lon, analysisId){
    ['elevationValue','landValue','soilValue','moistureValue','lightValue'].forEach(id => $(id).textContent = '…');
    const [elevation, weather, land, soil] = await Promise.allSettled([
      environmentElevation(lat,lon), environmentWeather(lat,lon), environmentLand(lat,lon), environmentSoil(lat,lon)
    ]);
    if(analysisId !== state.analysisId) return;
    setEnv('elevationValue','elevationDetail',elevation.status === 'fulfilled' ? elevation.value : null,'Kõrgusandmeid ei saadud');
    setEnv('landValue','landDetail',land.status === 'fulfilled' ? land.value : null,'Maastikuandmeid ei saadud');
    setEnv('soilValue','soilDetail',soil.status === 'fulfilled' ? soil.value : null,'Vaata kaardilt MaRu mullakihti');
    const weatherValue = weather.status === 'fulfilled' ? weather.value : null;
    setEnv('moistureValue','moistureDetail',weatherValue?.moisture,'Niiskusandmeid ei saadud');
    setEnv('lightValue','lightDetail',weatherValue?.light,'Valgusandmeid ei saadud');
  }

  async function runAnalysis(){
    const button = $('analyzeBtn');
    const analysisId = ++state.analysisId;
    try{
      if(!await resolveTypedPlant()){
        setStatus('Ma ei leidnud seda taime. Proovi näiteks „kadakas”.', 'error');
        return;
      }
      if(!state.location){
        setStatus('Vali asukoht kaardilt, seadmest või GPS-iga fotost.', 'error');
        scrollToId('map');
        return;
      }
      button.disabled = true;
      button.textContent = 'Analüüsin…';
      setStatus('Kogun kohalikke andmeid…');
      $('resultEmpty').classList.add('hidden');
      $('resultContent').classList.remove('hidden');
      $('verdict').className = 'verdict-card';
      $('verdict').innerHTML = '<div class="selected-result"><b>Analüüsin…</b><span>Kogun andmeid</span></div>';
      $('plants').innerHTML = '<div class="empty-result"><b>Otsin soovitusi…</b><p>Taimekaardid ilmuvad kohe, pildid võivad laadida hiljem.</p></div>';

      const [nearby, aiText] = await Promise.all([
        nearbyPlants(state.location.lat, state.location.lon),
        photoAI(state.file, state.location)
      ]);
      if(analysisId !== state.analysisId) return;
      if(!nearby.length) throw new Error('Selle koha ümbrusest ei leitud piisavalt avalikke taimevaatlusi.');

      const protection = protectedInfo(state.plant.scientific);
      const sensitive = protection?.category === 'I' || protection?.category === 'II';
      const selectedCount = sensitive ? null : await selectedPlantCount(state.plant.key, state.location.lat, state.location.lon).catch(() => 0);
      if(analysisId !== state.analysisId) return;

      renderResult(selectedCount, nearby, aiText);
      renderAlternatives(nearby);
      renderConservation(nearby);
      loadEnvironment(state.location.lat, state.location.lon, analysisId);
      setStatus('Analüüs valmis.', 'ok');
      scrollToId('results');
    } catch(error){
      console.error('[BioGlow] Analüüs ebaõnnestus', error);
      setStatus(error.message || 'Analüüs ebaõnnestus. Proovi uuesti.', 'error');
      $('plants').innerHTML = '<div class="empty-result"><b>Soovitusi ei saanud laadida</b><p>Proovi uuesti või vali teine punkt.</p></div>';
    } finally {
      if(analysisId === state.analysisId){
        button.disabled = false;
        button.textContent = 'Analüüsi sobivust →';
      }
    }
  }

  function clearPlant(){
    state.plant = null;
    $('plantInput').value = '';
    $('clearPlant').classList.add('hidden');
    $('suggest').classList.add('hidden');
    renderChosenPlant();
  }
  function reset(){
    cancelAddressSearch(true);
    state.analysisId += 1;
    clearPlant();
    removePhoto();
    state.location = null;
    if(state.map && state.marker){ state.map.removeLayer(state.marker); state.marker = null; }
    state.map?.setView([58.65,25.1],7);
    $('coordText').textContent = 'Koordinaadid puuduvad';
    $('mapBadge').textContent = 'Klõpsa kaardil';
    $('locationState').innerHTML = '<span class="dot"></span><span>Asukohta pole valitud</span>';
    $('resultContent').classList.add('hidden');
    $('resultEmpty').classList.remove('hidden');
    setStatus('Vali taim ja koht.');
    scrollToId('analyze');
  }

  function bindEvents(){
    $('addressForm').addEventListener('submit', searchAddress);
    $('addressInput').addEventListener('input', () => cancelAddressSearch());
    $('addressInput').addEventListener('keydown', event => {
      if(event.key === 'Escape') cancelAddressSearch();
    });
    document.querySelectorAll('[data-scroll]').forEach(button => button.addEventListener('click', () => scrollToId(button.dataset.scroll)));
    document.querySelectorAll('[data-quick]').forEach(button => button.addEventListener('click', () => {
      $('plantInput').value = button.dataset.quick;
      $('clearPlant').classList.remove('hidden');
      state.plant = null;
      renderChosenPlant();
      loadSuggestions(button.dataset.quick, true);
    }));
    $('plantInput').addEventListener('input', event => {
      clearTimeout(state.searchTimer);
      state.plant = null;
      renderChosenPlant();
      const query = event.target.value.trim();
      $('clearPlant').classList.toggle('hidden', !query);
      if(query.length < 2){ $('suggest').classList.add('hidden'); return; }
      state.searchTimer = setTimeout(() => loadSuggestions(query), 220);
    });
    $('clearPlant').addEventListener('click', clearPlant);
    $('pickFile').addEventListener('click', () => $('files').click());
    $('files').addEventListener('change', () => readPhoto($('files').files[0]));
    $('removePhoto').addEventListener('click', removePhoto);
    $('useLocation').addEventListener('click', useDeviceLocation);
    $('pickMap').addEventListener('click', () => { toast('Klõpsa kaardil soovitud kohale.'); scrollToId('map'); state.map?.invalidateSize(); });
    $('analyzeBtn').addEventListener('click', runAnalysis);
    $('resetBtn').addEventListener('click', reset);
    $('drop').addEventListener('dragover', event => { event.preventDefault(); $('drop').classList.add('drag'); });
    $('drop').addEventListener('dragleave', () => $('drop').classList.remove('drag'));
    $('drop').addEventListener('drop', event => { event.preventDefault(); $('drop').classList.remove('drag'); readPhoto(event.dataTransfer.files[0]); });
    document.addEventListener('click', event => {
      if(!$('suggest').contains(event.target) && event.target !== $('plantInput')) $('suggest').classList.add('hidden');
    });
  }

  function init(){
    try{
      bindEvents();
      initMap();
      debug('FINAL versioon käivitus');
    } catch(error){
      console.error('[BioGlow] Käivitamise viga', error);
      setStatus('Lehe käivitamisel tekkis viga. Värskenda lehte.', 'error');
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
