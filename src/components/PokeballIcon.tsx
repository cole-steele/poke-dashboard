export default function PokeballIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* White base circle */}
      <circle cx="20" cy="20" r="19" fill="#fff" stroke="#222" strokeWidth="2" />
      {/* Red top half */}
      <path d="M1,20 A19,19 0 0 1 39,20 Z" fill="#e63946" />
      {/* Middle band */}
      <rect x="1" y="18" width="38" height="4" fill="#222" />
      {/* Button ring */}
      <circle cx="20" cy="20" r="6.5" fill="#fff" stroke="#222" strokeWidth="2.5" />
      {/* Button highlight */}
      <circle cx="20" cy="20" r="3" fill="#f0f0f0" />
    </svg>
  );
}
