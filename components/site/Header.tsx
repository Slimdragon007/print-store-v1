'use client';
import Link from "next/link";
export default function Header(){
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">MH Photo</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/prints" className="hover:opacity-70">Prints</Link>
        </nav>
      </div>
    </header>
  );
}
