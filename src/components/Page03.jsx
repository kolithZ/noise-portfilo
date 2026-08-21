import { Link } from "react-router-dom";
import { LetterSwapPingPong } from "./LetterSwap.jsx";

export default function Page03() {
  return (
    <>
      <main className="w-full my-auto flex flex-col items-center relative">
        <div className="relative max-w-4xl w-full px-4">
          <div
            className="italic font-medium leading-[0.85] tracking-tighter text-left"
            style={{
              letterSpacing: "-0.04em",
              fontSize: "clamp(3rem, 10vw, 9.5rem)",
            }}
          >
            Photography
          </div>

          {/* <div className="absolute right-4 md:right-20 top-0 md:top-0 text-[10px] tracking-widest uppercase text-stone-700 font-medium leading-relaxed">
            原作者
            <br />
            The WanderingSoul
          </div> */}

          <div
            className="italic font-medium leading-[0.85] tracking-tighter text-right md:pr-12 mt-2"
            style={{
              letterSpacing: "-0.04em",
              fontSize: "clamp(3rem, 10vw, 9.5rem)",
            }}
          >
            Gallery
          </div>
        </div>

        <div className="w-full max-w-2xl mt-12 flex flex-col sm:flex-row items-start sm:items-center px-4 space-y-6 sm:space-y-0 justify-end">
          <Link
            to="/detail/page03"
            className="flex items-center space-x-6 border border-stone-900 rounded-full px-5 py-2 text-xs uppercase font-medium tracking-wider hover:bg-stone-900 hover:text-white transition-colors"
          >
            <LetterSwapPingPong
              label="VISIT ↗"
              className="text-xs uppercase font-medium tracking-wider"
            />
          </Link>
        </div>
      </main>
    </>
  );
}
