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
│   └── ...
├── objects/            # 게임 오브젝트
│   ├── ui/            # UI 컴포넌트
│   │   ├── Button.ts
│   │   ├── Panel.ts
│   │   └── HealthBar.ts
│   └── character/     # 캐릭터 객체
├── services/          # API 서비스 레이어
│   ├── api/
│   │   ├── HttpClient.ts
│   │   └── WebSocketClient.ts
│   ├── AuthService.ts
│   └── CharacterService.ts
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
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## 🎮 주요 기능

### 구현된 기능

- ✅ **로비 시스템**: 메인 메뉴, 화폐 표시, 에너지 시스템
- ✅ **캐릭터 관리**: 캐릭터 목록, 상세 정보, 필터링/정렬
- ✅ **가챠 시스템**: 일반/프리미엄 소환, 애니메이션, 결과 표시
- ✅ **UI 컴포넌트**: 재사용 가능한 버튼, 패널, 체력바
- ✅ **상태 관리**: 플레이어 데이터, 캐릭터, 인벤토리 관리
- ✅ **API 서비스**: HTTP/WebSocket 클라이언트, 인증 서비스

### 개발 중인 기능

- 🔨 **전투 시스템**: 턴제 전투, 스킬 시스템
- 🔨 **던전 시스템**: 스토리, 속성, 경험치 던전
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
2. HttpClient 또는 WebSocketClient 사용
3. 타입 정의는 `src/types/index.ts` 에 추가

```typescript
export class NewService {
  async getData(): Promise<DataType> {
    return await httpClient.get<DataType>('/api/endpoint');
  }
}
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

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물은 dist/ 폴더에 생성됩니다
# 정적 파일 서버를 통해 배포할 수 있습니다
```

## 🐛 디버깅

- 브라우저 개발자 도구에서 콘솔 로그 확인
- Phaser의 디버그 모드 활성화: `game.ts`에서 `debug: true` 설정
- 네트워크 탭에서 API 호출 모니터링

## 📝 TODO

- [ ] 실제 백엔드 API 연동
- [ ] 전투 시스템 완성
- [ ] 룬 시스템 구현
- [ ] 애니메이션 및 이펙트 추가
- [ ] 사운드/음악 추가
- [ ] 다국어 지원
- [ ] 성능 최적화
- [ ] 모바일 최적화

## 🤝 Contributing

1. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
2. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
3. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
4. Pull Request 생성

## 📄 라이선스

This project is private and proprietary.

## 📞 문의

개발 관련 문의: [your-email@example.com]
