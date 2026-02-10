# API Documentation

프론트엔드에서 사용하는 백엔드 API 명세

## 🔗 Base URL

```
Development: http://localhost:8080/api/v1
Production: https://api.yourgame.com/api/v1
```

## 🔐 인증

### JWT 토큰
- **Access Token**: 15분 유효기간
- **Refresh Token**: 7일 유효기간

### 헤더
```
Authorization: Bearer <access_token>
```

## 📊 응답 형식

모든 API는 표준화된 응답 형식을 사용합니다:

```typescript
{
  "success": boolean,
  "data": T | null,
  "error": string | null,
  "timestamp": string (ISO 8601)
}
```

### 성공 응답 예시
```json
{
  "success": true,
  "data": {
    "id": "123",
    "username": "player1"
  },
  "error": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 에러 응답 예시
```json
{
  "success": false,
  "data": null,
  "error": "Invalid credentials",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📄 페이지네이션

리스트 API는 페이지네이션을 지원합니다.

### 요청 파라미터
```typescript
{
  page: number,      // 기본값: 1
  limit: number,     // 기본값: 20, 최대: 100
  sortBy: string,    // 정렬 필드
  sortOrder: 'ASC' | 'DESC'  // 기본값: DESC
}
```

### 응답
```typescript
{
  items: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

## 🔑 엔드포인트

### 1. 인증 (Auth)

#### POST /auth/register
회원가입

**요청**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "authToken": "string",
    "refreshToken": "string",
    "expiresIn": 900
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /auth/login
로그인

**요청**
```json
{
  "email": "string",
  "password": "string"
}
```

**응답**: 회원가입과 동일

#### POST /auth/refresh
토큰 갱신

**요청**
```json
{
  "refreshToken": "string"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "authToken": "string",
    "refreshToken": "string",
    "expiresIn": 900
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /auth/logout
로그아웃

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": null,
  "error": null,
  "timestamp": "string"
}
```

---

### 2. 유저 (User)

#### GET /user/profile
유저 프로필 조회

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "level": 10,
    "exp": 5000,
    "crystals": 1000,
    "gold": 50000,
    "energy": 80,
    "maxEnergy": 100,
    "lastEnergyUpdate": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "error": null,
  "timestamp": "string"
}
```

#### PUT /user/profile
프로필 업데이트

**헤더**: Authorization Required

**요청**
```json
{
  "username": "string"  // 옵션
}
```

#### GET /user/inventory
인벤토리 조회

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "itemId": "string",
        "name": "string",
        "type": "consumable" | "material" | "equipment",
        "quantity": 10,
        "description": "string"
      }
    ]
  },
  "error": null,
  "timestamp": "string"
}
```

---

### 3. 캐릭터 (Character)

#### GET /characters
캐릭터 목록 조회 (페이지네이션)

**헤더**: Authorization Required

**쿼리 파라미터**
```
?page=1&limit=20&sortBy=level&sortOrder=DESC&element=fire&class=warrior
```

**응답**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "level": 1,
        "rarity": 5,
        "element": "fire",
        "class": "warrior",
        "hp": 1000,
        "atk": 150,
        "def": 80,
        "spd": 100
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "error": null,
  "timestamp": "string"
}
```

#### GET /characters/:id
캐릭터 상세 정보

**헤더**: Authorization Required

#### POST /characters/:id/level-up
캐릭터 레벨업

**헤더**: Authorization Required

#### POST /characters/:id/evolve
캐릭터 진화

**헤더**: Authorization Required

---

### 4. 던전 (Dungeon)

