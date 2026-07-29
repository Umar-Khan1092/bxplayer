"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TopHeader() {
  const pathname = usePathname();

  const navItems = [
    { name: "FEATURES", href: "/features" },
    { name: "FAQS", href: "/faq" },
    { name: "CONTACT", href: "/contact" },
    { name: "Legal Terms", href: "/legal" },
    { name: "ACTIVATE DEVICE", href: "/activate" },
    { name: "MANAGE PLAYLISTS", href: "/playlist" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-white/10 shadow-2xl">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-500 to-green-300">
            BX
          </div>
          <span className="font-bold text-gray-300 tracking-wider text-sm mt-1 group-hover:text-green-400 transition-colors">PLAYER</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden xl:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-5 py-2 rounded-md text-xs font-bold tracking-widest transition-all duration-300 cursor-pointer uppercase",
                  isActive 
                    ? "text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button (Optional placeholder for future expansion) */}
        <div className="xl:hidden flex items-center">
           <Link href="/playlist" className="text-xs font-bold uppercase tracking-wider bg-green-600 hover:bg-green-700 transition-colors text-white px-4 py-2 rounded-md shadow-lg">
             Manage Playlists
           </Link>
        </div>

      </div>
    </header>
  );
}
