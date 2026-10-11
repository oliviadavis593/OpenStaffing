/**
 * Normalization used by the Report Card to CMS hospital crosswalk.
 * Matching itself happens in Postgres with pg_trgm; these helpers make both
 * sides comparable first.
 */

const NAME_STOPWORDS = [
  "hospital",
  "medical center",
  "medical ctr",
  "health center",
  "health system",
  "healthcare",
  "health care",
  "the",
  "inc",
  "llc",
  "of",
];

const STREET_ABBREVIATIONS: Record<string, string> = {
  street: "st",
  avenue: "ave",
  road: "rd",
  boulevard: "blvd",
  drive: "dr",
  lane: "ln",
  court: "ct",
  highway: "hwy",
  parkway: "pkwy",
  north: "n",
  south: "s",
  east: "e",
  west: "w",
  suite: "ste",
};

function baseClean(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bsaint\b/g, "st")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHospitalName(name: string): string {
  let out = ` ${baseClean(name)} `;
  for (const word of NAME_STOPWORDS) {
    out = out.replace(new RegExp(`\\s${word}\\s`, "g"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

export function normalizeStreetAddress(address: string): string {
  return baseClean(address)
    .split(" ")
    .map((token) => STREET_ABBREVIATIONS[token] ?? token)
    .join(" ");
}

/** URL-safe slug, for example "Northwestern Memorial Hospital" -> "northwestern-memorial-hospital". */
export function slugify(input: string): string {
  return baseClean(input).replace(/\s/g, "-");
}
