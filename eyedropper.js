const imageInput = document.getElementById('imageInput');
const loadExample = document.getElementById('loadExample');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const colorValue = document.getElementById('colorValue');
const copyColor = document.getElementById('copyColor');
const magnifier = document.getElementById('magnifier');
const magnifierCtx = magnifier.getContext('2d');

let currentColor = '#ffffff';

function drawImageToCanvas(img) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
}

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => drawImageToCanvas(img);
  img.src = URL.createObjectURL(file);
});

loadExample.addEventListener('click', () => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => drawImageToCanvas(img);
  img.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
  // Magnifier config
  const zoom = 8;
  const size = 10; // 10x10 pixels
  const magSize = magnifier.width;
  // Limitar para não sair da borda da imagem
  let sx = Math.max(0, Math.min(canvas.width - size, x - Math.floor(size / 2)));
  let sy = Math.max(0, Math.min(canvas.height - size, y - Math.floor(size / 2)));
  // Limpar e desenhar o zoom
  magnifierCtx.clearRect(0, 0, magSize, magSize);
  magnifierCtx.imageSmoothingEnabled = false;
  magnifierCtx.drawImage(
    canvas,
    sx, sy, size, size,
    0, 0, magSize, magSize
  );
  // Desenhar borda central
  magnifierCtx.strokeStyle = '#ff0000';
  magnifierCtx.lineWidth = 2;
  magnifierCtx.strokeRect(
    magSize/2 - zoom/2, magSize/2 - zoom/2, zoom, zoom
  );
  // Posicionar magnifier
  magnifier.style.display = 'block';
  let mx = e.clientX - rect.left + 20;
  let my = e.clientY - rect.top + 20;
  // Ajustar para não sair do container
  const containerRect = canvas.parentElement.getBoundingClientRect();
  if (mx + magSize > containerRect.width) mx = containerRect.width - magSize;
  if (my + magSize > containerRect.height) my = containerRect.height - magSize;
  magnifier.style.left = mx + 'px';
  magnifier.style.top = my + 'px';
});

canvas.addEventListener('mouseleave', () => {
  magnifier.style.display = 'none';
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  currentColor = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
  colorPreview.style.background = currentColor;
  colorValue.textContent = currentColor;
});

copyColor.addEventListener('click', () => {
  if (!currentColor) return;
  navigator.clipboard.writeText(currentColor);
});