#### GET /dungeons
던전 목록

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "story" | "element" | "experience",
      "difficulty": 1,
      "energyCost": 10,
      "rewards": {
        "exp": 100,
        "gold": 500
      }
    }
  ],
  "error": null,
  "timestamp": "string"
}
```

#### POST /dungeons/:id/enter
던전 입장

**헤더**: Authorization Required

**요청**
```json
{
  "teamCharacterIds": ["char1", "char2", "char3"]
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "battleId": "string",
    "enemies": [...]
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /dungeons/battle/:battleId/action
전투 행동 수행

**헤더**: Authorization Required

**요청**
```json
{
  "action": "attack" | "skill" | "defend",
  "characterId": "string",
  "targetId": "string",
  "skillId": "string"  // skill 사용 시
}
```

#### GET /dungeons/battle/:battleId/result
전투 결과 확인

**헤더**: Authorization Required

---

### 5. PvP 아레나 (Arena)

#### GET /arena/ranking
랭킹 조회 (페이지네이션)

**헤더**: Authorization Required

**쿼리**: `?page=1&limit=20`

**응답**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rank": 1,
        "userId": "string",
        "username": "string",
        "rating": 2500,
        "wins": 100,
        "losses": 20
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 20,
    "totalPages": 50
  },
  "error": null,
  "timestamp": "string"
}
```

#### POST /arena/attack
다른 플레이어 공격

**헤더**: Authorization Required

**요청**
```json
{
  "targetUserId": "string",
  "teamCharacterIds": ["char1", "char2", "char3"]
}
```

#### POST /arena/defense
방어팀 설정

**헤더**: Authorization Required

**요청**
```json
{
  "teamCharacterIds": ["char1", "char2", "char3"]
}
```

#### GET /arena/history
전투 기록 (페이지네이션)

**헤더**: Authorization Required

---

### 6. 길드 (Guild)

#### GET /guilds
길드 목록 (페이지네이션)

**쿼리**: `?page=1&limit=20`

#### POST /guilds
길드 생성

**헤더**: Authorization Required

**요청**
```json
{
  "name": "string",
  "description": "string"
}
```

#### POST /guilds/:id/join
길드 가입

**헤더**: Authorization Required

#### GET /guilds/:id
길드 상세 정보

#### GET /guilds/:id/members
길드 멤버 목록

#### DELETE /guilds/:id/leave
길드 탈퇴

**헤더**: Authorization Required

---

### 7. 상점 (Shop)

#### GET /shop/items
상점 아이템 목록

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": {
        "crystals": 100,
        "gold": 0
      },
      "type": "character" | "item" | "package"
    }
  ],
  "error": null,
  "timestamp": "string"
}
```

#### POST /shop/purchase
아이템 구매

**헤더**: Authorization Required

**요청**
```json
{
  "itemId": "string",
  "quantity": 1
}
```

---

### 8. 퀘스트 (Quest)

#### GET /quests/daily
일일 퀘스트 목록

**헤더**: Authorization Required

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "progress": 5,
      "target": 10,
      "completed": false,
      "claimed": false,
      "rewards": {
        "exp": 100,
        "gold": 500
      }
    }
  ],
  "error": null,
  "timestamp": "string"
}
```

#### POST /quests/:id/complete
퀘스트 완료

**헤더**: Authorization Required

#### POST /quests/:id/claim
보상 받기

**헤ader**: Authorization Required

---

## 🌐 WebSocket 이벤트

### 연결
```
URL: ws://localhost:8080
```

### 클라이언트 → 서버

#### chat:send
채팅 메시지 전송
```json
{
  "channel": "string",
  "message": "string"
}
```

### 서버 → 클라이언트

#### chat:message
채팅 메시지 수신
```json
{
  "type": "chat:message",
  "data": {
    "channel": "string",
    "sender": "string",
    "message": "string",
    "timestamp": "string"
  }
}
```

#### pvp:match_found
PvP 매칭 성공
```json
{
  "type": "pvp:match_found",
  "data": {
    "matchId": "string",
    "opponent": {
      "userId": "string",
      "username": "string"
    }
  }
}
```

#### guild:notification
길드 알림
```json
{
  "type": "guild:notification",
  "data": {
    "title": "string",
    "message": "string",
    "timestamp": "string"
  }
}
```

---

## ⚠️ 에러 코드

| 코드 | 메시지 | 설명 |
|-----|-------|-----|
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 409 | Conflict | 리소스 충돌 (중복 등) |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 오류 |

---

## 🚦 Rate Limiting

- **제한**: 사용자당 분당 100회 요청
- **헤더**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📝 변경 이력

### v1.0.0 (2024-01-15)
- 초기 API 명세 작성
- JWT 인증 구현
- 페이지네이션 지원
- WebSocket 이벤트 정의
