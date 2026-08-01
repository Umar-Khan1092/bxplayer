"use client";

import { useEffect } from "react";
// @ts-ignore
import SpatialNavigation from "spatial-navigation-js";

export function SpatialNavigationInit() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      SpatialNavigation.init();
      SpatialNavigation.add({
        selector: 'a, button, input, [tabindex]',
      });
      SpatialNavigation.makeFocusable();
      
      // Optionally focus the first focusable element
      // SpatialNavigation.focus();
    }

    return () => {
      if (typeof window !== "undefined") {
        SpatialNavigation.uninit();
      }
    };
  }, []);

  return null;
}
