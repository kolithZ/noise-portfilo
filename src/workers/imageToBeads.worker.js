import * as iq from "image-q";
import SmartCrop from "smartcrop";
import { renderBeadPreview, renderBeadThumbnail } from "../utils/beadPreviewRenderer.js";

const COLOR_DISTANCE_FORMULA = "ciede2000";
// RGB 欧氏色差的理论上限为约 441；超过此值的格子边缘不参与孤点清理。
const EDGE_PROTECTION_COLOR_DISTANCE = 100;
// cleanup 强度在 0–1：1 时允许候选色的相对误差额外增加 65%，外加基础容差。
const CLEANUP_MAX_RELATIVE_ERROR_ALLOWANCE = 0.65;
const CLEANUP_BASE_ERROR_ALLOWANCE = 900;
const CLEANUP_MAX_COMPONENT_SIZE = 8;
const MAX_CANVAS_SIZE = 4096;
const MAX_CANVAS_PIXELS = 16 * 1024 * 1024;

function clampInteger(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Math.round(Number(value) || minimum)));
}

function rgbaKey(r, g, b, a = 255) {
  return `${r},${g},${b},${a}`;
}

function brightness([r, g, b]) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function colorDistanceSquared(rgbA, rgbB) {
  return rgbA.reduce((sum, value, index) => sum + (value - rgbB[index]) ** 2, 0);
}

function centerCrop(image, targetRatio) {
  const ratio = image.width / image.height;
  if (ratio > targetRatio) {
    const width = image.height * targetRatio;
    return { x: (image.width - width) / 2, y: 0, width, height: image.height };
  }
  const height = image.width / targetRatio;
  return { x: 0, y: (image.height - height) / 2, width: image.width, height };
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("当前浏览器不支持 OffscreenCanvas，无法在后台处理图片。请升级浏览器后重试。");
  }
  const canvasWidth = Math.max(1, Math.round(width));
  const canvasHeight = Math.max(1, Math.round(height));
  if (
    canvasWidth > MAX_CANVAS_SIZE
    || canvasHeight > MAX_CANVAS_SIZE
    || canvasWidth * canvasHeight > MAX_CANVAS_PIXELS
  ) {
    throw new Error(`图片或导出图纸过大：单边不能超过 ${MAX_CANVAS_SIZE}px，且总像素不能超过 ${MAX_CANVAS_PIXELS.toLocaleString()}。请减小图纸尺寸或原图。`);
  }
  return new OffscreenCanvas(canvasWidth, canvasHeight);
}

function releaseCanvas(canvas) {
  // 重置尺寸会释放 OffscreenCanvas 的像素 backing store，而不必等待 Worker 的 GC。
  canvas.width = 0;
  canvas.height = 0;
}

async function canvasToPngPayload(canvas) {
  try {
    if (typeof canvas.convertToBlob === "function") {
      try {
        const blob = await canvas.convertToBlob({ type: "image/png" });
        return { buffer: await blob.arrayBuffer() };
      } catch {
        // 部分实现虽暴露此方法但无法编码；继续使用像素回退路径。
      }
    }

    // Safari / 部分 Firefox 尚未支持 convertToBlob：将原始像素交给主线程的 canvas 编码。
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return {
      imageData: {
        width: imageData.width,
        height: imageData.height,
        data: imageData.data.buffer,
      },
    };
  } finally {
    releaseCanvas(canvas);
  }
}

async function getCrop(image, width, height, cropMode) {
  if (cropMode !== "smart") return centerCrop(image, width / height);
  try {
    const { topCrop } = await SmartCrop.crop(image, {
      width,
      height,
      minScale: 1,
      ruleOfThirds: true,
      canvasFactory: createCanvas,
    });
    return topCrop;
  } catch {
    return centerCrop(image, width / height);
  }
}

function createGridImageData(image, crop, width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  // 此处刻意不填白底：保留原始 alpha，统一由 flattenTransparency 决定透明像素的合成与回退色。
  const imageData = context.getImageData(0, 0, width, height);
  releaseCanvas(canvas);
  return imageData;
}

