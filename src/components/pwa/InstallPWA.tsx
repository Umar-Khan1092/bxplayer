"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download, Share } from "lucide-react";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW Registration Failed:", err));
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not already in standalone mode, show banner
    if (isIosDevice && !window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  if (!showInstallBanner) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 group hover:bg-zinc-800/90 transition-colors">
          <button onClick={() => setShowInstallBanner(false)} className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full border border-white/10">
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 relative rounded-xl overflow-hidden shadow-inner flex-shrink-0">
            <Image src="/logo.png" alt="BxPlayer" fill sizes="48px" className="object-cover" />
          </div>
          
          <div className="flex flex-col pr-4">
            <span className="text-white font-bold text-sm">BxPlayer</span>
            <span className="text-zinc-400 text-xs mb-2">Install App</span>
            <button 
              onClick={handleInstallClick}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1.5 px-4 rounded-full flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3 h-3" />
              Install
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center relative">
            <button 
              onClick={() => setShowIOSInstructions(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 relative rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border border-white/10">
              <Image src="/logo.png" alt="BxPlayer" fill sizes="80px" className="object-cover" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Install BxPlayer</h3>
            <p className="text-zinc-400 mb-8 text-sm">Install this app on your iPhone for a full-screen native experience.</p>
            
            <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-4 mb-4 text-left">
                <div className="bg-blue-500/20 text-blue-500 p-2 rounded-xl flex-shrink-0">
                  <Share className="w-6 h-6" />
                </div>
                <p className="text-sm text-zinc-300">
                  1. Tap the <strong className="text-white">Share</strong> button in your browser's toolbar.
                </p>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="bg-white/10 text-white p-2 rounded-xl flex-shrink-0">
                  <span className="w-6 h-6 flex items-center justify-center text-xl font-bold">+</span>
                </div>
                <p className="text-sm text-zinc-300">
                  2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="w-full bg-white text-black font-bold py-3 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
