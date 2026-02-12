# API Documentation v1

## Base URLs
- **API v1 (Nginx)**: `http://localhost/api/v1`
- **API v1 (Direct)**: `http://localhost:8080/api/v1`
- **WebSocket (Nginx)**: `ws://localhost/ws`
- **WebSocket (Direct)**: `ws://localhost:8080/ws`
- **Health Check**: `http://localhost/health` or `http://localhost:8080/health`

## Docs Endpoints
- **API Docs HTML**: `/docs`
- **OpenAPI JSON**: `/openapi.json`
- **Swagger UI**: `/swagger/index.html`
- **AsyncAPI YAML**: `/asyncapi.yaml`

## Scope and Status
- **MVP**: Auth, User, Characters, Party, Summon, Dungeons, Quests, Shop, Inventory
- **Post-MVP (Implemented)**: Arena, Guilds

## Authentication
- Protected endpoints require `Authorization: Bearer {authToken}`.
- Refresh token is stored as an HttpOnly cookie named `refresh_token` (Path: `/api/v1/auth/refresh`).
- Refresh token can also be sent in the request body for `/auth/refresh` and `/auth/logout`.

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-02-10T12:00:00Z"
}
```

For errors:
```json
{
  "success": false,
  "error": "error message",
  "timestamp": "2026-02-10T12:00:00Z"
}
```

## Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Response**: `429 Too Many Requests` when exceeded

---

## Authentication

### Register
회원가입

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**Response Data:**
```json
{
  "authToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player1@example.com",
    "level": 1,
    "exp": 0,
    "crystals": 300,
    "gold": 5000,
    "energy": 100,
    "max_energy": 100,
    "last_login": "2026-02-10T12:00:00Z"
  }
}
```

**Note:** Refresh token is set as an HttpOnly cookie.

### Login
로그인

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response Data:** Same shape as Register.

### Refresh Token
토큰 갱신

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body (optional if cookie exists):**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response Data:**
```json
{
  "authToken": "eyJhbGc..."
}
```

**Note:** Refresh token cookie is rotated on success.

### Logout
로그아웃

**Endpoint:** `POST /api/v1/auth/logout`

**Headers (optional but recommended):**
```
Authorization: Bearer {authToken}
```

**Request Body (optional):**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response Data:**
```json
{
  "message": "logged out successfully"
}
```

---

## User

### Get Profile
유저 프로필 조회

**Endpoint:** `GET /api/v1/user/profile`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Update Profile
유저 프로필 수정

**Endpoint:** `PUT /api/v1/user/profile`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body:**
```json
{
  "username": "player1",
  "email": "player1@example.com"
}
```

### Get Inventory
인벤토리 조회

**Endpoint:** `GET /api/v1/user/inventory`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Response Data:**
```json
{
  "crystals": 1000,
  "gold": 50000,
  "energy": 85,
  "max_energy": 100,
  "level": 10,
  "exp": 5000
}
```

---

## Characters

### Get User Characters
보유 캐릭터 목록

**Endpoint:** `GET /api/v1/characters`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Get Character Detail
캐릭터 상세 정보

**Endpoint:** `GET /api/v1/characters/{id}`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Level Up Character
캐릭터 레벨업

**Endpoint:** `POST /api/v1/characters/{id}/level-up`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body:**
```json
{
  "exp_crystals": 5
}
```

### Awaken Character
캐릭터 각성

**Endpoint:** `POST /api/v1/characters/{id}/awaken`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Get Party
파티 조회

**Endpoint:** `GET /api/v1/party`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Set Party
파티 설정

**Endpoint:** `PUT /api/v1/party`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body:**
```json
{
  "character_ids": [101, 102, 103, 104]
}
```

**Rules:**
- 1~4명의 캐릭터
- 중복 캐릭터 불가

---

## Summon (Gacha)

### Normal Summon
일반 소환 (크리스탈 100)

**Endpoint:** `POST /api/v1/summon/normal`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body (optional):**
```json
{
  "count": 1
}
```

**Notes:**
- `count`는 `1` 또는 `10`만 허용
- 10회 소환 시 10+1 보너스 제공
- 10회 소환에는 최소 4성 1장 보장

**Response Data:**
```json
{
  "results": [
    {
      "character_id": 15,
      "character": {
        "id": 15,
        "name": "Novice Fighter",
        "grade": 1,
        "element": "fire",
        "class": "warrior"
      },
      "is_new": true
    }
  ],
  "remaining_crystals": 200
}
```

### Premium Summon
프리미엄 소환 (크리스탈 300)

**Endpoint:** `POST /api/v1/summon/premium`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body (optional):**
```json
{
  "count": 1
}
```

### Get Summon Rates
가챠 확률 조회 (일반)

**Endpoint:** `GET /api/v1/summon/rates`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Response Data:**
```json
{
  "1": 50.0,
  "2": 30.0,
  "3": 15.0,
  "4": 4.0,
  "5": 1.0
}
```

---

## Dungeons (던전)

### Get All Dungeons
던전 목록 조회

**Endpoint:** `GET /api/v1/dungeons`

**Query Parameters:**
- `chapter` (optional): 챕터 번호

**Headers:**
```
Authorization: Bearer {authToken}
```

### Get Dungeon Detail
던전 상세 정보

**Endpoint:** `GET /api/v1/dungeons/{id}`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Get User Progress
사용자 던전 진행 상황

**Endpoint:** `GET /api/v1/dungeons/progress`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Enter Dungeon
던전 입장

**Endpoint:** `POST /api/v1/dungeons/{id}/enter`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Note:** 던전 입장 시 에너지가 소모됩니다.

### Complete Dungeon
던전 완료

**Endpoint:** `POST /api/v1/dungeons/{id}/complete`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body:**
```json
{
  "stars": 3,
  "time_taken": 120
}
```

---

## Quests (퀘스트)

### Get Daily Quests
일일 퀘스트 조회

**Endpoint:** `GET /api/v1/quests/daily`

### Get Weekly Quests
주간 퀘스트 조회

**Endpoint:** `GET /api/v1/quests/weekly`

### Get Achievements
업적 조회

**Endpoint:** `GET /api/v1/quests/achievements`

### Complete Quest
퀘스트 완료

**Endpoint:** `POST /api/v1/quests/{id}/complete`

### Claim Quest
퀘스트 보상 수령

**Endpoint:** `POST /api/v1/quests/{id}/claim`

### Daily Login
일일 로그인 보상 상태

**Endpoint:** `GET /api/v1/login/daily`

**Headers (for all quest endpoints):**
```
Authorization: Bearer {authToken}
```

---

## Shop (상점)

### Get Items
상점 아이템 조회

**Endpoint:** `GET /api/v1/shop/items`

**Query Parameters:**
- `currency` (optional): `gold`, `crystal`, `glory`, `guild`

**Headers:**
```
Authorization: Bearer {authToken}
```

### Purchase
상점 구매

**Endpoint:** `POST /api/v1/shop/purchase`

**Headers:**
```
Authorization: Bearer {authToken}
```

**Request Body:**
```json
{
  "shop_item_id": 1,
  "quantity": 1
}
```

### Purchase History
구매 내역 조회

**Endpoint:** `GET /api/v1/shop/history`

**Headers:**
```
Authorization: Bearer {authToken}
```

---

## Arena (Post-MVP)

### Get My Arena
아레나 상태 조회

**Endpoint:** `GET /api/v1/arena`

### Set Defense Team
방어 팀 설정

**Endpoint:** `PUT /api/v1/arena/defense`

**Request Body:**
```json
{
  "character_ids": [101, 102, 103, 104]
}
```

### Get Ranking
랭킹 조회

**Endpoint:** `GET /api/v1/arena/ranking`

**Query Parameters:**
- `limit` (optional, default 50)

### Attack
아레나 공격

**Endpoint:** `POST /api/v1/arena/attack`

**Request Body:**
```json
{
  "defender_id": 2,
  "attacker_team": [101, 102, 103, 104]
}
```

### Battle History
전투 기록 조회

**Endpoint:** `GET /api/v1/arena/history`

**Query Parameters:**
- `limit` (optional, default 20)

**Headers (for all arena endpoints):**
```
Authorization: Bearer {authToken}
```

---

## Guilds (Post-MVP)

### Get Guilds
길드 목록 조회

**Endpoint:** `GET /api/v1/guilds`

**Query Parameters:**
- `page` (optional, default 1)
- `limit` (optional, default 20)

### Create Guild
길드 생성

**Endpoint:** `POST /api/v1/guilds`

**Request Body:**
```json
{
  "name": "MyGuild",
  "description": "Welcome",
  "emblem": "fire"
}
```

### Get Guild Detail
길드 상세

**Endpoint:** `GET /api/v1/guilds/{id}`

### Update Guild
길드 정보 수정

**Endpoint:** `PUT /api/v1/guilds/{id}`

**Request Body:**
```json
{
  "description": "New description",
  "notice": "Raid at 9 PM",
  "emblem": "wind"
}
```

### Join Guild
길드 가입

**Endpoint:** `POST /api/v1/guilds/{id}/join`

### Leave Guild
길드 탈퇴

**Endpoint:** `POST /api/v1/guilds/{id}/leave`

### Get Members
길드 멤버 조회

**Endpoint:** `GET /api/v1/guilds/{id}/members`

### My Guild
내 길드 조회

**Endpoint:** `GET /api/v1/guilds/my`

**Headers (for all guild endpoints):**
```
Authorization: Bearer {authToken}
```

---

## WebSocket

### Connection
**Endpoint:** `ws://localhost:8080/ws` or `ws://localhost/ws`

