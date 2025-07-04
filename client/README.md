# GitHub Release Statistics Dashboard (Client)

## 주요 화면 및 기능 설명

### 1. 메인화면 (Repository Overview)

- **설명**  
  메인화면에서는 사용자가 등록한 GitHub 저장소(Repository) 목록을 카드 형태로 한눈에 볼 수 있습니다.  
  각 저장소 카드는 다음과 같은 정보를 제공합니다:
  - 저장소 이름 및 설명
  - GitHub 바로가기 버튼
  - 릴리즈 CSV 다운로드 버튼
  - 해당 저장소의 상세 통계 페이지로 이동하는 링크

- **주요 특징**
  - 반응형 레이아웃으로 데스크탑/모바일 모두 최적화
  - 브랜드 컬러와 당근마켓 스타일의 UI
  - 저장소별로 최신 릴리즈 정보를 빠르게 확인 가능

---

### 2. 상세화면 (Repository Detail)

- **설명**  
  저장소 카드를 클릭하면 해당 저장소의 상세화면으로 이동합니다.  
  이 화면에서는 저장소의 릴리즈 현황과 다양한 통계 대시보드를 확인할 수 있습니다.

- **상세 정보**
  - 저장소 이름, 설명, GitHub 바로가기
  - 전체 릴리즈 개수, 최근 배포일 등 요약 정보

---

### 3. 상세화면의 대시보드(통계/차트/릴리즈 리스트)

#### 3-1. 릴리즈 통계 대시보드

- **연간 릴리즈 통계**
  - 최근 1년간 월별 릴리즈 개수를 막대/꺾은선 그래프로 시각화
  - 각 월의 릴리즈 개수와 전체 합계 표시
  - 연도별 이동 가능

- **주간 릴리즈 통계**
  - 선택한 연/월의 주차별(월~금) 릴리즈 개수를 그래프로 표시
  - 각 주차는 3일 이상 포함된 주만 표시(월말/월초의 짧은 주차는 제외)
  - 주차별 릴리즈 개수와 합계, 주차 이동(이전/다음) 기능
  - 툴팁에 해당 날짜와 릴리즈 개수 표시

- **일간 릴리즈 통계**
  - 선택한 날짜의 시간대별(0~23시) 릴리즈 개수를 그래프로 표시
  - 날짜 선택은 커스텀 캘린더(react-datepicker)로 가능
  - 일별 릴리즈 개수와 합계 표시

- **공통**
  - 모든 날짜/시간 정보는 한국 표준시(KST, UTC+9) 기준으로 표시
  - 모바일에서도 차트가 넘치지 않도록 반응형 레이아웃 적용
  - 차트 위에 마우스를 올리면 상세 툴팁 제공

#### 3-2. 릴리즈 리스트

- **릴리즈 목록**
  - 릴리즈 버전, 배포일(YYYY년 MM월 DD일), 이름을 표 형태로 표시
  - 검색 기능(릴리즈명/버전명)
  - 페이지네이션(10개 단위)
  - 각 릴리즈 클릭 시 상세 모달 팝업(릴리즈 설명, 마크다운 지원, 배포일/버전 등 상세 정보)
  - 모달은 배경 클릭 또는 닫기 버튼으로 닫을 수 있음

- **CSV 다운로드**
  - 릴리즈 데이터를 ISO 8601(예: 2025-05-29T08:08:59Z) 형식으로 CSV로 다운로드 가능

---

## 기타

- 모든 주요 기능은 API 오류, 데이터 없음, 로딩 등 다양한 상황에 대해 친절한 안내 메시지와 UX를 제공합니다.
- 당근마켓 스타일의 컬러와 UI/UX를 적극 반영하여, 친근하고 직관적인 대시보드를 지향합니다.

---

## ChangeLog

### Task5: Mission Complete!
- 클라이언트와 서버를 완전히 분리된 구조로 리팩토링
- 클라이언트는 더 이상 직접 GitHub API나 로컬 데이터 가공을 하지 않고, 서버 API(`/api/releases`, `/api/statistics`, `/api/releases/csv`)만 사용
- 서버는 구동 시 releases.json(Raw 데이터)을 메모리에 올리고, 통계/릴리즈/CSV API를 제공
- 클라이언트의 모든 대시보드, 차트, 릴리즈 리스트, CSV 다운로드가 서버 API 기반으로 동작
- README에 구조 및 변경 내역(Changelog) 추가 