import { AnimatePresence, motion } from "framer-motion";

function ProjectNav({ current, total, onPrev, onNext }) {
  return (
    <div className="relative w-32 h-32 border border-stone-500 rounded-full flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-[120%] h-[1px] bg-stone-400 rotate-[-45deg]"></div>
        <button
          onClick={onPrev}
          className="absolute left-1 text-xs text-stone-700 cursor-pointer hover:text-black transition-colors"
        >
          ←
        </button>
        <div className="text-4xl font-light tracking-tighter flex items-center justify-center space-x-4 z-10">
          <AnimatePresence mode="wait">
            <motion.span
              key={current}
              className="absolute top-0 left-3"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {String(current).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={total}
              className="absolute bottom-0 right-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {String(total).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </div>
        <button
          onClick={onNext}
          className="absolute right-1 text-xs text-stone-700 cursor-pointer hover:text-black transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}

export default function Footer({ current, total, onPrev, onNext, image }) {
  return (
    <footer className="absolute bottom-0 left-0 right-0 w-full flex flex-col md:flex-row justify-between items-end gap-8 p-6 md:p-12 md:py-7 pointer-events-auto">
      <ProjectNav
        current={current}
        total={total}
        onPrev={onPrev}
        onNext={onNext}
      />

      <div className="flex flex-col space-y-4 md:mb-4 justify-center items-center">
        <span
          className="text-xs italic text-stone-600 tracking-widest"
          style={{ writingMode: "vertical-lr" }}
          // style={{ writingMode: "vertical-lr", transform: "rotate(270deg)" }}
        >
          Scorll
        </span>
        <div className="w-[1px] h-16 bg-stone-500"></div>
      </div>

      <div className="relative w-36 h-36 rounded-full overflow-hidden flex items-center justify-center shadow-lg border-4 border-white/50">
        {image ? (
          <img
            src={image}
            alt="Page decoration"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-800 to-amber-900 flex items-center justify-center">
            <div className="absolute inset-2 bg-rose-950 opacity-40"></div>
            <div className="w-14 h-14 bg-orange-500 shadow-md transform rotate-12 z-10"></div>
          </div>
        )}
      </div>
    </footer>
  );
}
