export type InterviewFeedback = { score?: number; strengths?: string[]; improvements?: string[]; suggestedAnswer?: string };
export function interviewAnalytics(feedback: unknown) {
  const entries = Object.values((feedback || {}) as Record<string, InterviewFeedback>).filter(Boolean);
  const scored = entries.filter(item => typeof item.score === "number" && Number.isFinite(item.score));
  return {
    answered: scored.length,
    average: scored.length ? Math.round(scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length * 10) / 10 : null,
    strengths: [...new Set(entries.flatMap(item => item.strengths || []))],
    improvements: [...new Set(entries.flatMap(item => item.improvements || []))],
  };
}