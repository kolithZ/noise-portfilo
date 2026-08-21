import { Link } from "react-router-dom";
import BerlinBackground from "../components/BerlinBackground";
import Navbar from "../components/Navbar";

export default function BerlinPage() {
  return (
    <>
      <div className="relative z-10 w-full h-screen overflow-hidden">
        <Navbar />

        {/* 左侧修饰元素 */}
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 hidden md:block">
          {/* BACK 按钮 */}
          <Link
            to="/"
            className="inline-flex items-center space-x-2 border border-stone-400 rounded-full px-4 py-1.5 text-[12px] uppercase font-medium tracking-wider mt-8 hover:bg-stone-900 hover:text-white transition-colors"
          >
            <span>BACK</span>
            <span>←</span>
          </Link>
        </div>

        {/* 右侧修饰元素 */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 hidden md:block">
          <div className="text-right">
            <div className="text-[10px] tracking-widest uppercase text-stone-700 font-medium leading-relaxed mb-8">
              <p>滚动</p>
              <p className="mt-2">Scroll</p>
            </div>
          </div>
        </div>

        {/* 移动端 BACK 按钮 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 border border-stone-900 rounded-full px-4 py-1.5 text-[11px] uppercase font-medium tracking-wider hover:bg-stone-900 hover:text-white transition-colors bg-white/80 backdrop-blur-sm"
          >
            <span>BACK</span>
            <span>←</span>
          </Link>
        </div>

        <BerlinBackground />
      </div>
    </>
  );
}
