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
      {showPrompt && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center h-[100dvh] w-[100vw] overflow-hidden">
          <div className="w-24 h-24 bg-[#0F763F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0F763F]/20 mb-8 mx-auto">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">BX Player App</h2>
          
          <p className="text-gray-400 mb-10 max-w-sm text-lg leading-relaxed">
            The Media Player is not supported in the mobile browser. You must install the official Android app to play videos with native hardware integration.
          </p>

          {isAndroid ? (
            <button 
              onClick={handleDownloadAPK}
              className="w-full max-w-sm bg-[#0F763F] text-white h-16 rounded-xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Download className="w-6 h-6" /> Download Android APK
            </button>
          ) : isIOS ? (
            <button 
              onClick={handleIOSInstall}
              className="w-full max-w-sm bg-white text-black h-16 rounded-xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Share className="w-6 h-6" /> Install on iOS
            </button>
          ) : null}
        </div>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-center h-[100dvh] w-[100vw] overflow-hidden">
          <div className="w-20 h-20 relative rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border border-white/10">
            <Image src="/logo.png" alt="BX Player" fill sizes="80px" className="object-cover" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Install BX Player</h3>
          <p className="text-zinc-400 mb-8 text-sm">Install this app on your iPhone for a full-screen native experience.</p>
          
          <div className="bg-zinc-800/50 rounded-2xl p-4 mb-8 max-w-sm w-full">
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
        </div>
      )}
    </>
  );
}
