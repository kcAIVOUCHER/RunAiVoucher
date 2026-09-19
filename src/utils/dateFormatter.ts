/**
 * Utilitário de Formatação Visual de Datas para Padrão Brasileiro (DD/MM/AAAA).
 * 
 * Regra do Sistema:
 * - A camada interna do sistema (IA, OCR, banco de dados, ordenação) pode manter datas em YYYY-MM-DD.
 * - Toda e qualquer apresentação visual do voucher DEVE ser convertida para DD/MM/AAAA.
 */

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  let str = dateStr.trim();
  if (!str) return "";

  // 1. Converte ISO com timestamp: 2026-03-04T14:30:00 ou 2026-03-04T14:30
  str = str.replace(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})T(\d{2}:\d{2})(?::\d{2})?/g, (_m, y, mo, d, time) => {
    const day = d.padStart(2, "0");
    const month = mo.padStart(2, "0");
    return `${day}/${month}/${y} às ${time}`;
  });

  // 2. Converte datas ISO YYYY-MM-DD ou YYYY/MM/DD
  str = str.replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (_m, y, mo, d) => {
    const day = d.padStart(2, "0");
    const month = mo.padStart(2, "0");
    return `${day}/${month}/${y}`;
  });

  // 3. Converte formatos com hífen DD-MM-YYYY
  str = str.replace(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g, (_m, d, mo, y) => {
    const day = d.padStart(2, "0");
    const month = mo.padStart(2, "0");
    return `${day}/${month}/${y}`;
  });

  // 4. Garante dois dígitos para dia e mês em D/M/YYYY (ex: 4/3/2026 -> 04/03/2026)
  str = str.replace(/\b(\d{1})\/(\d{1,2})\/(\d{4})\b/g, "0$1/$2/$3");
  str = str.replace(/\b(\d{2})\/(\d{1})\/(\d{4})\b/g, "$1/0$2/$3");

  return str;
}
