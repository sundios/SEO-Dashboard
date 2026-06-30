import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSiteName(site: string): string {
  if (!site) return '';
  if (site.startsWith('sc-domain:')) {
    return `${site.replace('sc-domain:', '')} (Domain)`;
  }
  return site.replace('https://', '').replace('http://', '');
} 