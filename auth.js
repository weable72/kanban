'use strict';

let supabaseClient;
let boardInitialized = false;
let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', () => {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
      showBoard(session.user);
      if (!boardInitialized && typeof initBoard === 'function') {
        initBoard();
        boardInitialized = true;
      }
    } else {
      showAuth();
      boardInitialized = false;
    }
  });

  document.getElementById('btn-email-action').addEventListener('click', handleEmailAction);
  document.getElementById('btn-google').addEventListener('click', signInWithGoogle);
  document.getElementById('btn-logout').addEventListener('click', () => supabaseClient.auth.signOut());
  document.getElementById('link-toggle').addEventListener('click', e => {
    e.preventDefault();
    toggleMode();
  });
});

async function handleEmailAction() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  clearError();

  if (isSignUpMode) {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) showError(error.message);
    else       showError('이메일을 확인해 계정을 인증해 주세요.', false);
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showError(error.message);
    } else {
      showBoard(data.session.user);
      if (!boardInitialized && typeof initBoard === 'function') {
        initBoard();
        boardInitialized = true;
      }
    }
  }
}

function signInWithGoogle() {
  supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
}

function toggleMode() {
  isSignUpMode = !isSignUpMode;
  document.getElementById('auth-title').textContent       = isSignUpMode ? '회원가입'      : '로그인';
  document.getElementById('btn-email-action').textContent = isSignUpMode ? '가입하기'      : '로그인';
  document.getElementById('btn-google').textContent       = isSignUpMode ? 'Google로 가입' : 'Google로 로그인';
  document.querySelector('.auth-toggle').innerHTML =
    isSignUpMode
      ? '이미 계정이 있으신가요? <a href="#" id="link-toggle">로그인</a>'
      : '계정이 없으신가요? <a href="#" id="link-toggle">회원가입</a>';
  document.getElementById('link-toggle').addEventListener('click', e => {
    e.preventDefault();
    toggleMode();
  });
  clearError();
}

function showBoard(user) {
  document.getElementById('auth-section').style.display  = 'none';
  document.getElementById('board-section').style.display = 'block';
  document.getElementById('user-email-display').textContent = user.email ?? '';
}

function showAuth() {
  document.getElementById('board-section').style.display = 'none';
  document.getElementById('auth-section').style.display  = 'flex';
}

function showError(msg, isErr = true) {
  const el = document.getElementById('auth-error');
  el.textContent       = msg;
  el.style.color       = isErr ? '#de350b' : '#006644';
  el.style.background  = isErr ? '#ffebe6' : '#e3fcef';
  el.hidden = false;
}

function clearError() {
  document.getElementById('auth-error').hidden = true;
}
