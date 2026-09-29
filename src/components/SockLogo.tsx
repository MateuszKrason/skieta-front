// Kept in step with public/favicon.svg, which is what every icon raster is
// generated from: same path, same viewBox, only the fills differ so the pink
// theme can recolour it.
export default function SockLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="4.5 4.5 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M11 6.9h16v17.5h3.9a6.1 6.1 0 0 1 6.1 6.1v4.6a6.1 6.1 0 0 1-6.1 6.1H17.1a6.1 6.1 0 0 1-6.1-6.1z"
        className="fill-[#059669] pink:fill-violet-600"
      />
      <path d="M11 6.9h16v5.3H11z" className="fill-[#a7f3d0] pink:fill-violet-200" />
      <rect x="28" y="28.3" width="7" height="10.4" rx="2.6" className="fill-[#a7f3d0] pink:fill-violet-200" />
    </svg>
  )
}
