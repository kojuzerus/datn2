// Linh vật thỏ SmartHub phiên bản 3D — dùng gradient + highlight để tạo khối.
// Kết hợp với keyframes `rabbit-jump` trong globals.css để thỏ nhảy tưng tưng.
export default function Rabbit3D({ size = 96 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 100 124"
      width={size}
      height={size * 1.24}
      className="block"
      style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.30))" }}
    >
      <defs>
        <radialGradient id="rb-body" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="62%" stopColor="#f7f7fa" />
          <stop offset="100%" stopColor="#d9dae2" />
        </radialGradient>
        <radialGradient id="rb-head" cx="40%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f8f8fb" />
          <stop offset="100%" stopColor="#dcdde5" />
        </radialGradient>
        <linearGradient id="rb-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e3e4ea" />
        </linearGradient>
        <linearGradient id="rb-ear-in" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc4cc" />
          <stop offset="100%" stopColor="#f87f92" />
        </linearGradient>
        <linearGradient id="rb-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f05252" />
          <stop offset="100%" stopColor="#c81e1e" />
        </linearGradient>
      </defs>

      {/* Tai trái */}
      <g style={{ transformOrigin: "36px 34px", animation: "rabbit-ear 2.6s ease-in-out infinite" }}>
        <ellipse cx="34" cy="20" rx="8.5" ry="18" fill="url(#rb-ear)" stroke="#c9cad3" strokeWidth="1" transform="rotate(-8 34 20)" />
        <ellipse cx="34.5" cy="21" rx="4.5" ry="12.5" fill="url(#rb-ear-in)" transform="rotate(-8 34.5 21)" />
      </g>
      {/* Tai phải */}
      <g style={{ transformOrigin: "64px 34px", animation: "rabbit-ear 2.6s ease-in-out 0.25s infinite" }}>
        <ellipse cx="66" cy="20" rx="8.5" ry="18" fill="url(#rb-ear)" stroke="#c9cad3" strokeWidth="1" transform="rotate(8 66 20)" />
        <ellipse cx="65.5" cy="21" rx="4.5" ry="12.5" fill="url(#rb-ear-in)" transform="rotate(8 65.5 21)" />
      </g>

      {/* Thân */}
      <ellipse cx="50" cy="92" rx="30" ry="26" fill="url(#rb-body)" stroke="#c9cad3" strokeWidth="1" />

      {/* Tay trái / phải ôm mép */}
      <ellipse cx="22" cy="86" rx="8" ry="11" fill="url(#rb-body)" stroke="#c9cad3" strokeWidth="1" transform="rotate(14 22 86)" />
      <ellipse cx="78" cy="86" rx="8" ry="11" fill="url(#rb-body)" stroke="#c9cad3" strokeWidth="1" transform="rotate(-14 78 86)" />

      {/* Áo đỏ chữ S */}
      <path d="M27 90 a23 20 0 0 1 46 0 v14 a23 14 0 0 1 -46 0 Z" fill="url(#rb-shirt)" />
      <path d="M27 90 a23 20 0 0 1 46 0 l0 4 a23 20 0 0 0 -46 0 Z" fill="rgba(255,255,255,0.18)" />
      <text x="50" y="103" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="15" fontFamily="sans-serif" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>S</text>

      {/* Đầu */}
      <ellipse cx="50" cy="52" rx="24" ry="22" fill="url(#rb-head)" stroke="#c9cad3" strokeWidth="1" />

      {/* Má hồng */}
      <ellipse cx="33" cy="58" rx="4.5" ry="3" fill="#ffb6c1" opacity="0.75" />
      <ellipse cx="67" cy="58" rx="4.5" ry="3" fill="#ffb6c1" opacity="0.75" />

      {/* Mắt — có highlight cho bóng 3D */}
      <circle cx="41" cy="50" r="3.6" fill="#1f1f28" />
      <circle cx="59" cy="50" r="3.6" fill="#1f1f28" />
      <circle cx="42.3" cy="48.6" r="1.3" fill="#fff" />
      <circle cx="60.3" cy="48.6" r="1.3" fill="#fff" />

      {/* Mũi + miệng */}
      <ellipse cx="50" cy="57" rx="3.2" ry="2.3" fill="#f87f92" />
      <path d="M50 59.5 q-3 4 -6 1.5 M50 59.5 q3 4 6 1.5" stroke="#c9808d" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Highlight đỉnh đầu */}
      <ellipse cx="43" cy="38" rx="10" ry="5" fill="rgba(255,255,255,0.85)" opacity="0.6" transform="rotate(-12 43 38)" />
    </svg>
  );
}
