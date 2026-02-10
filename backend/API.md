# API Documentation

Base URL: `http://localhost:8080/api`

## Authentication

### Register
회원가입

**Endpoint:** `POST /auth/register`

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
  }
}
```

### Login
로그인

**Endpoint:** `POST /auth/login`

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
  }
}
```

### Refresh Token
토큰 갱신

**Endpoint:** `POST /auth/refresh`

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
  }
}
```

---

## User

### Get Profile
유저 프로필 조회

**Endpoint:** `GET /user/profile`

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
  }
}
```

---

## Characters

### Get User Characters
보유 캐릭터 목록

**Endpoint:** `GET /characters`

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
  ]
}
```

### Get Character Detail
캐릭터 상세 정보

**Endpoint:** `GET /characters/:id`

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
    "exp": 500,
    "current_hp": 1200,
    "current_atk": 180,
    "current_def": 120,
    "current_spd": 95,
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
      "skill_1_id": 1,
      "skill_2_id": 2,
      "skill_3_id": 3,
      "skill_4_id": 8,
      "image_url": "/images/characters/fire_knight.png"
    }
  }
}
```

### Level Up Character
캐릭터 레벨업

**Endpoint:** `POST /characters/:id/level-up`

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
  }
}
```

---

## Summon (Gacha)

### Normal Summon
일반 소환 (골드 100 사용)

**Endpoint:** `POST /summon/normal`

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
      "base_def": 60,
      "base_spd": 70,
      "image_url": "/images/characters/novice_fighter.png"
    },
    "is_new": true
  }
}
```

### Premium Summon
프리미엄 소환 (크리스탈 300 사용)

**Endpoint:** `POST /summon/premium`

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
      "class": "mage",
      "base_hp": 900,
      "base_atk": 180,
      "base_def": 70,
      "base_spd": 95,
      "image_url": "/images/characters/flame_mage.png"
    },
    "is_new": true
  }
}
```

### Get Summon Rates
가챠 확률 조회

**Endpoint:** `GET /summon/rates`

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
  }
}
```

---

## Error Responses

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "error message here"
}
```

### HTTP Status Codes
- `200 OK` - 성공
- `400 Bad Request` - 잘못된 요청
- `401 Unauthorized` - 인증 실패
- `404 Not Found` - 리소스를 찾을 수 없음
- `500 Internal Server Error` - 서버 오류

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
