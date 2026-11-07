import { DEFAULT_SHEET_URL, parseContractsFromRows, parsePublicGoogleSheet } from './sheets-utils';
import type { SalesContract } from './types';

export async function fetchSpreadsheetContracts(url: string): Promise<SalesContract[]> {
  const safeUrl = url.trim() || DEFAULT_SHEET_URL;
  const spreadsheetId = safeUrl.match(/\/spreadsheets\/d\/(?:e\/)?([A-Za-z0-9-_]+)/i)?.[1];

  if (!spreadsheetId) {
    throw new Error('유효한 Google Sheets URL 또는 Spreadsheet ID가 필요합니다.');
  }

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
  const response = await fetch(sheetUrl, { method: 'GET' });

  if (!response.ok) {
    throw new Error('스프레드시트에 접근할 수 없습니다. 공개 설정 또는 URL을 확인해 주세요.');
  }

  const raw = await response.text();
  const rows = parsePublicGoogleSheet(raw);
  const contracts = parseContractsFromRows(rows) as SalesContract[];

  if (!contracts.length) {
    throw new Error('시트 구조를 분석해 계약 데이터를 찾지 못했습니다. 헤더와 담당자 블록 형식을 확인해 주세요.');
  }

  return contracts;
}
