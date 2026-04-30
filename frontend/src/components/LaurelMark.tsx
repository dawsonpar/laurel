/**
 * Laurel wreath wordmark glyph. Two mirrored branches of bay-laurel leaves
 * curving upward, classical Olympic origin. Color via currentColor so it
 * inherits the surrounding text color.
 */
export function LaurelMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Left branch */}
      <path d="M32 56 C 18 50, 10 38, 10 22" />
      <Leaf d="M14 22 C 9 18, 6 16, 4 16 C 6 20, 10 23, 14 22 Z" />
      <Leaf d="M14 28 C 9 25, 6 24, 4 24 C 6 27, 10 30, 14 28 Z" />
      <Leaf d="M16 35 C 11 33, 8 32, 6 33 C 8 36, 12 38, 16 35 Z" />
      <Leaf d="M20 41 C 15 40, 12 40, 10 41 C 12 44, 16 45, 20 41 Z" />
      <Leaf d="M25 47 C 20 47, 17 47, 16 48 C 18 51, 22 51, 25 47 Z" />

      {/* Right branch (mirrored) */}
      <path d="M32 56 C 46 50, 54 38, 54 22" />
      <Leaf d="M50 22 C 55 18, 58 16, 60 16 C 58 20, 54 23, 50 22 Z" />
      <Leaf d="M50 28 C 55 25, 58 24, 60 24 C 58 27, 54 30, 50 28 Z" />
      <Leaf d="M48 35 C 53 33, 56 32, 58 33 C 56 36, 52 38, 48 35 Z" />
      <Leaf d="M44 41 C 49 40, 52 40, 54 41 C 52 44, 48 45, 44 41 Z" />
      <Leaf d="M39 47 C 44 47, 47 47, 48 48 C 46 51, 42 51, 39 47 Z" />
    </svg>
  );
}

function Leaf({ d }: { d: string }) {
  return <path d={d} fill="currentColor" fillOpacity={0.18} />;
}
