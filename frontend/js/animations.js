export function initBackgroundParticles() {
  const container = document.getElementById('bgEffects');
  if (!container) return;

  for (let i = 0; i < 12; i += 1) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (16 + Math.random() * 12) + 's';
    container.appendChild(particle);
  }
}

export function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  container.innerHTML = '';
  const colors = ['#a855f7', '#7c3aed', '#c084fc', '#9333ea', '#fbbf24', '#22c55e', '#06b6d4', '#ef4444'];
  const shapes = ['●', '■', '▲', '★', '♦'];

  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.left = Math.random() * 100 + '%';
    piece.style.color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.fontSize = (6 + Math.random() * 10) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.4 + 's';
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}
