import { describe, expect, it } from "vitest";
import {
  formatMetricValue,
  formatPeriod,
  isStateCode,
  median,
  normalizeHospitalName,
  normalizeStreetAddress,
  percentileRank,
  relativeChange,
  slugify,
} from "./index";

describe("stats", () => {
  it("computes medians for odd, even, and empty lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("computes percentile rank with ties", () => {
    expect(percentileRank(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(45);
    expect(percentileRank(1, [])).toBeNull();
  });

  it("computes relative change and refuses divide-by-zero", () => {
    expect(relativeChange(10, 15)).toBe(0.5);
    expect(relativeChange(0, 5)).toBeNull();
  });
});

describe("normalize", () => {
  it("makes Report Card and CMS hospital names comparable", () => {
    expect(normalizeHospitalName("Northwestern Memorial Hospital")).toBe("northwestern memorial");
    expect(normalizeHospitalName("Saint Joseph Medical Center, Inc.")).toBe("st joseph");
  });

  it("abbreviates street words", () => {
    expect(normalizeStreetAddress("251 East Huron Street")).toBe("251 e huron st");
  });

  it("slugifies names", () => {
    expect(slugify("OSF St. Joseph Medical Center")).toBe("osf-st-joseph-medical-center");
  });
});

describe("format and states", () => {
  it("formats metric values by unit", () => {
    expect(formatMetricValue("rn_hours_per_patient_day", 7.5234)).toBe("7.52 hours");
    expect(formatMetricValue("rn_turnover_rate", 13.351)).toBe("13.4%");
    expect(formatMetricValue("rn_turnover_rate", null)).toBe("Not reported");
  });

  it("formats reporting periods in UTC", () => {
    expect(formatPeriod(new Date("2025-01-01"), new Date("2025-12-31"))).toBe(
      "Jan 2025 to Dec 2025",
    );
  });

  it("validates state codes", () => {
    expect(isStateCode("IL")).toBe(true);
    expect(isStateCode("ZZ")).toBe(false);
  });
});
