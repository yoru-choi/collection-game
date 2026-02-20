# 추후 개발 백로그 (비MVP)

## 1. 목적
- 본 문서는 **MVP 제외 항목**만 관리한다.
- 이미 상세 문서에 존재하는 MVP 규칙은 여기서 반복하지 않는다.

## 2. 기능 확장 백로그

### 2.1 성장 시스템 확장
- 룬 시스템 (장착/강화/세트 효과)
- 스킬 강화 (재료형 또는 중복 캐릭터 소모형)

### 2.2 콘텐츠 확장
- 보스 레이드
- 아레나(PvP)
- 이벤트 던전
- 길드전

### 2.3 소셜 확장
- 친구 시스템
- 길드 시스템
- 채팅(실시간)
- 알림/푸시

## 3. UI/Scene 확장 후보
- `ArenaScene` (PvP)
- `GuildScene` (길드)
- `InventoryScene` 고도화 (룬/장비 중심)

## 4. API 확장 후보

### 4.1 캐릭터
- `POST /api/v1/characters/:id/skill-up`
- `PUT /api/v1/characters/:id/rune`

### 4.2 PvP
- `GET /api/v1/arena/ranking`
- `POST /api/v1/arena/attack`
- `GET /api/v1/arena/history`

### 4.3 길드
- `GET /api/v1/guilds`
- `POST /api/v1/guilds`
- `POST /api/v1/guilds/:id/join`
- `GET /api/v1/guilds/:id/members`

## 5. 단계별 로드맵 (안)

### Phase 2
- PvE 확장(속성 던전/레이드)
- 성장 시스템 확장(룬 또는 스킬강화 중 1개 우선)
- 밸런스/경제 데이터 수집 체계 강화

### Phase 3
- PvP 및 랭킹
- 길드/친구/채팅

### Phase 4
- 시즌 운영, 한정 콘텐츠, 라이브 운영 자동화

## 6. 우선순위 원칙
- 신규 시스템은 반드시 기존 루프(전투→보상→성장)를 강화해야 한다.
- 운영 복잡도가 큰 기능(실시간 PvP/채팅)은 MVP 안정화 이후 도입한다.

---

**문서 버전**: 2.0  
**최종 수정일**: 2026-02-18