# 추후 개발 PRD (Product Requirements Document)

## 1. MVP 제외 항목
- 룬 시스템
- 스킬 강화
- PvP/길드/레이드
- 이벤트 던전
- 채팅

---

## 2. 추후 소셜 기능
- 길드 시스템
- 친구 시스템
- 채팅

---

## 3. 일일 시스템 (추후)
- 주간 퀘스트
- 출석 체크 (월간)

---

## 4. 추후 UI/Scene

### 4.1 UI 화면
- 룬 관리 화면

### 4.2 프론트엔드 Scene
- ArenaScene (PvP 아레나)
- GuildScene (길드 관리)
- InventoryScene (인벤토리 및 룬 관리)

---

## 5. API 엔드포인트 (추후)

**캐릭터**
- `POST /api/v1/characters/:id/skill-up` - 스킬 강화
- `PUT /api/v1/characters/:id/rune` - 룬 장착/변경

**던전/전투**
- `POST /api/v1/dungeons/:id/battle` - 전투 시작
- `POST /api/v1/battle/:id/action` - 전투 액션
- `POST /api/v1/battle/:id/result` - 전투 결과

**PvP**
- `GET /api/v1/arena/ranking` - 랭킹 조회
- `POST /api/v1/arena/attack` - 공격
- `GET /api/v1/arena/defense` - 방어 설정
- `GET /api/v1/arena/history` - 전투 기록

**길드**
- `GET /api/v1/guilds` - 길드 목록
- `POST /api/v1/guilds` - 길드 생성
- `POST /api/v1/guilds/:id/join` - 가입
- `GET /api/v1/guilds/:id` - 길드 정보
- `GET /api/v1/guilds/:id/members` - 멤버 목록

---

## 6. 데이터베이스 스키마 (추후)

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

---

## 7. 개발 로드맵 (Phase 2~4)

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

**문서 버전**: 1.0  
**최종 수정일**: 2026-02-12  
**작성자**: Development Team
