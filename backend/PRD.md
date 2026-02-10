# PRD: 캐릭터 수집형 RPG 게임

## 1. 프로젝트 개요

### 1.1 제품 비전
서머너즈워 스타일의 턴제 전략 RPG로, 매력적인 여성 캐릭터들을 수집하고 육성하여 다양한 전투 콘텐츠를 즐기는 모바일/웹 게임

### 1.2 기술 스택
- **프론트엔드**: Phaser 3 (2D game engine) + TypeScript + Vite
- **백엔드**: Go (Golang)
- **데이터베이스**: PostgreSQL
- **세션 & 캐시 스토어**: Valkey (Redis 호환)
  - JWT Refresh Token 저장 (TTL 7일)
  - Token Blacklist 관리 (로그아웃 시)
  - 사용자 활성 세션 관리
  - 실시간 랭킹 및 게임 데이터 캐싱
  - API Rate Limiting 카운터
- **통신**: WebSocket + HTTP/REST
- **인증**: JWT (Access Token + Refresh Token)
  - Access Token: 15분 수명, Stateless, 클라이언트 localStorage 저장
  - Refresh Token: 7일 수명, Valkey에 저장, HttpOnly 쿠키로 전송
  - Token Rotation & Blacklist를 통한 보안 강화
- **컨테이너화**: Docker & Docker Compose
  - PostgreSQL 컨테이너
  - Valkey 컨테이너
  - 백엔드 API 서버 컨테이너
  - 프론트엔드 정적 파일 서빙 컨테이너
  - Nginx 컨테이너 (리버스 프록시 & 로드 밸런싱)
  - Dozzle 컨테이너 (실시간 로그 모니터링)

### 1.3 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Client                              │
│              (Phaser 3 + TypeScript)                         │
│            Browser / Mobile WebView                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ WebSocket
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (Port 80)                            │
│         - Reverse Proxy                                      │
│         - Load Balancing                                     │
│         - Rate Limiting (100 req/min)                        │
│         - WebSocket Upgrade                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Proxy
                     │ WebSocket Proxy
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Go Backend Server (Port 8080)                   │
│         - REST API (/api/v1/*)                               │
│         - WebSocket Server (/ws)                             │
│         - JWT Authentication                                 │
│         - Business Logic                                     │
└──────────┬─────────────────────────┬────────────────────────┘
           │                         │
           │ SQL Queries             │ Cache Operations
           ↓                         ↓
┌──────────────────────┐   ┌──────────────────────┐
│   PostgreSQL (5432)  │   │   Valkey (6379)      │
│   - Game Data        │   │   - Session Cache    │
│   - User Info        │   │   - Rankings         │
│   - Characters       │   │   - Real-time Data   │
└──────────────────────┘   └──────────────────────┘

                     ↓
          ┌──────────────────────┐
          │  Dozzle (Port 8888)  │
          │  - Log Monitoring    │
          └──────────────────────┘
```

**통신 흐름:**
1. **Web Client** → Nginx (HTTP/WebSocket 요청)
2. **Nginx** → Go Backend (프록시, Rate Limiting 적용)
3. **Go Backend** → PostgreSQL (게임 데이터 CRUD)
4. **Go Backend** → Valkey (캐싱, 세션 관리)
5. **Dozzle** → Docker Logs (실시간 로그 수집 및 표시)

**네트워크 분리:**
- 모든 서비스는 `game_network` (Docker Bridge Network)에서 통신
- 외부 노출 포트: 80 (Nginx), 8888 (Dozzle)
- 내부 포트: 8080 (Backend), 5432 (PostgreSQL), 6379 (Valkey)

### 1.4 타겟 사용자
- 수집형 RPG를 좋아하는 게이머
- 캐릭터 육성 및 전략적 플레이를 즐기는 플레이어
- 연령대: 18-35세

### 1.5 플랫폼 지원
- **데스크톱**: Windows, macOS, Linux (웹 브라우저)
- **태블릿**: iPad, Android 태블릿
- **모바일**: iPhone, Android 스마트폰
- **반응형 디자인**: 모든 화면 크기와 해상도에 자동 대응
- **터치 및 마우스**: 두 가지 입력 방식 모두 지원

### 1.6 아트 에셋 리소스 (OpenGameArt.org)

**선정 사이트: OpenGameArt.org** (https://opengameart.org/)

#### 1.6.1 선정 이유

OpenGameArt.org는 다음과 같은 이유로 프로젝트의 유일한 에셋 소스로 선정되었습니다:

**장점:**
- ✅ **오픈소스 커뮤니티**: 완전한 무료 게임 에셋 저장소
- ✅ **명확한 라이선스**: CC0 (Public Domain), CC-BY 3.0/4.0, OGA-BY 3.0 등
- ✅ **직접 URL 접근 가능**: 이미지 파일에 직접 핫링크 가능
- ✅ **상업적 사용 허용**: 대부분의 에셋이 상업적 사용 가능 (크레딧 표기 조건)
- ✅ **RPG 에셋 풍부**: 여성 캐릭터, 던전, UI, 타일셋 등 프로젝트에 필요한 모든 에셋
- ✅ **활발한 커뮤니티**: 지속적인 업데이트, 검증된 품질

**주요 에셋 카테고리:**
- 2D 픽셀 아트 캐릭터 스프라이트 (16x16, 32x32, 64x64)
- RPG 타일셋 (던전, 마을, 자연 환경)
- UI/GUI 요소 (버튼, 패널, 아이콘)
- 스킬 이펙트 (화염, 물, 바람, 마법)
- 배경 음악 및 효과음 (Royalty Free)

#### 1.6.2 개발 전략: 핫링크 (Hotlink) 방식

**로컬 개발 환경 (핫링크 사용)**
- OpenGameArt.org의 이미지 URL을 직접 Phaser 3 코드에서 로드
- 에셋 다운로드 없이 즉시 개발 시작 가능
- 빠른 프로토타이핑 및 에셋 테스트
- 인터넷 연결 필요

**프로덕션 배포 환경 (로컬 에셋 사용)**
- 선택한 에셋을 다운로드하여 `frontend/public/assets/` 저장
- 빌드 시 Vite가 에셋을 번들링
- CDN 배포 가능
- 인터넷 연결 불필요

#### 1.6.3 에셋 로딩 구현 (환경별 전환)

**환경 변수 설정 (.env)**
```bash
# .env.development (로컬 개발)
VITE_ASSETS_MODE=hotlink
VITE_ASSETS_BASE_URL=https://opengameart.org

# .env.production (배포)
VITE_ASSETS_MODE=local
VITE_ASSETS_BASE_URL=/assets
```

**Phaser 3 에셋 로딩 유틸리티**
```typescript
// src/config/AssetConfig.ts
export class AssetConfig {
  private static readonly IS_HOTLINK = import.meta.env.VITE_ASSETS_MODE === 'hotlink';
  private static readonly BASE_URL = import.meta.env.VITE_ASSETS_BASE_URL;

  /**
   * 환경에 따라 에셋 URL 반환
   * - 개발: OpenGameArt.org 직접 링크 (핫링크)
   * - 배포: 로컬 assets 폴더
   */
  static getAssetUrl(localPath: string, hotlinkUrl?: string): string {
    if (this.IS_HOTLINK && hotlinkUrl) {
      return hotlinkUrl;
    }
    return `${this.BASE_URL}/${localPath}`;
  }
}

