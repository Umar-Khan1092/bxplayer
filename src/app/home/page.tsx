import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowRight, Play, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Hero Section */}
        <div className="mb-12 max-w-4xl">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Media Experience</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            BX Player is a lightning-fast, highly secure web media player. Effortlessly connect your M3U and Xtream sources in seconds and stream your favorite content in 4K UHD.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-transform hover:scale-105 flex items-center justify-center shadow-lg shadow-red-500/25"
            >
              <Play className="w-5 h-5 mr-2" fill="currentColor" /> Open Web Player
            </Link>
            <Link 
              href="/features"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all flex items-center justify-center"
            >
              Explore Features <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-12">
          <div className="glass p-6 rounded-2xl border border-white/5 text-left">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Setup</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              No software to download. Access your portal via the web, log in with your persistent device ID, and start streaming immediately.
            </p>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-white/5 text-left">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Isolated Security</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your playlists are encrypted and tied strictly to your Mac Address. Protect sensitive categories with advanced 4-digit Parental PINs.
            </p>
          </div>
          
          <div className="glass p-6 rounded-2xl border border-white/5 text-left">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Premium Playback</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built natively for the modern web with hardware acceleration, adaptive bitrate streaming, and support for all major codecs.
            </p>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
