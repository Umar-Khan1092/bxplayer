"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download, Share, Smartphone } from "lucide-react";
import { Capacitor } from '@capacitor/core';

export function InstallPWA() {
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // If running natively inside Capacitor, NEVER show this prompt.
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return;
    }

    // Check if user has already dismissed the prompt in this session/device
    const hasDismissed = localStorage.getItem('bxplayer_app_prompt_dismissed');
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    const android = /android/.test(userAgent);
    const ios = /iphone|ipad|ipod/.test(userAgent);
    
    setIsAndroid(android);
    setIsIOS(ios);
    setIsMobile(android || ios);

    // If it's a mobile web browser and they haven't dismissed it, show the prompt!
    if ((android || ios) && !hasDismissed && !window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('bxplayer_app_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  const handleDownloadAPK = () => {
    // Start the download
    window.location.href = '/app-release.apk';
    // After they click download, we can let them proceed
    handleDismiss();
  };

  const handleIOSInstall = () => {
    setShowIOSInstructions(true);
    setShowPrompt(false);
  };

  if (!showPrompt && !showIOSInstructions) return null;

  return (
    <>
      {/* Main Mobile App Prompt Overlay */}
      {showPrompt && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center max-w-sm w-full">
            <div className="w-32 h-32 relative rounded-3xl overflow-hidden mb-8 shadow-[0_0_40px_rgba(220,38,38,0.3)] border border-white/10">
              <Image src="/logo.png" alt="BX Player" fill sizes="128px" className="object-cover" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3">BX Player</h2>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed">
              For the ultimate ad-free experience, zero buffering, and native performance, install our official mobile app!
            </p>

            {isAndroid ? (
              <button 
                onClick={handleDownloadAPK}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-red-900/50 mb-4"
              >
                <Download className="w-5 h-5" />
                Install App (APK)
              </button>
            ) : isIOS ? (
              <button 
                onClick={handleIOSInstall}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg mb-4"
              >
                <Smartphone className="w-5 h-5" />
                Install iOS App
              </button>
            ) : null}

            <button 
              onClick={handleDismiss}
              className="text-gray-500 font-medium text-sm py-3 px-6 hover:text-white transition-colors mt-2"
            >
              Continue to Web Version
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button 
              onClick={() => setShowIOSInstructions(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-black/50 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 relative rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border border-white/10">
              <Image src="/logo.png" alt="BX Player" fill sizes="80px" className="object-cover" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Install BX Player</h3>
            <p className="text-zinc-400 mb-8 text-sm">Install this app on your iPhone for a full-screen native experience.</p>
            
            <div className="bg-zinc-800/50 rounded-2xl p-4 mb-8">
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
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-colors active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