// src/scenes/BootScene.ts
import { AssetConfig } from '../config/AssetConfig';

export class BootScene extends Phaser.Scene {
  preload() {
    // 여성 전사 캐릭터 (LPC Character Base)
    const warriorUrl = AssetConfig.getAssetUrl(
      'characters/female/warrior/lpc_warrior.png',
      'https://opengameart.org/sites/default/files/lpc-warrior-female.png'
    );
    this.load.spritesheet('warrior_female', warriorUrl, {
      frameWidth: 64,
      frameHeight: 64
    });

    // 던전 타일셋
    const dungeonUrl = AssetConfig.getAssetUrl(
      'tilesets/dungeon/dungeon_tiles.png',
      'https://opengameart.org/sites/default/files/dungeon-tileset-16x16.png'
    );
    this.load.image('dungeon_tiles', dungeonUrl);

    // UI 버튼
    const buttonUrl = AssetConfig.getAssetUrl(
      'ui/buttons/button_normal.png',
      'https://opengameart.org/sites/default/files/fantasy-button.png'
    );
    this.load.image('button_normal', buttonUrl);
  }
}
```

#### 1.6.4 에셋 목록 관리

```typescript
// src/game/assets/asset-list.ts
export interface AssetInfo {
  key: string;                    // Phaser에서 사용할 키
  localPath: string;              // 로컬 경로 (프로덕션)
  hotlinkUrl: string;             // OpenGameArt.org URL (개발)
  author: string;                 // 작가 이름
  license: string;                // 라이선스
  sourceUrl: string;              // 출처 페이지
  creditRequired: boolean;        // 크레딧 표기 필요 여부
}

export const ASSET_LIST: Record<string, AssetInfo> = {
  warrior_female: {
    key: 'warrior_female',
    localPath: 'characters/female/warrior/lpc_warrior.png',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/lpc-warrior-female.png',
    author: 'Redshrike, William.Thompsonj',
    license: 'CC-BY 3.0, GPL 3.0',
    sourceUrl: 'https://opengameart.org/content/lpc-character-bases',
    creditRequired: true
  },
  dungeon_tiles: {
    key: 'dungeon_tiles',
    localPath: 'tilesets/dungeon/dungeon_16x16.png',
    hotlinkUrl: 'https://opengameart.org/sites/default/files/dungeon-tileset.png',
    author: '0x72',
    license: 'CC0 (Public Domain)',
    sourceUrl: 'https://opengameart.org/content/dungeon-tileset-16x16',
    creditRequired: false
  }
};
```

#### 1.6.5 배포 전 에셋 다운로드

**package.json 스크립트**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run download-assets && vite build",
    "download-assets": "node scripts/download-assets.js"
  }
}
```

