/**
 * 绘制拼豆圆珠预览。该函数只依赖 Canvas 2D 接口，主线程 HTMLCanvasElement
 * 与 Worker 的 OffscreenCanvas 共用，避免两端视觉细节漂移。
 */
export function renderBeadPreview(canvas, cells, width, height, highlightCode = null, cellSize = 18, hideOtherColors = false) {
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建预览画布");
  context.fillStyle = "#fafaf9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  cells.forEach((cell, index) => {
    const x = (index % width) * cellSize;
    const y = Math.floor(index / width) * cellSize;
    const isSelected = !highlightCode || cell.code === highlightCode;
    if (hideOtherColors && !isSelected) return;
    context.globalAlpha = isSelected ? 1 : 0.16;
    // 保留底色作为珠子间的缝隙，避免同色方格遮掉圆形轮廓。
    context.fillStyle = cell.hex;
    context.beginPath();
    context.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.39, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,.18)";
    context.beginPath();
    context.arc(x + cellSize * 0.39, y + cellSize * 0.35, cellSize * 0.12, 0, Math.PI * 2);
    context.fill();
    if (highlightCode && cell.code === highlightCode) {
      context.globalAlpha = 1;
      context.strokeStyle = "#1c1917";
      context.lineWidth = Math.max(1, cellSize * 0.08);
      context.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    }
  });
  context.globalAlpha = 1;
}

/** 缩略图使用实心方格，避免极小单元格中的圆形抗锯齿造成颜色发虚。 */
export function renderBeadThumbnail(canvas, cells, width, height, cellSize = 2) {
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建缩略图画布");
  cells.forEach((cell, index) => {
    context.fillStyle = cell.hex;
    context.fillRect((index % width) * cellSize, Math.floor(index / width) * cellSize, cellSize, cellSize);
  });
}
