// Hand-written "perfect reader" extractions for every labelled posting.
// Purpose: prove the deterministic rules in supabase/functions/_shared/verdict.ts turn a
// correct reading into the confirmed label. When an AI extraction later disagrees with
// this file, the error is in extraction, not in the rules.
import type { Extraction } from "../supabase/functions/_shared/verdict.ts";

type Part = Partial<Extraction>;
const x = (...parts: Part[]): Extraction => Object.assign({}, ...parts);

const sal = (min: number | null, max: number | null, currency: string, quote: string): Part => ({ salary: { min, max, currency, quote } });
const lpa = (min: number, max: number, quote: string): Part => sal(min * 1e5, max * 1e5, "INR", quote);
const worldwide = (quote: string): Part => ({ location: { eligibility: "worldwide", quote } });
const unclearLoc = (quote: string): Part => ({ location: { eligibility: "unclear", quote } });
const places = (countries: string[], quote: string, confirmed = true): Part => ({ location: { eligibility: "listed", countries, confirmed, quote } });
const remote = (quote: string): Part => ({ workModel: { model: "remote", quote } });
const hybrid = (min: number, max: number, quote: string): Part => ({ workModel: { model: "hybrid", officeDaysMin: min, officeDaysMax: max, quote } });
const onsite = (days: number, quote: string): Part => ({ workModel: { model: "onsite", officeDaysMin: days, officeDaysMax: days, quote } });
const emp = (type: NonNullable<Extraction["employmentType"]>["type"], quote: string): Part => ({ employmentType: { type, quote } });
const FT = (quote = "Full-time"): Part => emp("full-time", quote);
const english = (quote: string): Part => ({ languages: [{ language: "English", level: "required", quote }] });
const notice = (maxAcceptedDays: number | null, strict: boolean, quote: string): Part => ({ notice: { maxAcceptedDays, strict, quote } });
const travel = (percentMax: number, quote: string): Part => ({ travel: { percentMax, quote } });

