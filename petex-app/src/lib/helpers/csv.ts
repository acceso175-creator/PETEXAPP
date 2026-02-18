type CsvValue = string | number | boolean | null | undefined;

const escapeCsvCell = (value: CsvValue) => {
  const normalized = value == null ? '' : String(value);
  if (/[,"\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export const buildCsv = (headers: string[], rows: CsvValue[][]) => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const lines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...lines].join('\n');
};

export const downloadCsvFile = (content: string, filename: string) => {
  const csvWithBom = `\uFEFF${content}`;
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const buildTimestampedFilename = (prefix: string, extension: string, date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
  return `${prefix}_${stamp}.${extension}`;
};

