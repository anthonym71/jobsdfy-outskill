type ImportTab = "url" | "text";

interface ResolveSharedImportArgs {
  source?: string | null;
  shareText?: string | null;
  shareTitle?: string | null;
  shareUrl?: string | null;
}

interface ResolvedSharedImport {
  preferredTab: ImportTab;
  text: string;
  url: string;
}

const URL_REGEX = /https?:\/\/[^\s<>"'`\])]+/gi;
const NESTED_URL_KEYS = ["url", "u", "target", "targetUrl", "redirect", "redirectUrl", "dest", "destination", "link"];

const uniqueValues = (values: string[]) => [...new Set(values.filter(Boolean))];

const cleanUrl = (value: string) => value.trim().replace(/^["'([]+/, "").replace(/["'),.\]]+$/, "");

const decodeVariants = (value: string) => {
  const variants = new Set<string>([value]);
  let current = value;

  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      variants.add(decoded);
      current = decoded;
    } catch {
      break;
    }
  }

  return [...variants];
};

const collectCandidateUrls = (value?: string | null) => {
  if (!value?.trim()) return [];

  const candidates = new Set<string>();

  for (const variant of decodeVariants(value)) {
    for (const match of variant.match(URL_REGEX) ?? []) {
      candidates.add(cleanUrl(match));
    }

    const normalizedVariant = cleanUrl(variant);

    try {
      const parsed = new URL(normalizedVariant);
      candidates.add(parsed.toString());

      for (const key of NESTED_URL_KEYS) {
        const nestedValue = parsed.searchParams.get(key);
        if (!nestedValue) continue;

        for (const nestedVariant of decodeVariants(nestedValue)) {
          const nestedMatch = nestedVariant.match(URL_REGEX)?.[0];
          const candidate = nestedMatch ? cleanUrl(nestedMatch) : cleanUrl(nestedVariant);
          if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
            candidates.add(candidate);
          }
        }
      }
    } catch {
      // Ignore values that are not valid top-level URLs.
    }
  }

  return [...candidates].filter((candidate) => {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  });
};

const isLinkedInUrl = (value: string) => {
  try {
    const hostname = new URL(value).hostname.replace(/^www\./, "");
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com") || hostname === "lnkd.in";
  } catch {
    return false;
  }
};

const scoreJobUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.toLowerCase();
    let score = 0;

    if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com") || hostname === "lnkd.in") score += 40;
    if (path.includes("/jobs/view")) score += 100;
    if (path.includes("/jobs/")) score += 60;
    if (parsed.searchParams.has("currentJobId") || /currentjobid=\d+/i.test(value)) score += 80;
    if (path.includes("/jobs/search") || path.includes("/feed") || path.includes("/comm/jobs")) score -= 50;
    if (path === "/" || path === "/jobs") score -= 20;
    if (value.length > 250) score -= 10;

    return score;
  } catch {
    return -1;
  }
};

export const resolveSharedImport = ({ source, shareText, shareTitle, shareUrl }: ResolveSharedImportArgs): ResolvedSharedImport => {
  const bestUrl = uniqueValues([
    ...collectCandidateUrls(shareUrl),
    ...collectCandidateUrls(shareText),
    ...collectCandidateUrls(shareTitle),
  ]).sort((left, right) => scoreJobUrl(right) - scoreJobUrl(left))[0] ?? "";

  const combinedText = uniqueValues([
    shareTitle?.trim() ?? "",
    shareText?.trim() ?? "",
    bestUrl ? `Job link: ${bestUrl}` : "",
  ]).join("\n\n").trim();

  const shouldPreferText = Boolean(combinedText) && (source === "extension" || isLinkedInUrl(bestUrl) || !bestUrl);

  return {
    preferredTab: shouldPreferText ? "text" : "url",
    text: shouldPreferText ? combinedText : "",
    url: shouldPreferText ? "" : bestUrl,
  };
};