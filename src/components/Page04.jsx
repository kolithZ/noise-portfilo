import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILTIN_BEAD_PALETTES,
  convertImageToBeads,
  parseCustomBeadPalette,
  renderBeadPreview,
} from "../utils/ImageToPinDou.js";

const initialSettings = {
  width: 48,
  height: 48,
  maxColors: 24,
  crop: "smart",
  dithering: false,
  showCellCodes: false,
  excludeTransparentFromMaterials: true,
  cleanup: 0.55,
};

const gridPresets = [
  { label: "1:1", width: 48, height: 48 },
  { label: "4:3", width: 64, height: 48 },
  { label: "3:4", width: 48, height: 64 },
  { label: "16:9", width: 64, height: 36 },
  { label: "9:16", width: 36, height: 64 },
];

const HISTORY_LIMIT = 4;
const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;
const PALETTE_STORAGE_KEY = "pindou.palette-config.v1";

function findImageFile(files) {
  return Array.from(files ?? []).find((file) => file.type.startsWith("image/"));
}

function loadStoredPaletteConfig() {
  const fallback = { paletteId: BUILTIN_BEAD_PALETTES[0].id, customPalette: null };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PALETTE_STORAGE_KEY) ?? "null");
    const customPalette = stored?.customPalette
      ? parseCustomBeadPalette(JSON.stringify(stored.customPalette))
      : null;
    const hasBuiltinPalette = BUILTIN_BEAD_PALETTES.some((palette) => palette.id === stored?.paletteId);
    return {
      customPalette,
      paletteId: stored?.paletteId === "custom" && customPalette
        ? "custom"
        : (hasBuiltinPalette ? stored.paletteId : fallback.paletteId),
    };
  } catch {
    return fallback;
  }
}

