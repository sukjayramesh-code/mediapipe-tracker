const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/* -------- POSE -------- */
const pose = new Pose({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

/* -------- HANDS -------- */
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

/* -------- FACE -------- */
const faceMesh = new FaceMesh({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

/* -------- UTILS -------- */
function fib(n) {
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

function drawBodyBox(lm) {
  const ids = [11, 12, 23, 24];
  const xs = ids.map(i => lm[i].x * canvas.width);
  const ys = ids.map(i => lm[i].y * canvas.height);

  ctx.strokeStyle = '#00AFFF';
  ctx.lineWidth = 3;
  ctx.strokeRect(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  );
}

/* -------- POSE RESULTS -------- */
pose.onResults(r => {
  if (!r.poseLandmarks) return;
  const lm = r.poseLandmarks;

  drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: '#00ffaa', lineWidth: 2 });
  drawLandmarks(ctx, lm, { color: '#ff0055', radius: 3 });

  lm.forEach(p => {
    const x = Math.round(p.x * canvas.width);
    const y = Math.round(p.y * canvas.height);
    ctx.fillStyle = 'yellow';
    ctx.font = '11px monospace';
    ctx.fillText(`x:${x} y:${y}`, x + 4, y - 4);
  });

  drawBodyBox(lm);

  const w = lm[16]; // wrist
  const cx = w.x * canvas.width;
  const cy = w.y * canvas.height;

  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const r = fib(i) * 4;
    const a = i * 0.8;
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.strokeStyle = 'rgba(255,215,0,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
});

/* -------- HAND RESULTS -------- */
hands.onResults(r => {
  if (!r.multiHandLandmarks) return;
  r.multiHandLandmarks.forEach(hand => {
    drawConnectors(ctx, hand, HAND_CONNECTIONS, { color: '#00BFFF', lineWidth: 2 });
    drawLandmarks(ctx, hand, { color: '#FFD700', radius: 3 });

    hand.forEach(p => {
      const x = Math.round(p.x * canvas.width);
      const y = Math.round(p.y * canvas.height);
      ctx.fillStyle = '#00FFFF';
      ctx.font = '10px monospace';
      ctx.fillText(`x:${x} y:${y}`, x + 3, y - 3);
    });
  });
});

/* -------- FACE RESULTS -------- */
faceMesh.onResults(r => {
  if (!r.multiFaceLandmarks) return;
  r.multiFaceLandmarks.forEach(face => {
    drawConnectors(ctx, face, FACEMESH_TESSELATION, {
      color: 'rgba(0,255,255,0.3)',
      lineWidth: 1
    });
    drawLandmarks(ctx, face, { color: '#00FFFF', radius: 1 });
  });
});

/* -------- CAMERA -------- */
const camera = new Camera(video, {
  onFrame: async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    await pose.send({ image: video });
    await hands.send({ image: video });
    await faceMesh.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();