**다운로드 스크립트 (scripts/download-assets.js)**
```javascript
import fs from 'fs';
import path from 'path';
import https from 'https';
import { ASSET_LIST } from '../src/game/assets/asset-list.ts';

async function downloadFile(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function downloadAllAssets() {
  console.log('📦 Downloading assets from OpenGameArt.org...\n');

  for (const [key, asset] of Object.entries(ASSET_LIST)) {
    const destPath = path.join('./public/assets', asset.localPath);
    
    if (fs.existsSync(destPath)) {
      console.log(`⊗ Skip: ${asset.localPath}`);
      continue;
    }

    try {
      await downloadFile(asset.hotlinkUrl, destPath);
    } catch (error) {
      console.error(`✗ Failed: ${key}`, error.message);
    }
  }

  console.log('\n✅ Complete!');
}

downloadAllAssets();
```

#### 1.6.6 추천 에셋 (여성 캐릭터 중심)

**OpenGameArt.org 주요 에셋:**

1. **LPC (Liberated Pixel Cup) Character Base** ⭐
   - URL: https://opengameart.org/content/lpc-character-bases
   - 여성 캐릭터 스프라이트 (64x64)
   - 4방향 이동, 공격, 스킬 사용 애니메이션
   - 라이선스: CC-BY 3.0, GPL 3.0

2. **Dungeon Tileset II**
   - URL: https://opengameart.org/content/dungeon-tileset-ii
   - 16x16 픽셀 던전 타일셋
   - 라이선스: CC0 (Public Domain)

3. **Fantasy UI Borders**
   - URL: https://opengameart.org/content/fantasy-ui-borders
   - RPG 스타일 UI 요소
   - 라이선스: CC0

**검색 키워드:**
- `LPC female character`
- `RPG girl sprite`
- `dungeon tileset 16x16`
- `fantasy UI`
- `fire spell effect`

---

## 2. 핵심 기능 (Core Features)

### 2.1 캐릭터 수집 시스템

#### 2.1.1 가챠 시스템
- **일반 소환**: 기본 확률로 캐릭터 획득
- **프리미엄 소환**: 높은 등급 캐릭터 확률 상승
- **등급 구분**: 
  - ⭐ 1성 (Common) - 50%
  - ⭐⭐ 2성 (Uncommon) - 30%
  - ⭐⭐⭐ 3성 (Rare) - 15%
  - ⭐⭐⭐⭐ 4성 (Epic) - 4%
  - ⭐⭐⭐⭐⭐ 5성 (Legendary) - 1%

#### 2.1.2 캐릭터 속성
- **속성 시스템**: 화(Fire), 수(Water), 풍(Wind), 광(Light), 암(Dark)
- **상성 관계**: 화 > 풍 > 수 > 화 / 광 ↔ 암
- **클래스**: 전사, 마법사, 힐러, 암살자, 탱커, 서포터

#### 2.1.3 캐릭터 스탯
- HP (체력)
- ATK (공격력)
- DEF (방어력)
- SPD (속도)
- CRT (치명타율)
- CRT DMG (치명타 데미지)
- ACC (정확도)
- RES (저항)

### 2.2 캐릭터 육성 시스템

#### 2.2.1 레벨업
- 경험치 획득: 전투, 경험치 던전
- 최대 레벨: 각 성급별 상한 (1성: 15, 2성: 25, 3성: 35, 4성: 45, 5성: 60)
- 레벨업 재료: 경험치 크리스탈

#### 2.2.2 각성 (Evolution)
- 하위 성급 → 상위 성급으로 진화
- 필요 재료: 같은 성급 캐릭터(먹이) + 각성석
- 각성 시 레벨 1로 초기화, 스탯 대폭 상승

#### 2.2.3 스킬 강화
- 각 캐릭터는 4개의 스킬 보유 (기본 공격 + 3개 액티브 스킬)
- 스킬 레벨 최대 10
- 필요 재료: 스킬북 또는 동일 캐릭터

#### 2.2.4 룬 시스템 (장비)
- 6개 슬롯 (1,3,5: 고정 스탯 / 2,4,6: 선택 스탯)
- 룬 등급: Normal, Magic, Rare, Hero, Legend
- 룬 강화: +15까지 강화 가능
- 세트 효과: 같은 종류 2개/4개 장착 시 보너스

### 2.3 전투 시스템

#### 2.3.1 턴제 전투
- 속도(SPD) 스탯 기반 턴 순서 결정
- 최대 4명까지 파티 구성
- Auto Play 기능 지원
- 배속 기능: x1, x2, x3

#### 2.3.2 스킬 시스템
- 쿨타임 기반 스킬 사용
- 버프/디버프 효과
- 상태이상: 스턴, 침묵, 도발, 수면, 얼음, 독 등
- 게이지 시스템: 스킬 사용 시 게이지 소모

### 2.4 게임 콘텐츠

#### 2.4.1 PvE 콘텐츠

**스토리 던전**
- 챕터별 스테이지 구성
- 난이도: Normal, Hard, Hell
- 보상: 크리스탈, 골드, 캐릭터 조각

**속성 던전**
- 요일별 속성 던전 오픈
- 각성 재료 획득

**경험치 던전**
- 캐릭터 레벨업 재료 획득

**골드 던전**
- 골드 대량 획득

**보스 레이드**
- 협동 레이드 (멀티플레이)
- 강력한 보스 처치
- 특별 보상: 전설 룬, 희귀 재료

#### 2.4.2 PvP 콘텐츠

**아레나**
- 실시간 PvP (또는 AI 기반)
- 랭킹 시스템
- 시즌별 보상
- 등급: Bronze, Silver, Gold, Platinum, Diamond, Master, Legend

