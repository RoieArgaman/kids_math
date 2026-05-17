"use client";

import { useMemo } from "react";
import { TapToPlayTtsButton } from "@/components/ui/TapToPlayTtsButton";
import { useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";
import { testIds } from "@/lib/testIds";
import type { WorkedExample } from "@/lib/types";
import { buildWorkedExampleSpeakChunks } from "@/lib/utils/workedExampleSpeakText";

type WorkedExampleTtsButtonProps = {
  sectionId: string;
  example: WorkedExample;
};

export function WorkedExampleTtsButton({ sectionId, example }: WorkedExampleTtsButtonProps) {
  const { ttsEnabled, hydrated } = useAdminTtsEnabled();
  const chunks = useMemo(() => buildWorkedExampleSpeakChunks(example), [example]);

  if (chunks.length === 0) {
    return null;
  }

  return (
    <TapToPlayTtsButton
      chunks={chunks}
      dataTestId={testIds.component.sectionBlock.example.tts(sectionId)}
      featureEnabled={hydrated && ttsEnabled}
      ariaLabel="הַשְׁמַע דֻּגְמָה פְּתוּרָה"
      ariaLabelSpeaking="עֲצוֹר הַשְׁמָעָה"
    />
  );
}
