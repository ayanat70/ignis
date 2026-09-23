export function formatTenge(amount: number, prefix: string = ""): string {
  const formatted = Math.round(amount).toLocaleString("ru-RU");
  return `${prefix}${formatted} ₸`;
}

export function formatKwh(kwh: number, digits: number = 1): string {
  return `${kwh.toFixed(digits)} кВт·ч`;
}