function csvValue(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createMaterialsCsvDataUrl(colors, transparentBeads, excludeTransparentFromMaterials) {
  const rows = ["code,name,count", ...colors.map((color) => [color.code, color.name, color.count].map(csvValue).join(","))];
  if (excludeTransparentFromMaterials && transparentBeads > 0) rows.push(`# excluded_transparent_background=${transparentBeads}`);
  return `data:text/csv;charset=utf-8,${encodeURIComponent(rows.join("\r\n"))}`;
}

function updateTransparentMaterialCounts(result, excludeTransparentFromMaterials) {
  if (result.excludeTransparentFromMaterials === excludeTransparentFromMaterials || result.transparentBeads === 0) {
    return { ...result, excludeTransparentFromMaterials };
  }

  const adjustment = excludeTransparentFromMaterials ? -result.transparentBeads : result.transparentBeads;
  let foundFallback = false;
  const colors = result.colors
    .map((color) => {
      if (color.code !== result.transparentFallback.code) return color;
      foundFallback = true;
      return { ...color, count: color.count + adjustment };
    })
    .filter((color) => color.count > 0);
  if (!foundFallback && adjustment > 0) colors.push({ ...result.transparentFallback, count: adjustment });
  colors.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
  const materialsBeads = colors.reduce((total, color) => total + color.count, 0);
  return {
    ...result,
    colors,
    materialsBeads,
    excludeTransparentFromMaterials,
    materialsCsvDataUrl: createMaterialsCsvDataUrl(colors, result.transparentBeads, excludeTransparentFromMaterials),
  };
}

export default function Page04() {
  const [storedPaletteConfig] = useState(loadStoredPaletteConfig);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [settings, setSettings] = useState(initialSettings);
  const [paletteId, setPaletteId] = useState(storedPaletteConfig.paletteId);
  const [customPalette, setCustomPalette] = useState(storedPaletteConfig.customPalette);
  const [customPaletteText, setCustomPaletteText] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [colorHighlightEnabled, setColorHighlightEnabled] = useState(false);
  const [hoveredColorCode, setHoveredColorCode] = useState(null);
  const [selectedColorCode, setSelectedColorCode] = useState(null);
  const [showOnlySelectedColor, setShowOnlySelectedColor] = useState(false);
  const sourcePreviewUrlRef = useRef("");
  const historyIdRef = useRef(0);
  const processingRequestIdRef = useRef(0);
  const previewCanvasRef = useRef(null);
  const paletteMaxColorsRef = useRef(new Map());
  // 约定：注册到 window 等长生命周期对象的回调不得捕获渲染时配置，必须从此 ref 读取最新值。
  const latestProcessingConfigRef = useRef(null);
  const selectedFileHandlerRef = useRef(null);

  const activePalette = useMemo(() => {
    if (paletteId === "custom" && customPalette) return customPalette;
    return BUILTIN_BEAD_PALETTES.find((palette) => palette.id === paletteId)?.swatches ?? BUILTIN_BEAD_PALETTES[0].swatches;
  }, [customPalette, paletteId]);
  const minimumColorCount = Math.min(8, activePalette.length);
  const activeColorCode = selectedColorCode ?? (colorHighlightEnabled ? hoveredColorCode : null);

  useEffect(() => {
    latestProcessingConfigRef.current = { settings, palette: activePalette, paletteId };
  }, [activePalette, paletteId, settings]);

  const updateSourcePreview = (file) => {
    if (sourcePreviewUrlRef.current) URL.revokeObjectURL(sourcePreviewUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    sourcePreviewUrlRef.current = nextUrl;
    setSourcePreviewUrl(nextUrl);
  };

  const processFile = async (
    file,
    processingSettings = settings,
    processingPalette = activePalette,
    processingPaletteId = paletteId,
    existingHistoryId = null,
  ) => {
    if (!file) return;
    const requestId = ++processingRequestIdRef.current;
    setError("");
    setIsProcessing(true);
    try {
      const conversion = await convertImageToBeads(file, {
        width: processingSettings.width,
        height: processingSettings.height,
        maxColors: processingSettings.maxColors,
        palette: processingPalette,
        crop: processingSettings.crop,
        dithering: processingSettings.dithering,
        showCellCodes: processingSettings.showCellCodes,
        excludeTransparentFromMaterials: processingSettings.excludeTransparentFromMaterials,
        cleanup: processingSettings.cleanup,
      });
      if (requestId !== processingRequestIdRef.current) return;
      setResult(conversion);
      setSourceFile(file);
      updateSourcePreview(file);
      if (existingHistoryId !== null) {
        setActiveHistoryId(existingHistoryId);
      } else {
        const entry = {
          id: ++historyIdRef.current,
          thumbnailDataUrl: conversion.thumbnailDataUrl,
          width: conversion.width,
          height: conversion.height,
          totalBeads: conversion.totalBeads,
          colors: conversion.colors,
          sourceFile: file,
          settings: { ...processingSettings },
          paletteId: processingPaletteId,
          palette: processingPalette,
        };
        setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
        setActiveHistoryId(entry.id);
      }
      setHoveredColorCode(null);
      setSelectedColorCode(null);
      setShowOnlySelectedColor(false);
    } catch (processingError) {
      if (requestId !== processingRequestIdRef.current) return;
      console.error(processingError);
      setError(processingError instanceof Error ? processingError.message : "图片处理失败，请更换图片后重试。");
    } finally {
      if (requestId === processingRequestIdRef.current) setIsProcessing(false);
    }
  };

  const handleSelectedFile = async (file, processingConfig = latestProcessingConfigRef.current) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择有效的图片文件（PNG、JPG、WebP 等）。");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setError("图片超过 20 MB，请压缩后再试。");
      return;
    }
    await processFile(
      file,
      processingConfig.settings,
      processingConfig.palette,
      processingConfig.paletteId,
    );
  };
  useEffect(() => {
    selectedFileHandlerRef.current = handleSelectedFile;
  }, [handleSelectedFile]);

  const handleUpload = (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    void handleSelectedFile(file);
  };

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateTransparentMaterialHandling = (excludeTransparentFromMaterials) => {
    updateSetting("excludeTransparentFromMaterials", excludeTransparentFromMaterials);
    if (!result) return;
    const updatedResult = updateTransparentMaterialCounts(result, excludeTransparentFromMaterials);
    setResult(updatedResult);
    setHistory((current) => current.map((entry) => (
      entry.id === activeHistoryId
        ? {
          ...entry,
          colors: updatedResult.colors,
          settings: { ...entry.settings, excludeTransparentFromMaterials },
        }
        : entry
    )));
  };

  const applyGridPreset = ({ width, height }) => {
    setSettings((current) => ({ ...current, width, height }));
  };

  const selectPalette = (nextPaletteId) => {
    setPaletteId(nextPaletteId);
    const nextPalette = nextPaletteId === "custom" ? customPalette : BUILTIN_BEAD_PALETTES.find((palette) => palette.id === nextPaletteId)?.swatches;
    if (nextPalette) {
      const rememberedMaxColors = paletteMaxColorsRef.current.get(nextPaletteId) ?? settings.maxColors;
      setSettings((current) => ({ ...current, maxColors: Math.min(rememberedMaxColors, nextPalette.length) }));
    }
  };

  const applyCustomPalette = () => {
    try {
      const palette = parseCustomBeadPalette(customPaletteText);
      const rememberedMaxColors = paletteMaxColorsRef.current.get("custom") ?? settings.maxColors;
      const nextMaxColors = Math.min(rememberedMaxColors, palette.length);
      setCustomPalette(palette);
      setPaletteId("custom");
      setSettings((current) => ({ ...current, maxColors: nextMaxColors }));
      setError("");
    } catch (paletteError) {
      setError(paletteError instanceof Error ? paletteError.message : "自定义色卡格式无效。");
    }
  };

  const selectHistoryEntry = (entry) => {
    setSettings(entry.settings);
    if (entry.paletteId === "custom") setCustomPalette(entry.palette);
    setPaletteId(entry.paletteId);
    setHoveredColorCode(null);
    setSelectedColorCode(null);
    setShowOnlySelectedColor(false);
    void processFile(entry.sourceFile, entry.settings, entry.palette, entry.paletteId, entry.id);
  };

  const undoToPreviousResult = () => {
    const activeIndex = history.findIndex((entry) => entry.id === activeHistoryId);
    const previousEntry = history[activeIndex + 1];
    if (previousEntry) selectHistoryEntry(previousEntry);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    void handleSelectedFile(event.dataTransfer.files[0]);
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const file = findImageFile(event.clipboardData.files)
        ?? Array.from(event.clipboardData.items ?? [])
          .find((item) => item.type.startsWith("image/"))
          ?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void selectedFileHandlerRef.current(file, latestProcessingConfigRef.current);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => () => {
    processingRequestIdRef.current += 1;
    if (sourcePreviewUrlRef.current) URL.revokeObjectURL(sourcePreviewUrlRef.current);
  }, []);

  useEffect(() => {
    setSettings((current) => {
      const maxColors = Math.min(current.maxColors, activePalette.length);
      return maxColors === current.maxColors ? current : { ...current, maxColors };
    });
  }, [activePalette.length]);

  useEffect(() => {
    // paletteMaxColorsRef 的唯一写入点：每个色卡记住其最后生效且已钳制的值。
    paletteMaxColorsRef.current.set(paletteId, settings.maxColors);
  }, [paletteId, settings.maxColors]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify({ paletteId, customPalette }));
    } catch (storageError) {
      console.warn("无法保存自定义色卡到本地存储", storageError);
    }
  }, [customPalette, paletteId]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !result) return;
    renderBeadPreview(
      canvas,
      result.cells,
      result.width,
      result.height,
      activeColorCode,
      18,
      showOnlySelectedColor,
    );
  }, [activeColorCode, result, showOnlySelectedColor]);

  const handlePreviewMove = (event) => {
    if (!colorHighlightEnabled || selectedColorCode || !result) return;
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) {
      setHoveredColorCode(null);
      return;
    }

    const column = Math.min(result.width - 1, Math.floor((x / bounds.width) * result.width));
    const row = Math.min(result.height - 1, Math.floor((y / bounds.height) * result.height));
    setHoveredColorCode(result.cells[row * result.width + column]?.code ?? null);
  };

  return (
    <main className="w-full max-w-5xl px-4 py-16 mx-auto text-center">
      <h1 className="text-4xl italic font-medium tracking-tight">PinDou</h1>
      <p className="mt-3 text-sm text-stone-600">把任意图片转换为可制作的拼豆图纸与材料表。</p>

      <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium tracking-wide text-stone-700">
            图纸宽度：{settings.width} 豆
            <input className="mt-2 w-full accent-stone-900" type="range" min="16" max="96" step="4" value={settings.width} aria-label={`图纸宽度：${settings.width} 豆`} aria-valuetext={`${settings.width} 豆`} onChange={(event) => updateSetting("width", Number(event.target.value))} />
          </label>
          <label className="text-xs font-medium tracking-wide text-stone-700">
            图纸高度：{settings.height} 豆
            <input className="mt-2 w-full accent-stone-900" type="range" min="16" max="96" step="4" value={settings.height} aria-label={`图纸高度：${settings.height} 豆`} aria-valuetext={`${settings.height} 豆`} onChange={(event) => updateSetting("height", Number(event.target.value))} />
          </label>
          <label className="text-xs font-medium tracking-wide text-stone-700">
            最多颜色：{settings.maxColors} / {activePalette.length} 种
            <input className="mt-2 w-full accent-stone-900" type="range" min={minimumColorCount} max={activePalette.length} step="1" value={settings.maxColors} aria-label={`最多颜色：${settings.maxColors} 种`} aria-valuetext={`${settings.maxColors} 种`} onChange={(event) => updateSetting("maxColors", Number(event.target.value))} />
          </label>
          <label className="text-xs font-medium tracking-wide text-stone-700">
            裁切方式
            <select className="mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" value={settings.crop} onChange={(event) => updateSetting("crop", event.target.value)}>
              <option value="smart">智能保留主体</option>
              <option value="center">居中裁切</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700">
            <input className="accent-stone-900" type="checkbox" checked={settings.dithering} onChange={(event) => updateSetting("dithering", event.target.checked)} />
            使用渐变抖动
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700">
            <input className="accent-stone-900" type="checkbox" checked={settings.showCellCodes} onChange={(event) => updateSetting("showCellCodes", event.target.checked)} />
            图纸显示色号
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700">
            <input className="accent-stone-900" type="checkbox" checked={settings.excludeTransparentFromMaterials} onChange={(event) => updateTransparentMaterialHandling(event.target.checked)} />
            透明背景不计入材料
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium tracking-wide text-stone-700">拼豆色卡</legend>
          <label className="mt-2 block text-xs text-stone-600">
            当前色卡
            <select className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800" value={paletteId} onChange={(event) => selectPalette(event.target.value)}>
              {BUILTIN_BEAD_PALETTES.map((palette) => (
                <option key={palette.id} value={palette.id}>{palette.name}（{palette.swatches.length} 色）</option>
              ))}
              {customPalette && <option value="custom">自定义色卡（{customPalette.length} 色）</option>}
            </select>
          </label>
          <label className="mt-3 block text-xs text-stone-600">
            粘贴自定义色卡（JSON 或 CSV）
            <textarea
              className="mt-1 block min-h-24 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-800"
              value={customPaletteText}
              placeholder={'JSON: [{"code":"M01","name":"白","hex":"#FFFFFF"}]\nCSV: code,name,hex'}
              onChange={(event) => setCustomPaletteText(event.target.value)}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button className="rounded-full border border-stone-900 px-4 py-2 text-xs font-medium transition-colors hover:bg-stone-100" type="button" onClick={applyCustomPalette}>
              应用自定义色卡
            </button>
            <p className="text-xs text-stone-500">可粘贴 MARD、乐高等品牌的官方 `code,name,hex` 清单；最多 256 色。</p>
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium tracking-wide text-stone-700">比例预设（仍可继续自定义宽高）</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {gridPresets.map((preset) => {
              const isActive = settings.width === preset.width && settings.height === preset.height;
              return (
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    isActive ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:bg-stone-100"
                  }`}
                  key={preset.label}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => applyGridPreset(preset)}
                >
                  {preset.label} · {preset.width} × {preset.height}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div
          className={`mt-5 rounded-xl border border-dashed p-3 transition-colors ${
            isDragActive ? "border-stone-900 bg-stone-100" : "border-stone-300"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!isProcessing) setIsDragActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsDragActive(false);
          }}
          onDrop={handleDrop}
        >
          <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-stone-900 px-5 py-2 text-xs font-medium tracking-wider text-white transition-colors hover:bg-stone-700">
            {isProcessing ? "处理中…" : "上传图片"}
            <input className="sr-only" type="file" accept="image/*" onChange={handleUpload} disabled={isProcessing} />
          </label>
          {sourceFile && (
            <button className="rounded-full border border-stone-900 px-5 py-2 text-xs font-medium tracking-wider transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => processFile(sourceFile)} disabled={isProcessing}>
              按当前设置重新生成
            </button>
          )}
            <span className="text-xs text-stone-500">也可拖入图片或按 Ctrl / Cmd + V 粘贴截图</span>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {history.length > 1 && (
        <section className="mx-auto mt-6 max-w-5xl rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">生成历史</h2>
              <p className="mt-1 text-xs text-stone-500">保留最近 {HISTORY_LIMIT} 次设置与缩略图；切换时会在后台重新生成完整图纸。</p>
            </div>
            <button
              className="rounded-full border border-stone-900 px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={history.findIndex((entry) => entry.id === activeHistoryId) >= history.length - 1}
              onClick={undoToPreviousResult}
            >
              撤销到上一版
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {history.map((entry, index) => (
              <button
                className={`overflow-hidden rounded-lg border text-left transition-colors ${
                  entry.id === activeHistoryId ? "border-stone-900 ring-1 ring-stone-900" : "border-stone-200 hover:border-stone-400"
                }`}
                type="button"
                key={entry.id}
                onClick={() => selectHistoryEntry(entry)}
              >
                <img className="h-24 w-full object-cover" src={entry.thumbnailDataUrl} alt={`第 ${index + 1} 次生成预览`} />
                <span className="block px-2 py-1.5 text-xs text-stone-600">{entry.width} × {entry.height} · {entry.colors.length} 色</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="mt-10 grid items-start gap-8 text-left lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">拼豆效果预览</h2>
                <p className="mt-1 text-xs text-stone-600">{result.width} × {result.height} 格 · 网格共 {result.totalBeads.toLocaleString()} 格</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-xs font-medium underline underline-offset-4" type="button" onClick={() => setShowOriginalComparison((current) => !current)}>
                  {showOriginalComparison ? "仅看效果" : "原图并排"}
                </button>
                <a className="text-xs font-medium underline underline-offset-4" href={result.previewDataUrl} download="pindou-preview.png">下载预览</a>
              </div>
            </div>
            <div className={`mt-5 gap-4 ${showOriginalComparison && sourcePreviewUrl ? "grid sm:grid-cols-2" : ""}`}>
              {showOriginalComparison && sourcePreviewUrl && (
                <figure>
                  <figcaption className="mb-2 text-xs font-medium text-stone-600">原图</figcaption>
                  <img className="max-h-[560px] w-full object-contain" src={sourcePreviewUrl} alt="上传的原始图片" />
                </figure>
              )}
              <figure>
                {showOriginalComparison && sourcePreviewUrl && <figcaption className="mb-2 text-xs font-medium text-stone-600">拼豆效果</figcaption>}
                <canvas
                  ref={previewCanvasRef}
                  className={`mx-auto block h-auto max-w-full ${colorHighlightEnabled && !selectedColorCode ? "cursor-crosshair" : ""}`}
                  width={result.width * 18}
                  height={result.height * 18}
                  style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "560px" }}
                  role="img"
                  aria-label="生成的拼豆效果预览"
                  onMouseMove={handlePreviewMove}
                  onMouseLeave={() => !selectedColorCode && setHoveredColorCode(null)}
                />
              </figure>
            </div>
          </div>

          <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">材料清单</h2>
              <span className="text-xs text-stone-500">{result.materialsBeads.toLocaleString()} 颗 · {result.colors.length} 色</span>
            </div>
            {result.transparentBeads > 0 && (
              <p className="mt-2 text-xs leading-5 text-stone-500">
                {result.excludeTransparentFromMaterials
                  ? `已从材料与 CSV 中排除 ${result.transparentBeads.toLocaleString()} 格完全透明背景。`
                  : `${result.transparentBeads.toLocaleString()} 格完全透明背景已按最亮色计入材料。`}
              </p>
            )}
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-700">
                <input
                  className="accent-stone-900"
                  type="checkbox"
                  checked={colorHighlightEnabled}
                  onChange={(event) => {
                    setColorHighlightEnabled(event.target.checked);
                    setHoveredColorCode(null);
                  }}
                />
                悬浮高亮颜色
              </label>
              <label className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${selectedColorCode ? "cursor-pointer bg-stone-100 text-stone-700" : "cursor-not-allowed bg-stone-50 text-stone-400"}`}>
                <input
                  className="accent-stone-900"
                  type="checkbox"
                  checked={showOnlySelectedColor}
                  disabled={!selectedColorCode}
                  onChange={(event) => setShowOnlySelectedColor(event.target.checked)}
                />
                仅显示选中色
              </label>
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-500">点击色号会筛选并隐藏其余珠子；再次点击即可取消筛选。</p>
            <ul className="mt-4 space-y-2">
              {result.colors.map((color) => (
                <li
                  key={color.code}
                >
                  <button
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                      activeColorCode === color.code ? "bg-stone-900 text-white" : "hover:bg-stone-100"
                    }`}
                    type="button"
                    aria-pressed={selectedColorCode === color.code}
                    onClick={() => {
                      const isDeselecting = selectedColorCode === color.code;
                      setSelectedColorCode((current) => current === color.code ? null : color.code);
                      setShowOnlySelectedColor(!isDeselecting);
                      setHoveredColorCode(null);
                    }}
                    onMouseEnter={() => colorHighlightEnabled && !selectedColorCode && setHoveredColorCode(color.code)}
                    onMouseLeave={() => colorHighlightEnabled && !selectedColorCode && setHoveredColorCode(null)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-4 w-4 shrink-0 rounded-full border border-stone-300" style={{ backgroundColor: color.hex }} />
                      <span className="min-w-0">
                        <span className="block">{color.code} · {color.name}</span>
                        <span className={`block text-xs ${activeColorCode === color.code ? "text-stone-300" : "text-stone-500"}`}>
                          rgb({color.rgb.join(", ")})
                        </span>
                      </span>
                    </span>
                    <strong className="font-medium">{color.count}</strong>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <a className="inline-flex rounded-full border border-stone-900 px-4 py-2 text-xs font-medium tracking-wider transition-colors hover:bg-stone-100" href={result.patternDataUrl} download="pindou-pattern.png">
                下载 PNG 图纸
              </a>
              <a className="inline-flex rounded-full border border-stone-900 px-4 py-2 text-xs font-medium tracking-wider transition-colors hover:bg-stone-100" href={result.patternSvgDataUrl} download="pindou-pattern.svg">
                下载 SVG 图纸
              </a>
              <a className="inline-flex rounded-full border border-stone-900 px-4 py-2 text-xs font-medium tracking-wider transition-colors hover:bg-stone-100" href={result.materialsCsvDataUrl} download="pindou-materials.csv">
                下载材料 CSV
              </a>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