function flattenTransparency(imageData) {
  const flattenedPixels = new Uint8ClampedArray(imageData.data);
  const transparentMask = new Uint8Array(imageData.width * imageData.height);
  for (let offset = 0, index = 0; offset < flattenedPixels.length; offset += 4, index += 1) {
    const alpha = flattenedPixels[offset + 3];
    if (alpha === 0) transparentMask[index] = 1;
    if (alpha < 255) {
      const opacity = alpha / 255;
      // 半透明像素与白底合成，完全透明像素则由 transparentMask 单独指定为浅色。
      flattenedPixels[offset] = Math.round(flattenedPixels[offset] * opacity + 255 * (1 - opacity));
      flattenedPixels[offset + 1] = Math.round(flattenedPixels[offset + 1] * opacity + 255 * (1 - opacity));
      flattenedPixels[offset + 2] = Math.round(flattenedPixels[offset + 2] * opacity + 255 * (1 - opacity));
    }
    flattenedPixels[offset + 3] = 255;
  }
  return {
    imageData: new ImageData(flattenedPixels, imageData.width, imageData.height),
    transparentMask,
  };
}

function makePalette(swatchList) {
  const palette = new iq.utils.Palette();
  swatchList.forEach((swatch) => palette.add(iq.utils.Point.createByRGBA(...swatch.rgb, 255)));
  return palette;
}

function lightestSwatch(swatchList) {
  return swatchList.reduce(
    (lightest, swatch) => (brightness(swatch.rgb) > brightness(lightest.rgb) ? swatch : lightest),
    swatchList[0],
  );
}

function darkestSwatch(swatchList) {
  return swatchList.reduce(
    (darkest, swatch) => (brightness(swatch.rgb) < brightness(darkest.rgb) ? swatch : darkest),
    swatchList[0],
  );
}

function swatchesFromQuantized(pointContainer, allSwatches, maximumColors) {
  if (maximumColors >= allSwatches.length) return allSwatches;
  const byRgba = new Map(allSwatches.map((swatch) => [rgbaKey(...swatch.rgb), swatch]));
  const counts = new Map();
  pointContainer.getPointArray().forEach((point) => {
    const swatch = byRgba.get(rgbaKey(point.r, point.g, point.b, point.a));
    if (swatch) counts.set(swatch.code, (counts.get(swatch.code) || 0) + 1);
  });
  const selected = [...allSwatches]
    .sort((a, b) => (counts.get(b.code) || 0) - (counts.get(a.code) || 0))
    .slice(0, maximumColors);
  const lightest = lightestSwatch(allSwatches);
  const darkest = darkestSwatch(allSwatches);
  const essentials = [lightest, darkest].filter(
    (swatch, index, array) => array.findIndex((item) => item.code === swatch.code) === index,
  );
  const essentialCodes = new Set(essentials.map((swatch) => swatch.code));
  essentials.forEach((essential) => {
    if (selected.some((swatch) => swatch.code === essential.code)) return;
    for (let index = selected.length - 1; index >= 0; index -= 1) {
      if (!essentialCodes.has(selected[index].code)) {
        selected[index] = essential;
        break;
      }
    }
  });
  return [...new Map(selected.map((swatch) => [swatch.code, swatch])).values()];
}

/**
 * 将全色板首轮量化的点映射到裁剪后的子色板。
 *
 * 关闭抖动时，首轮输出至多只有色卡数量种颜色；按 RGBA 缓存后只需进行
 * 色卡数 × 选中颜色数次 CIEDE2000 计算，不必再次遍历整张网格量化。
 */
