export { renderBeadPreview } from "./beadPreviewRenderer.js";

/** 默认拼豆色卡。接入具体品牌时只需替换此数组，算法不变。 */
export const DEFAULT_BEAD_PALETTE = [
  ["PD01", "白色", "#F8F7F2"], ["PD02", "奶油", "#F4E2B7"],
  ["PD03", "米色", "#D8BE91"], ["PD04", "浅灰", "#C9CCC9"],
  ["PD05", "灰色", "#858B8A"], ["PD06", "深灰", "#4B5050"],
  ["PD07", "黑色", "#222526"], ["PD08", "肤浅", "#FFD2AE"],
  ["PD09", "肤色", "#ECA475"], ["PD10", "棕褐", "#B8734B"],
  ["PD11", "深棕", "#71452F"], ["PD12", "红色", "#BD3E45"],
  ["PD13", "珊瑚", "#E56B61"], ["PD14", "粉色", "#F29AAA"],
  ["PD15", "玫红", "#BC4F78"], ["PD16", "紫色", "#8A5C9C"],
  ["PD17", "深紫", "#55406E"], ["PD18", "浅蓝", "#8DC7DD"],
  ["PD19", "天蓝", "#4C9BC5"], ["PD20", "蓝色", "#3866A3"],
  ["PD21", "深蓝", "#2D426D"], ["PD22", "薄荷", "#9DCEBD"],
  ["PD23", "绿色", "#4E9B71"], ["PD24", "深绿", "#326149"],
  ["PD25", "柠黄", "#F6DF62"], ["PD26", "黄色", "#F2B941"],
  ["PD27", "橙色", "#E98639"], ["PD28", "赭橙", "#C95B35"],
  ["PD29", "象牙白", "#FFFDF0"], ["PD30", "暖白", "#FFF4DE"],
  ["PD31", "沙色", "#E7CAA0"], ["PD32", "卡其", "#B99A70"],
  ["PD33", "驼色", "#9A7048"], ["PD34", "咖啡", "#674331"],
  ["PD35", "巧克力", "#452C25"], ["PD36", "银灰", "#B0B5B5"],
  ["PD37", "炭灰", "#353A3B"], ["PD38", "墨黑", "#151719"],
  ["PD39", "蜜桃", "#FFD5C2"], ["PD40", "杏色", "#F7B982"],
  ["PD41", "焦糖", "#D88750"], ["PD42", "砖红", "#A9483F"],
  ["PD43", "酒红", "#7D303A"], ["PD44", "樱桃红", "#D93842"],
  ["PD45", "朱红", "#E8523C"], ["PD46", "番茄红", "#EF644A"],
  ["PD47", "鲑粉", "#F58D83"], ["PD48", "浅粉", "#F9C7D0"],
  ["PD49", "樱花粉", "#F4A9C0"], ["PD50", "玫瑰粉", "#D97198"],
  ["PD51", "莓果", "#A83362"], ["PD52", "梅子", "#713653"],
  ["PD53", "薰衣草", "#B7A0D5"], ["PD54", "丁香紫", "#9A79BE"],
  ["PD55", "葡萄紫", "#6E4A93"], ["PD56", "靛紫", "#473669"],
  ["PD57", "冰蓝", "#C8E7F1"], ["PD58", "雾蓝", "#A4C9DE"],
  ["PD59", "湖蓝", "#70B8D2"], ["PD60", "青蓝", "#2B8CB8"],
  ["PD61", "钴蓝", "#2856A6"], ["PD62", "海军蓝", "#23385F"],
  ["PD63", "午夜蓝", "#172344"], ["PD64", "青绿", "#4EBAA8"],
  ["PD65", "水绿", "#75D2B5"], ["PD66", "浅绿", "#B5E1A7"],
  ["PD67", "草绿", "#78BA62"], ["PD68", "叶绿", "#4F8A43"],
  ["PD69", "森林绿", "#28553C"], ["PD70", "松绿", "#1F4540"],
  ["PD71", "荧光黄", "#EAF45C"], ["PD72", "芥末黄", "#CFAE32"],
  ["PD73", "金黄", "#E5A426"], ["PD74", "琥珀", "#D87B25"],
  ["PD75", "南瓜橙", "#E96928"], ["PD76", "赤陶", "#B85A38"],
  ["PD77", "奶茶", "#D6B08A"], ["PD78", "豆沙", "#B97D76"],
  ["PD79", "藕紫", "#A77D93"], ["PD80", "灰紫", "#786E8F"],
  ["PD81", "灰蓝", "#748DAB"], ["PD82", "蓝灰", "#526B7C"],
  ["PD83", "浅青", "#B5E7DE"], ["PD84", "孔雀绿", "#218B7A"],
  ["PD85", "橄榄绿", "#849244"], ["PD86", "军绿", "#586A3B"],
  ["PD87", "荧光绿", "#A8D34F"], ["PD88", "荧光橙", "#FF9B42"],
  ["PD89", "荧光粉", "#FF72AA"], ["PD90", "荧光紫", "#C76BE4"],
  ["PD91", "荧光蓝", "#54C8E8"], ["PD92", "透明白", "#EAF1F2"],
  ["PD93", "透明黄", "#E7DD97"], ["PD94", "透明红", "#D97875"],
  ["PD95", "透明蓝", "#83B8D0"], ["PD96", "透明绿", "#82B99A"],
].map(([code, name, hex]) => ({ code, name, hex, rgb: hexToRgb(hex) }));

