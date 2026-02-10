# Collection Game Backend

캐릭터 수집형 RPG 게임 백엔드 서버

## 기술 스택

- **언어**: Go 1.21+
- **프레임워크**: Gin (HTTP), gRPC
- **데이터베이스**: PostgreSQL
- **캐싱**: Redis/Valkey
- **인증**: JWT

## 프로젝트 구조

```
.
├── cmd/
│   └── server/          # 메인 애플리케이션
├── internal/
│   ├── domain/          # 도메인 모델
│   ├── repository/      # 데이터 액세스 레이어
│   ├── usecase/         # 비즈니스 로직
│   ├── handler/         # HTTP/gRPC 핸들러
│   └── middleware/      # 미들웨어
├── pkg/
│   ├── auth/            # 인증 유틸리티
│   ├── database/        # DB 연결
│   ├── cache/           # 캐시 유틸리티
│   └── utils/           # 공통 유틸리티
├── config/              # 설정
├── migrations/          # DB 마이그레이션
└── proto/               # gRPC 프로토콜 정의

## 시작하기

### 필수 요구사항

- Go 1.21 이상
- PostgreSQL 14 이상
- Redis/Valkey

### 설치

1. 저장소 클론
2. 환경 변수 설정:
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 설정
   ```

3. 의존성 설치:
   ```bash
   make deps
   ```

4. 데이터베이스 마이그레이션:
   ```bash
   make migrate-up
   ```

5. 서버 실행:
   ```bash
   make run
   ```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신

### 유저
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/profile` - 프로필 수정

### 캐릭터
- `GET /api/characters` - 보유 캐릭터 목록
- `GET /api/characters/:id` - 캐릭터 상세
- `POST /api/characters/:id/level-up` - 레벨업

### 가챠
- `POST /api/summon/normal` - 일반 소환
- `POST /api/summon/premium` - 프리미엄 소환

## 개발

### 테스트 실행
```bash
make test
```

### 빌드
```bash
make build
```

## 라이센스

Private Project
