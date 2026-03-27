import { childTid } from "@/lib/testIds";
import type { MathExpressionToken } from "@/lib/utils/mathText";

interface MathExpressionTokensProps {
  tokens: MathExpressionToken[];
  baseTestId: string;
}

function tokenModifierClass(type: MathExpressionToken["type"]): string {
  return `km-math-token--${type}`;
}

export function MathExpressionTokens({ tokens, baseTestId }: MathExpressionTokensProps) {
  const containerTestId = childTid(baseTestId, "mathTokens");
  return (
    <div
      data-testid={containerTestId}
      className="km-math-tokens"
      dir="ltr"
      style={{ unicodeBidi: "isolate" }}
    >
      {tokens.map((token, index) => (
        <span
          data-testid={childTid(containerTestId, "token", index, token.type)}
          key={`${token.type}-${index}-${token.value}`}
          className={`km-math-token ${tokenModifierClass(token.type)}`}
        >
          {token.value}
        </span>
      ))}
    </div>
  );
}
