# DEPLOY.md — 배포 전 설정 가이드

코드 작업은 완료된 상태입니다. 아래 순서대로 외부 서비스를 설정하면 배포가 완료됩니다.

---

## 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 프로젝트를 생성합니다.
2. 좌측 메뉴 **Settings → API** 에서 두 값을 복사해 둡니다.
   - **Project URL** → 나중에 GitHub Secret `SUPABASE_URL`로 사용
   - **anon public** 키 → 나중에 GitHub Secret `SUPABASE_ANON_KEY`로 사용

---

## 2. Supabase Auth 설정

### 리다이렉트 URL 등록

**Authentication → URL Configuration** 에서:

| 항목 | 값 |
|------|----|
| Site URL | `https://<username>.github.io/<repo-name>/` |
| Redirect URLs (추가) | `https://<username>.github.io/<repo-name>/` |
| Redirect URLs (추가) | `http://localhost` |

> `<username>`, `<repo-name>`은 본인의 GitHub 계정명과 저장소명으로 교체합니다.  
> 로컬에서 Live Server 등으로 열 경우 해당 주소도 Redirect URLs에 추가하세요.

### 이메일 인증 설정 (선택)

**Authentication → Providers → Email** 에서 **Confirm email** 옵션을 확인합니다.
- 활성화 시: 회원가입 후 이메일 인증 링크 클릭 필요
- 비활성화 시: 회원가입 즉시 로그인 가능 (테스트 편의용)

---

## 3. Google OAuth 설정

### Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) 에서 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
2. **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 만들기** 를 클릭합니다.
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. **승인된 리디렉션 URI** 에 아래 주소를 추가합니다.
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   > `<your-project-ref>`는 Supabase Project URL에서 확인할 수 있습니다. (예: `abcdefghijklmn`)
5. 생성 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사합니다.

### Supabase Google Provider 등록

**Authentication → Providers → Google** 에서:
- **Enable** 토글 활성화
- 위에서 복사한 클라이언트 ID와 보안 비밀번호 입력 후 저장

---

## 4. GitHub 저장소 설정

### 코드 푸시

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

### GitHub Pages 활성화

저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경합니다.

### Repository Secrets 등록

저장소 **Settings → Secrets and variables → Actions → New repository secret** 에서 두 값을 등록합니다.

| Secret 이름 | 값 |
|-------------|-----|
| `SUPABASE_URL` | Supabase Project URL (1단계에서 복사한 값) |
| `SUPABASE_ANON_KEY` | Supabase anon public 키 (1단계에서 복사한 값) |

---

## 5. 배포 실행

`main` 브랜치에 커밋을 push하면 GitHub Actions가 자동으로 실행됩니다.

```bash
git push origin main
```

저장소 **Actions** 탭에서 워크플로우 진행 상황을 확인할 수 있습니다.  
완료 후 `https://<username>.github.io/<repo-name>/` 에 접속합니다.

---

## 6. 로컬 개발 환경

`config.js`는 `.gitignore`에 의해 저장소에서 제외됩니다. 로컬에서 실행하려면 직접 생성해야 합니다.

프로젝트 루트에 `config.js`를 만들고 아래 내용을 채웁니다.

```js
const SUPABASE_URL      = 'https://<your-project-ref>.supabase.co';
const SUPABASE_ANON_KEY = '<your-anon-key>';
```

이후 `index.html`을 브라우저에서 직접 열거나 로컬 서버로 실행합니다.

---

## 체크리스트

- [ ] Supabase 프로젝트 생성 및 URL·anon key 복사
- [ ] Supabase Auth → Redirect URLs 등록
- [ ] Google Cloud Console OAuth 클라이언트 생성 및 리디렉션 URI 추가
- [ ] Supabase Google Provider에 클라이언트 ID/Secret 입력
- [ ] GitHub 저장소에 코드 push
- [ ] GitHub Pages Source → GitHub Actions 설정
- [ ] GitHub Secrets에 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등록
- [ ] `main` push 후 Actions 탭에서 배포 성공 확인
- [ ] 배포된 URL 접속 및 이메일·Google 로그인 동작 확인
