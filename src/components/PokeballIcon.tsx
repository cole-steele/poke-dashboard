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
      <circle cx="20" cy="20" r="18" fill="#fff" stroke="#1f2933" strokeWidth="2" />
      <path d="M2 20a18 18 0 0 1 36 0H2Z" fill="#e63946" />
      <path d="M2 19h36v3H2z" fill="#1f2933" />
      <circle cx="20" cy="20.5" r="6" fill="#fff" stroke="#1f2933" strokeWidth="2" />
      <path
        d="m17.2 20.4 2 2 3.7-4"
        stroke="#2f80ed"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
