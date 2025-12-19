document.addEventListener("DOMContentLoaded", () => {

  /* =========================
   * 상수 / 상태
   * ========================= */
  const PAGE_SIZE = 20;
  const PAGE_GROUP_SIZE = 3;

  let currentPage = Number(Util.qs("page")) || 1;
  let currentCategory = "";
  let currentKeyword = "";

  const CATEGORY_LABEL = {
    IT: "IT·시스템",
    SECURITY: "보안",
    DIGITAL: "디지털금융",
    FINANCE_PRODUCT: "금융상품",
    PENSION: "퇴직연금",
    CORPORATE: "기업금융",
    RETAIL: "개인금융",
    DIGITAL_ASSET: "디지털자산",
    CSR: "사회공헌(CSR)",
    EVENT: "이벤트·프로모션"
  };

  /* =========================
   * 데이터 로딩
   * ========================= */
  const allBoards = (StorageDB.get("BOARD") || [])
    .filter(b => b.status === "ACTIVE");

  const stats = StorageDB.get("BOARD_STAT") || [];
  const statMap = {};
  stats.forEach(s => statMap[s.board_id] = s);

  const noticeBoards = allBoards
    .filter(b => b.is_pinned === true)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const normalBoards = allBoards
    .filter(b => !b.is_pinned)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const tbody = document.getElementById("boardList");
  const pagination = document.getElementById("pagination");
  const categoryButtons = document.querySelectorAll(".board-category button");
  const keywordInput = document.getElementById("keyword");

  /* =========================
   * 렌더링
   * ========================= */
  function render(boards) {
    tbody.innerHTML = "";

    boards.forEach(b => {
      const stat = statMap[b.id] || { view_count: 0, like_count: 0 };
      const tr = document.createElement("tr");

      if (b.is_pinned) tr.classList.add("pinned");

      tr.innerHTML = `
        <td class="text-center">${b.is_pinned ? "공지" : b.id}</td>
        <td class="text-center">
          <span class="category-badge">
            ${CATEGORY_LABEL[b.category] || b.category}
          </span>
        </td>
        <td class="title">
          ${b.is_pinned ? '<span class="notice-icon">공지</span>' : ''}
          <a href="view.html?id=${b.id}">
            ${Util.escape(b.title)}
          </a>
        </td>
        <td class="text-center">${b.writer || "익명"}</td>
        <td class="text-center">${Util.fmt(b.created_at)}</td>
        <td class="text-center">${stat.view_count}</td>
        <td class="text-center">${stat.like_count}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  /* =========================
   * 필터 + 페이지네이션 적용
   * ========================= */
  function applyFilter() {
    const keyword = currentKeyword.toLowerCase();

    const filteredNormal = normalBoards.filter(b => {
      const matchCategory =
        !currentCategory || b.category === currentCategory;

      const matchKeyword =
        !keyword ||
        b.title.toLowerCase().includes(keyword) ||
        b.content.toLowerCase().includes(keyword);

      return matchCategory && matchKeyword;
    });

    const totalCount = filteredNormal.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (currentPage > totalPages) currentPage = 1;

    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageBoards =
      filteredNormal.slice(startIdx, startIdx + PAGE_SIZE);

    render([...noticeBoards, ...pageBoards]);
    renderPagination(totalPages);
  }

  /* =========================
   * 페이지 그룹 렌더링
   * ========================= */
  function renderPagination(totalPages) {
    if (!pagination || totalPages === 0) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = "";

    const currentGroup = Math.ceil(currentPage / PAGE_GROUP_SIZE);
    const startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
    const endPage =
      Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

    if (currentPage > 1) addPageButton("«", 1);
    if (startPage > 1) addPageButton("‹", startPage - 1);

    for (let i = startPage; i <= endPage; i++) {
      addPageButton(i, i, i === currentPage);
    }

    if (endPage < totalPages) addPageButton("›", endPage + 1);
    if (currentPage < totalPages) addPageButton("»", totalPages);
  }

  function addPageButton(label, page, isActive = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (isActive) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = page;
      applyFilter();
    });

    pagination.appendChild(btn);
  }

  /* =========================
   * 이벤트 바인딩
   * ========================= */

  // 카테고리
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentCategory = btn.dataset.category || "";
      currentPage = 1;
      applyFilter();
    });
  });

  // 검색 (Enter만)
  keywordInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      currentKeyword = keywordInput.value.trim();
      currentPage = 1;
      applyFilter();
    }
  });

  /* =========================
   * 초기 실행
   * ========================= */
  applyFilter();

});
