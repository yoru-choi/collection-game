# Collection Game Backend

캐릭터 수집형 RPG 게임 백엔드 서버 (PRD 기반 v2.0)

## ✨ 주요 기능

### 🐳 Docker 기반 인프라
- **완벽한 컨테이너화**: Docker Compose로 전체 스택 실행
- **PostgreSQL**: 게임 데이터 저장
- **Valkey (Redis)**: JWT 토큰 관리, 캐싱, 세션 관리
- **Nginx**: 리버스 프록시 & 로드 밸런싱 & Rate Limiting
- **Dozzle**: 실시간 로그 모니터링 웹 UI

### 🔧 백엔드 기능
- ✅ **API Versioning** (`/api/v1/`)
- ✅ **JWT 인증** (Valkey 기반 토큰 관리)
  - Access Token (15분) + Refresh Token (7일)
  - Token Blacklist (로그아웃 지원)
  - Token Rotation (보안 강화)
  - Concurrent Login 추적
- ✅ **Rate Limiting** (100 req/min)
- ✅ **WebSocket** 실시간 통신
- ✅ **구조화된 JSON 로깅**
- ✅ **bcrypt** (cost 12) 패스워드 암호화
- ✅ **Clean Architecture**

### 🎮 게임 기능
- ✅ 유저 인증 시스템
- ✅ 캐릭터 시스템 (속성, 클래스별 분류)
- ✅ 가챠 시스템 (일반/프리미엄)
- ✅ 캐릭터 레벨업 & 각성
- ✅ 화폐 시스템 (크리스탈, 골드)
- ✅ 에너지 시스템 (자동 회복)
- ✅ 던전 시스템 (스토리, 속성, 경험치, 골드, 보스)
- ✅ PvP 아레나 (비동기 전투)
- ✅ 길드 시스템
- ✅ 상점 시스템
- ✅ 퀘스트 시스템 (일일/주간/업적)
- ✅ 전투 시스템 (턴제 전투)
- ✅ 친구 시스템
- ✅ 룬 장비 시스템

## 📂 프로젝트 구조

```
backend/
├── cmd/
│   └── server/              # 메인 애플리케이션 진입점
├── internal/
│   ├── domain/              # 도메인 모델 (엔티티)
│   ├── repository/          # 데이터 액세스 레이어
│   ├── usecase/             # 비즈니스 로직
│   ├── handler/             # HTTP 핸들러 + WebSocket
│   └── middleware/          # 인증, Rate Limiting, CORS
├── pkg/
│   ├── auth/                # JWT 토큰 생성/검증
│   ├── database/            # PostgreSQL 연결
│   ├── cache/               # Valkey(Redis) 연결
│   ├── logger/              # 구조화된 JSON 로깅
│   └── utils/               # 공통 유틸리티
├── migrations/              # 데이터베이스 마이그레이션 SQL
├── Dockerfile               # 멀티 스테이지 Go 빌드
├── docker-compose.yml       # 전체 서비스 오케스트레이션
└── nginx.conf               # Nginx 리버스 프록시 설정
```

## 🚀 빠른 시작

### 필수 요구사항
- **Docker** 20.10+
- **Docker Compose** 2.0+

### 1️⃣ Docker Compose로 실행

```bash
# 전체 스택 시작 (PostgreSQL, Valkey, Backend, Nginx, Dozzle)
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 또는 Dozzle 웹 UI로 로그 확인
# 브라우저에서: http://localhost:8888
```

### 2️⃣ 로컬 개발 모드

```bash
# 의존성 설치
go mod download

# 환경 변수 설정
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=password
export DB_NAME=collection_game
export VALKEY_HOST=localhost
export VALKEY_PORT=6379
export JWT_SECRET=your-secret-key

# 서버 실행
go run cmd/server/main.go
```

### 3️⃣ 서비스 접근

| 서비스 | URL | 용도 |
|--------|-----|------|
| **Backend API** | http://localhost/api/v1/* | REST API |
| **WebSocket** | ws://localhost/ws | 실시간 통신 |
| **Dozzle** | http://localhost:8888 | 로그 모니터링 |
| **PostgreSQL** | localhost:5432 | 데이터베이스 |
| **Valkey** | localhost:6379 | 캐시 |

## 📖 API 문서

자세한 API 문서는 [API_V1.md](API_V1.md)를 참고하세요.

### 주요 엔드포인트

#### 🔐 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신

#### 👤 유저
- `GET /api/v1/user/profile` - 프로필 조회
- `PUT /api/v1/user/profile` - 프로필 수정
- `GET /api/v1/user/inventory` - 인벤토리 조회

#### 🎭 캐릭터
- `GET /api/v1/characters` - 보유 캐릭터 목록
- `GET /api/v1/characters/:id` - 캐릭터 상세
- `POST /api/v1/characters/:id/level-up` - 레벨업
- `POST /api/v1/characters/:id/awaken` - 각성

#### 🎰 가챠
- `POST /api/v1/summon/normal` - 일반 소환
- `POST /api/v1/summon/premium` - 프리미엄 소환
- `GET /api/v1/summon/rates` - 확률 정보

#### 🏰 던전
- `GET /api/v1/dungeons` - 던전 목록
- `GET /api/v1/dungeons/:id` - 던전 상세
- `POST /api/v1/dungeons/:id/enter` - 던전 입장
- `POST /api/v1/dungeons/:id/complete` - 던전 완료
- `GET /api/v1/dungeons/progress` - 진행 상황

#### ⚔️ 아레나
- `GET /api/v1/arena` - 내 아레나 정보
- `PUT /api/v1/arena/defense` - 방어 팀 설정
- `GET /api/v1/arena/ranking` - 랭킹 조회
- `POST /api/v1/arena/attack` - 공격
- `GET /api/v1/arena/history` - 전투 기록

