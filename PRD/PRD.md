# PRD: 캐릭터 수집형 RPG 게임

## 1. 프로젝트 개요

### 1.1 제품 비전
서머너즈워 스타일을 간소화한 턴제 수집형 RPG를 1인 개발로 구현한다. 핵심 재미(수집 → 성장 → 전투 → 보상)를 유지하되 시스템 복잡도는 낮춘다.

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
  - Access Token: 15분 수명, Stateless, 클라이언트 메모리에만 저장 (localStorage 미사용)
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
- **가로뷰 UI**: 서머너즈워 스타일의 가로뷰(landscape) 기준으로 설계
- **모바일 가로 고정**: 세로 모드에서는 회전 안내 오버레이 표시
- **터치 및 마우스**: 두 가지 입력 방식 모두 지원

### 1.6 아트 에셋 리소스 (OpenGameArt.org)

**선정 사이트: OpenGameArt.org** (https://opengameart.org/)

**정책:**
- 로컬 개발은 핫링크로 빠르게 진행한다.
- 배포 시에는 필요한 에셋을 다운로드하여 로컬로 번들링한다.
- 라이선스는 CC0/CC-BY 위주로 사용하고 크레딧을 표시한다.

### 1.7 핵심 게임 흐름 (자연스러운 플레이 루프)
1. **로그인/튜토리얼** → 기본 조작 안내, 기본 몬스터 + 기본 게임머니 지급
2. **저레벨 던전 준비** → 파티 선택 화면에서 기본 몬스터로 편성
3. **스토리 던전 1-1** → 전투 튜토리얼 + 보상 획득
4. **보상 소비 루프** → 상점 진입 → 몬스터 소환(가챠) 구매
5. **신규 몬스터 확인** → 파티 재편성 → 다음 던전 진입
6. **반복 플레이** → 던전 파밍 → 성장 → 난이도 상승
7. **일일 루틴** → 일일 퀘스트/던전 → 재화 수급
8. **엔드게임** → 보스/아레나(비동기)로 목표 제공

### 1.8 첫 10분 튜토리얼 스크립트 (AI 구현용)
1. **로그인 완료**: 닉네임 설정, 기본 UI 안내
2. **기본 지급**: 기본 몬스터 4종 + 골드 5000 + 크리스탈 300 지급
3. **파티 편성**: 기본 몬스터로 4인 파티 구성
4. **스토리 1-1 입장**: 전투 조작 안내 (스킬 1회 사용)
5. **전투 승리 보상**: 골드 1500 + 경험치 재료 1개 + 크리스탈 30 지급
6. **상점 진입 유도**: 일일 상점에서 골드 1000으로 재료 1회 구매
7. **무료 소환 1회**: 첫 소환으로 신규 몬스터 1종 지급 (소환 비용 UI에 크리스탈 100/300 표기)
8. **파티 재편성**: 신규 몬스터 포함 여부 선택
9. **다음 목표 안내**: 스토리 1-2, 일일 퀘스트 1개 해금

### 1.9 세션 종료 흐름 (자연스러운 마무리)
1. **종료 트리거**: 에너지 소진 또는 일일 퀘스트 완료
2. **보상 정산**: 오늘 획득한 보상 요약 표시
3. **다음 세션 목표 제안**: 다음 스토리 스테이지, 강화 대상 1개 추천
4. **휴식 안내**: 내일 보상/리셋 시간 안내 + 종료 버튼 노출

---

## 2. 게임 시스템 (MVP)

### 2.0 MVP 범위
- 포함: 로그인/튜토리얼, 기본 몬스터 지급, 파티 편성, 스토리 던전(챕터 1~2), 전투, 보상, 상점, 소환, 성장(레벨업/각성), 에너지, 일일 미션
- 제외(추후): 룬, 스킬 강화, PvP/길드/레이드, 이벤트 던전, 채팅

### 2.1 캐릭터 수집 시스템

#### 2.1.1 가챠 시스템
**MVP**
- **일반 소환**: 기본 확률로 캐릭터 획득
- **프리미엄 소환**: 높은 등급 캐릭터 확률 상승
- **소환 비용**:
  - 일반 소환: 크리스탈 100
  - 프리미엄 소환: 크리스탈 300
  - 10연속: 10회 비용으로 11회 제공
- **10연속 보너스**: 10연속 내 최소 4성 1장 보장
- **등급 구분**:
  - ⭐ 1성 (Common) - 50%
  - ⭐⭐ 2성 (Uncommon) - 30%
  - ⭐⭐⭐ 3성 (Rare) - 15%
  - ⭐⭐⭐⭐ 4성 (Epic) - 4%
  - ⭐⭐⭐⭐⭐ 5성 (Legendary) - 1%

**추후**
- **픽업 확률 표기(프리미엄 기준)**:
  - 5성 1% 중 픽업 0.5% / 비픽업 0.5%
  - 4성 4% 중 픽업 1% / 비픽업 3%
- **중복 처리**: 중복 캐릭터는 즉시 **조각**으로 전환, 조각 100개당 동일 캐릭터 1장 제작
- **천장/배너 규칙**:
  - 프리미엄 소환 80회 내 5성 1장 보장
  - 픽업 배너는 2주 주기로 교체
  - 픽업 배너에서 5성 획득 시 50% 확률로 픽업, 실패 시 다음 5성은 픽업 확정
- **배너 운영 캘린더(예시)**:
  - 1~2주차: 신규 픽업 A (신규 1명 + 복각 1명)
  - 3~4주차: 신규 픽업 B (신규 1명 + 복각 1명)
  - 월 1회: 테마 배너(속성/클래스 집중)
  - 분기 1회: 한정 배너(복각 없음, 이후 3개월 뒤 재등장)

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

#### 2.2.3 스킬 강화 (추후)
- 각 캐릭터는 4개의 스킬 보유 (기본 공격 + 3개 액티브 스킬)
- 스킬 레벨 최대 10
- 필요 재료: 스킬북 또는 동일 캐릭터

MVP에서는 스킬 강화 미사용, 스킬 레벨은 고정

#### 2.2.4 룬 시스템 (추후)
- 6개 슬롯 (1,3,5: 고정 스탯 / 2,4,6: 선택 스탯)
- 룬 등급: Normal, Magic, Rare, Hero, Legend
- 룬 강화: +15까지 강화 가능
- 세트 효과: 같은 종류 2개/4개 장착 시 보너스

MVP에서는 룬 시스템 미사용

### 2.3 전투 시스템

#### 2.3.1 전투 방식

**게이지 기반 전투 시스템**
- 각 소환수(몬스터)는 **공격속도(ATK Speed)** 스탯을 보유
- 전투 중 실시간으로 공격속도 게이지가 증가
- 게이지가 **100% 채워진 소환수**부터 행동 가능
- 여러 소환수의 게이지가 동시에 찬 경우, SPD 스탯이 높은 순서로 행동

**오토 전투 & 수동 전투 모드**

**아군 (플레이어 파티)**
- **오토 모드 (Auto ON)**
  - AI가 자동으로 스킬 선택 및 공격 대상 지정
  - 게이지가 가득 찬 소환수가 자동으로 행동
  - 배속 기능: x1, x2, x3 지원
- **수동 모드 (Auto OFF)**
  - 게이지가 가득 찬 소환수의 턴이 되면 **일시 정지**
  - 플레이어가 직접 스킬 선택 및 공격 대상 지정
  - 행동을 선택하면 다음 턴으로 진행
- **모드 전환**: 전투 중 언제든지 Auto ON/OFF 토글 가능

**적군 (AI 파티)**
- 무조건 **오토 모드**로 동작
- 게이지가 가득 찬 적 소환수가 자동으로 행동
- 플레이어는 제어 불가

**파티 구성**
- 최대 4명까지 파티 구성
- 각 소환수는 고유의 공격속도 스탯 보유

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

**초반 던전 보상 테이블 (예시)**

| 스테이지 | 에너지 | 골드 | 크리스탈 | 캐릭터 조각 |
| --- | --- | --- | --- | --- |
| 1-1 (Normal) | 3 | 1500 | 30 | 0 |
| 1-2 (Normal) | 3 | 1700 | 30 | 2 |
| 1-3 (Normal) | 4 | 2000 | 40 | 3 |
| 1-4 (Normal) | 4 | 2300 | 40 | 4 |
| 1-5 (Normal) | 5 | 2600 | 50 | 5 |

**Hard/Hell 보상 테이블 (예시)**

| 스테이지 | 난이도 | 에너지 | 골드 | 크리스탈 | 캐릭터 조각 |
| --- | --- | --- | --- | --- | --- |
| 1-1 | Hard | 5 | 3500 | 60 | 6 |
| 1-2 | Hard | 5 | 3800 | 60 | 8 |
| 1-3 | Hard | 6 | 4200 | 80 | 10 |
| 1-4 | Hard | 6 | 4600 | 80 | 12 |
| 1-5 | Hard | 7 | 5200 | 100 | 14 |
| 1-1 | Hell | 7 | 6500 | 120 | 15 |
| 1-2 | Hell | 7 | 7000 | 120 | 18 |
| 1-3 | Hell | 8 | 8000 | 150 | 22 |
| 1-4 | Hell | 8 | 9000 | 150 | 26 |
| 1-5 | Hell | 9 | 10000 | 180 | 30 |

**챕터 2 보상 테이블 (예시, Normal)**

| 스테이지 | 에너지 | 골드 | 크리스탈 | 캐릭터 조각 |
| --- | --- | --- | --- | --- |
| 2-1 (Normal) | 5 | 3000 | 50 | 6 |
| 2-2 (Normal) | 5 | 3300 | 50 | 7 |
| 2-3 (Normal) | 6 | 3600 | 60 | 8 |
| 2-4 (Normal) | 6 | 4000 | 60 | 9 |
| 2-5 (Normal) | 7 | 4500 | 70 | 10 |

**챕터 2 보상 테이블 (예시, Hard/Hell)**

| 스테이지 | 난이도 | 에너지 | 골드 | 크리스탈 | 캐릭터 조각 |
| --- | --- | --- | --- | --- | --- |
| 2-1 | Hard | 7 | 6000 | 100 | 16 |
| 2-2 | Hard | 7 | 6500 | 100 | 18 |
| 2-3 | Hard | 8 | 7200 | 120 | 20 |
| 2-4 | Hard | 8 | 8000 | 120 | 22 |
| 2-5 | Hard | 9 | 9000 | 150 | 24 |
| 2-1 | Hell | 9 | 11000 | 180 | 28 |
| 2-2 | Hell | 9 | 12000 | 180 | 32 |
| 2-3 | Hell | 10 | 13500 | 220 | 36 |
| 2-4 | Hell | 10 | 15000 | 220 | 40 |
| 2-5 | Hell | 11 | 17000 | 260 | 45 |

**속성 던전**
- 요일별 속성 던전 오픈
- 각성 재료 획득

**경험치 던전**
- 캐릭터 레벨업 재료 획득

**골드 던전**
- 골드 대량 획득

#### 2.4.2 추후 콘텐츠 (비MVP)
- 보스 레이드
- 아레나
- 길드전
- 이벤트 던전

### 2.5 추후 소셜 기능 (비MVP)
- 길드 시스템
- 친구 시스템
- 채팅

### 2.6 상점 및 화폐 시스템

#### 2.6.1 화폐 종류
- **크리스탈**: 유료 화폐 (과금 또는 보상)
- **골드**: 기본 게임 화폐

#### 2.6.2 상점
- **일일 상점(골드)**: 경험치 재료, 각성석, 에너지
- **가챠 상점(크리스탈)**: 일반/프리미엄 소환, 소환 패키지

**일일 상점 가격표 (예시)**

| 아이템 | 가격(골드) | 일일 구매 제한 |
| --- | --- | --- |
| 경험치 재료(소) | 2000 | 5 |
| 경험치 재료(중) | 5000 | 3 |
| 각성석 | 3000 | 3 |
| 에너지 10 | 1500 | 5 |

**일일 상점 재고 등급 확률 (예시, 경험치 재료 기준)**

| 등급 | 확률 |
| --- | --- |
| Normal | 60% |
| Magic | 30% |
| Rare | 10% |

#### 2.6.3 재화 획득/소비 루프
- **획득**: 전투 보상(골드/재료) → 일일 퀘스트(골드/크리스탈 소량) → 골드 던전(골드 대량)
- **소비**: 골드로 성장 재료 구매 → 스탯 상승 → 다음 던전 클리어 → 보상 증가
- **크리스탈 소비**: 주로 소환에 사용, 성장 재료는 골드로 해결되도록 구조화

#### 2.6.4 상점 운영 규칙
**MVP**
- **일일 상점**: 고정 카탈로그, 매일 00:00 구매 제한 리셋
- **가챠 상점**: 상시 운영 (일반/프리미엄 소환)
- **구매 제한**: 아이템별 일일 구매 제한 유지
- **구매 동기**: 전투 결과 화면에서 추천 아이템 1~2개 제안

**추후**
- **일일 상점 로테이션**:
  - 기본 재고 4칸 고정, 랜덤 재고 4칸은 4시간마다 갱신
  - 요일별 특화 슬롯 1칸 추가 (예: 월-각성석, 수-경험치 재료, 금-에너지)

#### 2.6.5 상점 가격 밸런싱(추후)
- 챕터 1: 기본 가격표 적용
- 챕터 2: 가격 1.2배, 일일 구매 제한은 동일 유지
- 챕터별 성장 재료 수요에 맞춰 경험치 재료/각성석 비중을 상향

### 2.7 일일 시스템

#### 2.7.1 에너지 시스템
- 최대 에너지: 100
- 자동 회복: 5분당 1
- 던전 입장 시 소모

#### 2.7.2 일일 미션
**MVP**
- **로그인 보상**: 일 1회 자동 지급, 보상 내역 UI로 확인
- **일일 퀘스트**: 5~10개 노출, 조건 충족 시 완료 처리
- **보상 수령 플로우**:
  1) 일일 퀘스트 목록 조회
  2) 조건 달성 시 완료 상태 전환
  3) 완료 후 보상 수령

