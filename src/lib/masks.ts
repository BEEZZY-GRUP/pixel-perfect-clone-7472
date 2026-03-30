// ─── Input Mask Utilities ──────────────────────────

/** Remove tudo que não é dígito */
const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** CPF: 000.000.000-00 */
export const maskCPF = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

/** CNPJ: 00.000.000/0000-00 */
export const maskCNPJ = (v: string): string => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

/** Telefone: (00) 00000-0000 ou (00) 0000-0000 */
export const maskPhone = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** CEP: 00000-000 */
export const maskCEP = (v: string): string => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

/** PIS: 000.00000.00-0 */
export const maskPIS = (v: string): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 8) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 8)}.${d.slice(8, 10)}-${d.slice(10)}`;
};

/** Moeda BRL: R$ 1.234,56 — aceita digitação e retorna string formatada */
export const maskCurrency = (v: string): string => {
  // Remove tudo que não é dígito ou vírgula/ponto
  let cleaned = v.replace(/[^\d,]/g, "");
  // Garante apenas uma vírgula
  const parts = cleaned.split(",");
  if (parts.length > 2) cleaned = parts[0] + "," + parts.slice(1).join("");
  // Limita casas decimais a 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + "," + parts[1].slice(0, 2);
  }
  if (!cleaned) return "";
  // Formata a parte inteira com pontos de milhar
  const intPart = parts[0].replace(/\D/g, "");
  const decPart = parts.length > 1 ? "," + parts[1].replace(/\D/g, "").slice(0, 2) : "";
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "R$ " + formatted + decPart;
};

/** Extrai valor numérico de uma string de moeda formatada */
export const unmaskCurrency = (v: string): string => {
  // Remove "R$ ", pontos de milhar, e converte vírgula para ponto
  const cleaned = v.replace(/R\$\s?/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? "0" : String(num);
};

/** Agência: 0000 ou 0000-0 */
export const maskAgency = (v: string): string => {
  const d = onlyDigits(v).slice(0, 5);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
};

/** Conta bancária: 00000-0 */
export const maskAccountNumber = (v: string): string => {
  const d = onlyDigits(v).slice(0, 13);
  if (d.length <= 1) return d;
  return `${d.slice(0, -1)}-${d.slice(-1)}`;
};

/** CNAE: 0000-0/00 */
export const maskCNAE = (v: string): string => {
  const d = onlyDigits(v).slice(0, 7);
  if (d.length <= 4) return d;
  if (d.length <= 5) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`;
};

/** Formata valor numérico para exibição BRL */
export const formatBRL = (v: number): string => {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
