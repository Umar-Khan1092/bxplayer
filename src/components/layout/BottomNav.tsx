"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Genre", href: "/", icon: Film },
    { name: "Favourite", href: "/", icon: Heart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/10 sm:hidden">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 min-w-[4rem]"
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-gray-300"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-white" : "text-gray-400"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
