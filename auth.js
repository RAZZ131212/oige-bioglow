(() => {
  'use strict';

  const SUPABASE_URL = 'https://katkzrlbxrllspcgdxew.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_DF8nS5ZdH97_kTe32U_O1w_xZP8Qh52';

  const $ = id => document.getElementById(id);
  let client = null;

  function showMessage(message, type = '') {
    const node = $('authMessage');
    if (!node) return;
    node.textContent = message || '';
    node.className = `auth-message ${type}`;
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
    const user = session?.user || null;
    const guestButton = $('accountButton');
    const menu = $('accountMenu');
    const nameNode = $('accountName');
    const emailNode = $('accountEmail');

    if (!user) {
      if (guestButton) {
        guestButton.innerHTML = '<span class="account-avatar">👤</span><span>Konto</span>';
        guestButton.dataset.loggedIn = 'false';
      }
      menu?.classList.add('hidden');
      return;
    }

    const name = displayName(user);
    if (guestButton) {
      guestButton.innerHTML = `<span class="account-avatar">${name.charAt(0).toUpperCase()}</span><span>${escapeHtml(name)}</span>`;
      guestButton.dataset.loggedIn = 'true';
    }
    if (nameNode) nameNode.textContent = name;
    if (emailNode) emailNode.textContent = user.email || '';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
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
      const msg = String(error?.message || 'Konto loomine ebaõnnestus.');
      showMessage(msg, 'error');
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

  async function init() {
    if (!window.supabase?.createClient) {
      console.error('[BioGlow Auth] Supabase teeki ei saanud laadida.');
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    $('accountButton')?.addEventListener('click', async event => {
      event.stopPropagation();
      const { data } = await client.auth.getSession();
      if (data?.session?.user) {
        $('accountMenu')?.classList.toggle('hidden');
      } else {
        openModal('login');
      }
    });

    $('loginTab')?.addEventListener('click', () => setTab('login'));
    $('signupTab')?.addEventListener('click', () => setTab('signup'));
    $('authClose')?.addEventListener('click', closeModal);
    $('authLoginForm')?.addEventListener('submit', login);
    $('authSignupForm')?.addEventListener('submit', signup);
    $('logoutButton')?.addEventListener('click', logout);
    $('openSignupFromMenu')?.addEventListener('click', () => openModal('signup'));

    $('authModal')?.addEventListener('click', event => {
      if (event.target === $('authModal')) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });
    document.addEventListener('click', event => {
      const wrap = $('accountWrap');
      if (wrap && !wrap.contains(event.target)) $('accountMenu')?.classList.add('hidden');
    });

    const { data } = await client.auth.getSession();
    updateAccountUI(data?.session || null);
    client.auth.onAuthStateChange((_event, session) => updateAccountUI(session));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
