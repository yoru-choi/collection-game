# 보안 가이드 (PRD 4.4 기반)

## 🔐 인증 및 인가 시스템

### JWT 토큰 전략 (Valkey 기반)

프로젝트는 PRD 4.4.1에 명시된 Valkey 기반 JWT 인증 전략을 따릅니다.

#### Access Token
- **만료 시간**: 15분
- **저장 위치**: 클라이언트 메모리 (HttpClient 인스턴스)
- **보안**: localStorage 미사용으로 XSS 공격 방지
- **검증**: Stateless, 서버에서 직접 서명 검증

```typescript
// Access Token은 메모리에만 저장
httpClient.setAccessToken(token);
```

#### Refresh Token
- **만료 시간**: 7일
- **저장 위치**: HttpOnly Cookie (서버가 Set-Cookie로 설정)
- **보안**: 
  - HttpOnly: JavaScript 접근 불가 (XSS 방어)
  - Secure: HTTPS에서만 전송
  - SameSite: CSRF 공격 방지
- **관리**: Valkey에 저장 및 검증
  - Key: `refresh_token:{user_id}:{token_id}`
  - TTL: 7일 (자동 만료)

```typescript
// Refresh Token은 Cookie로 자동 전송 (withCredentials: true)
await httpClient.post('/auth/refresh', {});
```

#### Token Blacklist
로그아웃 또는 강제 만료 시:
- Access Token의 JTI를 Valkey Blacklist에 추가
- Key: `token_blacklist:{jti}`
- TTL: Access Token 만료 시간 (15분)

```redis
SET token_blacklist:{token_jti} "revoked" EX 900
```

### 인증 플로우

#### 1. 로그인
```typescript
const authService = new AuthService();
await authService.login(email, password);

// 서버 응답:
// - Access Token (JSON 응답)
// - Refresh Token (Set-Cookie: HttpOnly)
```

#### 2. API 요청
```typescript
// Access Token은 자동으로 헤더에 추가
await httpClient.get('/user/profile');

// Authorization: Bearer {access_token}
```

#### 3. 토큰 갱신 (자동)
- Access Token 만료 시 (401 응답)
- HttpClient가 자동으로 Refresh Token으로 갱신
- Refresh Token은 Cookie로 자동 전송

```typescript
// 401 에러 발생 시 자동 실행
const response = await httpClient.post('/auth/refresh', {});
httpClient.setAccessToken(response.data.authToken);
```

#### 4. 로그아웃
```typescript
await authService.logout();

// 서버 동작:
// - Valkey에서 Refresh Token 삭제
// - Access Token을 Blacklist에 추가
// - Cookie 삭제 (Set-Cookie: Max-Age=0)

// 클라이언트 동작:
// - 메모리에서 Access Token 삭제
// - 토큰 갱신 타이머 중지
```

### 자동 토큰 갱신

Access Token 만료 1분 전 자동 갱신:

```typescript
// 로그인 성공 시 자동 시작
authService.startTokenRefreshTimer();

// 14분마다 갱신 시도 (15분 만료 전)
setInterval(() => {
  if (authService.isAuthenticated()) {
    authService.refreshToken();
  }
}, 14 * 60 * 1000);
```

## 🛡️ 보안 최적화

### XSS (Cross-Site Scripting) 방어
1. **Access Token**: 메모리에만 저장 (localStorage 미사용)
2. **Refresh Token**: HttpOnly Cookie (JavaScript 접근 불가)
3. **입력 검증**: 모든 사용자 입력 검증 및 이스케이핑

### CSRF (Cross-Site Request Forgery) 방어
1. **SameSite Cookie**: Refresh Token에 SameSite 속성 설정
2. **CORS**: 허용된 Origin만 접근 가능
3. **Origin 검증**: 서버에서 Origin 헤더 확인

### Session Hijacking 방어
1. **HTTPS**: 프로덕션에서 필수
2. **Secure Cookie**: HTTPS에서만 Cookie 전송
3. **Token Rotation**: Refresh Token 재사용 시 모두 무효화
4. **Concurrent Login**: 동시 로그인 기기 수 제한 (옵션)

## 📊 Rate Limiting

사용자당 분당 100회 요청 제한 (PRD 4.4.1):

```typescript
// Nginx 또는 백엔드에서 처리
// Valkey로 카운터 관리: rate_limit:{user_id}
```

## 🚨 보안 이벤트 처리

### 자동 로그아웃
다음 상황에서 자동 로그아웃:
1. Refresh Token 만료 (7일)
2. Token 갱신 실패
3. 서버에서 강제 로그아웃

```typescript
// HttpClient에서 자동 처리
window.dispatchEvent(new CustomEvent('auth:logout'));

// BootScene에서 리스닝
window.addEventListener('auth:logout', () => {
  this.scene.start(SCENE_KEYS.LOGIN);
});
```

## 🔧 개발 환경 설정

### 백엔드 없이 개발
게스트 로그인 사용:

```typescript
// Guest 토큰으로 개발
httpClient.setAccessToken('guest-dev-token');
```

### HTTPS 로컬 개발
Vite dev server에서 HTTPS 활성화:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    https: true, // 자체 서명 인증서 사용
  },
});
```

## ✅ 체크리스트

프로덕션 배포 전 확인사항:

- [ ] HTTPS 활성화 (Nginx/CDN)
- [ ] Secure Cookie 설정
- [ ] SameSite Cookie 속성 설정
- [ ] CORS 정책 검증
- [ ] Rate Limiting 활성화
- [ ] Token 만료 시간 확인
- [ ] Valkey 연결 확인
- [ ] 로그 모니터링 설정 (Dozzle)

## 📚 참고 자료

- PRD 섹션 4.4: 보안 요구사항
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
