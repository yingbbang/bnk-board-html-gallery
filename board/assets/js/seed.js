/* =========================
 * Seed Helper (seed 전용 정책)
 * ========================= */
function seedWriter(type) {
  return type === "ANON" ? "익명" : "운영자";
}

/*
 * SEED_POSTS : 원본 템플릿 (약 20건)
 * - 실제 삽입 수는 여기서 증식됨
 */
const SEED_POSTS = [
  { category: "IT", title: "시스템 점검 안내", content: "2025년 1월 5일 02:00 ~ 04:00 시스템 점검이 예정되어 있습니다.", writerType: "ADMIN" },
  { category: "CSR", title: "자유게시판 이용 안내", content: "욕설 및 광고성 게시글은 삭제될 수 있습니다.", writerType: "ADMIN" },
  { category: "FINANCE_PRODUCT", title: "퇴직연금 상품 문의", content: "DC형과 IRP의 차이가 무엇인가요?", writerType: "ANON" },
  { category: "DIGITAL_ASSET", title: "STO 관련 질문", content: "토큰증권은 기존 주식과 어떤 차이가 있나요?", writerType: "ANON" },
  { category: "IT", title: "신입행원 공개채용 안내", content: "BNK부산은행과 경남은행이 하반기 신입 행원을 공개 채용합니다.", writerType: "ADMIN" },
  { category: "CSR", title: "연탄나눔 봉사활동", content: "부산 동구 매축지마을에서 연탄나눔 봉사활동을 진행했습니다.", writerType: "ADMIN" },
  { category: "IT", title: "모바일뱅킹 통합검색 개편", content: "모바일뱅킹 통합검색 기능이 전면 개편되었습니다.", writerType: "ADMIN" },
  { category: "DIGITAL_ASSET", title: "원화 스테이블코인 상표권 출원", content: "BNK금융은 원화 스테이블코인 관련 상표권을 출원했습니다.", writerType: "ADMIN" },
  { category: "FINANCE_PRODUCT", title: "예금 특판 안내", content: "BNK내맘대로 예금 특판을 실시합니다.", writerType: "ADMIN" },
  { category: "IT", title: "AI 이상거래 탐지 시스템", content: "AI 기반 이상거래 추적·조사 시스템 구축을 추진합니다.", writerType: "ADMIN" }
];

/* =========================
 * Seed 정책
 * ========================= */
const TOTAL_COUNT = 100;

// 카테고리 비율 (총합 1.0)
const CATEGORY_RATIO = {
  IT: 0.25,
  CSR: 0.15,
  FINANCE_PRODUCT: 0.20,
  DIGITAL_ASSET: 0.10,
  PENSION: 0.10,
  CORPORATE: 0.10,
  EVENT: 0.10
};

/* =========================
 * 최초 1회 실행 Seed
 * ========================= */
(() => {
  if (localStorage.getItem("SEEDED") === "Y") return;

  /* 1. 스토리지 초기화 */
  StorageDB.set("BOARD", []);
  StorageDB.set("BOARD_STAT", []);
  StorageDB.set("BOARD_HISTORY", []);

  /* 2. 시퀀스 초기화 */
  localStorage.setItem("SEQ_BOARD_ID", 0);
  localStorage.setItem("SEQ_HISTORY_ID", 0);

  /* 3. 카테고리 풀 생성 (비율 반영) */
  const categoryPool = [];
  Object.entries(CATEGORY_RATIO).forEach(([category, ratio]) => {
    const count = Math.floor(TOTAL_COUNT * ratio);
    for (let i = 0; i < count; i++) categoryPool.push(category);
  });
  while (categoryPool.length < TOTAL_COUNT) categoryPool.push("IT");

  /* 4. 게시글 100건 생성 */
  const boards = [];
  const stats = [];
  const now = Date.now();

  for (let i = 0; i < TOTAL_COUNT; i++) {
    const template = SEED_POSTS[i % SEED_POSTS.length];
    const category = categoryPool[i];
    const id = StorageDB.nextId("SEQ_BOARD_ID");
    const createdAt = new Date(now - i * 1000 * 60 * 20).toISOString();

    // 공지 / 이벤트 상단 고정 규칙
    const isPinned =
      (category === "IT" && i < 3) ||
      (category === "EVENT" && i < 2);

    boards.push({
      id,
      category,
      title: isPinned ? `[공지] ${template.title}` : template.title,
      content: template.content,
      status: "ACTIVE",
      writer: seedWriter(template.writerType),
      writer_id: template.writerType === "ADMIN" ? 1 : null,
      created_by: 1,
      updated_by: 1,
      created_at: createdAt,
      updated_at: createdAt,
      version: 1,
      is_pinned: isPinned
    });

    stats.push({
      board_id: id,
      view_count: Math.floor(Math.random() * 500),
      like_count: Math.floor(Math.random() * 80),
      comment_count: Math.floor(Math.random() * 30)
    });
  }

  /* 5. 저장 */
  StorageDB.set("BOARD", boards);
  StorageDB.set("BOARD_STAT", stats);

  /* 6. 시딩 완료 플래그 */
  localStorage.setItem("SEEDED", "Y");

  console.log("✅ Seed 완료: 게시글 100건 생성");
})();
