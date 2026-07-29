"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function LegalPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 py-12 px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-white text-center">Legal Terms & Disclaimer</h1>
        <p className="text-gray-400 mb-12 text-center text-lg">Please read our terms of service regarding media usage.</p>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 sm:p-12 space-y-8 text-gray-300 leading-relaxed text-base">
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><span className="text-red-500">1.</span> No Content Provided</h3>
              <p>BX Player is strictly a media player interface. We do not provide, host, sell, or distribute any media content, live streams, or playlists. The application is completely empty by default.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><span className="text-red-500">2.</span> User Responsibility</h3>
              <p>Users are solely responsible for the content they choose to load into the player. By using BX Player, you agree that you have the legal right to access and stream the media provided in your custom M3U or Xtream Codes playlists.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><span className="text-red-500">3.</span> Intellectual Property</h3>
              <p>We do not endorse or promote the streaming of copyright-protected material without proper authorization from the copyright holder. If you are found to be using the software for unauthorized streaming, your access may be terminated.</p>
            </section>
            <section>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><span className="text-red-500">4.</span> Data Privacy</h3>
              <p>Your Mac Address and User ID are generated locally and used strictly for authorization and playlist retrieval within this platform. We do not share your device credentials or playlist URLs with third-party tracking services.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
