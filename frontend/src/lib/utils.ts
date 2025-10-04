import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import NepaliDate from "nepali-date-converter"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format AD Date to Nepali BS date with AD time
export function formatNepaliDateTime(dateInput: string | number | Date, options?: { language?: 'en' | 'np' }) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const nepali = NepaliDate.fromAD(date);
  const lang = options?.language ?? 'en';
  const bsDate = nepali.format('YYYY-MM-DD', lang);

  // Keep time from AD side for accuracy
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${bsDate}, ${time}`;
}