**길드전**
- 길드 vs 길드 전투
- 주 2-3회 개최
- 길드 포인트 및 보상 획득

#### 2.4.3 이벤트 던전
- 기간 한정 던전
- 특별 캐릭터 획득 기회
- 이벤트 전용 재료

### 2.5 소셜 기능

#### 2.5.1 길드 시스템
- 길드 생성/가입
- 길드 채팅
- 길드 스킬/버프
- 길드 상점

#### 2.5.2 친구 시스템
- 친구 추가/삭제
- 친구 캐릭터 용병 사용
- 우정 포인트 획득

#### 2.5.3 채팅
- 전체 채팅
- 길드 채팅
- 귓속말

### 2.6 상점 및 화폐 시스템

#### 2.6.1 화폐 종류
- **크리스탈**: 유료 화폐 (과금 또는 보상)
- **골드**: 기본 게임 화폐
- **영광 포인트**: 아레나 보상
- **길드 포인트**: 길드전 보상
- **우정 포인트**: 친구 시스템 보상

#### 2.6.2 상점
- **크리스탈 상점**: 가챠 패키지, 에너지 등
- **골드 상점**: 룬, 각성 재료 등
- **영광 상점**: PvP 전용 아이템
- **길드 상점**: 길드 전용 아이템
- **실시간 상점**: 무작위 아이템 (갱신 시간 있음)

### 2.7 일일 시스템

#### 2.7.1 에너지 시스템
- 최대 에너지: 100
- 자동 회복: 5분당 1
- 던전 입장 시 소모

#### 2.7.2 일일 미션
- 로그인 보상
- 일일 퀘스트 (5-10개)
- 주간 퀘스트
- 출석 체크 (월간)

---

## 3. 사용자 인터페이스 (UI/UX)

### 3.1 주요 화면

1. **로비 화면**
   - 대표 캐릭터 표시
   - 주요 메뉴 접근
   - 공지사항, 이벤트 배너

2. **소환 화면**
   - 가챠 애니메이션
   - 소환 확률 표시
   - 보유 화폐 표시

3. **캐릭터 관리 화면**
   - 캐릭터 목록 (필터/정렬)
   - 상세 정보
   - 강화/각성 UI

4. **전투 화면**
   - 캐릭터 모델 표시
   - 스킬 버튼
   - HP/버프 바
   - Auto/배속 버튼

5. **던전 선택 화면**
   - 던전 목록
   - 난이도 선택
   - 에너지 표시

6. **룬 관리 화면**
   - 룬 목록
   - 강화 UI
   - 장착/해제

### 3.2 UX 원칙
- **반응형 디자인**: 데스크톱(1280px+), 태블릿(768px-1279px), 모바일(~767px) 완벽 대응
- **다중 입력 지원**: 터치 인터페이스 + 마우스/키보드
- **적응형 레이아웃**: 화면 크기에 따라 UI 요소 자동 조정
- **크로스 플랫폼**: Windows, iPad, iPhone, Android 모두 동일한 경험 제공
- 빠른 네비게이션
- 명확한 정보 전달
- 매력적인 캐릭터 일러스트 강조
- 부드러운 애니메이션
- **성능 최적화**: 저사양 모바일 기기에서도 원활한 플레이

---

## 4. 기술 요구사항

### 4.1 백엔드 (Go)

#### 4.1.1 API 디자인 원칙
- RESTful API 설계
- API Versioning: `/api/v1/...` (향후 확장성)
- 일관된 응답 형식 (JSON)
```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-02-10T12:00:00Z"
}
```
- HTTP 상태 코드 표준 준수
- 페이지네이션 지원 (`?page=1&limit=20`)
- 필터링 및 정렬 쿼리 파라미터

#### 4.1.2 API 엔드포인트

**인증**
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `POST /api/v1/auth/logout` - 로그아웃
- `POST /api/v1/auth/refresh` - 토큰 갱신

**유저**
- `GET /api/v1/user/profile` - 프로필 조회
- `PUT /api/v1/user/profile` - 프로필 수정
- `GET /api/v1/user/inventory` - 인벤토리 조회

**캐릭터**
- `GET /api/v1/characters` - 보유 캐릭터 목록
- `GET /api/v1/characters/:id` - 캐릭터 상세
- `POST /api/characters/:id/level-up` - 레벨업
- `POST /api/characters/:id/evolve` - 각성
- `POST /api/characters/:id/skill-up` - 스킬 강화
- `PUT /api/characters/:id/rune` - 룬 장착/변경

**가챠**
- `POST /api/summon/normal` - 일반 소환
- `POST /api/summon/premium` - 프리미엄 소환
- `GET /api/summon/rates` - 확률 정보

**던전**
- `GET /api/dungeons` - 던전 목록
- `POST /api/dungeons/:id/enter` - 던전 입장
- `POST /api/dungeons/:id/battle` - 전투 시작
- `POST /api/battle/:id/action` - 전투 액션
- `POST /api/battle/:id/result` - 전투 결과

**PvP**
- `GET /api/arena/ranking` - 랭킹 조회
- `POST /api/arena/attack` - 공격
- `GET /api/arena/defense` - 방어 설정
- `GET /api/arena/history` - 전투 기록

