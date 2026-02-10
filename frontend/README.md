# Collection RPG - Frontend

캐릭터 수집형 RPG 게임 프론트엔드 클라이언트

## 📋 프로젝트 개요

Phaser 3 게임 엔진과 TypeScript를 사용한 2D 턴제 RPG 게임입니다.
서머너즈워 스타일의 캐릭터 수집, 육성, 전투 시스템을 구현합니다.

## 🛠 기술 스택

- **게임 엔진**: Phaser 3.80+
- **언어**: TypeScript 5.3+
- **빌드 도구**: Vite 5.0+
- **통신**: Axios (HTTP), Socket.IO (WebSocket)
- **상태 관리**: 싱글톤 패턴 기반 Store
- **API 버전**: v1 (RESTful)
- **인증**: JWT (Access Token 15분 + Refresh Token 7일)

## 🎯 플랫폼 지원

### 반응형 디자인
모든 화면 크기와 기기에서 최적화된 경험을 제공합니다:

- **💻 데스크톱**: Windows, macOS, Linux (웹 브라우저)
  - 해상도: 1280px 이상
  - 입력: 마우스 + 키보드
  
- **📱 태블릿**: iPad, Android 태블릿
  - 해상도: 768px ~ 1279px
  - 입력: 터치 최적화
  
- **📱 모바일**: iPhone, Android 스마트폰
  - 해상도: ~ 767px
  - 입력: 터치 인터페이스

### 자동 스케일링
- Phaser Scale.FIT 모드로 모든 화면에 자동 대응
- 가로/세로 비율 유지하며 최적 크기로 조정
- 터치와 마우스 입력 동시 지원

## 📁 프로젝트 구조

```
src/
├── scenes/              # Phaser 씬 (화면)
│   ├── BootScene.ts    # 초기 로딩
│   ├── LoginScene.ts   # 로그인/회원가입
│   ├── LobbyScene.ts   # 메인 로비
│   ├── SummonScene.ts  # 가챠 시스템
│   ├── CharacterListScene.ts
│   ├── CharacterDetailScene.ts
│   ├── BattleScene.ts  # 전투 시스템
│   ├── ArenaScene.ts   # PvP 아레나
│   ├── GuildScene.ts   # 길드 시스템
│   ├── ShopScene.ts    # 상점
│   └── ...
├── objects/            # 게임 오브젝트
│   ├── ui/            # UI 컴포넌트
│   │   ├── Button.ts
│   │   ├── Panel.ts
│   │   └── HealthBar.ts
│   └── character/     # 캐릭터 객체
├── services/          # API 서비스 레이어
│   ├── api/
│   │   ├── HttpClient.ts      # HTTP 클라이언트 (토큰 갱신 포함)
│   │   └── WebSocketClient.ts # WebSocket 클라이언트
│   ├── AuthService.ts         # 인증 (로그인, 회원가입)
│   ├── CharacterService.ts    # 캐릭터 관리 (페이지네이션)
│   ├── UserService.ts         # 유저 프로필, 인벤토리
│   ├── DungeonService.ts      # 던전 입장, 전투
│   ├── ArenaService.ts        # PvP 랭킹, 공격, 방어
│   ├── GuildService.ts        # 길드 CRUD, 멤버 관리
│   ├── ShopService.ts         # 상점 아이템, 구매
│   └── QuestService.ts        # 일일 퀘스트, 보상
├── store/             # 상태 관리
│   └── GameDataStore.ts
├── types/             # TypeScript 타입 정의
│   └── index.ts
├── utils/             # 유틸리티 함수
│   ├── Constants.ts
│   └── Helpers.ts
├── main.ts            # 엔트리 포인트
└── game.ts            # Phaser 게임 설정
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```env
# API Base URL (백엔드 서버 주소)
VITE_API_BASE_URL=http://localhost:8080

# WebSocket URL
VITE_WS_URL=ws://localhost:8080

