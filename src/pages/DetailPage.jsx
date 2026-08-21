import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import DetailLeftSection from "../components/DetailLeftSection.jsx";
import DetailRightSection from "../components/DetailRightSection.jsx";
import DetailCard from "../components/DetailCard.jsx";
import { getDetailPageData } from "../data/detailPageData.js";

// 每个页面的颜色配置（与 App.jsx 保持一致）
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
    color1: [24, 93, 87],
    color2: [176, 196, 222],
    backgroundColor: "#f5f7fa",
  },
];

export default function DetailPage() {
  const { pageId } = useParams();
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const scrollContainerRef = useRef(null);

  const pageData = getDetailPageData(pageId || "page01");

  // 根据 pageId 计算对应的 pageIndex 和颜色
  const pageIndex =
    {
      page01: 0,
      page02: 1,
      page03: 2,
    }[pageId] || 0;

  const currentColors = PAGE_COLORS[pageIndex];

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;

      if (scrollHeight > 0) {
        const percentage = Math.round((scrollTop / scrollHeight) * 100);
        setScrollPercentage(percentage);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className="w-full min-h-screen relative flex flex-col justify-between p-4 md:px-10 md:pt-16 md:pb-4 select-none overflow-hidden"
        style={{
          fontFamily: '"Inter", sans-serif',
          color: "#1c1917",
        }}
      >
        <Navbar />

        <main className="w-full flex-1 flex flex-col md:flex-row justify-between items-stretch my-6 relative min-h-[70vh]">
          <DetailLeftSection
            title={pageData.title}
            description={pageData.description}
            scrollPercentage={scrollPercentage}
            pageIndex={pageIndex}
          />

          <div
            ref={scrollContainerRef}
            className="w-full md:w-2/4 h-[65vh] md:h-[75vh] overflow-y-scroll py-4 space-y-12 my-auto z-10 px-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {pageData.cards.map((card, index) => (
              <DetailCard key={index} card={card} />
            ))}
          </div>

          <DetailRightSection
            projectNumber={pageData.projectNumber}
            totalProjects={pageData.totalProjects}
            role={pageData.role}
            agency={pageData.agency}
            year={pageData.year}
            awards={pageData.awards}
            portrait={pageData.portrait}
          />
        </main>
      </div>
    </>
  );
}