export const ORACLE: Record<string, Extraction> = {
  // ---- earlier synthetic examples ----
  "001": x(lpa(18, 24, "CTC: INR 18-24 LPA"), places(["India"], "Location: Bengaluru (Koramangala)"), onsite(5, "work-from-office role, 5 days a week"), FT(), english("English required"),
    notice(15, true, "Candidates serving notice longer than 15 days will not be considered")),
  "002": x(lpa(30, 40, "Compensation: INR 30-40 LPA"), places(["India"], "3 days a week in our Bengaluru office"), hybrid(3, 3, "Hybrid role: 3 days a week in our Bengaluru office"),
    emp("full-time", "Full-time, permanent"), travel(5, "Occasional travel (under 5%)"), english("Working language is English"), notice(60, false, "Notice period up to 60 days is fine")),
  "003": x(sal(null, null, "INR", "Competitive salary and benefits"), places(["India"], "Work from anywhere in India"), hybrid(3, 3, "expected in the office on Tuesdays to Thursdays"), FT(), english("English communication required")),

  // ---- general: GO ----
  G01: x(sal(60000, 80000, "USD", "Salary: USD 60,000-80,000 per year"), places(["India", "UK", "Poland"], "We hire full-time employees in India, UK and Poland"), remote("Senior Backend Engineer (Remote)"), FT(), travel(0, "Travel: none required"), english("Working language is English")),
  G02: x(sal(55000, 70000, "EUR", "Compensation: EUR 55,000-70,000 per year"), worldwide("Work from anywhere"), remote("Frontend Engineer - Remote, worldwide"), emp("full-time", "full-time employment via Deel"), english("English is our working language")),
  G03: x(sal(50000, 65000, "GBP", "Salary: GBP 50,000-65,000"), worldwide("open to candidates in any country"), remote("Fully remote and asynchronous"), emp("full-time", "Permanent, full-time"), travel(0, "No travel required")),
  G04: x(sal(70000, 90000, "USD", "Pay: $70,000-$90,000 per year"), worldwide("Location: Anywhere in the world"), remote("Location: Anywhere in the world"), FT(), travel(0, "Travel: none, with one optional team offsite per year"), english("English required")),
  G05: x(sal(45000, 60000, "USD", "Salary: $45,000-$60,000 per year"), { location: { eligibility: "timezone", utcMin: 3, utcMax: 8, quote: "Based anywhere between UTC+3 and UTC+8 time zones" } }, remote("QA Lead (Remote)"), FT("Full-time role"), english("English communication required")),
  G06: x(sal(95000, 120000, "USD", "Compensation: USD 95,000-120,000"), worldwide("Work from anywhere"), remote("Work from anywhere"), FT(), travel(5, "Travel: up to 5% for conferences"), english("Language: English")),
  G07: x(sal(40000, 55000, "USD", "Salary: $40,000-$55,000 per year"), worldwide("Remote worldwide"), remote("Remote worldwide"), emp("full-time", "Full-time employee"), english("Fluent English")),
  G08: x(sal(85000, 105000, "USD", "Salary: $85,000-$105,000 USD"), places(["India", "UK", "Poland"], "hiring in India, UK and Poland"), remote("Remote-first team"), FT(), english("Language: English")),

  // ---- general: REVIEW ----
  G09: x(sal(null, null, "USD", "Competitive salary and great benifits"), worldwide("Software Enginer - Remote"), remote("Software Enginer - Remote"), FT(), english("English required")),
  G10: x(sal(60000, 75000, "USD", "Salary: $60,000-$75,000"), unclearLoc("Remote (location flexibility depends on team needs)"), remote("Platform Engineer (Remote)"), FT()),
  G11: x(sal(55000, 70000, "USD", "Salary: $55,000-$70,000"), worldwide("Remote worldwide"), remote("Remote worldwide"), emp("contract-to-hire", "Employment: contract-to-hire, converting to full-time after 6 months")),
  G12: x(sal(40000, 50000, "USD", "Salary: $40,000-$50,000"), worldwide("Remote worldwide"), remote("Remote worldwide"), FT(), { travel: { vague: true, quote: "Some travel to client sites may be required" } }),
  G13: x(sal(110000, 130000, "USD", "Salary: $110,000-$130,000"), unclearLoc("other regions considered case by case"), remote("Remote (US and Canada preferred"), FT()),
  G14: x(sal(null, 50000, "USD", "Salary: up to $50,000 depending on experience"), worldwide("Open to candidates worldwide"), remote("Data Analyst (Remote)"), FT()),
  G15: x(sal(65000, 80000, "USD", "Compensation: $65,000-$80,000"), unclearLoc("Hybrid or remote - discuss with the hiring manager"), { workModel: { model: "unclear", quote: "Hybrid or remote - discuss with the hiring manager" } }, FT()),
  G16: x(worldwide("Product Manager (Remote)"), remote("Product Manager (Remote)"), FT(), english("English required"), sal(null, null, "USD", "Salary: negotiable")),
  G17: x(sal(50000, 65000, "USD", "Salary: $50,000-$65,000"), worldwide("Remote worldwide"), remote("Software Engineer (Remote worldwide)"), FT(),
    { languages: [{ language: "Spanish", level: "preferred", quote: "fluent Spanish preferred" }, { language: "English", level: "required", quote: "English required" }] }),
  G18: x(sal(30000, 100000, "USD", "Salary: $30,000-$100,000 depending on level"), worldwide("Remote worldwide"), remote("Remote worldwide"), FT()),
  G19: x(sal(60000, 80000, "USD", "Salary: $60,000-$80,000"), unclearLoc("(city to be confirmed)"), hybrid(2, 3, "Hybrid, 2-3 days in the office"), FT()),
  G20: x(sal(45000, 55000, "USD", "Salary: $45,000-$55,000"), worldwide("Content Engineer (Remote)"), remote("Content Engineer (Remote)"), emp("unclear", "Full-time equivalent, engaged as an independent contractor")),

  // ---- general: STOP ----
  G21: x(sal(120000, 150000, "USD", "Salary: $120,000-$150,000"), places(["United States"], "Candidates must reside in the United States"), remote("Software Engineer (Remote)"), FT()),
  G22: x(sal(70000, 85000, "GBP", "Salary: GBP 70,000-85,000"), places(["United Kingdom"], "This is an onsite role in London"), onsite(5, "This is an onsite role in London"), FT()),
  G23: x(sal(30000, 30000, "USD", "Pay: $30,000 pro-rated"), worldwide("Open worldwide"), remote("Data Analyst (Remote)"), emp("part-time", "Part-time, 20 hours per week")),
  G24: x(sal(80000, 100000, "USD", "Salary: $80,000-$100,000"), worldwide("open worldwide"), remote("Senior Engineer (Remote)"), FT(),
    { industries: { names: ["online casino", "sports betting"], quote: "an online casino and sports betting platform" } }),
  G25: x(sal(70000, 90000, "USD", "Salary: $70,000-$90,000"), worldwide("open worldwide"), remote("Solutions Engineer (Remote)"), FT(), travel(50, "Travel: up to 50% of the time")),
  G26: x(sal(18000, 22000, "USD", "Salary: $18,000-$22,000 per year"), worldwide("Open to candidates worldwide"), remote("Junior Developer (Remote)"), FT()),
  G27: x(sal(45000, 55000, "USD", "Salary: $45,000-$55,000"), worldwide("Support Engineer (Remote)"), remote("Support Engineer (Remote)"), FT(),
    { languages: [{ language: "German", level: "required", quote: "Fluent German (C1) is mandatory" }] }),
  G28: x(sal(300000, 300000, "AED", "Salary: AED 25,000 per month"), places(["United Arab Emirates"], "Office-based in Dubai, 5 days a week"), onsite(5, "Office-based in Dubai, 5 days a week"), FT()),
  G29: x(worldwide("Open worldwide"), remote("Web Developer (Remote)"), emp("freelance", "Freelance engagement, paid per project")),
  G30: x(sal(65000, 80000, "EUR", "Salary: EUR 65,000-80,000"), places(["EU"], "EU residents only"), remote("Backend Engineer (Remote)"), FT()),

  // ---- india: GO ----
  I01: x(lpa(32, 42, "CTC: INR 32-42 LPA"), places(["India"], "Hybrid: 3 days a week in our Bengaluru office"), hybrid(3, 3, "Hybrid: 3 days a week in our Bengaluru office"), notice(60, false, "Notice period up to 60 days is fine"), FT(), english("Working language: English")),
  I02: x(lpa(28, 36, "CTC: INR 28-36 LPA"), places(["India"], "Work from home anywhere in India"), remote("Work from home anywhere in India"), notice(90, false, "We accept notice periods up to 90 days"), FT()),
  I03: x(lpa(45, 60, "Compensation: INR 45-60 LPA"), places(["India"], "Engineering Lead - Bengaluru"), hybrid(2, 2, "Hybrid, 2 days in office"), FT("Full-time, permanent"),
    { languages: [{ language: "Hindi", level: "required", quote: "Languages: Hindi and English" }, { language: "English", level: "required", quote: "Languages: Hindi and English" }] }),
  I04: x(lpa(26, 30, "CTC: INR 26-30 LPA"), places(["India"], "the Bengaluru hub is optional"), remote("Remote-first; the Bengaluru hub is optional"), FT()),
  I05: x(lpa(30, 30, "CTC: INR 30 LPA fixed plus variable"), places(["India"], "HSR Layout, Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), notice(60, false, "Notice period negotiable up to 60 days"), FT()),

  // ---- india: REVIEW ----
  I06: x(sal(null, null, "INR", "CTC: as per industry standards"), places(["India"], "Software Developer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), FT()),
  I07: x(lpa(30, 38, "CTC: INR 30-38 LPA"), places(["India"], "Backend Engineer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), notice(30, false, "Notice period: 30 days preferred"), FT()),
  I08: x(lpa(28, 28, "CTC: INR 28 LPA"), places(["India"], "occasional visits to the Bengaluru office"), { workModel: { model: "unclear", quote: "Remote, with occasional visits to the Bengaluru office" } }, FT()),
  I09: x(lpa(30, 30, "CTC: INR 30 LPA"), places(["Bengaluru", "Hyderabad", "Pune"], "Location: Bengaluru / Hyderabad / Pune (to be decided)", false), hybrid(3, 3, "Hybrid, 3 days in office"), FT()),
  I10: x(lpa(20, 30, "CTC: INR 20-30 LPA"), places(["India"], "Application Developer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), FT()),
  I11: x(lpa(32, 32, "CTC: INR 32 LPA"), places(["India"], "Data Engineer - Bengaluru"), hybrid(3, 4, "Hybrid, 3 to 4 days in office depending on project"), FT()),

  // ---- india: STOP ----
  I12: x(lpa(30, 35, "CTC: INR 30-35 LPA"), places(["India"], "Software Engineer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), notice(15, true, "Immediate joiners only (0-15 days notice)"), FT()),
  I13: x(lpa(14, 20, "CTC: INR 14-20 LPA"), places(["India"], "Backend Developer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), notice(60, false, "Notice up to 60 days"), FT()),
  I14: x(lpa(30, 30, "CTC: INR 30 LPA"), places(["India"], "Senior Engineer - Bengaluru"), onsite(5, "Work from office, 5 days a week"), notice(60, false, "Notice up to 60 days"), FT()),
  I15: x(sal(96000, 96000, "SGD", "Compensation: SGD 8,000 per month"), places(["Singapore"], "Onsite role in Singapore"), onsite(5, "Onsite role in Singapore"), FT()),
  I16: x(lpa(27, 27, "CTC: INR 27 LPA"), places(["India"], "Operations Engineer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), FT(),
    { languages: [{ language: "Kannada", level: "required", quote: "Kannada fluency (reading, writing and speaking) is mandatory" }] }),
  I17: x(lpa(32, 32, "Pay: INR 32 LPA equivalent"), places(["India"], "Java Developer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), emp("contract", "Contract role for 11 months on third-party payroll")),
  I18: x(lpa(35, 45, "CTC: INR 35-45 LPA"), places(["India"], "Senior Engineer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), FT(),
    { industries: { names: ["real-money gaming", "fantasy sports"], quote: "our real-money gaming and fantasy sports platform" } }),
  I19: x(lpa(16, 16, "CTC: INR 16 LPA"), places(["India"], "Junior Developer - Bengaluru"), onsite(6, "Work from office, 6 days a week"), notice(15, true, "Immediate joiners only, maximum 15 days notice"), FT()),
  I20: x(lpa(30, 30, "CTC: INR 30 LPA"), places(["India"], "Field Solutions Engineer - Bengaluru"), hybrid(3, 3, "Hybrid, 3 days in office"), FT(), travel(40, "Travel: 40% across India")),
};