function createSwatchResolver(selectedSwatches) {
  const byRgba = new Map(selectedSwatches.map((swatch) => [rgbaKey(...swatch.rgb), swatch]));
  const byRgb = new Map(selectedSwatches.map((swatch) => [swatch.rgb.join(","), swatch]));
  const remapped = new Map();
  const distance = new iq.distance.CIEDE2000();
  const transparentFallback = lightestSwatch(selectedSwatches);

  return (point) => {
    const rgb = [point.r, point.g, point.b];
    // image-q 的 nearest / Floyd–Steinberg 均以调色板点作为输出；精确命中不涉及距离公式。
    // 若未来量化器输出非色卡点，则统一用 CIEDE2000 回退到选中的色卡。
    const exact = byRgba.get(rgbaKey(...rgb, point.a)) ?? byRgb.get(rgb.join(","));
    if (exact) return exact;
    if (point.a === 0) return transparentFallback;

    const key = rgbaKey(...rgb, point.a);
    const cached = remapped.get(key);
    if (cached) return cached;
    const closest = selectedSwatches.reduce(
      (best, swatch) => (
        distance.calculateRaw(point.r, point.g, point.b, point.a, ...swatch.rgb, 255)
          < distance.calculateRaw(point.r, point.g, point.b, point.a, ...best.rgb, 255)
          ? swatch
          : best
      ),
      selectedSwatches[0],
    );
    remapped.set(key, closest);
    return closest;
  };
}

function rgbDistanceAt(data, offsetA, offsetB) {
  const red = data[offsetA] - data[offsetB];
  const green = data[offsetA + 1] - data[offsetB + 1];
  const blue = data[offsetA + 2] - data[offsetB + 2];
  return Math.sqrt(red ** 2 + green ** 2 + blue ** 2);
}

function edgeStrength(data, width, height, x, y) {
  const centerOffset = (y * width + x) * 4;
  let strongestDifference = 0;
  const compare = (column, row) => {
    const neighborOffset = (row * width + column) * 4;
    strongestDifference = Math.max(strongestDifference, rgbDistanceAt(data, centerOffset, neighborOffset));
  };
  if (x > 0) compare(x - 1, y);
  if (x < width - 1) compare(x + 1, y);
  if (y > 0) compare(x, y - 1);
  if (y < height - 1) compare(x, y + 1);
  return strongestDifference;
}

function cleanupCells(cells, original, width, height, strength, immutableMask = null) {
  const cleanupStrength = Math.min(1, Math.max(0, Number(strength) || 0));
  if (cleanupStrength === 0) return cells;
  const updated = cells.map((cell) => ({ ...cell }));
  const indexAt = (x, y) => y * width + x;
  const visited = new Uint8Array(cells.length);
  // 完全透明像素会显示为浅色，但不属于降噪算法可调整的图像内容。
  if (immutableMask) immutableMask.forEach((isImmutable, index) => { if (isImmutable) visited[index] = 1; });
  const maximumComponentSize = Math.max(1, Math.round(cleanupStrength * CLEANUP_MAX_COMPONENT_SIZE));

  const visitNeighbor = (queue, componentCode, neighborIndex) => {
    if (visited[neighborIndex] || immutableMask?.[neighborIndex] || cells[neighborIndex].code !== componentCode) return;
    visited[neighborIndex] = 1;
    queue.push(neighborIndex);
  };

  for (let startIndex = 0; startIndex < cells.length; startIndex += 1) {
    if (visited[startIndex]) continue;
    const componentCode = cells[startIndex].code;
    const component = [];
    const queue = [startIndex];
    visited[startIndex] = 1;

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      component.push(index);
      if (x > 0) visitNeighbor(queue, componentCode, indexAt(x - 1, y));
      if (x < width - 1) visitNeighbor(queue, componentCode, indexAt(x + 1, y));
      if (y > 0) visitNeighbor(queue, componentCode, indexAt(x, y - 1));
      if (y < height - 1) visitNeighbor(queue, componentCode, indexAt(x, y + 1));
    }

    // cleanup 定义为消除小孤岛，而非全局分割；主体色块不会因清理被吞并。
    if (component.length > maximumComponentSize) continue;

    const boundaryVotes = new Map();
    let preservesEdge = false;
    const voteFor = (neighborIndex) => {
      if (immutableMask?.[neighborIndex]) return;
      const neighbor = cells[neighborIndex];
      if (neighbor.code === componentCode) return;
      const vote = boundaryVotes.get(neighbor.code);
      if (vote) vote.count += 1;
      else boundaryVotes.set(neighbor.code, { cell: neighbor, count: 1 });
    };

    component.forEach((index) => {
      const x = index % width;
      const y = Math.floor(index / width);
      preservesEdge ||= edgeStrength(original.data, width, height, x, y) > EDGE_PROTECTION_COLOR_DISTANCE;
      if (x > 0) voteFor(indexAt(x - 1, y));
      if (x < width - 1) voteFor(indexAt(x + 1, y));
      if (y > 0) voteFor(indexAt(x, y - 1));
      if (y < height - 1) voteFor(indexAt(x, y + 1));
    });
    if (preservesEdge || boundaryVotes.size === 0) continue;

    let strongestBoundary;
    let highestVotes = 0;
    boundaryVotes.forEach(({ cell, count }) => {
      if (count > highestVotes) {
        strongestBoundary = cell;
        highestVotes = count;
      }
    });

    const canMergeComponent = component.every((index) => {
      const offset = index * 4;
      const sourceRgb = [original.data[offset], original.data[offset + 1], original.data[offset + 2]];
      const currentError = colorDistanceSquared(sourceRgb, cells[index].rgb);
      const replacementError = colorDistanceSquared(sourceRgb, strongestBoundary.rgb);
      const maximumReplacementError = currentError * (1 + cleanupStrength * CLEANUP_MAX_RELATIVE_ERROR_ALLOWANCE)
        + CLEANUP_BASE_ERROR_ALLOWANCE;
      return replacementError <= maximumReplacementError;
    });
    if (canMergeComponent) component.forEach((index) => { updated[index] = { ...strongestBoundary }; });
  }
  return updated;
}

