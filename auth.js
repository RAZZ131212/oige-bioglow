(() => {
  'use strict';

  const SUPABASE_URL = 'https://katkzrlbxrllspcgdxew.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_DF8nS5ZdH97_kTe32U_O1w_xZP8Qh52';

  const $ = id => document.getElementById(id);
  let client = null;
  let currentSession = null;
  let lastSavedFingerprint = '';
  let saveTimer = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  }

  function showMessage(message, type = '') {
    const node = $('authMessage');
    if (!node) return;
    node.textContent = message || '';
    node.className = `auth-message ${type}`;
  }

  function showMiniToast(message) {
    let node = $('accountToast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'accountToast';
      node.className = 'account-toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove('show'), 2500);
  }

  function openModal(tab = 'login') {
    const modal = $('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTab(tab);
    setTimeout(() => {
      const target = tab === 'signup' ? $('signupName') : $('loginEmail');
      target?.focus();
    }, 50);
  }

  function closeModal() {
    $('authModal')?.classList.add('hidden');
    document.body.classList.remove('modal-open');
    showMessage('');
  }

  function setTab(tab) {
    const isSignup = tab === 'signup';
    $('authLoginForm')?.classList.toggle('hidden', isSignup);
    $('authSignupForm')?.classList.toggle('hidden', !isSignup);
    $('loginTab')?.classList.toggle('active', !isSignup);
    $('signupTab')?.classList.toggle('active', isSignup);
    showMessage('');
  }

  function displayName(user) {
    const metaName = user?.user_metadata?.display_name?.trim();
    if (metaName) return metaName;
    const email = user?.email || '';
    return email.includes('@') ? email.split('@')[0] : 'Kasutaja';
  }

  function updateAccountUI(session) {
    currentSession = session || null;
    const user = session?.user || null;
    const guestButton = $('accountButton');
    const menu = $('accountMenu');
    const nameNode = $('accountName');
    const emailNode = $('accountEmail');
    const analysesButton = $('myAnalysesButton');

    if (!user) {
      if (guestButton) {
        guestButton.innerHTML = '<span class="account-avatar">👤</span><span>Konto</span>';
        guestButton.dataset.loggedIn = 'false';
      }
      if (analysesButton) analysesButton.classList.add('hidden');
      menu?.classList.add('hidden');
      closeAnalysesModal();
      return;
    }

    const name = displayName(user);
    if (guestButton) {
      guestButton.innerHTML = `<span class="account-avatar">${escapeHtml(name.charAt(0).toUpperCase())}</span><span>${escapeHtml(name)}</span>`;
      guestButton.dataset.loggedIn = 'true';
    }
    if (nameNode) nameNode.textContent = name;
    if (emailNode) emailNode.textContent = user.email || '';
    if (analysesButton) analysesButton.classList.remove('hidden');
  }

  async function login(event) {
    event.preventDefault();
    const email = $('loginEmail')?.value.trim();
    const password = $('loginPassword')?.value || '';
    if (!email || !password) {
      showMessage('Sisesta e-post ja parool.', 'error');
      return;
    }

    const button = $('loginSubmit');
    if (button) button.disabled = true;
    showMessage('Logime sisse…');

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMessage('Sisselogimine õnnestus.', 'success');
      setTimeout(closeModal, 450);
    } catch (error) {
      const msg = String(error?.message || 'Sisselogimine ebaõnnestus.');
      showMessage(msg.includes('Invalid login credentials') ? 'Vale e-post või parool.' : msg, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function signup(event) {
    event.preventDefault();
    const name = $('signupName')?.value.trim();
    const email = $('signupEmail')?.value.trim();
    const password = $('signupPassword')?.value || '';

    if (!name || !email || !password) {
      showMessage('Täida kõik väljad.', 'error');
      return;
    }
    if (password.length < 6) {
      showMessage('Parool peab olema vähemalt 6 märki pikk.', 'error');
      return;
    }

    const button = $('signupSubmit');
    if (button) button.disabled = true;
    showMessage('Loome konto…');

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } }
      });
      if (error) throw error;

      if (data?.session) {
        showMessage('Konto loodud ja oled sisse logitud.', 'success');
        setTimeout(closeModal, 550);
      } else {
        showMessage('Konto loodud. Kontrolli e-posti ja kinnita konto.', 'success');
      }
    } catch (error) {
      showMessage(String(error?.message || 'Konto loomine ebaõnnestus.'), 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function logout() {
    try {
      await client.auth.signOut();
      $('accountMenu')?.classList.add('hidden');
    } catch (error) {
      console.error('[BioGlow Auth]', error);
    }
  }

  function createAnalysesUI() {
    const menu = $('accountMenu');
    const logoutButton = $('logoutButton');
    if (menu && logoutButton && !$('myAnalysesButton')) {
      const button = document.createElement('button');
      button.id = 'myAnalysesButton';
      button.className = 'btn secondary hidden';
      button.type = 'button';
      button.textContent = '📚 Minu analüüsid';
      menu.insertBefore(button, logoutButton);
    }

    if (!$('analysesModal')) {
      const modal = document.createElement('div');
      modal.id = 'analysesModal';
      modal.className = 'analyses-modal hidden';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="analyses-card">
          <button id="analysesClose" class="auth-close" type="button" aria-label="Sulge">×</button>
          <span class="eyebrow">SINU BIOGLOW</span>
          <div class="analyses-title-row">
            <div><h2>Minu analüüsid</h2><p>Siin on sinu kontole automaatselt salvestatud analüüsid.</p></div>
            <span id="analysesCount" class="analyses-count">0</span>
          </div>
          <div id="analysesStatus" class="analyses-status">Laen…</div>
          <div id="analysesList" class="analyses-list"></div>
        </div>`;
      document.body.appendChild(modal);
    }
  }

  function closeAnalysesModal() {
    $('analysesModal')?.classList.add('hidden');
    if ($('authModal')?.classList.contains('hidden')) document.body.classList.remove('modal-open');
  }

  async function openAnalysesModal() {
    if (!currentSession?.user) {
      openModal('login');
      return;
    }
    $('accountMenu')?.classList.add('hidden');
    $('analysesModal')?.classList.remove('hidden');
    document.body.classList.add('modal-open');
    await loadAnalyses();
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('et-EE', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function verdictClass(value) {
    const v = String(value || '').toLowerCase();
    if (v.includes('ei sobi')) return 'bad';
    if (v.includes('võib')) return 'maybe';
    if (v.includes('sobib')) return 'good';
    return 'neutral';
  }

  async function loadAnalyses() {
    const status = $('analysesStatus');
    const list = $('analysesList');
    if (!status || !list) return;
    status.textContent = 'Laen sinu analüüse…';
    list.innerHTML = '';

    const { data, error } = await client
      .from('saved_analyses')
      .select('id,plant_name,scientific_name,latitude,longitude,location_source,verdict,score,details,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[BioGlow saved analyses]', error);
      status.textContent = 'Analüüse ei saanud laadida.';
      return;
    }

    const rows = data || [];
    $('analysesCount').textContent = String(rows.length);
    if (!rows.length) {
      status.textContent = 'Sul pole veel salvestatud analüüse. Tee uus analüüs ja see ilmub siia automaatselt.';
      return;
    }

    status.textContent = '';
    list.innerHTML = rows.map(row => {
      const details = row.details || {};
      const env = details.environment || {};
      const envBits = [env.land, env.soil, env.moisture, env.light].filter(Boolean).slice(0, 3);
      return `
        <article class="saved-analysis" data-analysis-id="${row.id}">
          <div class="saved-analysis-head">
            <div>
              <h3>${escapeHtml(row.plant_name || 'Taim')}</h3>
              ${row.scientific_name ? `<i>${escapeHtml(row.scientific_name)}</i>` : ''}
            </div>
            <span class="saved-verdict ${verdictClass(row.verdict)}">${escapeHtml(row.verdict || 'Analüüs')}</span>
          </div>
          <div class="saved-meta">
            <span>📅 ${escapeHtml(formatDate(row.created_at))}</span>
            <span>📍 ${Number(row.latitude).toFixed(5)}, ${Number(row.longitude).toFixed(5)}</span>
          </div>
          ${envBits.length ? `<p class="saved-env">${envBits.map(escapeHtml).join(' · ')}</p>` : ''}
          <div class="saved-actions">
            <button class="saved-map-btn" type="button" data-lat="${row.latitude}" data-lon="${row.longitude}">⌖ Näita kaardil</button>
            <button class="saved-delete-btn" type="button" data-delete-id="${row.id}">Kustuta</button>
          </div>
        </article>`;
    }).join('');
  }

  async function deleteAnalysis(id) {
    if (!id) return;
    const { error } = await client.from('saved_analyses').delete().eq('id', id);
    if (error) {
      console.error('[BioGlow delete analysis]', error);
      showMiniToast('Kustutamine ebaõnnestus.');
      return;
    }
    showMiniToast('Analüüs kustutatud.');
    await loadAnalyses();
  }

  function showSavedOnMap(lat, lon) {
    const map = window.L && document.querySelector('#map')?._leaflet_id;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    closeAnalysesModal();
    const mapEl = $('map');
    mapEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const coord = $('coordText');
    if (coord) coord.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    const badge = $('mapBadge');
    if (badge) badge.textContent = 'salvestatud analüüs';
    // Appi enda kaardiobjekt pole auth.js-ist otse ligipääsetav; koordinaadid kuvatakse siiski kohe.
    if (!map) showMiniToast('Salvestatud asukoht: ' + latitude.toFixed(5) + ', ' + longitude.toFixed(5));
  }

  function readCurrentAnalysis() {
    const resultContent = $('resultContent');
    const verdictNode = $('verdict');
    const chosen = $('chosen');
    const coordText = $('coordText')?.textContent || '';
    if (!resultContent || resultContent.classList.contains('hidden') || !verdictNode?.textContent.trim()) return null;

    const coordMatch = coordText.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!coordMatch) return null;

    const chosenText = (chosen?.innerText || $('plantInput')?.value || 'Taim').trim().replace(/\s+/g, ' ');
    const lines = chosenText.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const plantName = lines[0] || $('plantInput')?.value?.trim() || 'Taim';
    const scientific = lines.find(line => /^[A-Z][a-z-]+\s+[a-z-]+/.test(line)) || null;

    const verdictText = verdictNode.innerText.trim().replace(/\s+/g, ' ');
    let verdict = 'Analüüs tehtud';
    const lower = verdictText.toLowerCase();
    if (lower.includes('ei sobi')) verdict = 'Ei sobi';
    else if (lower.includes('võib sobida')) verdict = 'Võib sobida';
    else if (lower.includes('sobib')) verdict = 'Sobib';

    const scoreMatch = verdictText.match(/(\d{1,3})\s*%/);
    const evidence = Array.from(document.querySelectorAll('#evidenceList > *')).map(n => n.innerText.trim()).filter(Boolean);
    const environment = {
      elevation: $('elevationValue')?.textContent?.trim() || null,
      land: $('landValue')?.textContent?.trim() || null,
      soil: $('soilValue')?.textContent?.trim() || null,
      moisture: $('moistureValue')?.textContent?.trim() || null,
      light: $('lightValue')?.textContent?.trim() || null
    };

    return {
      plant_name: plantName.slice(0, 180),
      scientific_name: scientific?.slice(0, 180) || null,
      latitude: Number(coordMatch[1]),
      longitude: Number(coordMatch[2]),
      location_source: $('mapBadge')?.textContent?.trim() || null,
      verdict,
      score: scoreMatch ? Math.min(100, Number(scoreMatch[1])) : null,
      details: {
        verdict_text: verdictText.slice(0, 1500),
        evidence: evidence.slice(0, 12),
        environment
      }
    };
  }

  async function saveCurrentAnalysis() {
    if (!currentSession?.user) return;
    const analysis = readCurrentAnalysis();
    if (!analysis) return;

    const fingerprint = [
      currentSession.user.id,
      analysis.plant_name,
      analysis.latitude.toFixed(5),
      analysis.longitude.toFixed(5),
      analysis.verdict,
      analysis.details.verdict_text
    ].join('|');
    if (fingerprint === lastSavedFingerprint) return;

    const { error } = await client.from('saved_analyses').insert(analysis);
    if (error) {
      console.error('[BioGlow save analysis]', error);
      return;
    }
    lastSavedFingerprint = fingerprint;
    showMiniToast('✓ Analüüs salvestati sinu kontole');
  }

  function watchAnalyses() {
    const resultContent = $('resultContent');
    if (!resultContent) return;

    const scheduleSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveCurrentAnalysis, 900);
    };

    const observer = new MutationObserver(() => {
      if (!resultContent.classList.contains('hidden') && $('verdict')?.textContent.trim()) scheduleSave();
    });
    observer.observe(resultContent, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] });

    $('analyzeBtn')?.addEventListener('click', () => {
      lastSavedFingerprint = '';
      scheduleSave();
    });
  }

  async function init() {
    if (!window.supabase?.createClient) {
      console.error('[BioGlow Auth] Supabase teeki ei saanud laadida.');
      return;
    }

    createAnalysesUI();
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    $('accountButton')?.addEventListener('click', async event => {
      event.stopPropagation();
      const { data } = await client.auth.getSession();
      if (data?.session?.user) $('accountMenu')?.classList.toggle('hidden');
      else openModal('login');
    });

    $('loginTab')?.addEventListener('click', () => setTab('login'));
    $('signupTab')?.addEventListener('click', () => setTab('signup'));
    $('authClose')?.addEventListener('click', closeModal);
    $('authLoginForm')?.addEventListener('submit', login);
    $('authSignupForm')?.addEventListener('submit', signup);
    $('logoutButton')?.addEventListener('click', logout);
    $('myAnalysesButton')?.addEventListener('click', openAnalysesModal);
    $('analysesClose')?.addEventListener('click', closeAnalysesModal);

    $('authModal')?.addEventListener('click', event => {
      if (event.target === $('authModal')) closeModal();
    });
    $('analysesModal')?.addEventListener('click', event => {
      if (event.target === $('analysesModal')) closeAnalysesModal();
      const deleteButton = event.target.closest('[data-delete-id]');
      if (deleteButton) deleteAnalysis(deleteButton.dataset.deleteId);
      const mapButton = event.target.closest('.saved-map-btn');
      if (mapButton) showSavedOnMap(mapButton.dataset.lat, mapButton.dataset.lon);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModal();
        closeAnalysesModal();
      }
    });
    document.addEventListener('click', event => {
      const wrap = $('accountWrap');
      if (wrap && !wrap.contains(event.target)) $('accountMenu')?.classList.add('hidden');
    });

    const { data } = await client.auth.getSession();
    updateAccountUI(data?.session || null);
    client.auth.onAuthStateChange((_event, session) => updateAccountUI(session));
    watchAnalyses();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
