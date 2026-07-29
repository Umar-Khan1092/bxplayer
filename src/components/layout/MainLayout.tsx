import * as React from "react"
import { TopHeader } from "./TopHeader"
import { BottomNav } from "./BottomNav"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="hidden sm:block">
        <TopHeader />
      </div>
      {/* On mobile, remove top padding since header is hidden */}
      <main className="pt-4 sm:pt-24 pb-20 sm:pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