**추후**
- **주간 퀘스트**
- **출석 체크 (월간)**

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
  - 소환 결과 카드에 고유 일러스트 표시 (몬스터별 1:1 매핑)

3. **캐릭터 관리 화면**
  - 캐릭터 목록 (필터/정렬)
  - 상세 정보
  - 강화/각성 UI

4. **전투 화면**
  - 캐릭터 모델 표시
  - 아군 몬스터 전투 스프라이트/이미지 고유 매핑
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
- **가로뷰 기준 UI**: 모든 화면을 가로뷰(landscape) 기준으로 설계
- **고정 뷰포트**: 논리 해상도는 가로뷰 기준(예: 1280x720 또는 1366x768)으로 고정
- **모바일 표시 방식**: 가로뷰 UI를 화면 중앙에 맞춰 스케일링, 상하 여백/딤 처리로 몰입 유지
- **세로 모드 안내**: 모바일에서 세로 모드 감지 시 회전 안내 오버레이 표시
- **단일 레이아웃**: 기기별 UI 분기 최소화, 동일 컴포넌트 규칙 유지
- **다중 입력 지원**: 터치 인터페이스 + 마우스/키보드
- 빠른 네비게이션
- 명확한 정보 전달
- 매력적인 캐릭터 일러스트 강조
- 부드러운 애니메이션
- **성능 최적화**: 저사양 모바일 기기에서도 원활한 플레이

