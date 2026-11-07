export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHjYdKL-DbXDzp19ukPoJwYJgDYcayWc2wJG4Ho23uReMI3uBAHAgD7PfhaOFdj0it2R88XDF5pEqk/pubhtml';

export function extractSpreadsheetId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/\/spreadsheets\/d\/(?:e\/)?([A-Za-z0-9-_]+)/i) || trimmed.match(/id=([A-Za-z0-9-_]+)/i);
  return match ? match[1] : null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value) + '원';
}

export function normalizeType(value: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) return '기타';

  const mapping: Record<string, string> = {
    모바일: '모바일',
    internet: '인터넷',
    인터넷: '인터넷',
    알뜰: '알뜰폰',
    알뜰폰: '알뜰폰',
    렌탈: '렌탈'
  };

  const lowered = normalized.toLowerCase();
  const lookup = Object.entries(mapping).find(([key]) => key.toLowerCase() === lowered);
  if (lookup) return lookup[1];

  if (lowered.includes('모바일')) return '모바일';
  if (lowered.includes('인터넷')) return '인터넷';
  if (lowered.includes('알뜰')) return '알뜰폰';
  if (lowered.includes('렌탈')) return '렌탈';

  return '기타';
}

export function parseBoolean(value: string | boolean | number | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 || value === 0 ? value === 1 : false;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return false;

  const trueSet = ['o', '○', 'ㅇ', 'y', 'yes', 'true', '1', '✓', '✔', 'ok'];
  const falseSet = ['x', '아니오', 'no', 'n', '0', ''];

  if (trueSet.includes(normalized)) return true;
  if (falseSet.includes(normalized)) return false;

  return normalized.includes('o') || normalized.includes('y') || normalized.includes('1');
}

export function parseCurrency(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const parsed = Number(cleaned.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDateLabel(dateValue: string): { periodStart: string | null; periodEnd: string | null; datePrecision: 'day' | 'range'; monthKey: string } {
  const raw = String(dateValue ?? '').trim();
  if (!raw) {
    return { periodStart: null, periodEnd: null, datePrecision: 'day', monthKey: '' };
  }

  const normalized = raw.replace(/\s+/g, '').replace(/\./g, '-');
  const year = new Date().getFullYear();

  const rangeMatch = normalized.match(/^(\d{1,2})-(\d{1,2})$/);
  if (rangeMatch) {
    const month = String(Number(rangeMatch[1])).padStart(2, '0');
    const day = String(Number(rangeMatch[2])).padStart(2, '0');
    return {
      periodStart: `${year}-${month}-${day}`,
      periodEnd: `${year}-${month}-${day}`,
      datePrecision: 'day',
      monthKey: `${year}-${month}`
    };
  }

  const monthRangeMatch = normalized.match(/^(\d{1,2})-(\d{1,2})-?(\d{1,2})?$/);
  if (monthRangeMatch) {
    const month = Number(monthRangeMatch[1]);
    const startDay = Number(monthRangeMatch[2]);
    const endDay = monthRangeMatch[3] ? Number(monthRangeMatch[3]) : startDay;
    const monthStr = String(month).padStart(2, '0');
    const startStr = String(startDay).padStart(2, '0');
    const endStr = String(endDay).padStart(2, '0');
    return {
      periodStart: `${year}-${monthStr}-${startStr}`,
      periodEnd: `${year}-${monthStr}-${endStr}`,
      datePrecision: 'range',
      monthKey: `${year}-${monthStr}`
    };
  }

  const monthOnly = normalized.match(/^(\d{1,2})$/);
  if (monthOnly) {
    const month = Number(monthOnly[1]);
    return {
      periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
      periodEnd: `${year}-${String(month).padStart(2, '0')}-31`,
      datePrecision: 'range',
      monthKey: `${year}-${String(month).padStart(2, '0')}`
    };
  }

  return {
    periodStart: null,
    periodEnd: null,
    datePrecision: 'day',
    monthKey: ''
  };
}

export function parsePublicGoogleSheet(rawHtml: string): string[][] {
  const start = rawHtml.indexOf('google.visualization.Query.setResponse');
  if (start === -1) {
    return [];
  }

  const section = rawHtml.slice(start);
  const jsonStart = section.indexOf('(');
  const jsonEnd = section.lastIndexOf(')');

  if (jsonStart === -1 || jsonEnd === -1) {
    return [];
  }

  try {
    const payload = JSON.parse(section.slice(jsonStart + 1, jsonEnd));
    const rows = (payload.table?.rows ?? []) as Array<{ c?: Array<{ v?: unknown }> }>;
    const table = rows.map((row) => 
      (row.c ?? []).map((cell) => (cell && 'v' in cell ? String(cell.v ?? '') : ''))
    );

    return table;
  } catch {
    return [];
  }
}

export function parseContractsFromRows(rows: string[][]): any[] {
  if (!rows.length) return [];

  const headerIndex = rows.findIndex((row) => row.some((cell) => /계약번호|유형|금액|모동|부가/i.test(String(cell))));
  if (headerIndex === -1) return [];

  const headers = rows[headerIndex].map((value) => String(value ?? ''));
  const dateIndex = headers.findIndex((value) => /날짜|일자|기간|월|일/i.test(value));
  const managerFieldMap = new Map<string, { contractNumber: number; type: number; addon: number; mobileTransfer: number; amount: number }>();

  headers.forEach((header, index) => {
    const match = header.match(/(.+?)\s*(계약번호|유형|부가|모동|금액)/i);
    if (!match) return;

    const managerName = match[1].trim() || '담당자';
    const fieldKey = match[2].toLowerCase();

    if (!managerFieldMap.has(managerName)) {
      managerFieldMap.set(managerName, { contractNumber: -1, type: -1, addon: -1, mobileTransfer: -1, amount: -1 });
    }

    const fields = managerFieldMap.get(managerName)!;
    if (fieldKey.includes('계약번호')) fields.contractNumber = index;
    if (fieldKey.includes('유형')) fields.type = index;
    if (fieldKey.includes('부가')) fields.addon = index;
    if (fieldKey.includes('모동')) fields.mobileTransfer = index;
    if (fieldKey.includes('금액')) fields.amount = index;
  });

  const contracts: any[] = [];

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const rowNumber = headerIndex + 1 + offset;
    const dateLabel = dateIndex >= 0 ? String(row[dateIndex] ?? '') : '';

    for (const [manager, fields] of managerFieldMap.entries()) {
      const contractNumber = fields.contractNumber >= 0 ? String(row[fields.contractNumber] ?? '').trim() : '';
      if (!contractNumber) continue;

      const typeValue = fields.type >= 0 ? String(row[fields.type] ?? '') : '';
      const amountValue = fields.amount >= 0 ? row[fields.amount] : 0;
      const addonValue = fields.addon >= 0 ? row[fields.addon] : '';
      const mobileTransferValue = fields.mobileTransfer >= 0 ? row[fields.mobileTransfer] : '';
      const metadata = parseDateLabel(dateLabel);

      contracts.push({
        id: `${manager}-${contractNumber}-${rowNumber}`,
        manager,
        contractNumber,
        type: normalizeType(typeValue),
        addon: parseBoolean(addonValue),
        mobileTransfer: parseBoolean(mobileTransferValue),
        amount: parseCurrency(amountValue),
        dateLabel,
        periodStart: metadata.periodStart,
        periodEnd: metadata.periodEnd,
        datePrecision: metadata.datePrecision,
        sourceSheet: 'google-sheets',
        sourceRow: rowNumber,
        monthKey: metadata.monthKey
      });
    }
  });

  return contracts;
}
