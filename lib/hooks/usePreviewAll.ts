"use client";

import { useEffect, useState } from "react";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export function usePreviewAll(): { previewAll: boolean; isRouteReady: boolean } {
  const [previewAll, setPreviewAll] = useState(false);
  const [isRouteReady, setIsRouteReady] = useState(false);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setIsRouteReady(true);
  }, []);

  return { previewAll, isRouteReady };
}

