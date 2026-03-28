import type { DayConcept } from "./exercise-factories";

export function validateDayConcept(c: DayConcept): string[] {
  const errors: string[] = [];
  if (!c.title) errors.push("missing title");
  if (!c.objective) errors.push("missing objective");
  if (!c.arithmeticMcOptions.includes(c.arithmeticMcAnswer))
    errors.push(
      `arithmeticMcAnswer "${c.arithmeticMcAnswer}" not in options [${c.arithmeticMcOptions.join(", ")}]`,
    );
  if (c.geometryPrompt && !c.geometryAnswer)
    errors.push("geometryPrompt present but geometryAnswer missing");
  if (c.geometryAnswer && !c.geometryPrompt)
    errors.push("geometryAnswer present but geometryPrompt missing");
  return errors;
}
