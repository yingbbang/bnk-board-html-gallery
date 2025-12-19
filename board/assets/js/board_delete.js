document.addEventListener("DOMContentLoaded", () => {
  const id = Number(Util.qs("id"));
  const boards = StorageDB.get("BOARD") || [];

  const currentUser = {
    role: "ADMIN" // 실제론 인증으로 교체
  };

  // ADMIN만 접근 가능
  if (currentUser.role !== "ADMIN") {
    alert("접근 권한이 없습니다.");
    location.href = "index.html";
    return;
  }

  const board = boards.find(b => b.id === id);

  if (!board || board.status === "DELETED") {
    alert("유효하지 않은 게시글입니다.");
    location.href = "index.html";
    return;
  }

  // 요약 정보 표시
  document.getElementById("delCategory").textContent = board.category;
  document.getElementById("delTitle").textContent = board.title;
  document.getElementById("delWriter").textContent = board.writer || "익명";
  document.getElementById("delDate").textContent =
    Util.fmt(board.created_at);

  // 삭제 실행
  document.getElementById("btnConfirmDelete").addEventListener("click", () => {
    const reason = document.getElementById("deleteReason").value.trim();

    if (!reason) {
      alert("삭제 사유는 필수입니다.");
      return;
    }

    board.status = "DELETED";
    board.deleted_reason = reason;
    board.deleted_at = new Date().toISOString();
    board.deleted_by = currentUser.role;

    StorageDB.set("BOARD", boards);

    // 감사 로그
    const logs = StorageDB.get("AUDIT_LOG") || [];
    logs.push({
      id: Date.now(),
      action: "DELETE",
      board_id: id,
      actor: currentUser.role,
      created_at: new Date().toISOString(),
      ip: "내부망"
    });
    StorageDB.set("AUDIT_LOG", logs);

    alert("게시글이 삭제되었습니다.");
    location.href = "index.html";
  });
});
