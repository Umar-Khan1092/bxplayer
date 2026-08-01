"use client";

import { useState, useEffect } from "react";
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

interface AuthState {
  macAddress: string;
  userId: string;
  isLoaded: boolean;
}

const generateMacAddress = () => {
  const chars = "0123456789ABCDEF";
  let mac = "";
  for (let i = 0; i < 6; i++) {
    mac += chars[Math.floor(Math.random() * chars.length)];
    mac += chars[Math.floor(Math.random() * chars.length)];
    if (i < 5) mac += ":";
  }
  return mac;
};

const generateUserId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    macAddress: "",
    userId: "",
    isLoaded: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor Device ID to persist across uninstalls
          const deviceId = await Device.getId();
          const uuid = deviceId.identifier.replace(/-/g, '').toUpperCase();
          
          let mac = "";
          for (let i = 0; i < 12; i += 2) {
            mac += uuid.substring(i, i + 2);
            if (i < 10) mac += ":";
          }
          
          // Generate an 8 digit consistent number from the UUID
          let numStr = "";
          for(let i = 0; i < uuid.length; i++) {
             numStr += uuid.charCodeAt(i).toString();
          }
          const userId = numStr.substring(0, 8);
          
          setAuthState({
            macAddress: mac,
            userId: userId,
            isLoaded: true,
          });
        } else {
          let storedMac = localStorage.getItem("bx_mac_address");
          let storedUserId = localStorage.getItem("bx_user_id");

          if (!storedMac || !storedUserId) {
            storedMac = generateMacAddress();
            storedUserId = generateUserId();
            localStorage.setItem("bx_mac_address", storedMac);
            localStorage.setItem("bx_user_id", storedUserId);
          }

          setAuthState({
            macAddress: storedMac,
            userId: storedUserId,
            isLoaded: true,
          });
        }
      }
    };
    initAuth();
  }, []);

  return authState;
}
