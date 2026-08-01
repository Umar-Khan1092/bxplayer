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
      const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
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