### 3.2.1 클라이언트 비주얼/게임성 디자인
- **게임성 있는 룩앤필**: 현실 UI가 아닌 게임 UI 느낌 (판넬, 프레임, 보석 버튼 등)
- **컬러/테마**: 판타지 톤(금속, 가죽, 룬 문양), 과한 네온이나 단조로운 평면 디자인 지양
- **타이포그래피**: 제목은 장식적, 본문은 가독성 우선 (한/영 혼용 가독성 확보)
- **UI 피드백**: 클릭/소환/보상 획득 시 짧고 명확한 이펙트(빛, 파티클, SFX)
- **레이아웃 리듬**: 주요 행동 버튼은 크고 중심에 배치, 부가 버튼은 보조 색상으로 구분
- **일관성**: 모든 화면에서 버튼, 카드, 배지의 형태/여백/그림자 규칙을 통일
- **아트 자산**: 캐릭터/아이콘/배경이 혼재해도 톤이 맞도록 기본 팔레트와 라이트 규칙 정의

### 3.2.2 UI 스타일 가이드 (MVP)
- **팔레트 (기본/강조)**: 베이스는 중립 회색 + 따뜻한 베이지, 강조는 골드(#D4AF37)와 크리스탈 블루(#3FB6C6)
- **상태 색상**: 성공(#4CAF50), 경고(#F2B705), 위험(#E53935), 비활성(#9E9E9E)
- **타이포 스케일**: H1 28-32px, H2 22-26px, 본문 14-16px, 캡션 12px
- **컴포넌트 규칙**: 버튼(라운드 10-14px), 카드(그림자 2단), 배지(등급/속성 색상 고정)
- **간격 규칙**: 8px 그리드, 주요 패널 간격 16-24px, 그룹 내부 8-12px
- **아이콘/일러스트**: 라인 두께 통일, 아이콘 톤은 밝은 금속/룬 문양 계열
- **모션**: 일반 전환 120-200ms, 소환/보상 연출 300-600ms, 과도한 흔들림 금지

### 3.2.3 화면별 UI 가이드
- **로비**: 상단 상태바 / 중앙 캐릭터 스탠딩 / 하단 5개 주요 메뉴 탭 / 우측 이벤트 배너, 은은한 파라럭스 배경
- **소환**: 상단 화폐 바 / 중앙 포털/마법진 연출 / 하단 소환 버튼 2개 + 10연속 / 스킵 버튼 우상단 보조
- **캐릭터 관리**: 상단 필터/정렬 / 좌측 그리드(2-4열) / 우측 상세 패널 / 하단 액션 버튼
- **전투**: 상단 정보(턴/웨이브/배속) / 중앙 전장 / 하단 스킬 4개 + Auto
- **던전 선택**: 상단 챕터 탭 / 중앙 노드형 맵 / 하단 입장 버튼 + 에너지, 잠금 스테이지 조건 표기
- **상점**: 상단 화폐 바 / 중앙 상품 그리드 / 일일 상점 타이머 강조 / 추천 상품 강조 카드

### 3.2.4 UI 컴포넌트 스펙
- **버튼**: 기본 높이 44px, 주요/보조/비활성 색 체계 명확화
- **카드**: 이미지/텍스트 6:4 비율, 호버 시 은은한 광원
- **모달**: 배경 딤 60%, 제목/본문/CTA 구획, 닫기 아이콘 우상단
- **상태바**: 골드/크리스탈/에너지 칩 형태, 아이콘+수치 패턴 고정
- **배지**: 등급 배지는 별 아이콘+색상, 속성 배지는 원형 아이콘+테두리
- **탭/필터**: 선택 시 강조 라인, 필터는 칩 형태
- **리스트/그리드**: 8px 그리드, 모바일 1열 스택
- **툴팁**: 2줄 이내 짧은 설명만

### 3.3 전투 결과 → 상점/소환/파티 편성 UX 점검
- **결과 요약**: 승패, 획득 재화, 캐릭터 경험치 증가를 한 화면에서 확인
- **행동 CTA**: 재도전/다음 던전/상점/소환/파티 편성 중 1~2개만 강조
- **재화 가시성**: 상점/소환 진입 전 현재 골드/크리스탈 잔액 표시
- **부족 안내**: 재화 부족 시 대체 경로(골드 던전/일일 퀘스트) 제안
- **파티 재편성**: 신규 몬스터 획득 시 편성 화면으로 바로 이동
- **이탈 최소화**: 닫기/로비 버튼은 보조 버튼으로 배치

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

#### 4.1.2 핵심 데이터 항목 (API/DB)
- **유저**: id, nickname, created_at, last_login
- **재화**: user_id, gold, crystal, updated_at
- **에너지**: user_id, energy, max_energy, last_recovery_at
- **몬스터**: monster_id, name, rarity, element, base_stats
- **보유 몬스터**: user_id, monster_id, level, exp, awaken_stage, skill_levels
- **파티 편성**: user_id, slot_index, monster_instance_id
- **던전 진행도**: user_id, chapter, stage, difficulty, cleared
- **보상 기록**: user_id, stage_id, rewards, created_at
- **가챠 기록**: user_id, banner_id, results, created_at
- **상점 재고**: shop_id, items, refresh_at
- **구매 기록**: user_id, shop_id, item_id, price, created_at
- **일일 퀘스트**: user_id, quest_id, progress, completed_at

#### 4.1.3 OpenAPI/WS 문서화 및 테스트
- **OpenAPI 3.0**: Go REST API는 OpenAPI 3.0 스펙으로 문서화
- **문서 제공**: `/openapi.json` 및 `/docs` (Swagger UI 또는 Redoc)
- **계약 테스트**: 스펙 기반 요청/응답 검증 테스트 추가
- **WebSocket 문서화**: WS 이벤트/페이로드는 OpenAPI 확장 또는 AsyncAPI 스펙으로 별도 명세
- **버전 관리**: `/api/v1` 스펙 버전과 동기화

#### 4.1.4 API 엔드포인트

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
- `POST /api/v1/characters/:id/level-up` - 레벨업
- `POST /api/v1/characters/:id/awaken` - 각성
- `POST /api/v1/characters/:id/skill-up` - 스킬 강화 (추후)
- `PUT /api/v1/characters/:id/rune` - 룬 장착/변경 (추후)

**가챠**
- `POST /api/v1/summon/normal` - 일반 소환 (count: 1 or 10)
- `POST /api/v1/summon/premium` - 프리미엄 소환 (count: 1 or 10)
- `GET /api/v1/summon/rates` - 확률 정보

**던전**
- `GET /api/v1/dungeons` - 던전 목록
- `POST /api/v1/dungeons/:id/enter` - 던전 입장
- `POST /api/v1/dungeons/:id/complete` - 던전 클리어 처리 (MVP)
- `POST /api/v1/dungeons/:id/battle` - 전투 시작 (추후)
- `POST /api/v1/battle/:id/action` - 전투 액션 (추후)
- `POST /api/v1/battle/:id/result` - 전투 결과 (추후)

**PvP (추후)**
- `GET /api/v1/arena/ranking` - 랭킹 조회
- `POST /api/v1/arena/attack` - 공격
- `GET /api/v1/arena/defense` - 방어 설정
- `GET /api/v1/arena/history` - 전투 기록

**길드 (추후)**
- `GET /api/v1/guilds` - 길드 목록
- `POST /api/v1/guilds` - 길드 생성
- `POST /api/v1/guilds/:id/join` - 가입
- `GET /api/v1/guilds/:id` - 길드 정보
- `GET /api/v1/guilds/:id/members` - 멤버 목록

**상점**
- `GET /api/v1/shop/items` - 상점 아이템 목록
- `POST /api/v1/shop/purchase` - 구매

**퀘스트**
- `GET /api/v1/quests/daily` - 일일 퀘스트
- `POST /api/v1/quests/:id/complete` - 퀘스트 완료
- `POST /api/v1/quests/:id/claim` - 보상 수령
- `GET /api/v1/login/daily` - 일일 로그인 상태

#### 4.1.5 데이터베이스 스키마

**MVP 스키마 범위**
- 사용: Users, Characters, UserCharacters, Dungeons
- 보완: 핵심 데이터 항목에 있는 테이블은 구현 단계에서 추가 정의
- 추후: Runes, Skills, Arena, Guilds 관련 테이블

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

#### 4.1.6 아키텍처

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

#### 4.1.7 주요 패키지 구조
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
- **ArenaScene**: PvP 아레나 (추후)
- **GuildScene**: 길드 관리 (추후)
- **ShopScene**: 상점
- **InventoryScene**: 인벤토리 및 룬 관리 (추후)

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

**가로뷰 UI 기준**
- 가로뷰 기준 해상도를 고정하고 기기별로 스케일링
- 모바일 세로 모드에서는 회전 안내 오버레이 표시
- 화면이 좁을수록 상하 여백/딤 처리로 몰입 유지

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

#### 4.3.2 클라이언트 성능 (랜드스케이프 기준)
**표시/해상도 기준**
- 목표 FPS: 60fps
- 기준 해상도: 1280x720 (가로 고정)
- 최소 사양: Chrome 90+, Firefox 88+, Safari 14+

**데스크톱/태블릿 표시**
- 동일 UI를 스케일 업/다운하며 레터박싱 허용
- 터치/마우스 입력 모두 지원

**모바일 성능 기준 (가로 보기)**
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
- [ ] 스토리 던전 (챕터 1~2, Normal)
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
