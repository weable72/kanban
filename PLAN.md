# Plan: Supabase 인증 + GitHub Pages 배포

## Context

순수 바닐라 JS Kanban 앱에 회원가입/로그인(이메일 + Google OAuth)을 추가하고 GitHub Pages로 배포한다. 빌드 도구 없이 CDN 스크립트 방식으로 Supabase JS SDK를 로드하고, 인증 정보는 GitHub Secrets에 보관하여 CI에서 주입한다.

---

## 파일 변경 목록

| 파일 | 상태 |
|------|------|
| `index.html` | 수정 |
| `app.js` | 수정 (최소) |
| `style.css` | 수정 (추가) |
| `auth.js` | 신규 |
| `.gitignore` | 신규 |
| `.github/workflows/deploy.yml` | 신규 |

> `config.js` — CI에서 생성되는 파일. 저장소에 커밋하지 않음 (gitignore).

---

## Step 1 — `.gitignore`

```
config.js
```

---

## Step 2 — `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - uses: actions/checkout@v4

      - name: Generate config.js from secrets
        run: |
          printf 'const SUPABASE_URL = "%s";\nconst SUPABASE_ANON_KEY = "%s";\n' \
            "${{ secrets.SUPABASE_URL }}" \
            "${{ secrets.SUPABASE_ANON_KEY }}" > config.js

      - uses: actions/configure-pages@v6

      - uses: actions/upload-pages-artifact@v5
        with:
          path: '.'

      - id: deployment
        uses: actions/deploy-pages@v5
```

**GitHub Repository 설정 (수동):**
- Settings → Pages → Source → **GitHub Actions** 선택
- Settings → Secrets → Actions:
  - `SUPABASE_URL` : Supabase Dashboard → Settings → API → Project URL
  - `SUPABASE_ANON_KEY` : Supabase Dashboard → Settings → API → anon public key

---

## Step 3 — `index.html` 수정

### `<head>` — 스크립트 4개 추가 (기존 `<link>` 아래)

```html
<script src="config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="auth.js" defer></script>
<script src="app.js" defer></script>
```

기존 `<script src="app.js">` 는 `</body>` 직전에서 제거.

### `<body>` 구조 전면 교체

```html
<body>

  <!-- 인증 섹션 (비로그인 시 노출) -->
  <section id="auth-section">
    <div id="auth-box">
      <h2 id="auth-title">로그인</h2>
      <input type="email"    id="auth-email"    placeholder="이메일" autocomplete="email" />
      <input type="password" id="auth-password" placeholder="비밀번호" autocomplete="current-password" />
      <div id="auth-error" class="auth-error" hidden></div>
      <button id="btn-email-action">로그인</button>
      <button id="btn-google">Google로 로그인</button>
      <p class="auth-toggle">
        계정이 없으신가요? <a href="#" id="link-toggle">회원가입</a>
      </p>
    </div>
  </section>

  <!-- 보드 섹션 (로그인 후 노출) -->
  <section id="board-section" hidden>
    <header>
      <h1>Kanban Board</h1>
      <div class="header-right">
        <span id="user-email-display"></span>
        <button id="btn-logout">로그아웃</button>
      </div>
    </header>

    <main class="board">
      <!-- 기존 column 3개 그대로 -->
    </main>

    <!-- 기존 모달 그대로 -->
  </section>

</body>
```

---

## Step 4 — `auth.js` (신규)

```js
'use strict';

let supabaseClient;
let boardInitialized = false;
let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', () => {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
  });

  // 인증 상태 변화 감지 — 세션 복원, 로그인, 로그아웃 모두 여기서 처리
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

  // 버튼 이벤트
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
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) showError(error.message);
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
  document.getElementById('auth-title').textContent         = isSignUpMode ? '회원가입'      : '로그인';
  document.getElementById('btn-email-action').textContent   = isSignUpMode ? '가입하기'      : '로그인';
  document.getElementById('btn-google').textContent         = isSignUpMode ? 'Google로 가입' : 'Google로 로그인';
  document.querySelector('.auth-toggle').innerHTML =
    isSignUpMode
      ? '이미 계정이 있으신가요? <a href="#" id="link-toggle">로그인</a>'
      : '계정이 없으신가요? <a href="#" id="link-toggle">회원가입</a>';
  document.getElementById('link-toggle').addEventListener('click', e => {
    e.preventDefault(); toggleMode();
  });
  clearError();
}

