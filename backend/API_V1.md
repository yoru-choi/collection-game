# API Documentation v1.0

## Base URLs
- **API v1**: `http://localhost:8080/api/v1`
- **WebSocket**: `ws://localhost:8080/ws`
- **Health Check**: `http://localhost:8080/health`

## Features
- ✅ API Versioning (v1)
- ✅ Rate Limiting (100 req/min per IP)
- ✅ JWT Authentication
- ✅ WebSocket Real-time Communication
- ✅ Structured JSON Logging

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
- **Limit**: 100 requests per minute per IP address
- **Response**: 429 Too Many Requests when exceeded

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

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

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

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Refresh Token
토큰 갱신

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## User

### Get Profile
유저 프로필 조회

**Endpoint:** `GET /api/v1/user/profile`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "player1",
    "level": 5,
    "exp": 1250,
    "crystals": 500,
    "gold": 10000,
    "energy": 85,
    "max_energy": 100
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Characters

### Get User Characters
보유 캐릭터 목록

**Endpoint:** `GET /api/v1/characters`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "character_id": 5,
      "level": 10,
      "exp": 500,
      "current_hp": 1200,
      "current_atk": 180,
      "current_def": 120,
      "current_spd": 95,
      "crit_rate": 15.5,
      "crit_damage": 75.0,
      "accuracy": 10.0,
      "resistance": 5.0,
      "skill_1_level": 2,
      "skill_2_level": 1,
      "skill_3_level": 1,
      "skill_4_level": 1,
      "awakened": false,
      "obtained_at": "2026-02-10T10:30:00Z"
    }
  ],
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Get Character Detail
캐릭터 상세 정보

**Endpoint:** `GET /api/v1/characters/:id`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "character_id": 5,
    "level": 10,
    "Character": {
      "id": 5,
      "name": "Fire Knight",
      "grade": 4,
      "element": "fire",
      "class": "warrior",
      "base_hp": 1000,
      "base_atk": 150,
      "base_def": 100,
      "base_spd": 90,
      "image_url": "/images/characters/fire_knight.png"
    }
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Level Up Character
캐릭터 레벨업

**Endpoint:** `POST /api/v1/characters/:id/level-up`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "exp_crystals": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "character leveled up successfully"
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Summon (Gacha)

### Normal Summon
일반 소환 (골드 100 사용)

**Endpoint:** `POST /api/v1/summon/normal`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "character_id": 15,
    "character": {
      "id": 15,
      "name": "Novice Fighter",
      "grade": 1,
      "element": "fire",
      "class": "warrior",
      "base_hp": 600,
      "base_atk": 80,
      "image_url": "/images/characters/novice_fighter.png"
    },
    "is_new": true
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Premium Summon
프리미엄 소환 (크리스탈 300 사용)

**Endpoint:** `POST /api/v1/summon/premium`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "character_id": 2,
    "character": {
      "id": 2,
      "name": "Flame Mage",
      "grade": 5,
      "element": "fire",
      "class": "mage"
    },
    "is_new": true
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Get Summon Rates
가챠 확률 조회

**Endpoint:** `GET /api/v1/summon/rates`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "1": 50.0,
    "2": 30.0,
    "3": 15.0,
    "4": 4.0,
    "5": 1.0
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## WebSocket

### Connection
WebSocket 연결

**Endpoint:** `ws://localhost:8080/ws`

**Query Parameters:**
- `user_id` (optional): User ID for authentication

### Message Format
All WebSocket messages follow this structure:

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

#### Chat Message
**Client sends:**
```json
{
  "type": "chat",
  "data": {
    "channel": "global",
    "message": "Hello world!"
  }
}
```

**Server broadcasts:**
```json
{
  "type": "chat",
  "data": {
    "user_id": 1,
    "username": "player1",
    "channel": "global",
    "message": "Hello world!",
    "timestamp": "2026-02-10T12:00:00Z"
  }
}
```

---

## Error Responses

### HTTP Status Codes
- `200 OK` - 성공
- `400 Bad Request` - 잘못된 요청
- `401 Unauthorized` - 인증 실패
- `404 Not Found` - 리소스를 찾을 수 없음
- `429 Too Many Requests` - Rate Limit 초과
- `500 Internal Server Error` - 서버 오류

### Error Format
```json
{
  "success": false,
  "error": "detailed error message",
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Testing with curl

### Register
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl http://localhost:8080/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Normal Summon
```bash
curl -X POST http://localhost:8080/api/v1/summon/normal \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Security Features

### JWT Tokens (Valkey-Based Management)

**Token Types:**
- **Access Token**: 
  - Expiration: 15 minutes
  - Stored in client memory only (not localStorage)
  - Stateless verification
  
