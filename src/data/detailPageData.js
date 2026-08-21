// DetailPage 数据配置
export const DETAIL_PAGE_DATA = {
  page01: {
    title: ["illustration", "design"],
    description: "专注于视觉叙事和品牌标识设计。",
    projectNumber: "01",
    totalProjects: "03",
    role: "视觉设计师",
    agency: "个人工作室",
    year: "2026",
    awards: "-",
    portrait: {
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    },
    cards: [
      {
        image: "/illustration/01.png",
      },
      {
        image: "/illustration/02.png",
      },
      {
        image: "/illustration/03.png",
      },
      {
        image: "/illustration/04.png",
      },
    ],
  },
  page02: {
    title: ["portfolio", "2026"],
    description: "个人作品集",
    projectNumber: "02",
    totalProjects: "03",
    role: "全栈开发/UI 设计师",
    agency: "个人工作室",
    year: "2026",
    awards: "FWA OF THE DAY",
    cards: [
      {
        image: "/portfolio/01.png",
      },
      {
        image: "/portfolio/02.png",
      },
      {
        image: "/portfolio/03.png",
      },
      {
        image: "/portfolio/04.png",
      },
      {
        image: "/portfolio/05.png",
      },
      {
        image: "/portfolio/06.png",
      },
    ],
  },
  page03: {
    title: ["photography", "gallery"],
    description: "摄影爱好者",
    projectNumber: "03",
    totalProjects: "03",
    role: "摄影师",
    agency: "个人工作室",
    year: "2025",
    awards: "-",
    cards: [
      {
        image: "/photograph/01.png",
      },
      {
        image: "/photograph/02.png",
      },
      {
        image: "/photograph/03.png",
      },
      {
        image: "/photograph/04.png",
      },
    ],
  },
};

export const getDetailPageData = (pageId) => {
  return DETAIL_PAGE_DATA[pageId] || DETAIL_PAGE_DATA.page01;
};