#### 🏰 길드
- `GET /api/v1/guilds` - 길드 목록
- `POST /api/v1/guilds` - 길드 생성
- `GET /api/v1/guilds/:id` - 길드 상세
- `POST /api/v1/guilds/:id/join` - 길드 가입
- `POST /api/v1/guilds/:id/leave` - 길드 탈퇴
- `GET /api/v1/guilds/:id/members` - 멤버 목록
- `GET /api/v1/guilds/my` - 내 길드

#### 🛒 상점
- `GET /api/v1/shop/items` - 상점 아이템 목록
- `POST /api/v1/shop/purchase` - 구매
- `GET /api/v1/shop/history` - 구매 기록

#### 📋 퀘스트
- `GET /api/v1/quests/daily` - 일일 퀘스트
- `GET /api/v1/quests/weekly` - 주간 퀘스트
- `GET /api/v1/quests/achievements` - 업적
- `POST /api/v1/quests/:id/claim` - 보상 수령
- `GET /api/v1/login/daily` - 일일 로그인 보상

#### 🌐 WebSocket
- `ws://localhost/ws` - WebSocket 연결
- **메시지 타입**: `ping`, `pong`, `chat`, `pvp`, `notification`

## 🔒 보안 기능

### JWT 토큰 관리 (Valkey 기반)
- **Access Token**: 15분 만료 (클라이언트 메모리 저장)
- **Refresh Token**: 7일 만료 (Valkey 저장 관리)
- **Token Blacklist**: 로그아웃 시 Valkey에 저장
- **Token Rotation**: Refresh 시 새 토큰 발급 및 구 토큰 폐기
- **JTI (JWT ID)**: UUID로 토큰 추적 및 무효화

### 암호화 및 검증
- **bcrypt**: Cost 12로 패스워드 해싱
- **Prepared Statements**: SQL Injection 방지

### Rate Limiting
- **Nginx**: 100 req/min per IP
- **Application**: 100 req/min per IP

### 기타 보안
- **CORS**: Origin 허용 제어
- **Server-side Validation**: 모든 게임 로직 서버 검증

**Valkey에 저장되는 토큰 정보:**
```redis
refresh_token:{user_id}:{token_id}  # TTL: 7일
token_blacklist:{token_jti}          # TTL: 15분
user_session:{user_id}               # TTL: 24시간
```

## 🐳 Docker 가이드

자세한 Docker 사용법은 [DOCKER.md](DOCKER.md)를 참고하세요.

### Docker Compose 명령어

```bash
# 전체 서비스 시작
docker-compose up -d

# 특정 서비스 재시작
docker-compose restart backend

# 로그 확인
docker-compose logs -f backend

# 전체 중지
docker-compose down

# 볼륨까지 삭제 (DB 데이터 초기화)
docker-compose down -v

# 이미지 재빌드
docker-compose build --no-cache backend
```

### 데이터베이스 접속

```bash
docker exec -it collection-game-postgres psql -U postgres -d collection_game
```

### Valkey(Redis) CLI

```bash
docker exec -it collection-game-valkey valkey-cli
```

## 📊 모니터링

### Dozzle 로그 뷰어
- URL: http://localhost:8888
- 실시간 컨테이너 로그 확인
- 필터링 및 검색 기능

### 구조화된 로그 형식
```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "level": "INFO",
  "message": "Server started",
  "data": {
    "port": 8080
  }
}
```

## 🧪 테스트

```bash
# 유닛 테스트
go test ./...

# 커버리지 포함
go test -cover ./...

# API 테스트 (cURL)
# 회원가입
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"Test1234!","email":"player1@test.com"}'

# 로그인
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"Test1234!"}'

# WebSocket 테스트 (websocat)
websocat ws://localhost/ws
```

## 🛠️ 개발 팁

### 환경 변수 (PostgreSQL, Valkey, Nginx, Dozzle)
- JWT 인증 시스템 (Valkey 기반)
- API Versioning (/api/v1/*)
- WebSocket 실시간 통신
- Rate Limiting (Nginx + Application)
- 구조화된 로깅
- Clean Architecture

### ✅ Phase 2 (완료)
- 유저/캐릭터 시스템
- 가챠 시스템
- 던전 시스템 (스토리, 속성, 경험치, 골드, 보스)
- PvP 아레나 (비동기 전투)
- 길드 시스템
- 상점 시스템
- 퀘스트 시스템 (일일/주간/업적)
- 전투 시스템 (턴제)
- 친구 시스템
- 룬 장비 시스템

### 🔜 Phase 3 (예정)
- 프론트엔드 (Phaser 3 + TypeScript)
- 실시간 PvP (WebSocket 기반)
- 길드전
- 이벤트 시스템
- 보스 레이드
- 스킨 시스템
- 시즌 패스션 생성
```bash
# 새 마이그레이션 파일 생성
migrate create -ext sql -dir migrations -seq add_new_table
```

### 로컬 빌드
```bash
# 바이너리 빌드
go build -o bin/server cmd/server/main.go

# 실행
./bin/server
```

## 📚 추가 문서

- [API_V1.md](API_V1.md) - 완전한 API 명세서
- [DOCKER.md](DOCKER.md) - Docker 심화 가이드
- [PRD.md](../PRD.md) - 프로젝트 요구사항 문서

## 🎯 로드맵

### ✅ Phase 1 (완료)
- Docker 인프라 구축
- API Versioning
- WebSocket 실시간 통신
- Rate Limiting
- 구조화된 로깅
- 기본 게임 기능

### 🔜 Phase 2 (예정)
- 전투 시스템
- 던전 시스템
- PvP 아레나
- 길드 시스템
- 이벤트 시스템

## 📄 라이센스

Private Project
