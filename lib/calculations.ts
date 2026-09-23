export type PriorityLevel = "RED" | "ORANGE" | "YELLOW" | "GREEN";

/**
 * Returns default flexibility coefficient based on device category.
 * Case-insensitive lookup.
 */
export function getFlexibilityByCategory(
  category: string | null | undefined
): number {
  if (!category) {
    return 0.3;
  }

  const normalized = category.trim().toLowerCase();

  switch (normalized) {
    case "cooling":
    case "heating":
      return 0.9;
    case "washing":
    case "dishwasher":
      return 0.6;
    case "water_heating":
      return 0.5;
    case "lighting":
      return 0.4;
    case "fridge":
    case "router":
    case "security":
      return 0.05;
    default:
      return 0.3;
  }
}

/**
 * Calculates raw estimated electricity consumption in kWh.
 * Formula: (P / 1000) * t * days * k_duty
 */
export function calculateRawEstimate(
  ratedPowerWatts: number,
  hoursPerDay: number,
  dutyCycle: number,
  daysInPeriod: number
): number {
  if (
    ratedPowerWatts <= 0 ||
    hoursPerDay <= 0 ||
    daysInPeriod <= 0 ||
    dutyCycle <= 0
  ) {
    return 0;
  }
  return (ratedPowerWatts / 1000) * hoursPerDay * daysInPeriod * dutyCycle;
}

/**
 * Calculates calibration coefficient to reconcile heuristic estimates with actual utility bill.
 * Formula: actualTotalKwh / estimatesSum.
 * If estimatesSum === 0, returns 1.
 */
export function calculateCalibrationCoefficient(
  actualTotalKwh: number,
  estimatesSum: number
): number {
  if (estimatesSum === 0) {
    return 1;
  }
  return actualTotalKwh / estimatesSum;
}

/**
 * Determines energy optimization priority based on calibrated consumption and flexibility.
 * score = (calibratedKwh / totalKwh) * flexibility
 * score >= 0.15 → RED
 * score >= 0.07 → ORANGE
 * score >= 0.02 → YELLOW
 * otherwise → GREEN
 */
export function calculatePriority(
  calibratedKwh: number,
  totalKwh: number,
  flexibility: number
): PriorityLevel {
  if (totalKwh <= 0 || calibratedKwh <= 0) {
    return "GREEN";
  }

  const score = (calibratedKwh / totalKwh) * flexibility;

  if (score >= 0.15) {
    return "RED";
  }
  if (score >= 0.07) {
    return "ORANGE";
  }
  if (score >= 0.02) {
    return "YELLOW";
  }
  return "GREEN";
}

/**
 * Returns number of calendar days in the given month and year.
 * @param periodMonth 1 to 12
 * @param periodYear 4-digit year
 */
export function getDaysInPeriod(
  periodYear: number,
  periodMonth: number
): number {
  return new Date(periodYear, periodMonth, 0).getDate();
}
