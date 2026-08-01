"use client";

import { useEffect } from "react";
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useRouter, usePathname } from 'next/navigation';

export function CapacitorApp() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const backButtonListener = App.addListener('backButton', () => {
        // First check if a video is in fullscreen and exit fullscreen instead of navigating
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
          else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
          return;
        }
        
        // Otherwise handle normal navigation
        if (pathname === '/') {
          App.exitApp();
        } else {
          router.back();
        }
      });
      
      return () => {
        backButtonListener.then(listener => listener.remove());
      };
    }
  }, [pathname, router]);

  return null;
}
