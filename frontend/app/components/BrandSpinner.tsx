export default function BrandSpinner({ size = 64 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Vòng quay */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          border: "3.5px solid #fee2e2",
          borderTopColor: "#dc2626",
          borderRightColor: "#dc2626",
        }}
      />
      {/* Logo thỏ ở giữa */}
      <svg viewBox="0 0 80 80" width={size * 0.6} height={size * 0.6} className="block">
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
    </div>
  );
}