**길드**
- `GET /api/guilds` - 길드 목록
- `POST /api/guilds` - 길드 생성
- `POST /api/guilds/:id/join` - 가입
- `GET /api/guilds/:id` - 길드 정보
- `GET /api/guilds/:id/members` - 멤버 목록

**상점**
- `GET /api/shop/items` - 상점 아이템 목록
- `POST /api/shop/purchase` - 구매

**퀘스트**
- `GET /api/quests/daily` - 일일 퀘스트
- `POST /api/quests/:id/complete` - 퀘스트 완료
- `POST /api/quests/:id/claim` - 보상 수령

#### 4.1.2 데이터베이스 스키마

**Users**
```sql
- id (PK)
- username
- email
- password_hash
- level
- exp
- crystals
- gold
- energy
- max_energy
- last_energy_update
- created_at
- updated_at
```

**Characters**
```sql
- id (PK)
- name
- grade (star)
- element (fire, water, wind, light, dark)
- class
- base_hp
- base_atk
- base_def
- base_spd
- skill_1_id
- skill_2_id
- skill_3_id
- skill_4_id
- image_url
```

**UserCharacters**
```sql
- id (PK)
- user_id (FK)
- character_id (FK)
- level
- exp
- current_hp
- current_atk
- current_def
- current_spd
- skill_1_level
- skill_2_level
- skill_3_level
- skill_4_level
- awakened
- obtained_at
```

**Runes**
```sql
- id (PK)
- user_character_id (FK)
- slot (1-6)
- type (ATK, DEF, HP, SPD, CRT, ACC, etc.)
- grade
- level
- main_stat
- sub_stat_1
- sub_stat_2
- sub_stat_3
- sub_stat_4
```

**Skills**
```sql
- id (PK)
- name
- description
- cooldown
- multiplier
- effects (JSON: buff, debuff, heal, etc.)
```

**Dungeons**
```sql
- id (PK)
- name
- type
- difficulty
- energy_cost
- stages (JSON)
- rewards (JSON)
```

**Arena**
```sql
- id (PK)
- user_id (FK)
- rank
- rating
- win_count
- lose_count
- defense_team (JSON)
```

**Guilds**
```sql
- id (PK)
- name
- leader_id (FK)
- level
- members_count
- max_members
- created_at
```

**GuildMembers**
```sql
- id (PK)
- guild_id (FK)
- user_id (FK)
- role (leader, officer, member)
- contribution
- joined_at
```

**데이터베이스 인덱스 전략**
- `users(email)` - UNIQUE, 로그인 조회
- `users(username)` - UNIQUE, 중복 체크
- `user_characters(user_id, character_id)` - 빠른 조회
- `user_characters(user_id, level DESC)` - 정렬 최적화
- `runes(user_character_id)` - 룬 조회
- `arena(user_id)`, `arena(rank)` - 랭킹 조회
- `guild_members(guild_id)`, `guild_members(user_id)` - 길드 멤버 조회
- `created_at`, `updated_at` - 시간 기반 쿼리

#### 4.1.3 아키텍처

**레이어 구조 (Clean Architecture)**
```
┌──────────────────────────────────────────────────┐
│           Handler Layer                          │
│  - HTTP Handlers (/api/v1/*)                     │
│  - WebSocket Handler (/ws)                       │
│  - Middleware (Auth, Rate Limit, CORS)           │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│           UseCase Layer                          │
│  - Business Logic                                │
│  - Game Rules Validation                         │
│  - Orchestration                                 │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│         Repository Layer                         │
│  - Database Access (PostgreSQL)                  │
│  - Cache Access (Valkey)                         │
│  - External Services                             │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│           Domain Layer                           │
│  - Entities (User, Character, etc.)              │
│  - Value Objects                                 │
│  - Domain Interfaces                             │
└──────────────────────────────────────────────────┘
```

**통신 계층:**
- **HTTP/REST API**: 게임 로직, 인증, 데이터 CRUD (`/api/v1/*`)
- **WebSocket**: 실시간 PvP, 채팅, 알림 (`/ws`)
- **JWT 기반 인증**: Access Token (15분) + Refresh Token (7일, Valkey 저장)
- **Valkey 캐싱 및 세션 관리**:
  - JWT Refresh Token 저장 및 검증
  - Token Blacklist (로그아웃/강제 만료)
  - 유저 세션 관리 (동시 로그인 제어)
  - 아레나 랭킹 (Sorted Set)
  - 던전 임시 데이터 (전투 상태)
  - 실시간 매칭 큐
  - API Rate Limiting 카운터

**데이터 흐름:**
1. Client → Nginx → Handler (인증 검증)
2. Handler → UseCase (비즈니스 로직)
3. UseCase → Repository (DB/Cache 접근)
4. Repository → PostgreSQL/Valkey
5. 응답 역순으로 반환

#### 4.1.4 주요 패키지 구조
```
/cmd
  /server
    main.go
/internal
  /domain
    /character
    /user
    /battle
    /dungeon
  /usecase
  /repository
  /handler
  /middleware
/pkg
  /auth
  /database
  /cache
  /utils
/config
/migrations
```

### 4.2 프론트엔드 (Phaser 3 + TypeScript + Vite)

