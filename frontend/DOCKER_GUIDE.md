# Docker Development Environment Guide

## 🐳 Docker 환경 구성

### 사전 요구사항
- Docker 20.10+
- Docker Compose 2.0+

### 서비스 구성

프로젝트는 다음 컨테이너로 구성됩니다:

```yaml
services:
  - postgres: PostgreSQL 데이터베이스
  - valkey: 캐싱 서버 (Redis 호환)
  - backend: Go 백엔드 API 서버
  - frontend: Vite 개발 서버 (또는 Nginx 정적 서빙)
  - nginx: 리버스 프록시 & 로드 밸런서
  - dozzle: 실시간 로그 모니터링 UI
```

## 📁 Docker 파일 구조

```
project-root/
├── docker-compose.yml          # 메인 Docker Compose 설정
├── docker-compose.dev.yml      # 개발 환경 오버라이드
├── docker-compose.prod.yml     # 프로덕션 환경 설정
├── .env                        # 환경 변수 (Git에서 제외)
├── .env.example                # 환경 변수 템플릿
├── backend/
│   └── Dockerfile              # 백엔드 Dockerfile
├── frontend/
│   ├── Dockerfile.dev          # 프론트엔드 개발용
│   └── Dockerfile.prod         # 프론트엔드 프로덕션용
└── nginx/
    └── nginx.conf              # Nginx 설정
```

## 🚀 빠른 시작

### 1. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 필요한 값 설정
```

### 2. 개발 환경 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up frontend backend -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 3. 서비스 접근

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080/api/v1
- **Dozzle (로그)**: http://localhost:8888
- **PostgreSQL**: localhost:5432
- **valkey**: localhost:6379

## 🔧 Docker Compose 명령어

### 기본 명령어

```bash
# 서비스 빌드
docker-compose build

# 서비스 시작 (백그라운드)
docker-compose up -d

# 서비스 중지
docker-compose stop

# 서비스 재시작
docker-compose restart

# 서비스 제거 (볼륨 유지)
docker-compose down

# 서비스 제거 (볼륨 포함)
docker-compose down -v

# 로그 확인
docker-compose logs -f [service-name]

# 실행 중인 컨테이너 목록
docker-compose ps

# 특정 서비스 쉘 접속
docker-compose exec [service-name] sh
```

### 개발 팁

```bash
# 프론트엔드만 재빌드 및 재시작
docker-compose up -d --build frontend

# 백엔드 로그 실시간 확인
docker-compose logs -f backend

# 데이터베이스 접속
docker-compose exec postgres psql -U gameuser -d gamedb

# valkey CLI 접속
docker-compose exec valkey valkey-cli

# 프론트엔드 컨테이너에서 명령 실행
docker-compose exec frontend npm install
docker-compose exec frontend npm run build
```

## 📊 Dozzle (로그 모니터링)

Dozzle은 웹 기반 실시간 로그 뷰어입니다.

### 접속
http://localhost:8888

### 기능
- 실시간 로그 스트리밍
- 다중 컨테이너 로그 동시 확인
- 로그 검색 및 필터링
- 컨테이너 통계 확인

## 🗄️ 데이터베이스 관리

### PostgreSQL 백업

```bash
# 백업 생성
docker-compose exec postgres pg_dump -U gameuser gamedb > backup.sql

# 백업 복원
docker-compose exec -T postgres psql -U gameuser gamedb < backup.sql
```

### Migration 실행

```bash
# 백엔드 컨테이너에서 migration 실행
docker-compose exec backend ./app migrate up
```

## 🔐 보안 고려사항

### 개발 환경
- 기본 포트 사용
- 간단한 비밀번호 허용
- CORS 완전 개방

### 프로덕션 환경
- **필수 변경 사항**:
  - 모든 기본 비밀번호 변경
  - HTTPS/TLS 설정
  - CORS 제한적 설정
  - 방화벽 규칙 적용
  - Secret 관리 (Docker Secrets 또는 환경 변수)

## 🐛 문제 해결

### 포트 충돌

```bash
# 사용 중인 포트 확인 (Windows)
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID <PID> /F

# Docker Compose 포트 변경
# docker-compose.yml에서 포트 매핑 수정
# ports: "3001:3000"
```

### 컨테이너 재시작 반복

```bash
# 로그 확인
docker-compose logs [service-name]

# 컨테이너 상태 확인
docker-compose ps

# 이미지 재빌드
docker-compose build --no-cache [service-name]
```

### 볼륨 데이터 초기화

```bash
# 주의: 모든 데이터가 삭제됩니다!
docker-compose down -v
docker-compose up -d
```

## 📦 프로덕션 배포

### 프로덕션 빌드

```bash
# 프로덕션 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 프로덕션 환경 시작
docker-compose -f docker-compose.prod.yml up -d
```

### 성능 최적화
- Multi-stage 빌드로 이미지 크기 최소화
- Health check 설정
- Resource limits 설정
- Nginx 캐싱 활성화
- PostgreSQL 커넥션 풀 최적화

## 📚 추가 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [PostgreSQL Docker 이미지](https://hub.docker.com/_/postgres)
- [Nginx Docker 이미지](https://hub.docker.com/_/nginx)
- [Dozzle 문서](https://dozzle.dev/)

## 🆘 도움말

문제가 발생하면:
1. 로그 확인: `docker-compose logs -f`
2. Dozzle에서 실시간 로그 모니터링
3. 컨테이너 상태 확인: `docker-compose ps`
4. GitHub Issues에 문의
