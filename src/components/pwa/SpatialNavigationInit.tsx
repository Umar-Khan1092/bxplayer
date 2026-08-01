"use client";

import { useEffect } from "react";

export function SpatialNavigationInit() {
  useEffect(() => {
    let SpatialNavigation: any;

    if (typeof window !== "undefined") {
      // @ts-ignore
      import("spatial-navigation-js").then((mod) => {
        SpatialNavigation = mod.default || mod;
        SpatialNavigation.init();
        SpatialNavigation.add({
          selector: 'a, button, input, [tabindex]',
        });
        SpatialNavigation.makeFocusable();
      });
    }

    return () => {
      if (typeof window !== "undefined" && SpatialNavigation) {
        SpatialNavigation.uninit();
      }
    };
  }, []);

  return null;
}