#### 4.2.1 주요 Scene (화면)
- **BootScene**: 초기 로딩 및 리소스 로드
- **LoginScene**: 로그인/회원가입
- **LobbyScene**: 메인 로비, 메뉴 네비게이션
- **CharacterListScene**: 보유 캐릭터 목록
- **CharacterDetailScene**: 캐릭터 상세 정보 및 강화
- **SummonScene**: 가챠 (소환) 애니메이션
- **DungeonSelectScene**: 던전 선택
- **BattleScene**: 턴제 전투
- **ArenaScene**: PvP 아레나
- **GuildScene**: 길드 관리
- **ShopScene**: 상점
- **InventoryScene**: 인벤토리 및 룬 관리

#### 4.2.2 게임 오브젝트 구조
- **Character**: 캐릭터 스프라이트 및 애니메이션
- **Skill**: 스킬 이펙트 관리
- **UI Components**: 재사용 가능한 UI 요소 (버튼, 패널, 팝업)
- **BattleSystem**: 전투 로직 및 턴 관리
- **ParticleEffects**: 전투 및 스킬 이펙트

#### 4.2.3 상태 관리
- **GameData Store**: 전역 게임 상태 (TypeScript 클래스/싱글톤)
- **Player Data**: 유저 정보, 캐릭터, 인벤토리
- **Phaser Registry**: Scene 간 데이터 공유
- **Event System**: Phaser Events로 Scene 간 통신

#### 4.2.4 주요 라이브러리 및 도구
- **Phaser 3**: 2D 게임 엔진
- **TypeScript**: 타입 안정성
- **Vite**: 빠른 개발 서버 및 빌드
- **Axios**: HTTP REST API 호출
- **Socket.io-client**: WebSocket 통신
- **Spine/DragonBones** (선택): 캐릭터 애니메이션 (고급)
- **Howler.js**: 사운드 관리 (선택)

#### 4.2.4.1 반응형 디자인 구현
**Phaser Scale 설정**
```typescript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1280,
  height: 720,
}
```

**플랫폼별 최적화**
- **데스크톱 (1280px 이상)**: 전체 UI 표시, 마우스 호버 효과
- **태블릿 (768px ~ 1279px)**: 중간 크기 UI, 터치 최적화
- **모바일 (~ 767px)**: 간소화된 UI, 큰 터치 영역

**입력 처리**
```typescript
// 터치와 마우스 모두 지원
scene.input.on('pointerdown', handler);
scene.input.on('pointerup', handler);
```

**성능 최적화**
- 저사양 기기 자동 감지
- 프레임율 자동 조정
- 텍스처 품질 조정
- 파티클 효과 제한

#### 4.2.5 프로젝트 구조
```
/src
  /scenes
    BootScene.ts
    LoginScene.ts
    LobbyScene.ts
    BattleScene.ts
    ...
  /objects
    /character
      Character.ts
      CharacterSprite.ts
    /ui
      Button.ts
      Panel.ts
      HealthBar.ts
    /battle
      BattleSystem.ts
      SkillEffect.ts
  /services
    /api
      HttpClient.ts
      WebSocketClient.ts
    AuthService.ts
    CharacterService.ts
    BattleService.ts
  /store
    GameDataStore.ts
    PlayerStore.ts
  /types
    Character.ts
    Battle.ts
    User.ts
  /utils
    Constants.ts
    Helpers.ts
  /assets
    /images
      /characters
      /ui
      /backgrounds
    /audio
      /music
      /sfx
    /spine (선택)
  main.ts
  game.ts
```

#### 4.2.6 통신 레이어

**HTTP REST API**
- 게임 로직 (전투, 던전, 캐릭터 조작)
- 인증 (login, register)
- 데이터 조회 및 수정
- Stateless 통신

**WebSocket 이벤트**
- `chat:message` - 채팅 메시지 송수신
- `chat:join` - 채널 입장
- `pvp:match_found` - PvP 매칭 완료
- `pvp:turn` - 실시간 PvP 턴 진행
- `guild:notification` - 길드 알림
- `event:update` - 이벤트 실시간 업데이트
- `user:online_status` - 친구 온라인 상태
- `notification:push` - 일반 알림

### 4.3 성능 요구사항

#### 4.3.1 서버 성능
- API 응답 시간: 평균 < 200ms
- 전투 처리: < 100ms per action
- 동시 접속자: 10,000명 이상 지원
- 데이터베이스 쿼리 최적화
- CDN을 통한 정적 파일 서빙

#### 4.3.2 클라이언트 성능 (반응형)
**데스크톱 (Windows, macOS, Linux)**
- 목표 FPS: 60fps
- 최소 사양: Chrome 90+, Firefox 88+, Safari 14+
- 권장 해상도: 1920x1080 이상

**태블릿 (iPad, Android Tablet)**
- 목표 FPS: 60fps (고사양), 30fps (저사양)
- 지원 기기: iPad (5세대 이상), Android 태블릿 (2020년 이후)
- 터치 지연 시간: < 100ms
- 자동 품질 조정

**모바일 (iPhone, Android Phone)**
- 목표 FPS: 30fps ~ 60fps (기기별 자동 조정)
- 지원: iOS 13+, Android 8.0+
- 배터리 최적화: 저전력 모드 지원
- 데이터 절약: 이미지/리소스 압축

