export function animateCountUp(element, endVal, duration = 800) {
  if (!element) return;
  const startVal = parseInt(element.innerText) || 0;
  if (startVal === endVal) {
    element.innerText = endVal + '%';
    return;
  }
  const startTime = performance.now();

  const tick = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeOutQuart
    const ease = 1 - Math.pow(1 - progress, 4);

    const currentVal = Math.round(startVal + (endVal - startVal) * ease);
    element.innerText = currentVal + '%';

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.innerText = endVal + '%';
    }
  };
  requestAnimationFrame(tick);
}

export function fireConfetti() {
  const count = 100;
  const colors = ['#D9442A', '#1F4FA8', '#EAB308', '#181511'];
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for(let i=0; i<count; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.8,
      r: Math.random() * 4 + 2,
      dx: Math.random() * 20 - 10,
      dy: Math.random() * -15 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleInc: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
    });
  }

  let animationFrame;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.tiltAngle) + p.dy + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle) * 2;
      p.dy += 0.5; // Gravity arc

      if (p.y <= canvas.height) {
        active = true;
      }

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
      ctx.stroke();
    });

    if (active) {
      animationFrame = requestAnimationFrame(render);
    } else {
      document.body.removeChild(canvas);
    }
  }
  render();
}
