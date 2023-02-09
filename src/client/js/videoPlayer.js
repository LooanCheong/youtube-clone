const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 0.5;
video.volume = volumeValue;
let videoPlayStatus = false;
let setVideoPlayStatus = false;

//비디오 재생 정지 파트
const toggleVideoPlay = () => {
  video.paused ? video.play() : video.pause();
  playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handlePlayClick = () => {
  toggleVideoPlay();
};

const handleVideoClick = () => {
  toggleVideoPlay();
};

const handleVideoWithSpaceBtn = (e) => {
  if (e.keyCode === 32) {
    e.preventDefault();
    toggleVideoPlay();
  }
};

//비디오 소리 제어 파트
const handleMuteClick = () => {
  if (video.muted) {
    video.muted = false;
    video.volume = volumeValue;
  } else {
    video.muted = true;
  }
  muteBtnIcon.classList = video.muted
    ? "fas fa-volume-mute"
    : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (e) => {
  const {
    target: { value },
  } = e;
  if (video.muted) {
    video.muted = false;
    muteBtnIcon.classList = "fas fa-volume-up";
  }
  if (value === "0") {
    video.muted = true;
    muteBtnIcon.classList = "fas fa-volume-mute";
  }
  video.volume = value;
};

const handleMuteWithMBtn = (e) => {
  if (e.keyCode === 77) {
    handleMuteClick();
  }
};

const handleVolumeChangeCheck = (e) => {
  const {
    target: { value },
  } = e;
  if (value != 0) {
    volumeValue = value;
  }
};

const handleVolumeWithTopArrowBtn = (e) => {
  if (e.keyCode === 38) {
    e.preventDefault();
    if (video.volume <= 0.95) {
      video.volume = (video.volume + 0.05).toFixed(2);
    } else {
      video.volume = 1;
    }
    volumeRange.value = video.volume;
  }
};

const handleVolumeWithDownArrowBtn = (e) => {
  if (e.keyCode === 40) {
    e.preventDefault();
    if (video.volume >= 0.05) {
      video.volume = (video.volume - 0.05).toFixed(2);
    } else {
      video.volume = 0;
    }
    volumeRange.value = video.volume;
  }
};

//비디오 시간 파트
const formatTime = (seconds) => {
  if (seconds >= 3600) {
    return new Date(seconds * 1000).toISOString().substring(11, 19);
  } else {
    return new Date(seconds * 1000).toISOString().substring(14, 19);
  }
};

const handleLoadedMetadata = () => {
  totalTime.innerText = formatTime(Math.floor(video.duration));
  timeline.max = Math.floor(video.duration);
};

const handleTimeupdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
  if (currentTime.innerText === totalTime.innerText) {
    playBtnIcon.classList = "fas fa-play";
  }
};

const handleTimelineChange = (e) => {
  const {
    target: { value },
  } = e;
  if (!setVideoPlayStatus) {
    videoPlayStatus = video.paused ? false : true;
    setVideoPlayStatus = true;
  }
  video.pause();
  video.currentTime = value;
};

const handleTimelineSet = () => {
  videoPlayStatus ? video.play() : video.pause();
  setVideoPlayStatus = false;
};

const handleEnded = () => {
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, {
    method: "POST",
  });
};

//비디오 풀 스크린 파트
const toggleFullScreen = () => {
  const fullscreen = document.fullscreenElement;
  if (fullscreen) {
    document.exitFullscreen();
    fullScreenIcon.classList = "fas fa-expand";
  } else {
    videoContainer.requestFullscreen();
    fullScreenIcon.classList = "fas fa-compress";
  }
};

const handleFullscreen = () => {
  toggleFullScreen();
};

const handleVideoDoubleClick = () => {
  toggleFullScreen();
};

//비디오 플레이어 팝업 파트
const hideControls = () => videoControls.classList.remove("showing");

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }
  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }
  videoControls.classList.add("showing");
  controlsMovementTimeout = setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(hideControls, 3000);
};

//이벤트리스너
playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMuteClick);
volumeRange.addEventListener("input", handleVolumeChange);
volumeRange.addEventListener("change", handleVolumeChangeCheck);
document.addEventListener("keydown", handleMuteWithMBtn);
document.addEventListener("keydown", handleVolumeWithTopArrowBtn);
document.addEventListener("keydown", handleVolumeWithDownArrowBtn);
video.addEventListener("loadeddata", handleLoadedMetadata);
video.addEventListener("timeupdate", handleTimeupdate);
video.addEventListener("ended", handleEnded);
video.addEventListener("click", handleVideoClick);
video.addEventListener("dblclick", handleVideoDoubleClick);
timeline.addEventListener("input", handleTimelineChange);
timeline.addEventListener("change", handleTimelineSet);
fullScreenBtn.addEventListener("click", handleFullscreen);
document.addEventListener("keydown", handleVideoWithSpaceBtn);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
