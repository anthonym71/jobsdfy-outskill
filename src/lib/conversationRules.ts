export const SINGLE_QUESTION_RULE = "Ask exactly ONE short, single-part question per turn. Wait for the user's answer before asking another. Never combine questions or add a second follow-up in the same turn. Acknowledge the answer briefly. Never invent answers. If the user says stop or pause, stop asking questions and offer to save what they have provided or carry on.";

export function voiceMessage(message: any): { speaker: "user" | "agent"; text: string } | null {
  const user = message?.source === "user" ? message.message : message?.user_transcription_event?.user_transcript;
  if (typeof user === "string" && user.trim()) return { speaker: "user", text: user.trim() };
  const agent = message?.source === "ai" ? message.message : message?.agent_response_event?.agent_response;
  return typeof agent === "string" && agent.trim() ? { speaker: "agent", text: agent.trim() } : null;
}

export function singleQuestion(text: string): string {
  const end = text.indexOf("?");
  return end < 0 ? text.trim() : text.slice(0, end + 1).trim();
}

export function nextUnanswered(questions: string[], answers: Record<number, string>): number {
  const index = questions.findIndex((_, i) => !answers[i]?.trim());
  return index < 0 ? Math.max(0, questions.length - 1) : index;
}