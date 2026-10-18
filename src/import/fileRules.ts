export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Only .csv files can be imported.';
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 5 MB.';
  return null;
}
