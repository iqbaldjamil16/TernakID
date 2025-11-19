
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type GrowthRecord } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate?: Date | null): string {
  if (!birthDate) {
    return 'N/A';
  }

  const today = new Date();
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  let ageMonths = today.getMonth() - birthDate.getMonth();

  if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
    ageYears--;
    ageMonths += 12;
  }

  if (ageYears < 0) return 'Data Tidak Valid';

  return `${ageYears} Tahun ${ageMonths} Bulan`;
}

export function calculateADG(growthRecords?: GrowthRecord[]) {
  if (!growthRecords || growthRecords.length < 2) {
    return { average: 'N/A', records: growthRecords?.map(r => ({ ...r, adg: 'N/A' })) || [] };
  }

  const sortedRecords = [...growthRecords].sort((a, b) => a.date.getTime() - b.date.getTime());

  let totalADG = 0;
  let count = 0;
  
  const recordsWithADG = sortedRecords.map((current, i) => {
    if (i === 0) {
      return { ...current, adg: 'N/A' };
    }
    const prev = sortedRecords[i - 1];
    const daysDiff = (current.date.getTime() - prev.date.getTime()) / (1000 * 3600 * 24);
    const weightDiff = current.weight - prev.weight;

    if (daysDiff > 0) {
      const adg = (weightDiff / daysDiff).toFixed(2);
      totalADG += parseFloat(adg);
      count++;
      return { ...current, adg };
    }
    return { ...current, adg: 'N/A' };
  });

  const averageADG = count > 0 ? (totalADG / count).toFixed(2) : 'N/A';
  
  return { average: averageADG, records: recordsWithADG };
}

export function formatToYYYYMMDD(date: Date | null | undefined): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

    