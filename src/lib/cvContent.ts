export type CvContent = Record<string, any>;
export type CvMergeMode = "merge" | "combine" | "overwrite";
export function parsedCvContent(parsed: CvContent): CvContent {
  return {
    professionalSummary: parsed.summary || "",
    coreSkills: parsed.topSkills || [],
    experience: (parsed.workHistory || []).map((work: CvContent) => ({ title: work.title, company: work.company,
      dateRange: `${work.startYear || ""}–${work.isCurrent ? "Present" : work.endYear || ""}`,
      bullets: [work.description, work.achievements].filter(Boolean) })),
    educationSection: (parsed.education || []).map((item: CvContent) => `${item.degree || ""} ${item.field || ""} · ${item.institution} ${item.startYear || ""}–${item.endYear || ""}`).join("\n"),
    certificatesSection: (parsed.certificates || []).map((item: CvContent) => `${item.name} · ${item.issuer || ""}`).join("\n"),
  };
}
export function mergeCvContent(current: CvContent, incoming: CvContent, mode: CvMergeMode): CvContent {
  if (mode === "overwrite") return incoming;
  const result = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (!value || (Array.isArray(value) && !value.length)) continue;
    const old = current[key];
    if (Array.isArray(value)) {
      const existing = Array.isArray(old) ? old : [];
      result[key] = mode === "combine" ? [...existing, ...value] : [...new Map([...existing, ...value].map(entry => [JSON.stringify(entry), entry])).values()];
    } else if (mode === "combine" && typeof old === "string" && old && typeof value === "string") {
      result[key] = old === value ? old : `${old}\n\n${value}`;
    } else if (!old) result[key] = value;
  }
  return result;
}