function createBeadPreviewCanvas(cells, width, height, cellSize = 18) {
  const canvas = createCanvas(width * cellSize, height * cellSize);
  renderBeadPreview(canvas, cells, width, height, null, cellSize);
  return canvas;
}

function createBeadThumbnailCanvas(cells, width, height, cellSize) {
  const canvas = createCanvas(width * cellSize, height * cellSize);
  renderBeadThumbnail(canvas, cells, width, height, cellSize);
  return canvas;
}

function patternLayout(width, height, showCellCodes) {
  const cellSize = showCellCodes ? 26 : 22;
  const labelSize = 24;
  return {
    cellSize,
    labelSize,
    gridX: labelSize,
    gridY: labelSize,
    canvasWidth: width * cellSize + labelSize,
    canvasHeight: height * cellSize + labelSize,
  };
}

function codeTextColor(rgb) {
  return brightness(rgb) > 145 ? "#1c1917" : "#ffffff";
}

function renderPattern(cells, width, height, showCellCodes = false) {
  const layout = patternLayout(width, height, showCellCodes);
  const canvas = createCanvas(layout.canvasWidth, layout.canvasHeight);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  cells.forEach((cell, index) => {
    const x = layout.gridX + (index % width) * layout.cellSize;
    const y = layout.gridY + Math.floor(index / width) * layout.cellSize;
    context.fillStyle = cell.hex;
    context.fillRect(x, y, layout.cellSize, layout.cellSize);
    if (showCellCodes) {
      context.fillStyle = codeTextColor(cell.rgb);
      context.font = "600 7px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(cell.code, x + layout.cellSize / 2, y + layout.cellSize / 2);
    }
  });
  context.strokeStyle = "rgba(28,25,23,.22)";
  context.lineWidth = 1;
  const gridRight = canvas.width - 0.5;
  const gridBottom = canvas.height - 0.5;
  for (let x = 0; x <= width; x += 1) {
    const position = x === width ? gridRight : layout.gridX + x * layout.cellSize;
    context.beginPath(); context.moveTo(position, layout.gridY); context.lineTo(position, gridBottom); context.stroke();
  }
  for (let y = 0; y <= height; y += 1) {
    const position = y === height ? gridBottom : layout.gridY + y * layout.cellSize;
    context.beginPath(); context.moveTo(layout.gridX, position); context.lineTo(gridRight, position); context.stroke();
  }
  context.fillStyle = "#57534e";
  context.font = "10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let x = 0; x < width; x += 1) context.fillText(String(x + 1), layout.gridX + (x + 0.5) * layout.cellSize, layout.labelSize / 2);
  context.textAlign = "right";
  for (let y = 0; y < height; y += 1) context.fillText(String(y + 1), layout.labelSize - 4, layout.gridY + (y + 0.5) * layout.cellSize);
  return canvas;
}

