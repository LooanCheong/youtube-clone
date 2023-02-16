const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
let deleteBtns = document.querySelectorAll("#commentDeleteBtn");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = `  ${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "❌";
  span2.id = "commentDeleteBtn";
  span2.className = "video__comment-delete";
  span2.addEventListener("click", handleDelete);
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text.trim() === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const handleSubmitWithEnter = (e) => {
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
};

const handleDelete = async (e) => {
  const commentBlock = e.target.parentNode;
  const commentId = commentBlock.dataset.id;
  try {
    const response = await fetch(`/api/comments/${commentId}/delete`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Delete request failed");
    }
    commentBlock.remove();
  } catch (error) {
    //댓글 삭제 실패 알림 추가
    return;
  }
};

//이벤트 리스너
if (form) {
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("keydown", handleSubmitWithEnter);
}

if (deleteBtns) {
  deleteBtns.forEach((deleteBtn) =>
    deleteBtn.addEventListener("click", handleDelete)
  );
}
