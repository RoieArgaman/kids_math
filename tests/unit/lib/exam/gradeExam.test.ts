import { describe, expect, it } from "vitest";
import { gradeExam } from "@/lib/exam/gradeExam";
import { FINAL_EXAM_PASS_PERCENT } from "@/lib/final-exam/config";
import { ENGLISH_FINAL_EXAM_PASS_PERCENT } from "@/lib/english/final-exam/config";
import { SCIENCE_FINAL_EXAM_PASS_PERCENT } from "@/lib/science/final-exam/config";

/**
 * Boundary tests per subject. Each subject imports its OWN pass-percent
 * constant (not a centralized one) — the same wiring the graders use — so a
 * future change to any subject's threshold flips these assertions, catching
 * accidental drift.
 *
 * Strategy: use total=100 so `correctCount` equals the exact score percent,
 * letting us probe (threshold-1), threshold, (threshold+1) precisely.
 */
function expectFlipAtThreshold(passPercent: number): void {
  // total = 100 → scorePercent === correctCount
  expect(gradeExam({ correctCount: passPercent - 1, total: 100, passPercent })).toEqual({
    scorePercent: passPercent - 1,
    passed: false,
  });
  expect(gradeExam({ correctCount: passPercent, total: 100, passPercent })).toEqual({
    scorePercent: passPercent,
    passed: true,
  });
  expect(gradeExam({ correctCount: passPercent + 1, total: 100, passPercent })).toEqual({
    scorePercent: passPercent + 1,
    passed: true,
  });
  // 0% and 100% endpoints
  expect(gradeExam({ correctCount: 0, total: 100, passPercent })).toEqual({
    scorePercent: 0,
    passed: false,
  });
  expect(gradeExam({ correctCount: 100, total: 100, passPercent })).toEqual({
    scorePercent: 100,
    passed: true,
  });
}

describe("gradeExam — math final exam (pass = 85)", () => {
  it("pass constant is 85", () => {
    expect(FINAL_EXAM_PASS_PERCENT).toBe(85);
  });

  it("flips pass/fail exactly at the threshold", () => {
    expectFlipAtThreshold(FINAL_EXAM_PASS_PERCENT);
  });

  it("reproduces the real total=30 rounding boundary", () => {
    // 25/30 = 83.33% → round 83 → fail
    expect(gradeExam({ correctCount: 25, total: 30, passPercent: 85 })).toEqual({
      scorePercent: 83,
      passed: false,
    });
    // 26/30 = 86.67% → round 87 → pass (first passing count at total 30)
    expect(gradeExam({ correctCount: 26, total: 30, passPercent: 85 })).toEqual({
      scorePercent: 87,
      passed: true,
    });
  });
});

describe("gradeExam — english final exam (pass = 80)", () => {
  it("pass constant is 80", () => {
    expect(ENGLISH_FINAL_EXAM_PASS_PERCENT).toBe(80);
  });

  it("flips pass/fail exactly at the threshold", () => {
    expectFlipAtThreshold(ENGLISH_FINAL_EXAM_PASS_PERCENT);
  });
});

describe("gradeExam — science final exam (pass = 80)", () => {
  it("pass constant is 80", () => {
    expect(SCIENCE_FINAL_EXAM_PASS_PERCENT).toBe(80);
  });

  it("flips pass/fail exactly at the threshold", () => {
    expectFlipAtThreshold(SCIENCE_FINAL_EXAM_PASS_PERCENT);
  });
});

describe("gradeExam — total === 0 guard", () => {
  it("scores 0% and never passes when total is 0 (english/science empty-exam case)", () => {
    expect(gradeExam({ correctCount: 0, total: 0, passPercent: 80 })).toEqual({
      scorePercent: 0,
      passed: false,
    });
    // Even a positive correctCount cannot pass with no denominator.
    expect(gradeExam({ correctCount: 5, total: 0, passPercent: 80 })).toEqual({
      scorePercent: 0,
      passed: false,
    });
  });
});
