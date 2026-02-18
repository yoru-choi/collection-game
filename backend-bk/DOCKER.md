# Collection Game Backend - Docker Setup

## 🐳 Docker로 시작하기

### 사전 요구사항
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
- Docker Compose v2.0 이상

### 한 번에 실행하기

```bash
# 모든 서비스 시작 (백엔드, PostgreSQL, Valkey, Nginx, Dozzle)
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# Dozzle 웹 UI로 로그 보기 (더 편리)
# 브라우저에서: http://localhost:8888
```

### 서비스 URL
- **API Server**: http://localhost:80/api/v1
- **Health Check**: http://localhost:80/health
- **WebSocket**: ws://localhost:80/ws
- **Dozzle (로그 뷰어)**: http://localhost:8888
- **PostgreSQL**: localhost:5432
- **Valkey**: localhost:6379

### 데이터베이스 초기화

마이그레이션은 PostgreSQL 컨테이너 시작 시 자동으로 실행됩니다:
```bash
# 컨테이너가 실행 중인지 확인
docker-compose ps

# 수동으로 마이그레이션 실행 (필요 시)
docker-compose exec postgres psql -U postgres -d collection_game -f /docker-entrypoint-initdb.d/000001_init_schema.up.sql
docker-compose exec postgres psql -U postgres -d collection_game -f /docker-entrypoint-initdb.d/000002_seed_data.up.sql
docker-compose exec postgres psql -U postgres -d collection_game -f /docker-entrypoint-initdb.d/000003_add_indexes.up.sql
```

### 환경 변수 설정

기본 설정은 `docker-compose.yml`에 있습니다. 프로덕션 환경에서는 `.env` 파일 생성:

```bash
cp .env.example .env
# .env 파일 편집
```

### Docker 명령어

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 로그 보기
docker-compose logs -f [service_name]

# 특정 컨테이너 접속
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d collection_game

# 데이터 볼륨까지 삭제 (완전 초기화)
docker-compose down -v

# 이미지 빌드 (코드 변경 시)
docker-compose build backend

# 빌드 후 재시작
docker-compose up -d --build backend
```

---

## 📊 Dozzle - 실시간 로그 모니터링

Dozzle은 Docker 컨테이너 로그를 웹 브라우저에서 실시간으로 볼 수 있는 도구입니다.

### 접속
http://localhost:8888

### 기능
- ✅ 실시간 로그 스트리밍
- ✅ 컨테이너별 필터링
- ✅ 로그 검색
- ✅ 다크 모드 지원
- ✅ 멀티 컨테이너 동시 보기

### 사용법
1. 브라우저에서 http://localhost:8888 접속
2. 좌측에서 보고 싶은 컨테이너 선택
3. 실시간으로 로그 확인

---

## 🔧 개발 환경

### 로컬 개발 (Docker 없이)

```bash
# PostgreSQL과 Valkey만 Docker로 실행
docker-compose up -d postgres valkey

# 환경 변수 설정
export DB_HOST=localhost
export REDIS_HOST=localhost

# 백엔드 로컬 실행
go run cmd/server/main.go
```

### 핫 리로드 개발

```bash
# Air 설치 (Go Hot Reload 도구)
go install github.com/cosmtrek/air@latest

# Air 설정 파일 생성
air init

# Air로 실행
air
```

---

## 🏗️ 아키텍처

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Nginx    │  ← Rate Limiting & Reverse Proxy
│   :80       │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Backend   │  ← Go API Server
│   :8080     │
└──┬────┬─────┘
   │    │
   ↓    ↓
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Valkey  │
│  :5432   │  │  :6379   │
└──────────┘  └──────────┘

┌─────────────┐
│   Dozzle    │  ← Log Viewer
│   :8888     │
└─────────────┘
```

---

## 📝 로깅

### 구조화된 JSON 로그

모든 로그는 JSON 형식으로 출력됩니다:

```json
{
  "timestamp": "2026-02-10T12:00:00Z",
  "level": "INFO",
  "message": "Server started",
  "data": {
    "address": "0.0.0.0:8080",
    "version": "v1.0.0"
  }
}
```

### 로그 레벨
- **ERROR**: 오류 및 예외
- **WARN**: 경고
- **INFO**: 일반 정보
- **DEBUG**: 디버그 정보 (개발 환경에서만)

### 로그 확인 방법

1. **Dozzle 웹 UI** (추천)
   ```
   http://localhost:8888
   ```

2. **Docker 명령어**
   ```bash
   docker-compose logs -f backend
   ```

3. **컨테이너 내부**
   ```bash
   docker-compose exec backend sh
   # logs가 stdout으로 출력됨
   ```

---

## 🛡️ 보안

### JWT 설정
- Access Token: 15분
- Refresh Token: 7일
- bcrypt cost: 12

### Rate Limiting
- Nginx 레벨: 100 req/min per IP
- Application 레벨: 100 req/min per IP

### CORS
프로덕션 환경에서는 `nginx.conf`에서 CORS 설정 변경 필요

---

## 🔍 트러블슈팅

### 포트 충돌
```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# 포트 변경은 docker-compose.yml에서
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 재시작
docker-compose restart postgres
```

### 백엔드 빌드 실패
```bash
# 캐시 삭제 후 재빌드
docker-compose build --no-cache backend
docker-compose up -d backend
```

### 데이터 초기화
```bash
# 모든 컨테이너와 볼륨 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d
```

---

## 📦 프로덕션 배포

### 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 중요: 프로덕션 시크릿 변경!
JWT_SECRET=your-production-secret-key-here
DB_PASSWORD=strong-database-password
```

### 이미지 빌드 및 푸시
```bash
# 이미지 빌드
docker build -t collection-game-backend:latest .

# Docker Hub에 푸시 (옵션)
docker tag collection-game-backend:latest yourusername/collection-game-backend:latest
docker push yourusername/collection-game-backend:latest
```

### Docker Swarm / Kubernetes
- `docker-compose.yml`을 기반으로 오케스트레이션 도구 설정 가능
- 프로덕션에서는 secrets 관리 도구 사용 권장

---

## 📚 추가 문서

- [API 문서 v1](API_V1.md)
- [PRD (제품 요구사항 명세)](PRD.md)
- [로컬 개발 가이드](SETUP.md)

---

## 🎯 다음 단계

1. ✅ Docker 환경 실행
2. ✅ API 테스트 (curl 또는 Postman)
3. ✅ Dozzle로 로그 확인
4. ⬜ 프론트엔드 연동
5. ⬜ 추가 게임 기능 개발
