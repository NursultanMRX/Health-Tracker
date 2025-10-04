import { GlucoseReading } from './types';

export function mgDlToMmolL(mgDl: number): number {
  return parseFloat((mgDl / 18.018).toFixed(1));
}

export function mmolLToMgDl(mmolL: number): number {
  return Math.round(mmolL * 18.018);
}

export function formatGlucoseValue(valueMgDl: number, unit: 'mg/dL' | 'mmol/L'): string {
  if (unit === 'mmol/L') {
    return mgDlToMmolL(valueMgDl).toString();
  }
  return valueMgDl.toString();
}

export function calculateTIR(
  readings: GlucoseReading[],
  targetLow: number,
  targetHigh: number
): number {
  if (readings.length === 0) return 0;

  const inRange = readings.filter(
    r => r.value_mg_dl >= targetLow && r.value_mg_dl <= targetHigh
  );

  return Math.round((inRange.length / readings.length) * 100);
}

export function calculateAverage(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;

  const sum = readings.reduce((acc, r) => acc + r.value_mg_dl, 0);
  return Math.round(sum / readings.length);
}

export function calculateCV(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;

  const mean = calculateAverage(readings);
  const variance = readings.reduce((acc, r) => {
    return acc + Math.pow(r.value_mg_dl - mean, 2);
  }, 0) / readings.length;

  const sd = Math.sqrt(variance);
  return Math.round((sd / mean) * 100);
}

export function calculateSD(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;

  const mean = calculateAverage(readings);
  const variance = readings.reduce((acc, r) => {
    return acc + Math.pow(r.value_mg_dl - mean, 2);
  }, 0) / readings.length;

  return Math.round(Math.sqrt(variance));
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