export const BUILTIN_BEAD_PALETTES = [
  { id: "standard-96", name: "通用 96 色", swatches: DEFAULT_BEAD_PALETTE },
  { id: "classic-28", name: "常用 28 色", swatches: DEFAULT_BEAD_PALETTE.slice(0, 28) },
  {
    id: "soft-32",
    name: "柔和 32 色",
    swatches: DEFAULT_BEAD_PALETTE.filter((_, index) => [0, 1, 2, 3, 7, 8, 12, 13, 15, 17, 18, 21, 22, 24, 25, 29, 30, 38, 39, 46, 47, 52, 53, 56, 57, 64, 65, 70, 76, 78, 82, 91].includes(index)),
  },
];

const MAX_CUSTOM_SWATCHES = 256;

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function normalizeHex(hex) {
  const value = String(hex ?? "").trim();
  if (/^#[\da-fA-F]{3}$/.test(value)) return `#${value.slice(1).split("").map((part) => part.repeat(2)).join("")}`.toUpperCase();
  if (/^#[\da-fA-F]{6}$/.test(value)) return value.toUpperCase();
  throw new Error("色值必须是 #RRGGBB 或 #RGB 格式");
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += character;
  }
  if (quoted) throw new Error("CSV 引号未闭合");
  values.push(value.trim());
  return values;
}

function normalizePaletteEntries(entries) {
  if (!Array.isArray(entries) || entries.length < 2) throw new Error("色卡至少需要两种颜色");
  if (entries.length > MAX_CUSTOM_SWATCHES) throw new Error(`自定义色卡最多支持 ${MAX_CUSTOM_SWATCHES} 种颜色`);
  const codes = new Set();
  return entries.map((entry, index) => {
    const [rawCode, rawName, rawHex] = Array.isArray(entry)
      ? entry
      : [entry?.code, entry?.name, entry?.hex];
    const code = String(rawCode ?? "").trim();
    if (!code) throw new Error(`第 ${index + 1} 行缺少色号`);
    if (codes.has(code)) throw new Error(`色号 ${code} 重复`);
    codes.add(code);
    const hex = normalizeHex(rawHex);
    return { code, name: String(rawName ?? code).trim() || code, hex, rgb: hexToRgb(hex) };
  });
}

function parseJsonPalette(parsed) {
  const entries = Array.isArray(parsed) ? parsed : parsed?.colors;
  if (!Array.isArray(entries)) throw new Error("JSON 色卡必须是颜色数组，或包含 colors 数组的对象");
  entries.forEach((entry, index) => {
    const [code, , hex] = Array.isArray(entry)
      ? entry
      : [entry?.code, entry?.name, entry?.hex];
    if (!String(code ?? "").trim()) throw new Error(`JSON 色卡第 ${index + 1} 项缺少 code`);
    if (!String(hex ?? "").trim()) throw new Error(`JSON 色卡第 ${index + 1} 项缺少 hex`);
  });
  return normalizePaletteEntries(entries);
}

/** 解析 JSON 数组或 code,name,hex 三列 CSV，供导入品牌官方色卡使用。 */
export function parseCustomBeadPalette(text) {
  const content = String(text ?? "").trim();
  if (!content) throw new Error("请粘贴 JSON 或 CSV 色卡内容");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (jsonError) {
    if (content.startsWith("[") || content.startsWith("{")) throw jsonError;
    const rows = content.split(/\r?\n/).filter((line) => line.trim()).map(parseCsvLine);
    const firstRow = rows[0].map((value) => value.toLowerCase());
    const entries = firstRow[0] === "code" && firstRow[1] === "name" && firstRow[2] === "hex" ? rows.slice(1) : rows;
    return normalizePaletteEntries(entries);
  }
  return parseJsonPalette(parsed);
}

let worker;
let requestId = 0;
let workerIdleTimer;
const pendingConversions = new Map();
const WORKER_IDLE_TIMEOUT_MS = 30_000;

function clearWorkerIdleTimer() {
  if (workerIdleTimer) clearTimeout(workerIdleTimer);
  workerIdleTimer = undefined;
}

function terminateWorker() {
  clearWorkerIdleTimer();
  if (!worker) return;
  worker.terminate();
  worker = undefined;
}

function scheduleWorkerTermination() {
  clearWorkerIdleTimer();
  if (!worker || pendingConversions.size > 0) return;
  const activeWorker = worker;
  workerIdleTimer = setTimeout(() => {
    if (worker === activeWorker && pendingConversions.size === 0) terminateWorker();
  }, WORKER_IDLE_TIMEOUT_MS);
}

function getWorker() {
  clearWorkerIdleTimer();
  if (worker) return worker;
  const createdWorker = new Worker(new URL("../workers/imageToBeads.worker.js", import.meta.url), { type: "module" });
  worker = createdWorker;
  createdWorker.onmessage = ({ data }) => {
    if (worker !== createdWorker) return;
    const pending = pendingConversions.get(data.requestId);
    if (!pending) return;
    pendingConversions.delete(data.requestId);
    if (data.type === "error") {
      pending.reject(new Error(data.message));
      scheduleWorkerTermination();
      return;
    }
    pending.resolve(data.result);
    scheduleWorkerTermination();
  };
  createdWorker.onerror = (event) => {
    if (worker !== createdWorker) return;
    const error = new Error(event.message || "图片处理 Worker 发生错误");
    pendingConversions.forEach(({ reject }) => reject(error));
    pendingConversions.clear();
    terminateWorker();
  };
  return worker;
}

function bufferToDataUrl(buffer, type) {
  return blobToDataUrl(new Blob([buffer], { type }));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("无法生成图片预览"));
    reader.readAsDataURL(blob);
  });
}

