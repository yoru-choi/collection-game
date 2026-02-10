# Collection Game Backend - 설치 및 실행 가이드

## 시작하기

### 1. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하여 설정:

```bash
cp .env.example .env
```

`.env` 파일 수정:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=collection_game

# JWT Secret (보안을 위해 강력한 키로 변경하세요)
JWT_SECRET=your-very-secure-secret-key-change-this

# Redis (선택사항)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. PostgreSQL 설치 및 데이터베이스 생성

PostgreSQL이 설치되어 있지 않다면:
- [PostgreSQL 다운로드](https://www.postgresql.org/download/)

데이터베이스 생성:
```sql
CREATE DATABASE collection_game;
```

### 3. 데이터베이스 마이그레이션

마이그레이션 도구 설치 (선택):
```bash
# Windows
scoop install migrate

# 또는 직접 다운로드
# https://github.com/golang-migrate/migrate
```

마이그레이션 실행:
```bash
# SQL 파일을 직접 실행
psql -U postgres -d collection_game -f migrations/000001_init_schema.up.sql
psql -U postgres -d collection_game -f migrations/000002_seed_data.up.sql
```

또는 pgAdmin이나 다른 PostgreSQL 클라이언트를 사용하여 SQL 파일 실행

### 4. Redis 설치 (선택사항)

Redis는 캐싱에 사용됩니다. 없어도 서버는 실행됩니다.

- [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- 또는 Docker: `docker run -d -p 6379:6379 redis`

### 5. 의존성 설치

```bash
go mod download
```

### 6. 서버 실행

#### 개발 모드:
```bash
go run cmd/server/main.go
```

#### 빌드 후 실행:
```bash
# 빌드
go build -o bin/server.exe cmd/server/main.go

# 실행
./bin/server.exe
```

#### Makefile 사용:
```bash
# 실행
make run

# 빌드
make build

# 테스트
make test
```

### 7. 서버 확인

브라우저나 curl로 헬스체크:
```bash
curl http://localhost:8080/health
```

예상 응답:
```json
{"status":"ok"}
```

## API 테스트

### 회원가입
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "email": "player1@example.com",
    "password": "password123"
  }'
```

### 로그인
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "player1",
    "password": "password123"
  }'
```

### 프로필 조회 (로그인 후 받은 토큰 사용)
```bash
curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 일반 소환 (가챠)
```bash
curl -X POST http://localhost:8080/api/summon/normal \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 프리미엄 소환
```bash
curl -X POST http://localhost:8080/api/summon/premium \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 보유 캐릭터 목록
```bash
curl http://localhost:8080/api/characters \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 문제 해결

### 데이터베이스 연결 실패
- PostgreSQL이 실행 중인지 확인
- `.env` 파일의 DB 설정 확인
- 방화벽 설정 확인

### 빌드 오류
```bash
go mod tidy
go clean -cache
```

### 포트가 이미 사용 중
`.env` 파일에서 `SERVER_PORT` 변경

## 프로젝트 구조

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 메인 서버 진입점
├── config/
│   └── config.go                # 설정 관리
├── internal/
│   ├── domain/                  # 도메인 모델
│   │   ├── user.go
│   │   ├── character.go
│   │   ├── skill.go
│   │   ├── rune.go
│   │   ├── dungeon.go
│   │   └── summon.go
│   ├── repository/              # 데이터 액세스 레이어
│   │   ├── user_repository.go
│   │   ├── character_repository.go
│   │   └── summon_repository.go
│   ├── usecase/                 # 비즈니스 로직
│   │   ├── auth_usecase.go
│   │   ├── user_usecase.go
│   │   ├── character_usecase.go
│   │   └── summon_usecase.go
│   ├── handler/                 # HTTP 핸들러
│   │   ├── auth_handler.go
│   │   ├── user_handler.go
│   │   ├── character_handler.go
│   │   ├── summon_handler.go
│   │   └── router.go
│   └── middleware/              # 미들웨어
│       ├── auth.go
│       └── logging.go
├── pkg/                         # 재사용 가능한 패키지
│   ├── auth/
│   │   └── jwt.go
│   ├── database/
│   │   └── database.go
│   ├── cache/
│   │   └── cache.go
│   └── utils/
│       ├── random.go
│       └── response.go
├── migrations/                  # DB 마이그레이션
│   ├── 000001_init_schema.up.sql
│   ├── 000001_init_schema.down.sql
│   ├── 000002_seed_data.up.sql
│   └── 000002_seed_data.down.sql
├── .env.example                 # 환경 변수 예제
├── .gitignore
├── go.mod
├── go.sum
├── Makefile
├── API.md                       # API 문서
├── PRD.md                       # 제품 요구사항 명세
└── README.md
```

## 구현된 기능 (MVP)

### ✅ 완료된 기능
- [x] 유저 인증 시스템 (회원가입, 로그인, JWT)
- [x] 유저 프로필 관리
- [x] 캐릭터 시스템 (20개 샘플 캐릭터)
- [x] 가챠 시스템 (일반/프리미엄 소환)
- [x] 캐릭터 레벨업
- [x] 화폐 시스템 (크리스탈, 골드)
- [x] 에너지 시스템
- [x] 데이터베이스 스키마
- [x] Clean Architecture 구조
- [x] API 문서

### 🚧 다음 단계 (PRD 참조)
- [ ] 전투 시스템
- [ ] 던전 시스템
- [ ] 룬 시스템 (장비)
- [ ] 스킬 강화
- [ ] 캐릭터 각성 (Evolution)
- [ ] PvP 아레나
- [ ] 길드 시스템

## 추가 자료

- [API 문서](API.md)
- [PRD (제품 요구사항 명세)](PRD.md)

## 기술 스택

- **언어**: Go 1.21+
- **프레임워크**: 
  - Gorilla Mux (HTTP 라우팅)
  - JWT (인증)
- **데이터베이스**: PostgreSQL
- **캐싱**: Redis/Valkey (선택사항)
- **아키텍처**: Clean Architecture

## 라이센스

Private Project
