const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
let deleteBtns = document.querySelectorAll("#commentDeleteBtn");
let commentLikeBtns = document.querySelectorAll("#video__comment-like");
const videoLikeBtn = document.getElementById("video__like");
const videoLikeCounter = document.getElementById("video__like-count");
const followBtn = document.getElementById("video__user__follow");
const videoOwner = document.getElementById("video__data");

//댓글 파트
const addComment = (text, id, owner) => {
  const updateCommentCount = () => {
    const commentCountSpan = document.getElementById("video__comments-count");
    const currentCount = parseInt(
      commentCountSpan.innerText.match(/\d+/)[0],
      10
    );
    commentCountSpan.innerText = `댓글 ${currentCount + 1}개`;
  };

  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const a = document.createElement("a");
  a.href = `/users/${owner._id}`;
  const img = document.createElement("img");
  img.className = "video__comment-avatar";
  img.src = owner.avatarUrl;
  a.appendChild(img);
  const span = document.createElement("span");
  span.innerText = `  ${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "❌";
  span2.id = "commentDeleteBtn";
  span2.className = "video__comment-delete";
  span2.addEventListener("click", handleDelete);
  const btn = document.createElement("button");
  btn.id = "video__comment-like";
  const i = document.createElement("i");
  i.className = "fas fa-thumbs-up";
  const btnSpan = document.createElement("span");
  btnSpan.id = "video__comment-like-count";
  btnSpan.innerText = " 0";
  btn.appendChild(i);
  btn.appendChild(btnSpan);
  btn.addEventListener("click", handleCommentLike);
  const timeSpan = document.createElement("span");
  timeSpan.innerText = "방금 전";
  newComment.appendChild(a);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  newComment.appendChild(btn);
  newComment.appendChild(timeSpan);
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
    const currentCount = parseInt(
      commentCountSpan.innerText.match(/\d+/)[0],
      10
    );
    commentCountSpan.innerText = `댓글 ${currentCount - 1}개`;
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
    const commentLikeCount = commentBlock.querySelector(
      "#video__comment-like-count"
    );
    commentLikeCount.textContent = ` ${likeCount}`;
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

if (commentLikeBtns) {
  commentLikeBtns.forEach((likeBtn) => {
    likeBtn.addEventListener("click", handleCommentLike);
  });
}

//유저 컨트롤러 파트
const handleVideoLike = async () => {
  const videoId = videoContainer.dataset.id;
  const response = await fetch(`/api/videos/${videoId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 201) {
    const { likeCount } = await response.json();
    videoLikeCounter.innerText = ` ${likeCount}`;
  }
};

const handleUserFollow = async () => {
  const videoOwnerId = videoOwner.dataset.id;
  const response = await fetch(`/api/users/${videoOwnerId}/follow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 201) {
    const { text } = await response.json();
    followBtn.innerText = text;
  }
};

//이벤트 핸들러
videoLikeBtn.addEventListener("click", handleVideoLike);
if (followBtn) {
  followBtn.addEventListener("click", handleUserFollow);
}
