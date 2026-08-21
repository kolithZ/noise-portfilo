export default function DetailRightSection({
  projectNumber,
  totalProjects,
  role,
  agency,
  year,
  awards,
  portrait,
}) {
  return (
    <div className="w-full md:w-1/4 flex flex-col justify-between items-end py-4 z-20">
      <div className="text-right mt-4">
        <div className="text-4xl font-light tracking-tighter text-stone-900">
          {projectNumber}{" "}
          <span className="text-stone-300 text-2xl mx-1">/</span>
          <span className="text-stone-400">{totalProjects}</span>
        </div>
        <div className="mt-8 space-y-4 text-[10px] tracking-wider uppercase text-left inline-block">
          <div>
            <p className="text-stone-400 font-normal">ROLE</p>
            <p className="text-stone-800 font-medium">{role}</p>
          </div>
          <div>
            <p className="text-stone-400 font-normal">AGENCY</p>
            <p className="text-stone-800 font-medium">{agency}</p>
          </div>
          <div>
            <p className="text-stone-400 font-normal">YEAR</p>
            <p className="text-stone-800 font-medium">{year}</p>
          </div>
          <div>
            <p className="text-stone-400 font-normal">AWARDS</p>
            <p className="text-stone-800 font-medium">{awards}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
