'use strict';

// 회원가입/로그인/로그아웃/세션 조회 — 실제 네트워크(Supabase Auth) 호출이라 Jest 유닛테스트 범위 밖 (TRD.md 6절)

async function signUpWithEmail(email, password) {
  return supabaseClient.auth.signUp({ email, password });
}

async function signInWithEmail(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

async function signInWithOAuth(provider) {
  // redirectTo를 명시하지 않으면 Supabase가 대시보드의 Site URL로 돌려보낸다.
  // GitHub Pages 프로젝트 사이트(https://weable72.github.io/kanban/)처럼 하위 경로를 쓰는 경우
  // Site URL 설정과 무관하게 항상 "현재 페이지"로 돌아오도록 명시적으로 지정한다.
  const redirectTo = window.location.origin + window.location.pathname;
  return supabaseClient.auth.signInWithOAuth({ provider, options: { redirectTo } });
}

async function signOut() {
  return supabaseClient.auth.signOut();
}

async function getSession() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

// callback(session | null)을 인자로 받아 세션 상태가 바뀔 때마다 호출한다.
function onAuthStateChange(callback) {
  return supabaseClient.auth.onAuthStateChange((_event, session) => callback(session));
}