# Environment
VITE_ENV=development

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_DATA=true
```

`.env.example` 파일을 참조하세요.

## 🔐 보안 및 인증

### JWT 토큰 관리 (Valkey 기반)
PRD 4.4.1 기준으로 구현:

- **Access Token**: 
  - 15분 유효기간
  - 메모리에만 저장 (XSS 방어)
  - 자동 갱신 (만료 1분 전)

- **Refresh Token**: 
  - 7일 유효기간
  - HttpOnly Cookie (JavaScript 접근 불가)
  - Valkey에서 관리

- **보안 기능**:
  - Token Blacklist (로그아웃 시)
  - Token Rotation (재사용 방지)
  - Rate Limiting (100 req/min)

자세한 내용은 [SECURITY.md](./SECURITY.md)를 참조하세요.

### 구현된 기능

- ✅ **인증 시스템**: JWT 기반 로그인, 회원가입, 자동 토큰 갱신
- ✅ **로비 시스템**: 메인 메뉴, 화폐 표시, 에너지 시스템
- ✅ **캐릭터 관리**: 캐릭터 목록(페이지네이션), 상세 정보, 필터링/정렬
- ✅ **가챠 시스템**: 일반/프리미엄 소환, 애니메이션, 결과 표시
- ✅ **던전 시스템**: 던전 목록, 입장, 전투 진행
- ✅ **PvP 시스템**: 랭킹 조회, 공격, 방어팀 설정, 전투 기록
- ✅ **길드 시스템**: 길드 생성/검색/가입, 멤버 관리
- ✅ **상점 시스템**: 아이템 목록, 구매
- ✅ **퀘스트 시스템**: 일일 퀘스트, 완료, 보상 받기
- ✅ **UI 컴포넌트**: 재사용 가능한 버튼, 패널, 체력바
- ✅ **상태 관리**: 플레이어 데이터, 캐릭터, 인벤토리 관리
- ✅ **API 서비스**: HTTP/WebSocket 클라이언트 with 토큰 갱신
- ✅ **실시간 기능**: 채팅, PvP 매칭 알림, 길드 알림

### 개발 중인 기능

- 🔨 **전투 시스템**: 턴제 전투 UI, 스킬 애니메이션
- 🔨 **캐릭터 육성**: 강화, 진화, 스킬 업그레이드 UI
- 🔨 **PvP 아레나**: 랭킹 시스템, 실시간 대전
- 🔨 **길드 시스템**: 길드 생성, 길드전
- 🔨 **상점 시스템**: 아이템 구매, 패키지
- 🔨 **룬 시스템**: 장비 관리, 강화

## 🎨 게임 플로우

```
BootScene (로딩)
    ↓
LoginScene (인증)
    ↓
LobbyScene (메인 허브)
    ↓
├─→ SummonScene (가챠)
├─→ CharacterListScene → CharacterDetailScene
├─→ DungeonSelectScene → BattleScene
├─→ ArenaScene (PvP)
├─→ GuildScene
├─→ ShopScene
└─→ InventoryScene
```

## 🎯 핵심 시스템

### 캐릭터 시스템
- 5성급 등급 (1⭐ ~ 5⭐)
- 5가지 속성 (화, 수, 풍, 광, 암)
- 6가지 클래스 (전사, 마법사, 힐러, 암살자, 탱커, 서포터)
- 스탯: HP, ATK, DEF, SPD, CRT, CRT DMG, ACC, RES

### 가챠 확률
- 5⭐: 1%
- 4⭐: 4%
- 3⭐: 15%
- 2⭐: 30%
- 1⭐: 50%

### 화폐 시스템
- 💎 크리스탈 (유료 화폐)
- 🪙 골드 (게임 화폐)
- ⚡ 에너지 (5분당 1 회복)

## 🔧 개발 가이드

### API 아키텍처

#### HTTP 클라이언트
- 자동 토큰 갱신 (Access Token 만료 시)
- API 버전 관리 (`/api/v1/...`)
- 표준화된 응답 형식: `{success, data, error, timestamp}`
- 요청 재시도 메커니즘

```typescript
// HttpClient 사용 예시
const response = await httpClient.get<UserData>('/user/profile');
// 응답: { success: true, data: {...}, error: null, timestamp: "..." }
```

#### WebSocket 클라이언트
- 자동 재연결 (최대 5회)
- 타입 안전 이벤트 핸들링
- 표준 이벤트: `chat:message`, `pvp:match_found`, `guild:notification`

```typescript
// WebSocket 사용 예시
wsClient.onChatMessage((message) => {
  console.log(`${message.sender}: ${message.content}`);
});

