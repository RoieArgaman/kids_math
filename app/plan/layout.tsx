import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "תּוֹכְנִית לִמּוּדִים — כִּיתָּה א׳",
  description:
    "מַפָּה לְפִי תְחוּמֵי לִמּוּד, מַעֲקָב הִתְקַדְּמוּת, רוּטִינַת עֲבוֹדָה יוֹמִית וּמַדְרִיךְ קָצָר לְהוֹרִים.",
};

export default function PlanLayout({ children }: { children: ReactNode }) {
  return children;
}