**공통 최적화**
- 초기 로딩 시간: < 3초
- Scene 전환 시간: < 500ms
- 메모리 사용량: < 512MB (모바일), < 1GB (데스크톱)
- 네트워크 대역폭: 최소 3G 이상

### 4.4 보안 요구사항

#### 4.4.1 인증 및 인가

**JWT 토큰 전략 (Valkey 기반)**
- **Access Token**: 
  - 만료 시간: 15분
  - 클라이언트 메모리에만 저장 (localStorage 미사용)
  - Stateless로 서버에서 직접 검증
  
- **Refresh Token**: 
  - 만료 시간: 7일
  - Valkey에 저장 관리: `refresh_token:{user_id}:{token_id}`
  - TTL: 7일 (자동 만료)
  - HttpOnly Cookie로 전송 (XSS 방지)

**Valkey 기반 토큰 관리**
```redis
# Refresh Token 저장
SET refresh_token:{user_id}:{token_id} "{token_data}" EX 604800

# Token Blacklist (로그아웃/강제 만료)
SET token_blacklist:{token_jti} "revoked" EX 900

# 동시 로그인 세션 관리 (옵션)
SET user_session:{user_id} "{session_data}" EX 86400
SADD user_active_sessions:{user_id} "{token_id}"
```

**인증 플로우**
1. **로그인**:
   - 사용자 인증 성공 → Access Token + Refresh Token 발급
   - Refresh Token을 Valkey에 저장
   - 클라이언트에 Access Token 반환, Refresh Token은 HttpOnly Cookie

2. **API 요청**:
   - Access Token 검증 (서명, 만료 시간)
   - Blacklist 체크 (Valkey: `token_blacklist:{jti}`)
   - 유효하면 요청 처리

3. **토큰 갱신**:
   - Refresh Token으로 요청
   - Valkey에서 Refresh Token 검증
   - 유효하면 새로운 Access Token 발급
   - 필요 시 Refresh Token도 갱신 (Rotation)

4. **로그아웃**:
   - Access Token을 Blacklist에 추가 (Valkey)
   - Refresh Token 삭제 (Valkey)
   - 해당 세션 정리

**보안 강화**
- API Rate Limiting (사용자당 100 req/min)
- CORS 설정 (허용된 Origin만)
- Refresh Token Rotation (재사용 공격 방지)
- Concurrent Login 제한 (옵션: 최대 3개 기기)
- IP 기반 이상 탐지 (급격한 IP 변경 시 재인증)

#### 4.4.2 데이터 보안
- 비밀번호 암호화 (bcrypt, cost 12)
- HTTPS/TLS 1.3 통신
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 검증 및 이스케이핑)

#### 4.4.3 게임 보안
- 서버 사이드 검증 (모든 게임 로직)
- 가챠 확률 서버 관리
- 전투 결과 서버 계산
- 치트 감지 시스템
- 비정상 패턴 모니터링

### 4.5 모니터링 및 로깅

#### 4.5.1 로깅 전략
- 구조화된 로그 (JSON 포맷)
- 로그 레벨: ERROR, WARN, INFO, DEBUG
- Dozzle을 통한 실시간 로그 조회
- 중요 이벤트 로깅
  - 사용자 인증/인가
  - 가챠 결과
  - 아이템 구매
  - 에러 및 예외

#### 4.5.2 모니터링 지표
- 서버 리소스 (CPU, 메모리, 디스크)
- API 응답 시간 및 에러율
- 데이터베이스 커넥션 풀
- valkey 캐시 히트율
- 동시 접속자 수
- WebSocket 연결 상태

---

## 5. 비즈니스 모델

### 5.1 수익화 방식

#### 5.1.1 크리스탈 판매
- 소액 결제: $0.99 - $99.99
- 패키지 상품
- 첫 구매 보너스
- 일일/주간/월간 패스

#### 5.1.2 구매 유도 요소
- 가챠 시스템
- 에너지 충전
- 스킬업 패키지
- 외형 (스킨) 판매
- 전투 패스 (배틀 패스)

### 5.2 유저 유지 전략
- 일일 로그인 보상
- 이벤트 던전 (주간/월간)
- 시즌 랭킹 보상
- 신규 캐릭터 정기 업데이트
- 밸런스 패치

---

## 6. 개발 로드맵

### Phase 1: MVP (2-3개월)
**인프라 & 개발 환경**
- [ ] Docker 개발 환경 구축 (docker-compose.yml)
- [ ] PostgreSQL, valkey 컨테이너 설정
- [ ] 백엔드 프로젝트 구조 구축 (Clean Architecture)
- [ ] 프론트엔드 Phaser 3 프로젝트 초기화

**아트 에셋 준비 (OpenGameArt.org 핫링크)**
- [ ] **에셋 선정 및 목록 작성**
  - OpenGameArt.org에서 여성 캐릭터 5종 선정 (LPC Character Base)
  - 던전 타일셋, UI 요소, 스킬 이펙트 URL 수집
  - `asset-list.ts` 파일에 hotlink URL 및 라이선스 정보 기록
- [ ] **개발 환경 설정**
  - `.env.development` 파일 생성 (VITE_ASSETS_MODE=hotlink)
  - `AssetConfig.ts` 유틸리티 클래스 구현
  - BootScene에 핫링크 기반 에셋 로더 구현
