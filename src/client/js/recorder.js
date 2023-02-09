const startBtn = document.getElementById("startBtn");

const handleStart = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
};

//이벤트 리스너
startBtn.addEventListener("click", handleStart);
