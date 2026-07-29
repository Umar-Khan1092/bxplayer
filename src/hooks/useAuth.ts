"use client";

import { useState, useEffect } from "react";

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
    if (typeof window !== "undefined") {
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
  }, []);

  return authState;
}
