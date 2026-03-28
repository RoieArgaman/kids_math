"use client";

import { useCallback, useMemo, useRef } from "react";

import type { Exercise } from "@/lib/types";

export function useExerciseFocus(allExercises: Exercise[]): {
  exerciseOrder: string[];
  focusNextInput: (currentId: string) => void;
  setFocusRef: (exerciseId: string, node: HTMLElement | null) => void;
} {
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const exerciseOrder = useMemo(() => allExercises.map((e) => e.id), [allExercises]);

  const focusNextInput = useCallback(
    (currentId: string) => {
      const currentIndex = exerciseOrder.findIndex((id) => id === currentId);
      const nextId = exerciseOrder[currentIndex + 1];
      if (!nextId) {
        return;
      }
      refs.current[nextId]?.focus();
    },
    [exerciseOrder],
  );

  const setFocusRef = useCallback((exerciseId: string, node: HTMLElement | null) => {
    refs.current[exerciseId] = node;
  }, []);

  return { exerciseOrder, focusNextInput, setFocusRef };
}
