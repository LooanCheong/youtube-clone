const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
let deleteBtns = document.querySelectorAll("#commentDeleteBtn");
let likeBtns = document.querySelectorAll("#video__comment-like");

const addComment = (text, id, owner) => {
  const updateCommentCount = () => {
    const commentCountSpan = document.getElementById("video__comments-count");
    const currentCount = parseInt(commentCountSpan.innerText);
    commentCountSpan.innerText = currentCount + 1 + "개의 댓글";
  };

  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const img = document.createElement("img");
  img.className = "video__comment-avatar";
  img.src = "/" + owner.avatarUrl;
  const span = document.createElement("span");
  span.innerText = `  ${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "❌";
  span2.id = "commentDeleteBtn";
  span2.className = "video__comment-delete";
  span2.addEventListener("click", handleDelete);
  newComment.appendChild(img);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
  updateCommentCount();
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
    const { newComment } = await response.json();
    addComment(text, newComment._id, newComment.owner);
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
  const updateCommentCount = () => {
    const commentCountSpan = document.getElementById("video__comments-count");
    const currentCount = parseInt(commentCountSpan.innerText);
    commentCountSpan.innerText = currentCount - 1 + "개의 댓글";
  };

  try {
    const response = await fetch(`/api/comments/${commentId}/delete`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Delete request failed");
    }
    commentBlock.remove();
    updateCommentCount();
  } catch (error) {
    //댓글 삭제 실패 알림 추가
    return;
  }
};

const likeCounting = (likeCount) => {
  const commentCounts = document.querySelectorAll("#video__comment-like-count");
};

const handleCommentLike = async (e) => {
  let commentBlock = e.target.parentNode;
  if (commentBlock.nodeName != "LI") {
    commentBlock = commentBlock.parentNode;
  }
  const commentId = commentBlock.dataset.id;

  const response = await fetch(`/api/comments/${commentId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 201) {
    const { likeCount } = await response.json();

    console.log(likeCount);
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

if (likeBtns) {
  likeBtns.forEach((likeBtn) => {
    likeBtn.addEventListener("click", handleCommentLike);
  });
}
