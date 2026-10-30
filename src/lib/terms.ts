export const TERMS_VERSION = "2026-10-30";
export const hasCurrentTerms = (acceptance: { terms_version: string } | null) => acceptance?.terms_version === TERMS_VERSION;