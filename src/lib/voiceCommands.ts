/** Spoken commands understood by voice features. */
const STOP_RE = /^(?:ok(?:ay)?\s+|please\s+|joby\s+)*(stop|pause|hold on|wait|hang on)(?:\s+(?:please|there|now|a (?:sec|second|moment)|joby))*[.!?]*$/i;
const CONTINUE_RE = /^(?:ok(?:ay)?\s+|please\s+)*(continue|next|carry on|go on|move on|done|that'?s it)(?:\s+please)?[.!?]*$/i;
const SKIP_RE = /^(?:please\s+)*(skip|pass|next question|i don'?t know|none|not sure)[.!?]*$/i;

const clean = (t: string) => t.trim().replace(/\s+/g, " ");

export const isStopCommand = (t: string) => STOP_RE.test(clean(t));
export const isContinueCommand = (t: string) => CONTINUE_RE.test(clean(t));
export const isSkipCommand = (t: string) => SKIP_RE.test(clean(t));

/** "60k", "60,000", "sixty thousand" (already digit-converted by browsers) → "60000" */
export const spokenNumber = (t: string): string => {
  const s = t.toLowerCase().replace(/,/g, "");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(k|thousand|m|million)?/);
  if (!m) return "";
  let n = parseFloat(m[1]);
  if (m[2] === "k" || m[2] === "thousand") n *= 1000;
  if (m[2] === "m" || m[2] === "million") n *= 1_000_000;
  return String(Math.round(n));
};
