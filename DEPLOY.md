# DEPLOY.md — 배포 전 설정 가이드

코드 작업은 완료된 상태입니다. 아래 순서대로 외부 서비스를 설정하면 배포가 완료됩니다.

> **config.js** — Supabase 키가 이미 입력되어 저장소에 포함되어 있습니다.  
> `anon` 키는 브라우저에 어차피 노출되는 공개 키이므로 public repo에 커밋해도 무방합니다.

---

## 1. Supabase Auth 설정

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

## 2. Google OAuth 설정

### Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) 에서 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
2. **API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 만들기** 를 클릭합니다.
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. **승인된 리디렉션 URI** 에 아래 주소를 추가합니다.
   ```
   https://wwclugysfdqkktutfgbr.supabase.co/auth/v1/callback
   ```
5. 생성 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사합니다.

### Supabase Google Provider 등록

**Authentication → Providers → Google** 에서:
- **Enable** 토글 활성화
- 위에서 복사한 클라이언트 ID와 보안 비밀번호 입력 후 저장

---

## 3. GitHub 저장소 설정

### 코드 푸시

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

### GitHub Pages 활성화

저장소 **Settings → Pages → Build and deployment** 에서:
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`

설정 저장 후 수 분 내에 자동으로 배포됩니다.  
완료 후 `https://<username>.github.io/<repo-name>/` 에 접속합니다.

---

## 4. 로컬 개발 환경

`config.js`가 저장소에 포함되어 있으므로 별도 설정 없이 `index.html`을 브라우저에서 바로 열 수 있습니다.

---

## 체크리스트

- [ ] Supabase Auth → Redirect URLs 등록
- [ ] Google Cloud Console OAuth 클라이언트 생성 및 리디렉션 URI 추가
- [ ] Supabase Google Provider에 클라이언트 ID/Secret 입력
- [ ] GitHub 저장소에 코드 push
- [ ] GitHub Pages Source → Deploy from a branch 설정 (`main` / root)
- [ ] 배포된 URL 접속 및 이메일·Google 로그인 동작 확인
