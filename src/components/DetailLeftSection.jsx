import { Link } from "react-router-dom";
import { LetterSwapPingPong } from "./LetterSwap.jsx";

export default function DetailLeftSection({
  title,
  description,
  scrollPercentage,
  pageIndex,
}) {
  return (
    <div className="w-full md:w-1/4 flex flex-col justify-between py-4 z-20">
      <div className="mt-4">
        <h1
          className="text-5xl font-medium leading-[0.85] tracking-tighter italic"
          style={{ letterSpacing: "-0.05em" }}
        >
          {title[0]}
        </h1>
        <h1
          className="text-5xl font-medium leading-[0.85] tracking-tighter italic mt-1 pl-1"
          style={{ letterSpacing: "-0.05em" }}
        >
          {title[1]}
        </h1>
        <p className="text-[12px] text-stone-600 max-w-[200px] leading-relaxed mt-8 font-normal">
          {description}
        </p>
        <Link
          to={`/?page=${pageIndex}`}
          className="inline-flex items-center space-x-6 border border-stone-900 rounded-full px-4 py-1.5 text-[11px] uppercase font-medium tracking-wider mt-6 hover:bg-stone-900 hover:text-white transition-colors"
        >
          <LetterSwapPingPong
            label="BACK ←"
            className="text-[11px] uppercase font-medium tracking-wider"
          />
        </Link>
      </div>

      <div className="relative w-36 h-36 border border-stone-300 rounded-full flex items-center justify-center mt-8 md:mt-0">
        <span className="text-4xl font-light tracking-tighter">
          {scrollPercentage}%
        </span>
      </div>
    </div>
  );
}