**Query Parameters:**
- `user_id` (optional): User ID for dev testing

### Message Format
**Client → Server:**
```json
{
  "type": "message_type",
  "data": {}
}
```

**Server → Client:**
```json
{
  "type": "response_type",
  "data": {}
}
```

### Supported Message Types

#### Ping/Pong
**Client sends:**
```json
{
  "type": "ping"
}
```

**Server responds:**
```json
{
  "type": "pong",
  "data": {
    "message": "pong"
  }
}
```

#### Chat Broadcast
**Client sends:**
```json
{
  "type": "chat",
  "data": {
    "message": "hello"
  }
}
```

**Server broadcasts:** Same payload to all connected clients.

---

## Error Responses

### HTTP Status Codes
- `200 OK` - 성공
- `400 Bad Request` - 잘못된 요청
- `401 Unauthorized` - 인증 실패
- `404 Not Found` - 리소스를 찾을 수 없음
- `429 Too Many Requests` - Rate Limit 초과
- `500 Internal Server Error` - 서버 오류

---

## Testing with curl

### Register (store refresh cookie)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123"
  }'
```

### Login (store refresh cookie)
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "player1",
    "password": "password123"
  }'
```

### Refresh (cookie-based)
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -b cookies.txt
```

### Get Profile (with token)
```bash
curl http://localhost:8080/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Normal Summon (10+1)
```bash
curl -X POST http://localhost:8080/api/v1/summon/normal \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

---

## Game Mechanics (PRD Summary)

### Energy System
- 최대 에너지: 100
- 회복 속도: 5분당 1

### Character Grades (Star Rating)
- ⭐ 1성: 50% (일반), 20% (프리미엄)
- ⭐⭐ 2성: 30% (일반), 30% (프리미엄)
- ⭐⭐⭐ 3성: 15% (일반), 35% (프리미엄)
- ⭐⭐⭐⭐ 4성: 4% (일반), 12% (프리미엄)
- ⭐⭐⭐⭐⭐ 5성: 1% (일반), 3% (프리미엄)

### Level Caps by Grade
- 1성: 레벨 15
- 2성: 레벨 25
- 3성: 레벨 35
- 4성: 레벨 45
- 5성: 레벨 60

### Currency
- **크리스탈**: 프리미엄 화폐
- **골드**: 기본 화폐

### Starting Resources
- 크리스탈: 300
- 골드: 5,000
- 에너지: 100