function showBoard(user) {
  document.getElementById('auth-section').hidden = true;
  document.getElementById('board-section').hidden = false;
  document.getElementById('user-email-display').textContent = user.email ?? '';
}

function showAuth() {
  document.getElementById('board-section').hidden = true;
  document.getElementById('auth-section').hidden  = false;
}

function showError(msg, isErr = true) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.color = isErr ? '#de350b' : '#006644';
  el.style.background = isErr ? '#ffebe6' : '#e3fcef';
  el.hidden = false;
}

function clearError() {
  document.getElementById('auth-error').hidden = true;
}
```

---

## Step 5 — `app.js` 수정 (최소 변경)

마지막 두 줄만 함수로 감싼다:

```js
// 변경 전
document.querySelectorAll('.card').forEach(attachCardEvents);
updateAllCounts();

// 변경 후
function initBoard() {
  document.querySelectorAll('.card').forEach(attachCardEvents);
  updateAllCounts();
}
```

`initBoard()`는 `auth.js`의 `onAuthStateChange`에서 호출되므로 직접 호출하지 않는다.

---

## Step 6 — `style.css` 추가

기존 코드 하단에 아래 블록 추가:

```css
/* ── Auth Section ── */
#auth-section {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: #f0f2f5;
}
#auth-box {
  background: #fff; border-radius: 12px; padding: 40px; width: 360px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; gap: 14px;
}
#auth-box h2 { font-size: 1.3rem; font-weight: 700; color: #172b4d; }
#auth-box input {
  border: 2px solid #dfe1e6; border-radius: 6px;
  padding: 10px 12px; font-size: 0.9rem; font-family: inherit;
  color: #172b4d; outline: none; transition: border-color 0.15s;
}
#auth-box input:focus { border-color: #0052cc; }
#auth-box button {
  padding: 10px; border: none; border-radius: 6px;
  font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
#btn-email-action { background: #0052cc; color: #fff; }
#btn-email-action:hover { background: #0065ff; }
#btn-google { background: #fff; color: #172b4d; border: 2px solid #dfe1e6; }
#btn-google:hover { background: #f4f5f7; }
.auth-error {
  font-size: 0.85rem; border-radius: 4px; padding: 8px 12px;
}
.auth-toggle { font-size: 0.85rem; text-align: center; color: #5e6c84; }

/* ── Header additions ── */
header { display: flex; align-items: center; justify-content: space-between; }
.header-right { display: flex; align-items: center; gap: 16px; }
#user-email-display { font-size: 0.85rem; opacity: 0.85; }
#btn-logout {
  background: rgba(255,255,255,0.2); color: #fff;
  border: 1px solid rgba(255,255,255,0.4); border-radius: 6px;
  padding: 6px 14px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
#btn-logout:hover { background: rgba(255,255,255,0.35); }
```

---

## Supabase Dashboard 수동 설정 (필수)

1. **Auth → URL Configuration**
   - Site URL: `https://<username>.github.io/<repo-name>/`
   - Redirect URLs: 위 URL + `http://localhost` (로컬 개발용)

2. **Auth → Providers → Google**
   - Google Cloud Console: OAuth 2.0 클라이언트 생성, Authorized redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback` 추가
   - 발급된 Client ID/Secret을 Supabase Dashboard에 입력 후 활성화

---

## 검증 방법

1. `main` 브랜치에 push → GitHub Actions 워크플로우 실행 확인
2. `https://<username>.github.io/<repo-name>/` 접속 → 로그인 화면 표시 확인
3. 이메일 회원가입 → 이메일 인증 → 로그인 → 보드 표시 확인
4. 로그아웃 → 로그인 화면 복귀 확인
5. Google 로그인 버튼 → OAuth 플로우 → 보드 표시 확인
6. 로컬 개발 시: `config.js` 직접 생성 후 `index.html`을 브라우저로 열기
