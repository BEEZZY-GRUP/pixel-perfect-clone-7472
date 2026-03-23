export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  cnpj: string;
  phone: string | null;
  message: string | null;
  challenge: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  priority: string | null;
  tags: string[] | null;
  archived: boolean;
  archived_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_OPTIONS = [
  { key: "novo", label: "NOVO", color: "bg-blue-500", lightBg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  { key: "contatado", label: "CONTATADO", color: "bg-yellow-500", lightBg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
  { key: "qualificado", label: "QUALIFICADO", color: "bg-emerald-500", lightBg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  { key: "negociacao", label: "NEGOCIAÇÃO", color: "bg-purple-500", lightBg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  { key: "fechado", label: "FECHADO", color: "bg-green-500", lightBg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" },
  { key: "perdido", label: "PERDIDO", color: "bg-red-500", lightBg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
] as const;

export const PRIORITY_OPTIONS = [
  { key: "low", label: "Baixa", emoji: "🟢" },
  { key: "medium", label: "Média", emoji: "🟡" },
  { key: "high", label: "Alta", emoji: "🟠" },
  { key: "urgent", label: "Urgente", emoji: "🔴" },
] as const;

export const CHALLENGE_OPTIONS = [
  "Crescer o faturamento",
  "Organizar processos",
  "Estruturar a gestão",
  "Preparar a liderança",
  "Escalar o negócio",
  "Outro",
];

export const SOURCE_OPTIONS = [
  "website",
  "indicação",
  "whatsapp",
  "instagram",
  "linkedin",
  "evento",
  "manual",
  "outro",
];