async function imageDataToDataUrl(imageData, type) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  try {
    const context = canvas.getContext("2d");
    // 仅基于 Worker 转移来的 ArrayBuffer 创建视图；ImageData 会直接采用该 typed array，不再复制像素。
    const pixels = new Uint8ClampedArray(imageData.data);
    context.putImageData(new ImageData(pixels, imageData.width, imageData.height), 0, 0);
    if (typeof canvas.toBlob === "function") {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (nextBlob) resolve(nextBlob);
          else reject(new Error("浏览器无法将预览像素编码为 PNG"));
        }, type);
      });
      return blobToDataUrl(blob);
    }
    return canvas.toDataURL(type);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function pngPayloadToDataUrl(payload) {
  return payload.buffer
    ? bufferToDataUrl(payload.buffer, "image/png")
    : imageDataToDataUrl(payload.imageData, "image/png");
}

function textToDataUrl(text, type) {
  return bufferToDataUrl(new TextEncoder().encode(text).buffer, type);
}

/** 将图片转为可实际制作的拼豆网格。 */
export async function convertImageToBeads(file, options = {}) {
  if (!(file instanceof Blob)) throw new Error("请选择图片文件");
  if (typeof Worker === "undefined") throw new Error("当前浏览器不支持后台图片处理");

  const sourceBuffer = await file.arrayBuffer();
  const id = ++requestId;
  const conversionWorker = getWorker();
  const result = await new Promise((resolve, reject) => {
    pendingConversions.set(id, { resolve, reject });
    try {
      conversionWorker.postMessage({
        type: "convert",
        requestId: id,
        sourceBuffer,
        mimeType: file.type || "image/*",
        options: { ...options, palette: options.palette ?? DEFAULT_BEAD_PALETTE },
      }, [sourceBuffer]);
    } catch (error) {
      pendingConversions.delete(id);
      scheduleWorkerTermination();
      reject(error);
    }
  });

  const [previewDataUrl, patternDataUrl, thumbnailDataUrl, patternSvgDataUrl, materialsCsvDataUrl] = await Promise.all([
    pngPayloadToDataUrl(result.previewPng),
    pngPayloadToDataUrl(result.patternPng),
    pngPayloadToDataUrl(result.thumbnailPng),
    textToDataUrl(result.patternSvg, "image/svg+xml"),
    textToDataUrl(result.materialsCsv, "text/csv"),
  ]);
  const { patternPng, previewPng, thumbnailPng, patternSvg, materialsCsv, ...conversion } = result;
  return { ...conversion, previewDataUrl, patternDataUrl, thumbnailDataUrl, patternSvgDataUrl, materialsCsvDataUrl };
}
