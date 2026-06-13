"use client";

import { useMemo } from "react";
import { TapToPlayTtsButton } from "@/components/ui/TapToPlayTtsButton";
import { testIds } from "@/lib/testIds";
import type { WorkedExample } from "@/lib/types";
import { buildWorkedExampleSpeakChunks } from "@/lib/utils/workedExampleSpeakText";

type WorkedExampleTtsButtonProps = {
  sectionId: string;
  example: WorkedExample;
};

export function WorkedExampleTtsButton({ sectionId, example }: WorkedExampleTtsButtonProps) {
  const chunks = useMemo(() => buildWorkedExampleSpeakChunks(example), [example]);

  if (chunks.length === 0) {
    return null;
  }

  return (
    <TapToPlayTtsButton
      chunks={chunks}
      dataTestId={testIds.component.sectionBlock.example.tts(sectionId)}
      ariaLabel="הַשְׁמַע דֻּגְמָה פְּתוּרָה"
      ariaLabelSpeaking="עֲצוֹר הַשְׁמָעָה"
    />
  );
}
