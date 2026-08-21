import { Link } from "react-router-dom";
import { LetterSwapPingPong } from "./LetterSwap.jsx";

export default function Page02() {
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
            Illustration
          </div>
          <div
            className="italic font-medium leading-[0.85] tracking-tighter text-right md:pr-12 mt-2"
            style={{
              letterSpacing: "-0.04em",
              fontSize: "clamp(3rem, 10vw, 9.5rem)",
            }}
          >
            Design
          </div>
        </div>
        <div className="w-full max-w-2xl mt-12 flex flex-col sm:flex-row items-start sm:items-center px-4 space-y-6 sm:space-y-0 justify-end">
          <Link
            to="/detail/page01"
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