function escapeXml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;",
  })[character]);
}

function renderPatternSvg(cells, width, height, showCellCodes = false) {
  const layout = patternLayout(width, height, showCellCodes);
  const cellsMarkup = cells.map((cell, index) => {
    const x = layout.gridX + (index % width) * layout.cellSize;
    const y = layout.gridY + Math.floor(index / width) * layout.cellSize;
    const code = showCellCodes
      ? `<text x="${x + layout.cellSize / 2}" y="${y + layout.cellSize / 2}" fill="${codeTextColor(cell.rgb)}" font-size="7" font-weight="600" text-anchor="middle" dominant-baseline="middle">${escapeXml(cell.code)}</text>`
      : "";
    return `<rect x="${x}" y="${y}" width="${layout.cellSize}" height="${layout.cellSize}" fill="${cell.hex}"/>${code}`;
  }).join("");
  const verticalLines = Array.from({ length: width + 1 }, (_, index) => {
    const x = index === width ? layout.canvasWidth - 0.5 : layout.gridX + index * layout.cellSize;
    return `<path d="M${x} ${layout.gridY}V${layout.canvasHeight - 0.5}"/>`;
  }).join("");
  const horizontalLines = Array.from({ length: height + 1 }, (_, index) => {
    const y = index === height ? layout.canvasHeight - 0.5 : layout.gridY + index * layout.cellSize;
    return `<path d="M${layout.gridX} ${y}H${layout.canvasWidth - 0.5}"/>`;
  }).join("");
  const columnLabels = Array.from({ length: width }, (_, index) => (
    `<text x="${layout.gridX + (index + 0.5) * layout.cellSize}" y="${layout.labelSize / 2}" text-anchor="middle" dominant-baseline="middle">${index + 1}</text>`
  )).join("");
  const rowLabels = Array.from({ length: height }, (_, index) => (
    `<text x="${layout.labelSize - 4}" y="${layout.gridY + (index + 0.5) * layout.cellSize}" text-anchor="end" dominant-baseline="middle">${index + 1}</text>`
  )).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.canvasWidth}" height="${layout.canvasHeight}" viewBox="0 0 ${layout.canvasWidth} ${layout.canvasHeight}"><rect width="100%" height="100%" fill="#ffffff"/>${cellsMarkup}<g fill="none" stroke="#1c1917" stroke-opacity=".22">${verticalLines}${horizontalLines}</g><g fill="#57534e" font-family="sans-serif" font-size="10">${columnLabels}${rowLabels}</g></svg>`;
}

