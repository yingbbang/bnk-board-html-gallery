/* 게시글 수정 + 이력 (+ 첨부파일 최대 5개 제한) */

document.addEventListener("DOMContentLoaded", () => {
  const MAX_ATTACH = 5;

  const id = Number(Util.qs("id"));
  const boards = StorageDB.get("BOARD") || [];
  const histories = StorageDB.get("BOARD_HISTORY") || [];

  const board = boards.find(b => b.id === id);
  if (!board) {
    alert("게시글 없음");
    history.back();
    return;
  }

  // --- DOM refs (name 의존 제거: id로만 접근) ---
  const form = document.querySelector("#editForm");
  const titleEl = document.getElementById("title");
  const contentEl = document.getElementById("content");
  const fileInput = document.getElementById("attachments");          // <input type="file" ...>
  const existingBox = document.getElementById("existingAttachments"); // 기존첨부 렌더링 영역

  // --- 기본값 보정 ---
  board.attachments = Array.isArray(board.attachments) ? board.attachments : [];

  // --- 기존 값 세팅 ---
  if (titleEl) titleEl.value = board.title || "";
  if (contentEl) contentEl.value = board.content || "";

  // =========================
  // 1) 기존 첨부 렌더링 (삭제 체크박스)
  // =========================
  function renderExistingAttachments() {
    if (!existingBox) return;

    if (board.attachments.length === 0) {
      existingBox.innerHTML = `<small class="form-help">기존 첨부파일이 없습니다.</small>`;
      return;
    }

    // value에 index 박아두고, 제출 시 삭제 처리
    existingBox.innerHTML = board.attachments.map((a, idx) => {
      const name = (a && a.name) ? a.name : String(a);
      return `
        <label class="attach-row" style="display:block; margin:6px 0;">
          <input type="checkbox" name="removeAttachment" value="${idx}">
          ${Util.escape(name)} <span class="muted">(삭제)</span>
        </label>
      `;
    }).join("") + `
      <small class="form-help">
        ※ 기존 첨부파일은 브라우저 정책상 자동 재선택이 불가합니다.
      </small>
    `;
  }

  function getRemoveIndexes() {
    const checks = document.querySelectorAll('input[name="removeAttachment"]:checked');
    return Array.from(checks).map(ch => Number(ch.value)).filter(n => Number.isFinite(n));
  }

  function getRemainingExistingCount() {
    const removeIdx = new Set(getRemoveIndexes());
    return board.attachments.filter((_, i) => !removeIdx.has(i)).length;
  }

  function getAllowedNewCount() {
    return Math.max(0, MAX_ATTACH - getRemainingExistingCount());
  }

  renderExistingAttachments();

  // =========================
  // 2) 신규 파일 선택 시 "추가 가능 개수" 초과 방지
  // =========================
  function enforceFileLimitOnSelect() {
    if (!fileInput) return;

    const allowed = getAllowedNewCount();
    const newCount = fileInput.files ? fileInput.files.length : 0;

    if (newCount > allowed) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.\n현재 추가 가능: ${allowed}개`);
      fileInput.value = ""; // 선택 초기화
    }
  }

  if (fileInput) {
    fileInput.addEventListener("change", enforceFileLimitOnSelect);
  }

  // 기존 첨부 삭제 체크가 바뀌면 "추가 가능 개수"도 바뀌니까 재검증
  if (existingBox) {
    existingBox.addEventListener("change", enforceFileLimitOnSelect);
  }

  // =========================
  // 3) 저장(submit) 시: 삭제 반영 + 신규 첨부 합산(최대 5개) + 저장
  // =========================
  form.addEventListener("submit", e => {
    e.preventDefault();

    const title = titleEl ? titleEl.value.trim() : (form.title?.value || "").trim();
    const content = contentEl ? contentEl.value : (form.content?.value || "");

    // (선택) 여기서 비밀번호 검증 로직이 있어야 "수정/삭제용"이 의미가 있음.
    // 현재 소스엔 password 검증이 없으니, 원하면 추가해줄게.

    // 1) 기존 첨부 중 삭제 체크 반영
    const removeIdx = new Set(getRemoveIndexes());
    const remained = board.attachments.filter((_, i) => !removeIdx.has(i));

    // 2) 신규 파일 메타만 저장(로컬스토리지에 File 객체 저장 불가)
    const newFiles = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
    const allowed = Math.max(0, MAX_ATTACH - remained.length);
    if (newFiles.length > allowed) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.\n현재 추가 가능: ${allowed}개`);
      return;
    }

    const newAttachMetas = newFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploaded_at: new Date().toISOString()
    }));

    const finalAttachments = remained.concat(newAttachMetas);
    if (finalAttachments.length > MAX_ATTACH) {
      alert(`첨부파일은 최대 ${MAX_ATTACH}개까지 가능합니다.`);
      return;
    }

    // 이력 저장(기존 구조 유지 + 첨부 변화도 같이 남김)
    histories.push({
      history_id: StorageDB.nextId("SEQ_HISTORY_ID"),
      board_id: id,
      before_content: board.content,
      after_content: content,
      before_attachments: board.attachments,     // 추가
      after_attachments: finalAttachments,       // 추가
      updated_by: 1,
      updated_at: new Date().toISOString()
    });

    // 게시글 갱신
    board.title = title;
    board.content = content;
    board.attachments = finalAttachments;        // 추가
    board.updated_at = new Date().toISOString();
    board.version = (board.version || 0) + 1;

    StorageDB.set("BOARD", boards);
    StorageDB.set("BOARD_HISTORY", histories);

    location.href = `view.html?id=${id}`;
  });
});
