# Collection Game Backend (TypeScript)

`backend-bk`(Go) 기반 API를 TypeScript/Node.js + NestJS로 재구성한 백엔드입니다.

## 실행

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
npm start
```

## 주요 사항

- Base URL: `/api/v1`
- Health: `/health`
- WebSocket: `/ws`
- Docs: `/docs`, `/openapi.json`, `/asyncapi.yaml`, `/swagger/index.html`
- 응답 포맷: `{ success, data|error, timestamp }`
- 인증: Access Token(Bearer) + Refresh Token(HttpOnly Cookie)

현재 구현은 PRD/MVP 연동을 위한 **동작 가능한 인메모리 버전**이며, DB/Valkey 영속 레이어는 이후 단계에서 교체 가능합니다.