- [ ] **크레딧 시스템 구현**
  - CreditsScene 생성
  - 에셋 출처 자동 표시 기능
- [ ] **배포 스크립트 준비**
  - `download-assets.js` 스크립트 작성
  - `npm run build` 시 자동 다운로드 설정

**핵심 기능**
- [ ] 유저 인증 시스템 (JWT)
- [ ] 캐릭터 시스템 (기본 20종)
- [ ] 가챠 시스템
- [ ] 기본 전투 시스템
- [ ] 스토리 던전 (5챕터)
- [ ] 캐릭터 레벨업/각성
- [ ] 기본 UI/UX (Phaser Scenes)

**테스트**
- [ ] 단위 테스트 (핵심 로직)
- [ ] API 통합 테스트

### Phase 2: 핵심 콘텐츠 (2-3개월)
**에셋 확장**
- [ ] 추가 여성 캐릭터 에셋 (총 50종으로 확장)
- [ ] 속성별 스킬 이펙트 (화, 수, 풍, 광, 암)
- [ ] 보스 레이드 전용 배경 및 이펙트
- [ ] 프리미엄 UI 테마

**게임 콘텐츠**
- [ ] 룬 시스템
- [ ] 속성 던전
- [ ] 보스 레이드
- [ ] 아레나 (PvP)
- [ ] 랭킹 시스템 (valkey sorted set)
- [ ] 상점 시스템
- [ ] 추가 캐릭터 (총 50종)
- [ ] 성능 최적화 (캐싱 전략)

### Phase 3: 소셜 & 확장 (2개월)
- [ ] WebSocket 서버 구현
- [ ] 길드 시스템
- [ ] 길드전
- [ ] 친구 시스템
- [ ] 채팅 시스템 (WebSocket)
- [ ] 이벤트 시스템
- [ ] 추가 캐릭터 (총 100종)
- [ ] 알림 시스템 (WebSocket)

### Phase 4: 고급 기능 & 운영 (진행 중)
- [ ] 스킨 시스템
- [ ] 실시간 PvP (WebSocket)
- [ ] 월드 보스
- [ ] 크로스 서버 컨텐츠
- [ ] 시즌 패스
- [ ] 모니터링 대시보드 구축
- [ ] 자동 백업 시스템
- [ ] 지속적인 밸런스 패치 및 신규 콘텐츠

---

## 7. 성공 지표 (KPI)

### 7.1 유저 지표
- DAU (Daily Active Users)
- MAU (Monthly Active Users)
- 유저 유지율 (D1, D7, D30)
- 평균 플레이 타임

### 7.2 수익 지표
- ARPU (Average Revenue Per User)
- ARPPU (Average Revenue Per Paying User)
- 전환율 (Free → Paying)
- LTV (Lifetime Value)

### 7.3 게임 지표
- 가챠 횟수
- 던전 클리어율
- PvP 참여율
- 길드 활성도

---

## 8. 리스크 및 고려사항

### 8.1 기술적 리스크
- 확장성 문제 (트래픽 증가 시)
- 게임 밸런스 조정의 어려움
- 치팅/해킹 방지
- 서버 안정성

### 8.2 비즈니스 리스크
- 경쟁 게임 대비 차별화
- 가챠 확률 규제 (국가별)
- 유저 이탈
- 초기 유저 획득 비용

### 8.3 완화 방안
- 로드 테스트 및 모니터링
- 정기적인 밸런스 패치
- 보안 강화 (서버 검증, 암호화)
- 백업 및 장애 복구 계획
- 차별화된 캐릭터 디자인 및 스토리
- 적극적인 커뮤니티 관리

---

## 9. 다음 단계

1. **아트 리소스 확보**
   - 캐릭터 일러스트레이터 섭외
   - UI/UX 디자이너 섭외
   - 캐릭터 디자인 가이드 작성

2. **기술 스택 세팅**
   - Docker 개발 환경 구축
     - docker-compose.yml 설정
     - PostgreSQL, valkey, Nginx, Dozzle 컨테이너 설정
     - 백엔드/프론트엔드 Dockerfile 작성
   - 레포지토리 구조 설정
   - CI/CD 파이프라인 구축 (Docker 이미지 빌드/배포)
   - 개발 환경 문서화 (README.md)

3. **프로토타입 개발**
   - 핵심 게임 루프 구현
   - 전투 시스템 프로토타입
   - 가챠 시스템 프로토타입

4. **테스트**
   - 알파 테스트
   - 베타 테스트
   - 성능 테스트

5. **런칭**
   - 소프트 런칭 (특정 지역)
   - 글로벌 런칭
   - 마케팅 캠페인

---

## 부록

### A. 참고 게임
- 서머너즈워
- Epic Seven
- Azur Lane
- Genshin Impact (가챠 시스템)
- 프린세스 커넥트! Re:Dive

### B. 용어 정리
- **가챠 (Gacha)**: 무작위 아이템 획득 시스템
- **각성 (Evolution)**: 캐릭터 등급 상승
- **룬 (Rune)**: 장비 시스템
- **PvE**: Player vs Environment (컴퓨터 상대)
- **PvP**: Player vs Player (플레이어 대전)

### C. 문의 사항
- 기술 관련: [개발팀 이메일]
- 기획 관련: [기획팀 이메일]
- 아트 관련: [아트팀 이메일]