function csvValue(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function renderMaterialsCsv(colors, transparentBeads = 0, excludeTransparentFromMaterials = false) {
  const rows = ["code,name,count", ...colors.map((color) => [color.code, color.name, color.count].map(csvValue).join(","))];
  if (excludeTransparentFromMaterials && transparentBeads > 0) {
    rows.push(`# excluded_transparent_background=${transparentBeads}`);
  }
  return rows.join("\r\n");
}

async function convert(sourceBuffer, mimeType, options) {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("当前浏览器不支持 OffscreenCanvas，无法在后台处理图片。请升级浏览器后重试。");
  }
  if (typeof createImageBitmap === "undefined") {
    throw new Error("当前浏览器不支持 createImageBitmap，无法解码并在后台处理图片。请升级浏览器后重试。");
  }
  const width = clampInteger(options.width ?? 48, 16, 96);
  const height = clampInteger(options.height ?? 48, 16, 96);
  const allSwatches = options.palette;
  if (!allSwatches?.length) throw new Error("拼豆色卡至少需要包含一种颜色");
  const maximumColors = clampInteger(options.maxColors ?? 24, 2, allSwatches.length);
  let image;
  try {
    image = await createImageBitmap(new Blob([sourceBuffer], { type: mimeType }));
  } catch {
    throw new Error("无法解码图片文件：请确认文件未损坏且为浏览器支持的图片格式。");
  }
  try {
    const crop = await getCrop(image, width, height, options.crop ?? "smart");
    const rawImageData = createGridImageData(image, crop, width, height);
    const { imageData: original, transparentMask } = flattenTransparency(rawImageData);
    const container = iq.utils.PointContainer.fromImageData(original);
    const initiallyQuantized = iq.applyPaletteSync(container, makePalette(allSwatches), {
      colorDistanceFormula: COLOR_DISTANCE_FORMULA, imageQuantization: "nearest",
    });
    const selectedSwatches = swatchesFromQuantized(initiallyQuantized, allSwatches, maximumColors);
    const quantized = options.dithering
      ? iq.applyPaletteSync(container, makePalette(selectedSwatches), {
        colorDistanceFormula: COLOR_DISTANCE_FORMULA,
        imageQuantization: "floyd-steinberg",
      })
      : initiallyQuantized;
    const resolveSwatch = createSwatchResolver(selectedSwatches);
    const transparentFallback = lightestSwatch(selectedSwatches);
    const cells = quantized.getPointArray().map((point, index) => {
      const swatch = transparentMask[index] ? transparentFallback : resolveSwatch(point);
      return { ...swatch, rgb: [...swatch.rgb] };
    });
    const cleanedCells = cleanupCells(cells, original, width, height, Number(options.cleanup ?? 0.55), transparentMask);
    const excludeTransparentFromMaterials = options.excludeTransparentFromMaterials ?? true;
    const transparentBeads = transparentMask.reduce((total, isTransparent) => total + isTransparent, 0);
    const counts = cleanedCells.reduce((result, cell) => {
      result[cell.code] = (result[cell.code] || 0) + 1;
      return result;
    }, {});
    const colors = selectedSwatches
      .map((swatch, paletteIndex) => ({ ...swatch, count: counts[swatch.code], paletteIndex }))
      .filter((swatch) => swatch.count)
      .sort((a, b) => b.count - a.count || a.paletteIndex - b.paletteIndex)
      .map(({ paletteIndex, ...swatch }) => swatch);
    const materialColors = excludeTransparentFromMaterials
      ? colors
        .map((color) => color.code === transparentFallback.code
          ? { ...color, count: color.count - transparentBeads }
          : color)
        .filter((color) => color.count > 0)
      : colors;
    const materialsBeads = materialColors.reduce((total, color) => total + color.count, 0);
    // 顺序编码，确保上一张 canvas 的 backing store 释放后再分配下一张。
    const previewPng = await canvasToPngPayload(createBeadPreviewCanvas(cleanedCells, width, height));
    const patternPng = await canvasToPngPayload(renderPattern(cleanedCells, width, height, options.showCellCodes));
    const thumbnailCellSize = Math.max(2, Math.floor(144 / Math.max(width, height)));
    const thumbnailPng = await canvasToPngPayload(createBeadThumbnailCanvas(cleanedCells, width, height, thumbnailCellSize));
    const patternSvg = renderPatternSvg(cleanedCells, width, height, options.showCellCodes);
    const materialsCsv = renderMaterialsCsv(materialColors, transparentBeads, excludeTransparentFromMaterials);
    return {
      width, height, cells: cleanedCells, colors: materialColors, totalBeads: cleanedCells.length,
      materialsBeads, transparentBeads, excludeTransparentFromMaterials,
      transparentFallback: { ...transparentFallback, rgb: [...transparentFallback.rgb] },
      previewPng, patternPng, thumbnailPng, patternSvg, materialsCsv,
    };
  } finally {
    image.close();
  }
}

self.onmessage = async ({ data }) => {
  if (data.type !== "convert") return;
  try {
    const result = await convert(data.sourceBuffer, data.mimeType, data.options);
    const transferables = [
      result.previewPng.buffer ?? result.previewPng.imageData.data,
      result.patternPng.buffer ?? result.patternPng.imageData.data,
      result.thumbnailPng.buffer ?? result.thumbnailPng.imageData.data,
    ];
    self.postMessage({ type: "success", requestId: data.requestId, result }, transferables);
  } catch (error) {
    self.postMessage({ type: "error", requestId: data.requestId, message: error instanceof Error ? error.message : "图片处理失败" });
  }
};
