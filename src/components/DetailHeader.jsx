export default function DetailHeader() {
  return (
    <header className="w-full flex justify-between items-start text-[11px] font-medium tracking-widest uppercase z-30">
      <div className="flex items-center space-x-12">
        <div className="font-bold tracking-tighter text-sm">F / P</div>
        <div className="hidden sm:block text-stone-500">UDINE, 05:26 AM CEST</div>
      </div>
      <div className="flex items-center space-x-8">
        <nav className="space-x-3">
          <a href="#" className="hover:underline">PROJECTS</a>
          <span className="text-stone-300">/</span>
          <a href="#" className="text-stone-500 hover:underline">ABOUT</a>
        </nav>
        <div className="w-3.5 h-3.5 bg-stone-900 rounded-full"></div>
      </div>
    </header>
  );
}