import { describe, expect, it } from "vitest";
import {
  calculateCalibrationCoefficient,
  calculatePriority,
  calculateRawEstimate,
  getDaysInPeriod,
  getFlexibilityByCategory,
} from "./calculations";

describe("lib/calculations", () => {
  describe("calculateRawEstimate", () => {
    it("should correctly compute kWh for given power, hours, duty cycle, and days", () => {
      // 1000W for 5 hours/day with duty cycle 0.8 across 30 days
      // (1000 / 1000) * 5 * 30 * 0.8 = 120 kWh
      const result = calculateRawEstimate(1000, 5, 0.8, 30);
      expect(result).toBeCloseTo(120);

      // 1200W inverter AC, 8 hours/day, dutyCycle 0.6, 31 days in August
      // 1.2 * 8 * 31 * 0.6 = 178.56 kWh
      const acResult = calculateRawEstimate(1200, 8, 0.6, 31);
      expect(acResult).toBeCloseTo(178.56);
    });

    it("should return 0 when any parameter is non-positive", () => {
      expect(calculateRawEstimate(0, 5, 1, 30)).toBe(0);
      expect(calculateRawEstimate(1000, 0, 1, 30)).toBe(0);
      expect(calculateRawEstimate(1000, 5, 0, 30)).toBe(0);
      expect(calculateRawEstimate(1000, 5, 1, 0)).toBe(0);
    });
  });

  describe("calculateCalibrationCoefficient", () => {
    it("should divide actual kWh by sum of estimates", () => {
      // actual: 450 kWh, estimated: 300 kWh -> k = 1.5
      expect(calculateCalibrationCoefficient(450, 300)).toBeCloseTo(1.5);

      // actual: 400 kWh, estimated: 500 kWh -> k = 0.8
      expect(calculateCalibrationCoefficient(400, 500)).toBeCloseTo(0.8);
    });

    it("should return 1 when estimatesSum is 0 (division by zero protection)", () => {
      expect(calculateCalibrationCoefficient(450, 0)).toBe(1);
    });
  });

  describe("calculatePriority", () => {
    it("should return RED when score >= 0.15", () => {
      // calibratedKwh = 20, totalKwh = 100, flexibility = 0.9 -> score = 0.18 >= 0.15
      expect(calculatePriority(20, 100, 0.9)).toBe("RED");
      // score exactly 0.15
      expect(calculatePriority(15, 100, 1.0)).toBe("RED");
    });

    it("should return ORANGE when 0.07 <= score < 0.15", () => {
      // calibratedKwh = 10, totalKwh = 100, flexibility = 0.9 -> score = 0.09
      expect(calculatePriority(10, 100, 0.9)).toBe("ORANGE");
      // score exactly 0.07
      expect(calculatePriority(7, 100, 1.0)).toBe("ORANGE");
    });

    it("should return YELLOW when 0.02 <= score < 0.07", () => {
      // calibratedKwh = 5, totalKwh = 100, flexibility = 0.6 -> score = 0.03
      expect(calculatePriority(5, 100, 0.6)).toBe("YELLOW");
      // score exactly 0.02
      expect(calculatePriority(2, 100, 1.0)).toBe("YELLOW");
    });

    it("should return GREEN when score < 0.02 or non-positive", () => {
      // calibratedKwh = 20, totalKwh = 100, flexibility = 0.05 -> score = 0.01 < 0.02
      expect(calculatePriority(20, 100, 0.05)).toBe("GREEN");
      expect(calculatePriority(0, 100, 0.9)).toBe("GREEN");
      expect(calculatePriority(50, 0, 0.9)).toBe("GREEN");
    });
  });

  describe("getFlexibilityByCategory", () => {
    it("should return correct coefficients case-insensitively", () => {
      expect(getFlexibilityByCategory("cooling")).toBe(0.9);
      expect(getFlexibilityByCategory("COOLING")).toBe(0.9);
      expect(getFlexibilityByCategory("Heating")).toBe(0.9);

      expect(getFlexibilityByCategory("washing")).toBe(0.6);
      expect(getFlexibilityByCategory("Dishwasher")).toBe(0.6);

      expect(getFlexibilityByCategory("water_heating")).toBe(0.5);

      expect(getFlexibilityByCategory("LIGHTING")).toBe(0.4);

      expect(getFlexibilityByCategory("fridge")).toBe(0.05);
      expect(getFlexibilityByCategory("Router")).toBe(0.05);
      expect(getFlexibilityByCategory("SECURITY")).toBe(0.05);
    });

    it("should return 0.3 for unknown categories or null/undefined", () => {
      expect(getFlexibilityByCategory(null)).toBe(0.3);
      expect(getFlexibilityByCategory(undefined)).toBe(0.3);
      expect(getFlexibilityByCategory("")).toBe(0.3);
      expect(getFlexibilityByCategory("tv")).toBe(0.3);
      expect(getFlexibilityByCategory("computer")).toBe(0.3);
    });
  });

  describe("getDaysInPeriod", () => {
    it("should return correct number of days for month and year", () => {
      expect(getDaysInPeriod(2026, 8)).toBe(31);
      expect(getDaysInPeriod(2026, 9)).toBe(30);
      expect(getDaysInPeriod(2024, 2)).toBe(29);
      expect(getDaysInPeriod(2026, 2)).toBe(28);
    });
  });
});