- **Refresh Token**: 
  - Expiration: 7 days
  - Stored in Valkey: `refresh_token:{user_id}:{token_id}`
  - Auto-expires via TTL
  - Recommended: Send via HttpOnly Cookie

**Security Features:**
- **Algorithm**: HS256
- **bcrypt**: Cost factor 12
- **Token ID (JTI)**: UUID for tracking and revocation
- **Token Blacklist**: Revoked tokens stored in Valkey
- **Token Rotation**: Refresh tokens are rotated on renewal
- **Concurrent Login**: Trackable via Valkey session management

**Authentication Flow:**

1. **Login**:
   - User credentials validated
   - Access + Refresh tokens generated
   - Refresh token stored in Valkey
   - Both tokens returned to client

2. **API Request**:
   - Access token validated (signature, expiration)
   - Blacklist check (Valkey: `token_blacklist:{jti}`)
   - If valid, request processed

3. **Token Refresh**:
   - Refresh token validated against Valkey
   - Old refresh token revoked (rotation)
   - New token pair generated
   - New refresh token stored in Valkey

4. **Logout**:
   - Access token added to blacklist (Valkey)
   - Refresh token deleted from Valkey
   - Session cleaned up

**Valkey Keys:**
```redis
# Refresh Token Storage
refresh_token:{user_id}:{token_id} → TTL: 7 days

# Token Blacklist (Logout)
token_blacklist:{token_jti} → TTL: 15 minutes

# User Session (Optional)
user_session:{user_id} → TTL: 24 hours
```

### Rate Limiting
- 100 requests per minute per IP
- Applied to all API endpoints
- Excludes health check endpoint
- Implemented at both Nginx and application level

### CORS
- Configurable in production
- Currently allows all origins for development

### Additional Security
- SQL Injection protection via Prepared Statements
- XSS prevention through input validation
- HTTPS/TLS 1.3 recommended in production
- Server-side game logic validation

---

## Game Mechanics

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
- **크리스탈** (Crystals): 프리미엄 화폐
- **골드** (Gold): 기본 화폐

### Starting Resources
- 크리스탈: 300
- 골드: 5,000
- 에너지: 100

---

## Dungeons (던전)

### Get All Dungeons
던전 목록 조회

**Endpoint:** `GET /api/v1/dungeons`

**Query Parameters:**
- `chapter` (optional): 챕터 번호로 필터링

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "초원의 시작",
      "dungeon_type": "story",
      "difficulty": "normal",
      "chapter": 1,
      "stage": 1,
      "energy_cost": 5,
      "exp_reward": 100,
      "gold_reward": 50
    }
  ],
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Get Dungeon Detail
던전 상세 정보

**Endpoint:** `GET /api/v1/dungeons/:id`

**Headers:**
```
Authorization: Bearer {access_token}
```

### Get User Progress
사용자 던전 진행 상황

**Endpoint:** `GET /api/v1/dungeons/progress`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "dungeon_id": 1,
      "cleared": true,
      "stars": 3,
      "best_time": 120,
      "clear_count": 5,
      "updated_at": "2026-02-10T10:00:00Z"
    }
  ],
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### Enter Dungeon
던전 입장

**Endpoint:** `POST /api/v1/dungeons/:id/enter`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "battle_1_1",
    "user_id": 1,
    "dungeon_id": 1,
    "current_stage": 1,
    "turn_count": 0,
    "is_completed": false,
    "victory": false
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

**Note:** 던전 입장 시 에너지가 소모됩니다.

### Complete Dungeon
던전 완료

**Endpoint:** `POST /api/v1/dungeons/:id/complete`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "stars": 3,
  "time_taken": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "dungeon completed successfully"
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Character Awakening (각성)

### Awaken Character
캐릭터 각성

**Endpoint:** `POST /api/v1/characters/:id/awaken`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "character awakened successfully"
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

**Requirements:**
- 캐릭터가 현재 등급의 최대 레벨에 도달
- 충분한 크리스탈 (등급 × 1000)
- 충분한 골드 (등급 × 50000)

**Effects:**
- 레벨 1로 초기화
- 모든 스탯 50% 증가
- 각성 상태로 변경

---

## User Inventory (인벤토리)

### Get Inventory
인벤토리 조회

**Endpoint:** `GET /api/v1/user/inventory`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "crystals": 1000,
    "gold": 50000,
    "energy": 85,
    "max_energy": 100,
    "level": 10,
    "exp": 5000
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Logout

### Logout
로그아웃

**Endpoint:** `POST /api/v1/auth/logout`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "logged out successfully"
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

**Note:** JWT는 stateless이므로 클라이언트에서 토큰을 삭제해야 합니다.