wsClient.sendChatMessage('채널명', '메시지 내용');
```

### 새로운 Scene 추가

1. `src/scenes/` 에 새 씬 파일 생성
2. Phaser.Scene 상속
3. `src/game.ts` 의 scene 배열에 추가
4. `src/utils/Constants.ts` 에 씬 키 추가

```typescript
export class NewScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.NEW_SCENE });
  }

  create(): void {
    // 씬 초기화 코드
  }
}
```

### API 서비스 추가

1. `src/services/` 에 새 서비스 파일 생성
2. HttpClient 상속
3. 타입 정의는 `src/types/index.ts` 에 추가

```typescript
import { httpClient } from './api/HttpClient';
import { ApiResponse } from '@/types';

class NewService {
  async getData(): Promise<ApiResponse<DataType>> {
    return await httpClient.get<DataType>('/endpoint');
  }
}

export const newService = new NewService();
```

### 페이지네이션 구현

```typescript
import { PaginationParams, PaginatedResponse } from '@/types';

const params: PaginationParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
};

const response = await characterService.getCharacters(params);
// response.data = { items: [...], total: 100, page: 1, limit: 20, totalPages: 5 }
```

### UI 컴포넌트 생성

`src/objects/ui/` 에 재사용 가능한 컴포넌트 생성:

```typescript
export class CustomComponent extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    // 컴포넌트 초기화
    scene.add.existing(this);
  }
}
```

## 🐳 Docker 환경

Docker를 사용한 개발 환경 구성은 [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)를 참조하세요.

### 빠른 시작

```bash
# Docker Compose로 전체 환경 실행
docker-compose up -d

# 프론트엔드만 재빌드
docker-compose up -d --build frontend

# 로그 확인 (Dozzle)
# 브라우저에서 http://localhost:8888 접속
```

## 📦 빌드 및 배포

### 로컬 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### Docker 빌드

```bash
# 개발 환경
docker-compose up -d

# 프로덕션 환경
docker-compose -f docker-compose.prod.yml up -d
```

## 🐛 디버깅

### 브라우저 디버깅
- 개발자 도구에서 콘솔 로그 확인
- 네트워크 탭에서 API 호출 모니터링
- Phaser의 디버그 모드 활성화: `game.ts`에서 `debug: true` 설정

### Docker 환경 디버깅
- Dozzle: http://localhost:8888 (실시간 로그)
- 컨테이너 로그: `docker-compose logs -f frontend`
- 컨테이너 쉘 접속: `docker-compose exec frontend sh`

## 🔐 보안

### 토큰 관리
- Access Token: 15분 유효기간
- Refresh Token: 7일 유효기간
- 자동 갱신: 만료 1분 전 자동 갱신 시도
- Storage: localStorage에 안전하게 저장

### API 보안
- Rate Limiting: 사용자당 분당 100회 요청 제한
- HTTPS 사용 권장 (프로덕션)
- CORS 설정 필요

## 📊 성능 최적화

### 이미지 최적화
- 스프라이트 시트 사용
- 텍스처 아틀라스 활용
- WebP 형식 권장

### 코드 최적화
- Lazy loading으로 초기 로딩 시간 단축
- 객체 풀링으로 메모리 관리
- 불필요한 업데이트 루프 최소화

## 📝 TODO

### 높은 우선순위
- [ ] 실제 백엔드 API 연동 테스트
- [ ] 전투 시스템 애니메이션 완성
- [ ] 에러 바운더리 및 에러 핸들링 강화

### 중간 우선순위  
- [ ] 룬 시스템 구현
- [ ] 캐릭터 강화/진화 UI
- [ ] 사운드/음악 추가
- [ ] 튜토리얼 시스템

### 낮은 우선순위
- [ ] 다국어 지원 (i18n)
- [ ] 모바일 최적화
- [ ] PWA 지원
- [ ] 성능 프로파일링 및 최적화

## 🤝 Contributing

1. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
2. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
3. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
4. Pull Request 생성

## 📄 라이선스

This project is private and proprietary.

## 📞 문의

개발 관련 문의: [your-email@example.com]
