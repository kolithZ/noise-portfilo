import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Page01 from "./components/Page01.jsx";
import Page02 from "./components/Page02.jsx";
import Page03 from "./components/Page03.jsx";
import { ImageTrail } from "./components/ImageTrail.jsx";

const Page04 = lazy(() => import("./components/Page04.jsx"));

const PAGES = [Page01, Page02, Page03, Page04];
const PAGE_IMAGES = [
  "./illustration/01.png",
  "./portfolio/01.png",
  "./photograph/01.png",
  "./portfolio/04.png",
];

// 鼠标移动图片跟随效果开关：false 时仅不渲染，相关代码与图片资源全部保留。
const SHOW_IMAGE_TRAIL = false;

// Trail 图片元素
const TRAIL_IMAGES = [
  "./illustration/01.png",
  "./portfolio/01.png",
  "./photograph/01.png",
  "./illustration/02.png",
  "./portfolio/03.png",
  "./photograph/02.png",
];

// 每个页面的颜色配置
const PAGE_COLORS = [
  {
    color1: [245, 196, 128],
    color2: [208, 114, 137],
    backgroundColor: "#f0cad7",
  },
  {
    color1: [255, 182, 193],
    color2: [255, 218, 185],
    backgroundColor: "#fff5f5",
  },
  {
    color1: [24, 93, 87], // 迷雾蓝
    color2: [176, 196, 222], // 钢青
    backgroundColor: "#f5f7fa", // 浅岩灰
  },
  {
    color1: [246, 223, 98],
    color2: [79, 129, 167],
    backgroundColor: "#fafaf9",
  },
];

const TRANSITION_DURATION = 0.8; // 秒
const SCROLL_THRESHOLD = 100; // 滚轮触发阈值（提高灵敏度）
const SCROLL_COOLDOWN = 500; // 滚轮冷却时间（毫秒）

const pageVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

export default function App() {
  const [searchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "0", 10);
  const [page, setPage] = useState(
    Math.min(Math.max(initialPage, 0), PAGES.length - 1),
  );
  const [direction, setDirection] = useState(0); // 1: next, -1: prev
  const total = PAGES.length;
  const isTransitioning = useRef(false);
  const lastScrollTime = useRef(0);
  const accumulatedDelta = useRef(0);

  const goNext = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setDirection(1);
    setPage((p) => (p + 1) % total);
    setTimeout(() => {
      isTransitioning.current = false;
    }, TRANSITION_DURATION * 1000);
  };

  const goPrev = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setDirection(-1);
    setPage((p) => (p - 1 + total) % total);
    setTimeout(() => {
      isTransitioning.current = false;
    }, TRANSITION_DURATION * 1000);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      // PinDou 页面包含可滚动的图纸和材料清单，保留原生纵向滚动。
      if (page === PAGES.length - 1) return;
      const now = Date.now();

      // 如果正在过渡或冷却时间内，忽略滚动
      if (
        isTransitioning.current ||
        now - lastScrollTime.current < SCROLL_COOLDOWN
      ) {
        return;
      }

      // 累积滚动量
      accumulatedDelta.current += e.deltaY;

      // 检查是否达到阈值
      if (accumulatedDelta.current > SCROLL_THRESHOLD) {
        accumulatedDelta.current = 0;
        lastScrollTime.current = now;
        goNext();
      } else if (accumulatedDelta.current < -SCROLL_THRESHOLD) {
        accumulatedDelta.current = 0;
        lastScrollTime.current = now;
        goPrev();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [page]);

  const CurrentPage = PAGES[page];
  const currentColors = PAGE_COLORS[page];

  return (
    <>
      <div
        className={`relative z-10 w-full min-h-screen overflow-x-hidden ${
          page === PAGES.length - 1 ? "overflow-y-auto" : "overflow-y-hidden"
        } select-none font-sans`}
        style={{ fontFamily: '"Inter", sans-serif', color: "#1c1917" }}
      >
        {SHOW_IMAGE_TRAIL && (
          <ImageTrail
            rotationRange={20}
            interval={80}
            animationSequence={[
              [{ scale: 1.3 }, { duration: 0.15, ease: "circOut" }],
              [
                { scale: 0, opacity: 0 },
                { duration: 0.6, ease: "circIn" },
              ],
            ]}
          >
            {TRAIL_IMAGES.map((img, index) => (
              <div
                key={index}
                className="w-32 h-32 overflow-hidden shadow-lg"
                style={{
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <img
                  src={img}
                  alt={`Trail ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </ImageTrail>
        )}

        <Navbar />

        <main className="w-full min-h-screen flex flex-col items-center justify-center pb-24">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: TRANSITION_DURATION,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full flex flex-col items-center justify-center"
            >
              <Suspense fallback={<p className="text-sm text-stone-600">加载拼豆工具…</p>}>
                <CurrentPage />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer
          current={page + 1}
          total={total}
          onPrev={goPrev}
          onNext={goNext}
          image={PAGE_IMAGES[page]}
        />
      </div>
    </>
  );
}
