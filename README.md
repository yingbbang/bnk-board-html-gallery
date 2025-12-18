# BNK Board HTML Project

본 프로젝트는 부산은행 게시판 시스템을 가정하여  
**순수 HTML / CSS / JavaScript 환경에서 게시판 구조와 데이터 설계 사고를 검증**하기 위해 제작되었다.

단순 CRUD 구현이 아닌,  
**금융권 실무 기준의 데이터 구조, 상태 관리, 감사·이력 개념**을 반영하는 것을 목표로 한다.

### 작업기간
2025.12.17(1일, 11:00~16:00, 점심시간은 작업하지 않음)

---
<br>

### index.html (list) ## 이미지를 누르면 해당 페이지로 이동합니다.
<a href="https://yingbbang.github.io/bnk-board-html/board/index.html"> 
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/snapshot-index.png"></a>

### view.html (view)
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/snapshot-view.png">

### write.html (write) ## 이미지를 누르면 해당 페이지로 이동합니다.
<a href="https://yingbbang.github.io/bnk-board-html/board/write.html"> 
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/snapshot-write.png"></a>

### edit.html (edit)
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/snapshot-edit.png">

### delete.html (delete)
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/snapshot-delete.png">

### ERD
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/erd.png">

### data-dictionary
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/data-dictionary.png">

### code-definition
<img src="https://github.com/yingbbang/bnk-board-html/blob/main/board/assets/dummy/code-definition.png">


## 1. 프로젝트 목적

- 금융권 게시판 시스템에서 요구되는 **데이터 책임 분리 구조**를 이해하고 구현
- ERD → Data Dictionary → Code Definition으로 이어지는 **설계 문서 체계 확립**
- 서버 없이도 구조적 사고를 검증할 수 있도록 **프론트 단독 구조로 구성**

---

## 2. 구현 범위

### 화면 (HTML)

- 게시글 목록: `index.html`
- 게시글 상세: `view.html`
- 게시글 등록: `write.html`
- 게시글 수정: `edit.html`
- 게시글 삭제: `delete.html`

### 문서 (Schema)

- `data-dictionary.html`
  - 테이블 구조
  - 컬럼 의미
  - 설계 원칙
  - 상태 기반 운영 규칙

- `code-definition.html`
  - 코드값(role, status, type, category)의 의미
  - 사용 규칙 및 주의사항

- `erd.png`
  - 전체 ERD 시각 자료

---

## 3. 설계 핵심 원칙

- **물리 삭제 금지**
  - 모든 데이터는 status 기반으로 관리

- **권한 분리**
  - role_code + level 조합을 통한 권한 판단

- **책임 추적 가능 구조**
  - writer / created_by / updated_by 분리

- **감사 대응**
  - 게시글 수정 이력(BOARD_HISTORY) 필수 기록

- **성능 고려**
  - 조회수·댓글 수 등 트래픽 데이터 분리(BOARD_STAT)

---

## 4. 디렉토리 구조

```text
bnk-board-html/
│
├─ README.md
│   └─ 프로젝트 목적, 설계 원칙, 문서/버전 관리 정책 설명
│
└─ board/
   │
   ├─ index.html
   │   └─ 게시글 목록 화면 (List)
   │      - 게시글 조회
   │      - 상태 ACTIVE 기준 노출
   │
   ├─ view.html
   │   └─ 게시글 상세 화면 (View)
   │      - 게시글 내용 조회
   │      - 조회수 증가
   │      - 댓글/첨부파일 표시
   │
   ├─ write.html
   │   └─ 게시글 등록 화면 (Write)
   │      - 신규 게시글 작성
   │      - BOARD / BOARD_STAT 생성
   │
   ├─ edit.html
   │   └─ 게시글 수정 화면 (Edit)
   │      - 게시글 수정
   │      - BOARD_HISTORY 이력 기록
   │
   └─ assets/
      │
      ├─ css/
      │  ├─ common.css
      │  │   └─ 공통 스타일
      │  │      - 레이아웃
      │  │      - 폰트
      │  │      - 기본 UI 규칙
      │  │
      │  └─ board.css
      │      └─ 게시판 전용 스타일
      │         - 목록/상세/작성 화면 개별 스타일
      │
      ├─ js/
      │  ├─ storage.js
      │  │   └─ localStorage 기반 데이터 저장소
      │  │      - DB 대체 역할
      │  │
      │  ├─ seed.js
      │  │   └─ 초기 데이터 세팅
      │  │      - 최초 1회 실행
      │  │
      │  ├─ util.js
      │  │   └─ 공통 유틸 함수
      │  │      - 날짜 포맷
      │  │      - 쿼리스트링 파싱
      │  │      - DOM 헬퍼
      │  │
      │  ├─ board_list.js
      │  │   └─ index.html 전용 로직
      │  │      - 게시글 목록 조회
      │  │
      │  ├─ board_view.js
      │  │   └─ view.html 전용 로직
      │  │      - 상세 조회
      │  │      - 조회수 증가
      │  │
      │  ├─ board_write.js
      │  │   └─ write.html 전용 로직
      │  │      - 게시글 등록 처리
      │  │
      │  └─ board_edit.js
      │      └─ edit.html 전용 로직
      │         - 게시글 수정
      │         - 이력 기록
      │
      └─ schema/
         ├─ data-dictionary.html
         │   └─ 데이터 사전
         │      - 테이블 구조
         │      - 컬럼 의미
         │      - 설계 원칙
         │
         ├─ code-definition.html
         │   └─ 코드 정의서
         │      - role / status / type / category 코드 규칙
         │
         └─ erd.png
             └─ 게시판 전체 ERD 시각 자료

# bnk-board-html-gallery
