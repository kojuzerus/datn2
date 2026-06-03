import Link from "next/link";

export default function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  const size = compact ? 48 : 56;

  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <svg viewBox="0 0 80 80" width={size} height={size} className="block">
        <ellipse cx="40" cy="56" rx="21" ry="17" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
        <ellipse cx="40" cy="35" rx="15" ry="14" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
        <ellipse cx="30" cy="17" rx="5.5" ry="11" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
        <ellipse cx="50" cy="17" rx="5.5" ry="11" fill="#fff" stroke="#e53e3e" strokeWidth="2" />
        <ellipse cx="30" cy="17" rx="3" ry="8" fill="#fca5a5" />
        <ellipse cx="50" cy="17" rx="3" ry="8" fill="#fca5a5" />
        <circle cx="35" cy="33" r="2.2" fill="#1a1a1a" />
        <circle cx="45" cy="33" r="2.2" fill="#1a1a1a" />
        <ellipse cx="40" cy="38.5" rx="2.5" ry="1.8" fill="#fca5a5" />
        <rect x="28" y="47" width="24" height="18" rx="5" fill="#e53e3e" />
        <text x="40" y="59" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="13" fontFamily="sans-serif">S</text>
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="text-lg font-bold text-gray-900 tracking-tight">
            SMART<span className="text-red-600">HUB</span>
          </div>
          <div className="text-[9px] text-gray-400 tracking-[2px] mt-0.5">
            CÔNG NGHỆ
          </div>
        </div>
      )}
    </Link>
  );
}
