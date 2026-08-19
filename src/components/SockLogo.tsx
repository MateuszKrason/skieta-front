export default function SockLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="14" y="4" width="16" height="24" rx="5" fill="#059669" />
      <rect x="14" y="22" width="26" height="16" rx="6" fill="#059669" />
      <rect x="15" y="5" width="14" height="5" fill="#a7f3d0" />
      <rect x="31" y="26" width="7" height="10" rx="2" fill="#a7f3d0" />
    </svg>
  )
}
