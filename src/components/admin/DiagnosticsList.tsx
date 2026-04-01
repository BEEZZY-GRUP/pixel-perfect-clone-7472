import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Calendar, ChevronRight, Plus, ArrowLeft, Check, ChevronDown, ChevronUp, Building2, User, Clock, TrendingUp, TrendingDown, Minus, Briefcase, Lightbulb, AlertTriangle, Target, CheckCircle2, XCircle, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLeads } from "./LeadsContext";
import type { Lead } from "./types";
import { toast } from "sonner";

interface Diagnostic {
  id: string;
  lead_id: string;
  created_at: string;
  meeting_date: string;
  meeting_type: string;
  commercial_name: string | null;
  company_segment: string | null;
  company_size: string | null;
  employees_count: string | null;
  annual_revenue: string | null;
  years_in_market: string | null;
  main_challenges: string[] | null;
  current_tools: string | null;
  has_defined_processes: boolean;
  has_marketing_strategy: boolean;
  has_sales_team: boolean;
  digital_presence_level: string | null;
  short_term_goals: string | null;
  long_term_goals: string | null;
  revenue_goal: string | null;
  growth_timeline: string | null;
  biggest_pain: string | null;
  tried_solutions: string | null;
  investment_capacity: string | null;
  decision_urgency: string | null;
  decision_maker: string | null;
  decision_process: string | null;
  stakeholders_count: string | null;
  budget_defined: boolean;
  budget_range: string | null;
  competitor_analysis: string | null;
  additional_notes: string | null;
  next_steps: string | null;
  score: number;
  classification: string;
  summary: string | null;
}

// ───── Questionnaire Configuration ─────
const CHALLENGES_OPTIONS = [
  "Falta de processos definidos",
  "Dificuldade em gerar leads",
  "Time de vendas desorganizado",
  "Falta de presença digital",
  "Não consegue escalar",
  "Gestão financeira precária",
  "Falta de liderança",
  "Comunicação interna ruim",
  "Retenção de talentos",
  "Transformação digital",
];

const SEGMENTS = ["Tecnologia", "Varejo", "Serviços", "Indústria", "Saúde", "Educação", "Alimentação", "Construção", "Consultoria", "Outro"];
const COMPANY_SIZES = ["MEI", "ME", "EPP", "Pequena", "Média", "Grande"];
const EMPLOYEES = ["1-5", "6-15", "16-50", "51-100", "101-500", "500+"];
const REVENUES = ["Até R$ 100k", "R$ 100k-500k", "R$ 500k-1M", "R$ 1M-5M", "R$ 5M-20M", "R$ 20M+"];
const YEARS = ["Menos de 1 ano", "1-3 anos", "3-5 anos", "5-10 anos", "10+ anos"];
const DIGITAL_LEVELS = ["Inexistente", "Básico", "Intermediário", "Avançado"];
const TIMELINES = ["Imediato (1-3 meses)", "Curto prazo (3-6 meses)", "Médio prazo (6-12 meses)", "Longo prazo (12+ meses)"];
const URGENCIES = ["Muito urgente", "Urgente", "Moderado", "Sem pressa"];
const BUDGET_RANGES = ["Até R$ 5k/mês", "R$ 5k-15k/mês", "R$ 15k-50k/mês", "R$ 50k-100k/mês", "R$ 100k+/mês"];
const INVESTMENT_OPTIONS = ["Muito baixa", "Baixa", "Moderada", "Alta", "Muito alta"];
const STAKEHOLDERS = ["1 pessoa", "2-3 pessoas", "4-5 pessoas", "6+ pessoas"];
const DECISION_PROCESSES = ["Decisão individual", "Sócios decidem juntos", "Conselho/comitê", "Processo complexo"];

// ───── NEW: Selectable Options for Text Fields ─────
const BIGGEST_PAIN_OPTIONS = [
  "Faturamento estagnado ou caindo",
  "Falta de clientes / leads qualificados",
  "Equipe desalinhada ou desmotivada",
  "Processos manuais ou caóticos",
  "Margem de lucro muito baixa",
  "Falta de presença digital",
  "Dificuldade em reter talentos",
  "Gestão financeira descontrolada",
  "Falta de liderança preparada",
  "Não consegue escalar o negócio",
  "Comunicação interna falha",
  "Concorrência muito agressiva",
  "Dependência do dono na operação",
  "Falta de planejamento estratégico",
];

const TRIED_SOLUTIONS_OPTIONS = [
  "Consultoria tradicional",
  "Agência de marketing/publicidade",
  "Cursos e treinamentos online",
  "Contratou gestor/diretor",
  "Implementou software/ERP",
  "Coaching empresarial",
  "Mentoria individual",
  "Tentou resolver internamente (DIY)",
  "Contratou freelancers",
  "Nada — nunca tentou resolver",
];

const SHORT_TERM_GOALS_OPTIONS = [
  "Aumentar faturamento",
  "Organizar processos internos",
  "Montar/treinar equipe comercial",
  "Implementar marketing digital",
  "Reduzir custos operacionais",
  "Melhorar atendimento ao cliente",
  "Lançar novo produto/serviço",
  "Estruturar o financeiro",
  "Contratar talentos-chave",
  "Automatizar operações",
];

const LONG_TERM_GOALS_OPTIONS = [
  "Se tornar referência no segmento",
  "Abrir filiais / expandir geograficamente",
  "Faturar acima de R$ 10M/ano",
  "Construir marca forte e reconhecida",
  "Ter operação autônoma (sem depender do dono)",
  "Preparar a empresa para venda / fusão",
  "Internacionalizar a operação",
  "Criar modelo de franquia",
  "Desenvolver liderança interna",
  "Alcançar excelência operacional",
];

const REVENUE_GOAL_OPTIONS = [
  "Até R$ 500k/ano",
  "R$ 500k - R$ 1M/ano",
  "R$ 1M - R$ 3M/ano",
  "R$ 3M - R$ 5M/ano",
  "R$ 5M - R$ 10M/ano",
  "R$ 10M - R$ 20M/ano",
  "R$ 20M+/ano",
];

// ───── Helpers for chip-based fields ─────
const CHIP_SEPARATOR = " | ";

function parseChipsAndText(value: string | null | undefined, options: string[]): { chips: string[]; text: string } {
  if (!value) return { chips: [], text: "" };
  const parts = value.split(CHIP_SEPARATOR).map(s => s.trim()).filter(Boolean);
  const chips = parts.filter(p => options.includes(p));
  const text = parts.filter(p => !options.includes(p)).join(CHIP_SEPARATOR);
  return { chips, text };
}

function combineChipsAndText(chips: string[], text: string): string | null {
  const parts = [...chips];
  if (text?.trim()) parts.push(text.trim());
  return parts.length > 0 ? parts.join(CHIP_SEPARATOR) : null;
}

// ───── Beezzy Solutions Mapping (Complete) ─────
interface BeezzySolution {
  solution: string;
  module: string;
  description: string;
  deliverables: string[];
  methodology_pillar: string;
}

const PAIN_SOLUTIONS: Record<string, BeezzySolution> = {
  "Falta de processos definidos": {
    solution: "Gestão de Processos",
    module: "Execução de Verdade",
    description: "Mapeamento completo de processos operacionais, comerciais e administrativos. Documentação de fluxos com responsáveis, prazos e indicadores de performance.",
    deliverables: ["Mapa de processos AS-IS e TO-BE", "Manual operacional documentado", "Fluxogramas por departamento", "Checklist de execução por função", "KPIs de eficiência por processo"],
    methodology_pillar: "Pilar 01 — Diagnóstico + Pilar 03 — Execução",
  },
  "Dificuldade em gerar leads": {
    solution: "MarTech & Aquisição de Clientes",
    module: "Marketing + Tecnologia",
    description: "Construção de funis de aquisição com inbound e outbound marketing, automação de nurturing, campanhas de performance e estratégias de conversão baseadas em dados.",
    deliverables: ["Funil de aquisição completo", "Automação de e-mail marketing", "Landing pages de conversão", "Campanhas pagas (Meta Ads, Google Ads)", "Dashboard de performance de marketing", "Estratégia de conteúdo para atração"],
    methodology_pillar: "Pilar 03 — Execução + Pilar 04 — Resultados",
  },
  "Time de vendas desorganizado": {
    solution: "Reestruturação Comercial Completa",
    module: "Gestão por Resultados",
    description: "Implementação de CRM com pipeline estruturado, criação de scripts de vendas, definição de metas individuais e coletivas, treinamento da equipe e rituais de acompanhamento semanal.",
    deliverables: ["CRM configurado e customizado", "Pipeline de vendas em 6 etapas", "Scripts de abordagem e follow-up", "Metas SMART por vendedor", "Dashboard comercial em tempo real", "Ritual semanal de revisão de pipeline"],
    methodology_pillar: "Pilar 02 — Plano Operacional + Pilar 04 — Resultados",
  },
  "Falta de presença digital": {
    solution: "Posicionamento Digital Estratégico",
    module: "Marketing + Tecnologia",
    description: "Construção de autoridade digital com branding, website profissional, SEO, gestão de redes sociais e estratégia de conteúdo para posicionar a marca como referência no segmento.",
    deliverables: ["Website institucional otimizado", "Perfis otimizados em redes sociais", "Estratégia de SEO e palavras-chave", "Calendário editorial mensal", "Identidade visual digital", "Gestão de Google Meu Negócio"],
    methodology_pillar: "Pilar 03 — Execução",
  },
  "Não consegue escalar": {
    solution: "Aceleração & Escalabilidade",
    module: "Parceiro Estratégico",
    description: "Diagnóstico de gargalos de crescimento, automação de operações repetitivas, estruturação de processos escaláveis e planejamento de expansão com projeções financeiras.",
    deliverables: ["Mapa de gargalos operacionais", "Plano de automação de processos", "Modelo de negócio escalável", "Projeção financeira de crescimento", "Playbook de expansão", "Definição de capacidade operacional"],
    methodology_pillar: "Pilar 01 — Diagnóstico + Pilar 05 — Legado",
  },
  "Gestão financeira precária": {
    solution: "Gestão Financeira & Controle",
    module: "Gestão por Resultados",
    description: "Implantação de DRE gerencial, fluxo de caixa projetado, planejamento orçamentário anual, dashboards financeiros em tempo real e controle rigoroso de custos e margens.",
    deliverables: ["DRE gerencial mensal", "Fluxo de caixa projetado", "Orçamento anual por centro de custo", "Dashboard financeiro em tempo real", "Política de aprovação de gastos", "Análise de margem por produto/serviço"],
    methodology_pillar: "Pilar 04 — Resultados",
  },
  "Falta de liderança": {
    solution: "Desenvolvimento de Liderança & Governance",
    module: "Legado Duradouro",
    description: "Programa de mentoria executiva, treinamento de gestores em liderança situacional, definição de cultura organizacional e implementação de governance com conselhos e rituais de decisão.",
    deliverables: ["Programa de mentoria executiva", "Treinamento de liderança situacional", "Código de cultura organizacional", "Estrutura de governance", "Rituais de liderança (1:1, all-hands)", "Plano de sucessão"],
    methodology_pillar: "Pilar 05 — Legado",
  },
  "Comunicação interna ruim": {
    solution: "Comunicação Organizacional Integrada",
    module: "Execução de Verdade",
    description: "Implantação de ferramentas de comunicação interna, rituais de alinhamento entre times, cultura de feedback contínuo e transparência radical na gestão.",
    deliverables: ["Stack de comunicação interna", "Rituais de alinhamento (daily, weekly, monthly)", "Política de feedback 360°", "Canal de comunicação transparente", "Template de reuniões produtivas", "Onboarding de comunicação para novos"],
    methodology_pillar: "Pilar 03 — Execução",
  },
  "Retenção de talentos": {
    solution: "Gestão de Pessoas & Employer Branding",
    module: "Legado Duradouro",
    description: "Criação de plano de carreira, política salarial competitiva, pesquisa de clima organizacional, programa de onboarding e construção de employer branding para atrair talentos.",
    deliverables: ["Plano de cargos e salários", "Pesquisa de clima organizacional", "Programa de onboarding estruturado", "PDI (Plano de Desenvolvimento Individual)", "Employer branding nas redes", "Política de benefícios e reconhecimento"],
    methodology_pillar: "Pilar 05 — Legado",
  },
  "Transformação digital": {
    solution: "Transformação Digital & Automação",
    module: "Marketing + Tecnologia",
    description: "Migração de ferramentas analógicas para digitais, automação de processos manuais, integração de sistemas e capacitação tecnológica de toda a equipe.",
    deliverables: ["Auditoria de maturidade digital", "Roadmap de transformação digital", "Migração de ferramentas e dados", "Automação de processos-chave", "Treinamento de equipe em novas ferramentas", "Integrações entre sistemas (APIs)"],
    methodology_pillar: "Pilar 01 — Diagnóstico + Pilar 03 — Execução",
  },
};

function calculateScore(form: Record<string, any>): { score: number; classification: string; summary: string } {
  let score = 0;

  const years = YEARS.indexOf(form.years_in_market || "");
  score += Math.min(years * 4, 16);
  if (form.has_defined_processes) score += 4;

  const digital = DIGITAL_LEVELS.indexOf(form.digital_presence_level || "");
  score += digital * 5;
  if (form.has_marketing_strategy) score += 5;

  const urgency = URGENCIES.indexOf(form.decision_urgency || "");
  score += (3 - urgency) * 5;
  const challenges = (form.main_challenges || []).length;
  score += Math.min(challenges * 2, 10);

  if (form.budget_defined) score += 8;
  const budgetIdx = BUDGET_RANGES.indexOf(form.budget_range || "");
  score += Math.min(budgetIdx * 3, 12);

  const inv = INVESTMENT_OPTIONS.indexOf(form.investment_capacity || "");
  score += inv * 5;

  score = Math.min(Math.max(score, 0), 100);

  let classification = "frio";
  let summary = "";

  if (score >= 80) {
    classification = "quente";
    summary = "Cliente altamente qualificado. Alta urgência, orçamento definido e maturidade empresarial elevada. Recomenda-se proposta comercial imediata.";
  } else if (score >= 60) {
    classification = "morno";
    summary = "Cliente com bom potencial. Possui interesse e capacidade de investimento moderada. Recomenda-se nurturing direcionado e follow-up em 1-2 semanas.";
  } else if (score >= 40) {
    classification = "frio";
    summary = "Cliente em fase inicial. Necessita amadurecimento antes de avançar no funil. Recomenda-se conteúdo educativo e acompanhamento mensal.";
  } else {
    classification = "desqualificado";
    summary = "Cliente com baixo potencial no momento. Orçamento limitado ou baixa urgência. Recomenda-se manter na base e reavaliar em 3-6 meses.";
  }

  return { score, classification, summary };
}

// ───── Generate comparative summary ─────
interface ComparisonChange {
  field: string;
  from: string;
  to: string;
  type: "improved" | "declined" | "changed" | "resolved" | "new_issue" | "unchanged";
}

function generateComparativeSummary(current: Diagnostic, previous: Diagnostic): {
  changes: ComparisonChange[];
  unchanged: ComparisonChange[];
  stillPending: string[];
  resolvedItems: string[];
  newIssues: string[];
  evolutionSummary: string;
} {
  const changes: ComparisonChange[] = [];
  const unchanged: ComparisonChange[] = [];

  const orderedFields: Array<{ key: string; label: string; options?: string[] }> = [
    { key: "company_segment", label: "Segmento" },
    { key: "company_size", label: "Porte", options: COMPANY_SIZES },
    { key: "employees_count", label: "Colaboradores", options: EMPLOYEES },
    { key: "annual_revenue", label: "Faturamento", options: REVENUES },
    { key: "digital_presence_level", label: "Presença digital", options: DIGITAL_LEVELS },
    { key: "investment_capacity", label: "Capacidade de investimento", options: INVESTMENT_OPTIONS },
    { key: "decision_urgency", label: "Urgência", options: URGENCIES },
    { key: "budget_range", label: "Faixa de orçamento", options: BUDGET_RANGES },
    { key: "growth_timeline", label: "Prazo de crescimento", options: TIMELINES },
    { key: "current_tools", label: "Ferramentas atuais" },
    { key: "decision_maker", label: "Decisor principal" },
    { key: "decision_process", label: "Processo decisório" },
    { key: "stakeholders_count", label: "Stakeholders", options: STAKEHOLDERS },
    { key: "commercial_name", label: "Comercial responsável" },
  ];

  for (const f of orderedFields) {
    const prev = (previous as any)[f.key] || "";
    const curr = (current as any)[f.key] || "";
    if (prev !== curr && (prev || curr)) {
      let type: ComparisonChange["type"] = "changed";
      if (f.options) {
        const prevIdx = f.options.indexOf(prev);
        const currIdx = f.options.indexOf(curr);
        if (prevIdx >= 0 && currIdx >= 0) {
          if (f.key === "decision_urgency") {
            type = currIdx < prevIdx ? "improved" : "declined";
          } else {
            type = currIdx > prevIdx ? "improved" : "declined";
          }
        }
      }
      changes.push({ field: f.label, from: prev || "—", to: curr || "—", type });
    } else if (prev && curr && prev === curr) {
      unchanged.push({ field: f.label, from: prev, to: curr, type: "unchanged" });
    }
  }

  const boolFields: Array<{ key: string; label: string }> = [
    { key: "has_defined_processes", label: "Processos definidos" },
    { key: "has_marketing_strategy", label: "Estratégia de marketing" },
    { key: "has_sales_team", label: "Time comercial" },
    { key: "budget_defined", label: "Orçamento definido" },
  ];

  for (const f of boolFields) {
    const prev = (previous as any)[f.key];
    const curr = (current as any)[f.key];
    if (prev !== curr) {
      changes.push({ field: f.label, from: prev ? "Sim" : "Não", to: curr ? "Sim" : "Não", type: curr ? "resolved" : "declined" });
    } else {
      unchanged.push({ field: f.label, from: prev ? "Sim" : "Não", to: curr ? "Sim" : "Não", type: "unchanged" });
    }
  }

  // Text fields comparison
  const textFields: Array<{ key: string; label: string; options?: string[] }> = [
    { key: "biggest_pain", label: "Maior dor", options: BIGGEST_PAIN_OPTIONS },
    { key: "short_term_goals", label: "Metas curto prazo", options: SHORT_TERM_GOALS_OPTIONS },
    { key: "long_term_goals", label: "Metas longo prazo", options: LONG_TERM_GOALS_OPTIONS },
    { key: "revenue_goal", label: "Meta de faturamento", options: REVENUE_GOAL_OPTIONS },
    { key: "tried_solutions", label: "Soluções tentadas", options: TRIED_SOLUTIONS_OPTIONS },
    { key: "competitor_analysis", label: "Análise de concorrentes" },
    { key: "next_steps", label: "Próximos passos" },
    { key: "additional_notes", label: "Observações adicionais" },
  ];

  for (const f of textFields) {
    const prev = (previous as any)[f.key] || "";
    const curr = (current as any)[f.key] || "";
    if (prev !== curr && (prev || curr)) {
      changes.push({ field: f.label, from: prev || "—", to: curr || "—", type: "changed" });
    } else if (prev && curr && prev === curr) {
      unchanged.push({ field: f.label, from: prev, to: curr, type: "unchanged" });
    }
  }

  // Challenges diff
  const prevChallenges = previous.main_challenges || [];
  const currChallenges = current.main_challenges || [];
  const newChallenges = currChallenges.filter(c => !prevChallenges.includes(c));
  const resolvedChallenges = prevChallenges.filter(c => !currChallenges.includes(c));
  const stillPendingChallenges = currChallenges.filter(c => prevChallenges.includes(c));

  if (newChallenges.length > 0) {
    changes.push({ field: "Novos desafios identificados", from: "—", to: newChallenges.join(", "), type: "new_issue" });
  }
  if (resolvedChallenges.length > 0) {
    changes.push({ field: "Desafios resolvidos ✅", from: resolvedChallenges.join(", "), to: "Resolvido", type: "resolved" });
  }
  if (stillPendingChallenges.length > 0) {
    changes.push({ field: "Desafios ainda pendentes ⚠️", from: stillPendingChallenges.join(", "), to: "Sem resolução", type: "declined" });
  }

  // Bool flags still negative (issues not addressed)
  const stillNegativeBools = boolFields.filter(f => !(current as any)[f.key] && !(previous as any)[f.key]);
  if (stillNegativeBools.length > 0) {
    for (const f of stillNegativeBools) {
      if (!changes.find(c => c.field === f.label)) {
        changes.push({ field: `${f.label} — ainda não implementado`, from: "Não", to: "Não", type: "new_issue" });
      }
    }
  }

  const scoreDiff = current.score - previous.score;
  let evolutionSummary = "";
  if (scoreDiff > 15) {
    evolutionSummary = `Evolução significativa (+${scoreDiff} pts). O cliente amadureceu consideravelmente desde o último diagnóstico, demonstrando maior urgência e capacidade de investimento.`;
  } else if (scoreDiff > 0) {
    evolutionSummary = `Evolução positiva (+${scoreDiff} pts). Houve avanços pontuais desde a última avaliação, indicando progresso no amadurecimento.`;
  } else if (scoreDiff === 0) {
    evolutionSummary = "Cenário estável. Não houve alteração significativa no score. Recomenda-se ações para acelerar o amadurecimento.";
  } else if (scoreDiff > -15) {
    evolutionSummary = `Leve regressão (${scoreDiff} pts). Alguns indicadores pioraram. Atenção ao engajamento e comunicação com o cliente.`;
  } else {
    evolutionSummary = `Regressão significativa (${scoreDiff} pts). É necessário reavaliar o interesse e disponibilidade do cliente antes de prosseguir.`;
  }

  return {
    changes,
    unchanged,
    stillPending: stillPendingChallenges,
    resolvedItems: resolvedChallenges,
    newIssues: newChallenges,
    evolutionSummary,
  };
}

// ───── Chip Selector Component ─────
function ChipSelector({ options, selected, onToggle, label }: { options: string[]; selected: string[]; onToggle: (opt: string) => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`font-heading text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
            selected.includes(opt)
              ? "bg-gold/15 text-gold border-gold-border font-semibold"
              : "bg-card/20 text-muted-foreground/50 border-border/30 hover:border-border/50 hover:text-muted-foreground/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ───── Main Component ─────
export default function DiagnosticsList() {
  const { leads } = useLeads();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewDiag, setViewDiag] = useState<Diagnostic | null>(null);

  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const loadDiagnostics = async (leadId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("lead_id", leadId)
      .order("meeting_date", { ascending: true });
    setDiagnostics((data as unknown as Diagnostic[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedLead) loadDiagnostics(selectedLead.id);
  }, [selectedLead]);

  // ───── Lead List View ─────
  if (!selectedLead) {
    return (
      <div className="space-y-5">
        <div>
          <p className="section-eyebrow">Diagnósticos</p>
          <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
            Selecione um cliente para ver os diagnósticos
          </h2>
        </div>

        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full bg-card/20 border border-border/40 rounded-lg pl-9 pr-4 py-2.5 text-sm font-heading text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-gold-border transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLeads.map((lead, i) => (
            <motion.button
              key={lead.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedLead(lead)}
              className="text-left rounded-lg border border-border/40 bg-card/10 backdrop-blur-sm p-4 hover:border-gold-border/50 hover:bg-card/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold-border/30 flex items-center justify-center font-heading text-gold text-xs font-bold">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading text-sm text-foreground font-semibold group-hover:text-gold transition-colors">{lead.name}</p>
                    <p className="font-heading text-[10px] text-muted-foreground/50">{lead.company}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-gold/60 transition-colors mt-1" />
              </div>
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/20">
                <span className="font-heading text-[9px] text-muted-foreground/40 flex items-center gap-1">
                  <Building2 size={9} /> {lead.cnpj}
                </span>
                <span className="font-heading text-[9px] text-muted-foreground/40 flex items-center gap-1">
                  <Calendar size={9} /> {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="border border-border/30 rounded-lg bg-card/10 p-12 flex flex-col items-center gap-3">
            <FileText size={28} className="text-muted-foreground/20" />
            <p className="font-heading text-sm text-muted-foreground/40">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    );
  }

  // ───── Viewing a Single Diagnostic Result ─────
  if (viewDiag) {
    const diagIdx = diagnostics.findIndex(d => d.id === viewDiag.id);
    const previousDiag = diagIdx > 0 ? diagnostics[diagIdx - 1] : null;
    return (
      <DiagnosticResult
        diagnostic={viewDiag}
        lead={selectedLead}
        previousDiagnostic={previousDiag}
        onBack={() => setViewDiag(null)}
      />
    );
  }

  // ───── Diagnostic Form ─────
  if (showForm) {
    return (
      <DiagnosticForm
        lead={selectedLead}
        lastDiagnostic={diagnostics.length > 0 ? diagnostics[diagnostics.length - 1] : null}
        onBack={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          loadDiagnostics(selectedLead.id);
        }}
      />
    );
  }

  // ───── Lead Diagnostics List ─────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedLead(null)} className="p-2 text-muted-foreground/50 hover:text-gold transition-colors rounded-lg hover:bg-gold-dim">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="section-eyebrow">Diagnósticos</p>
            <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
              {selectedLead.name} | {selectedLead.company}
            </h2>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2.5 bg-gold/90 text-background hover:bg-gold transition-all rounded-lg font-bold shadow-[0_0_20px_hsl(var(--gold)/0.15)]"
        >
          <Plus size={13} /> NOVO DIAGNÓSTICO
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : diagnostics.length === 0 ? (
        <div className="border border-border/30 rounded-lg bg-card/10 p-12 flex flex-col items-center gap-4">
          <FileText size={32} className="text-muted-foreground/20" />
          <p className="font-heading text-sm text-muted-foreground/40">Nenhum diagnóstico realizado.</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2.5 border border-gold-border text-gold hover:bg-gold-dim transition-all rounded-lg font-semibold"
          >
            <Plus size={13} /> CRIAR PRIMEIRO DIAGNÓSTICO
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {diagnostics.map((diag, i) => {
            const classColors: Record<string, string> = {
              quente: "text-green-400 bg-green-500/10 border-green-500/30",
              morno: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
              frio: "text-blue-400 bg-blue-500/10 border-blue-500/30",
              desqualificado: "text-red-400 bg-red-500/10 border-red-500/30",
            };
            const colorClass = classColors[diag.classification] || classColors.frio;
            const prevDiag = i > 0 ? diagnostics[i - 1] : null;
            const scoreDiff = prevDiag ? diag.score - prevDiag.score : null;
            return (
              <motion.button
                key={diag.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setViewDiag(diag)}
                className="w-full text-left rounded-lg border border-border/40 bg-card/10 backdrop-blur-sm p-4 hover:border-gold-border/50 hover:bg-card/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold-border/30 flex items-center justify-center">
                      <FileText size={16} className="text-gold/70" />
                    </div>
                    <div>
                      <p className="font-heading text-sm text-foreground font-semibold">
                        Diagnóstico | {new Date(diag.meeting_date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="font-heading text-[10px] text-muted-foreground/50">
                        {diag.meeting_type === "online" ? "Reunião Online" : diag.meeting_type === "presencial" ? "Presencial" : "Telefone"}
                        {diag.commercial_name && ` · ${diag.commercial_name}`}
                        {i === diagnostics.length - 1 && diagnostics.length > 1 && <span className="text-gold/60 ml-2">· Mais recente</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scoreDiff !== null && (
                      <span className={`font-heading text-[10px] font-semibold flex items-center gap-0.5 ${scoreDiff > 0 ? "text-green-400" : scoreDiff < 0 ? "text-red-400" : "text-muted-foreground/40"}`}>
                        {scoreDiff > 0 ? <TrendingUp size={11} /> : scoreDiff < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                        {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="font-heading text-lg font-bold text-gold">{diag.score}<span className="text-xs text-muted-foreground/40">/100</span></p>
                    </div>
                    <span className={`font-heading text-[9px] tracking-[0.1em] px-2.5 py-1 rounded border font-semibold uppercase ${colorClass}`}>
                      {diag.classification}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-gold/60 transition-colors" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───── Diagnostic Form Component ─────
function DiagnosticForm({ lead, lastDiagnostic, onBack, onSaved }: { lead: Lead; lastDiagnostic: Diagnostic | null; onBack: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const defaultForm: Record<string, any> = {
    meeting_date: new Date().toISOString().split("T")[0],
    meeting_type: "online",
    commercial_name: "",
    company_segment: "",
    company_size: "",
    employees_count: "",
    annual_revenue: "",
    years_in_market: "",
    main_challenges: [] as string[],
    current_tools: "",
    has_defined_processes: false,
    has_marketing_strategy: false,
    has_sales_team: false,
    digital_presence_level: "",
    // Chip-based fields
    short_term_goals_chips: [] as string[],
    short_term_goals_text: "",
    long_term_goals_chips: [] as string[],
    long_term_goals_text: "",
    revenue_goal: "",
    growth_timeline: "",
    biggest_pain_chips: [] as string[],
    biggest_pain_text: "",
    tried_solutions_chips: [] as string[],
    tried_solutions_text: "",
    investment_capacity: "",
    decision_urgency: "",
    decision_maker: "",
    decision_process: "",
    stakeholders_count: "",
    budget_defined: false,
    budget_range: "",
    competitor_analysis: "",
    additional_notes: "",
    next_steps: "",
  };

  // Pre-fill from last diagnostic
  const initialForm = useMemo(() => {
    if (!lastDiagnostic) return defaultForm;
    const f = { ...defaultForm };
    // Direct copy fields
    const directKeys = [
      "commercial_name", "company_segment", "company_size", "employees_count",
      "annual_revenue", "years_in_market", "main_challenges", "current_tools",
      "has_defined_processes", "has_marketing_strategy", "has_sales_team",
      "digital_presence_level", "revenue_goal", "growth_timeline",
      "investment_capacity", "decision_urgency", "decision_maker",
      "decision_process", "stakeholders_count", "budget_defined", "budget_range",
      "competitor_analysis",
    ];
    for (const key of directKeys) {
      const val = (lastDiagnostic as any)[key];
      if (val !== null && val !== undefined) f[key] = val;
    }
    // Parse chip-based fields from saved strings
    const chipFields: Array<{ dbKey: string; chipsKey: string; textKey: string; options: string[] }> = [
      { dbKey: "short_term_goals", chipsKey: "short_term_goals_chips", textKey: "short_term_goals_text", options: SHORT_TERM_GOALS_OPTIONS },
      { dbKey: "long_term_goals", chipsKey: "long_term_goals_chips", textKey: "long_term_goals_text", options: LONG_TERM_GOALS_OPTIONS },
      { dbKey: "biggest_pain", chipsKey: "biggest_pain_chips", textKey: "biggest_pain_text", options: BIGGEST_PAIN_OPTIONS },
      { dbKey: "tried_solutions", chipsKey: "tried_solutions_chips", textKey: "tried_solutions_text", options: TRIED_SOLUTIONS_OPTIONS },
    ];
    for (const cf of chipFields) {
      const parsed = parseChipsAndText((lastDiagnostic as any)[cf.dbKey], cf.options);
      f[cf.chipsKey] = parsed.chips;
      f[cf.textKey] = parsed.text;
    }
    return f;
  }, [lastDiagnostic]);

  const [form, setForm] = useState<Record<string, any>>(initialForm);

  useEffect(() => {
    if (lastDiagnostic && !prefilled) {
      setPrefilled(true);
    }
  }, [lastDiagnostic]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const toggleChallenge = (c: string) => {
    const current = form.main_challenges || [];
    update("main_challenges", current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c]);
  };
  const toggleChip = (chipsKey: string, value: string) => {
    const current: string[] = form[chipsKey] || [];
    update(chipsKey, current.includes(value) ? current.filter((x: string) => x !== value) : [...current, value]);
  };

  const inputClass = "w-full bg-card/20 border border-border/40 rounded-lg px-3 py-2.5 text-sm font-heading text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-gold-border transition-colors";
  const labelClass = "font-heading text-[10px] tracking-[0.15em] text-muted-foreground/70 mb-1.5 block font-semibold";
  const selectClass = inputClass + " appearance-none cursor-pointer";

  const steps = [
    { title: "Informações da Reunião", icon: "📋" },
    { title: "Perfil da Empresa", icon: "🏢" },
    { title: "Situação Atual", icon: "📊" },
    { title: "Metas & Objetivos", icon: "🎯" },
    { title: "Dores & Soluções", icon: "💡" },
    { title: "Tomada de Decisão", icon: "🤝" },
    { title: "Observações Finais", icon: "📝" },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Combine chip-based fields into strings for DB
    const dbForm = { ...form };
    dbForm.short_term_goals = combineChipsAndText(form.short_term_goals_chips || [], form.short_term_goals_text || "");
    dbForm.long_term_goals = combineChipsAndText(form.long_term_goals_chips || [], form.long_term_goals_text || "");
    dbForm.biggest_pain = combineChipsAndText(form.biggest_pain_chips || [], form.biggest_pain_text || "");
    dbForm.tried_solutions = combineChipsAndText(form.tried_solutions_chips || [], form.tried_solutions_text || "");
    // Remove chip/text helper fields
    delete dbForm.short_term_goals_chips;
    delete dbForm.short_term_goals_text;
    delete dbForm.long_term_goals_chips;
    delete dbForm.long_term_goals_text;
    delete dbForm.biggest_pain_chips;
    delete dbForm.biggest_pain_text;
    delete dbForm.tried_solutions_chips;
    delete dbForm.tried_solutions_text;

    const { score, classification, summary } = calculateScore(dbForm);
    const payload = {
      lead_id: lead.id,
      ...dbForm,
      score,
      classification,
      summary,
    };
    const { error } = await supabase.from("diagnostics").insert(payload as any);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar diagnóstico");
      return;
    }
    toast.success("Diagnóstico salvo com sucesso!");
    onSaved();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-muted-foreground/50 hover:text-gold transition-colors rounded-lg hover:bg-gold-dim">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="section-eyebrow">Novo Diagnóstico</p>
          <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
            {lead.name} | {lead.company}
          </h2>
        </div>
      </div>

      {/* Pre-fill notice */}
      {lastDiagnostic && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-gold-border/30 bg-gold/5 px-4 py-3 flex items-start gap-3"
        >
          <Lightbulb size={16} className="text-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-heading text-xs text-gold font-semibold">Dados do último diagnóstico carregados</p>
            <p className="font-heading text-[10px] text-muted-foreground/60 mt-0.5">
              As respostas do diagnóstico de {new Date(lastDiagnostic.meeting_date).toLocaleDateString("pt-BR")} foram pré-carregadas. Atualize apenas o que mudou.
            </p>
          </div>
        </motion.div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-heading text-[9px] tracking-[0.1em] font-semibold whitespace-nowrap transition-all ${
              step === i ? "bg-gold/15 text-gold border border-gold-border" : "text-muted-foreground/40 hover:text-muted-foreground/60 border border-transparent"
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden md:inline">{s.title}</span>
            <span className="md:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Form content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-border/40 bg-card/10 backdrop-blur-sm p-6"
        >
          <h3 className="font-heading text-sm text-gold font-semibold mb-5 flex items-center gap-2">
            <span className="text-lg">{steps[step].icon}</span>
            {steps[step].title}
          </h3>

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>DATA DA REUNIÃO</label>
                  <input type="date" value={form.meeting_date} onChange={(e) => update("meeting_date", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>TIPO</label>
                  <select value={form.meeting_type} onChange={(e) => update("meeting_type", e.target.value)} className={selectClass}>
                    <option value="online">Online (Meet/Zoom)</option>
                    <option value="presencial">Presencial</option>
                    <option value="telefone">Telefone</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>COMERCIAL RESPONSÁVEL</label>
                  <input value={form.commercial_name} onChange={(e) => update("commercial_name", e.target.value)} className={inputClass} placeholder="Nome do comercial" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SEGMENTO</label>
                  <select value={form.company_segment} onChange={(e) => update("company_segment", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>PORTE</label>
                  <select value={form.company_size} onChange={(e) => update("company_size", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>COLABORADORES</label>
                  <select value={form.employees_count} onChange={(e) => update("employees_count", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {EMPLOYEES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>FATURAMENTO ANUAL</label>
                  <select value={form.annual_revenue} onChange={(e) => update("annual_revenue", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {REVENUES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>TEMPO DE MERCADO</label>
                  <select value={form.years_in_market} onChange={(e) => update("years_in_market", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {YEARS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>PRINCIPAIS DESAFIOS</label>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGES_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChallenge(c)}
                      className={`font-heading text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
                        (form.main_challenges || []).includes(c)
                          ? "bg-red-500/15 text-red-400 border-red-500/30 font-semibold"
                          : "bg-card/20 text-muted-foreground/50 border-border/30 hover:border-border/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>FERRAMENTAS ATUAIS</label>
                <input value={form.current_tools} onChange={(e) => update("current_tools", e.target.value)} className={inputClass} placeholder="Ex: Planilhas, ERP, CRM..." />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>ESTRUTURA ATUAL</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_defined_processes} onChange={(e) => update("has_defined_processes", e.target.checked)} className="accent-[hsl(var(--gold))]" />
                  <span className="font-heading text-xs text-foreground/70">Processos definidos</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_marketing_strategy} onChange={(e) => update("has_marketing_strategy", e.target.checked)} className="accent-[hsl(var(--gold))]" />
                  <span className="font-heading text-xs text-foreground/70">Estratégia de marketing ativa</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_sales_team} onChange={(e) => update("has_sales_team", e.target.checked)} className="accent-[hsl(var(--gold))]" />
                  <span className="font-heading text-xs text-foreground/70">Time comercial</span>
                </label>
              </div>
              <div>
                <label className={labelClass}>PRESENÇA DIGITAL</label>
                <select value={form.digital_presence_level} onChange={(e) => update("digital_presence_level", e.target.value)} className={selectClass}>
                  <option value="">Selecione</option>
                  {DIGITAL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>METAS DE CURTO PRAZO (3-6 meses)</label>
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-2">Selecione as metas aplicáveis e complemente se necessário</p>
                <ChipSelector
                  options={SHORT_TERM_GOALS_OPTIONS}
                  selected={form.short_term_goals_chips || []}
                  onToggle={(opt) => toggleChip("short_term_goals_chips", opt)}
                />
                <textarea
                  value={form.short_term_goals_text || ""}
                  onChange={(e) => update("short_term_goals_text", e.target.value)}
                  className={`${inputClass} min-h-[60px] resize-y mt-2`}
                  placeholder="Detalhes adicionais sobre metas de curto prazo..."
                />
              </div>
              <div>
                <label className={labelClass}>METAS DE LONGO PRAZO (1-3 anos)</label>
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-2">Selecione as metas aplicáveis e complemente se necessário</p>
                <ChipSelector
                  options={LONG_TERM_GOALS_OPTIONS}
                  selected={form.long_term_goals_chips || []}
                  onToggle={(opt) => toggleChip("long_term_goals_chips", opt)}
                />
                <textarea
                  value={form.long_term_goals_text || ""}
                  onChange={(e) => update("long_term_goals_text", e.target.value)}
                  className={`${inputClass} min-h-[60px] resize-y mt-2`}
                  placeholder="Detalhes adicionais sobre a visão de futuro..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>META DE FATURAMENTO</label>
                  <select value={form.revenue_goal} onChange={(e) => update("revenue_goal", e.target.value)} className={selectClass}>
                    <option value="">Selecione a faixa</option>
                    {REVENUE_GOAL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>PRAZO PARA CRESCIMENTO</label>
                  <select value={form.growth_timeline} onChange={(e) => update("growth_timeline", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {TIMELINES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>MAIOR DOR DO CLIENTE</label>
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-2">Selecione as dores identificadas e detalhe se necessário</p>
                <ChipSelector
                  options={BIGGEST_PAIN_OPTIONS}
                  selected={form.biggest_pain_chips || []}
                  onToggle={(opt) => toggleChip("biggest_pain_chips", opt)}
                />
                <textarea
                  value={form.biggest_pain_text || ""}
                  onChange={(e) => update("biggest_pain_text", e.target.value)}
                  className={`${inputClass} min-h-[60px] resize-y mt-2`}
                  placeholder="Detalhes adicionais sobre a dor principal..."
                />
              </div>
              <div>
                <label className={labelClass}>SOLUÇÕES JÁ TENTADAS</label>
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-2">O que o cliente já tentou para resolver?</p>
                <ChipSelector
                  options={TRIED_SOLUTIONS_OPTIONS}
                  selected={form.tried_solutions_chips || []}
                  onToggle={(opt) => toggleChip("tried_solutions_chips", opt)}
                />
                <textarea
                  value={form.tried_solutions_text || ""}
                  onChange={(e) => update("tried_solutions_text", e.target.value)}
                  className={`${inputClass} min-h-[60px] resize-y mt-2`}
                  placeholder="Detalhes sobre tentativas anteriores..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CAPACIDADE DE INVESTIMENTO</label>
                  <select value={form.investment_capacity} onChange={(e) => update("investment_capacity", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {INVESTMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>URGÊNCIA DA DECISÃO</label>
                  <select value={form.decision_urgency} onChange={(e) => update("decision_urgency", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {URGENCIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>DECISOR PRINCIPAL</label>
                  <input value={form.decision_maker} onChange={(e) => update("decision_maker", e.target.value)} className={inputClass} placeholder="Quem toma a decisão final?" />
                </div>
                <div>
                  <label className={labelClass}>PROCESSO DECISÓRIO</label>
                  <select value={form.decision_process} onChange={(e) => update("decision_process", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {DECISION_PROCESSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>STAKEHOLDERS ENVOLVIDOS</label>
                  <select value={form.stakeholders_count} onChange={(e) => update("stakeholders_count", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {STAKEHOLDERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>FAIXA DE ORÇAMENTO</label>
                  <select value={form.budget_range} onChange={(e) => update("budget_range", e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {BUDGET_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.budget_defined} onChange={(e) => update("budget_defined", e.target.checked)} className="accent-[hsl(var(--gold))]" />
                <span className="font-heading text-xs text-foreground/70">O cliente já tem orçamento definido para este projeto?</span>
              </label>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>ANÁLISE DE CONCORRENTES</label>
                <textarea value={form.competitor_analysis} onChange={(e) => update("competitor_analysis", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Quem são os concorrentes? Qual o diferencial do cliente?" />
              </div>
              <div>
                <label className={labelClass}>OBSERVAÇÕES ADICIONAIS</label>
                <textarea value={form.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Notas gerais sobre a reunião..." />
              </div>
              <div>
                <label className={labelClass}>PRÓXIMOS PASSOS</label>
                <textarea value={form.next_steps} onChange={(e) => update("next_steps", e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="O que foi combinado para dar seguimento?" />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : onBack()}
          className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2.5 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-all rounded-lg font-semibold"
        >
          <ArrowLeft size={12} /> {step > 0 ? "ANTERIOR" : "CANCELAR"}
        </button>
        <div className="font-heading text-[10px] text-muted-foreground/40">
          {step + 1} de {steps.length}
        </div>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-4 py-2.5 bg-gold/15 text-gold border border-gold-border hover:bg-gold/25 transition-all rounded-lg font-semibold"
          >
            PRÓXIMO <ChevronRight size={12} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 font-heading text-[10px] tracking-[0.15em] px-5 py-2.5 bg-gold/90 text-background hover:bg-gold transition-all rounded-lg font-bold shadow-[0_0_20px_hsl(var(--gold)/0.15)] disabled:opacity-50"
          >
            <Check size={12} /> {saving ? "SALVANDO..." : "FINALIZAR DIAGNÓSTICO"}
          </button>
        )}
      </div>
    </div>
  );
}

// ───── Display chips from saved string ─────
function DisplayChips({ value, options, highlightColor = "red" }: { value: string | null; options?: string[]; highlightColor?: "red" | "gold" | "blue" | "green" }) {
  if (!value) return <span className="font-heading text-xs text-muted-foreground/40 italic">Não informado</span>;
  const parts = value.split(CHIP_SEPARATOR).map(s => s.trim()).filter(Boolean);
  const colorMap = {
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    gold: "bg-gold/10 text-gold border-gold-border/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  const chipClass = colorMap[highlightColor];
  const knownOptions = options || [];

  return (
    <div className="space-y-2">
      {parts.some(p => knownOptions.includes(p)) && (
        <div className="flex flex-wrap gap-1.5">
          {parts.filter(p => knownOptions.includes(p)).map((p, i) => (
            <span key={i} className={`font-heading text-[10px] px-3 py-1.5 rounded-lg border font-medium ${chipClass}`}>{p}</span>
          ))}
        </div>
      )}
      {parts.filter(p => !knownOptions.includes(p)).map((p, i) => (
        <p key={i} className="font-heading text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">{p}</p>
      ))}
    </div>
  );
}

// ───── Diagnostic Result View ─────
function DiagnosticResult({ diagnostic, lead, previousDiagnostic, onBack }: { diagnostic: Diagnostic; lead: Lead; previousDiagnostic: Diagnostic | null; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const classColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    quente: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", label: "CLIENTE QUENTE 🔥" },
    morno: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", label: "CLIENTE MORNO ☀️" },
    frio: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "CLIENTE FRIO ❄️" },
    desqualificado: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "DESQUALIFICADO ⛔" },
  };
  const cc = classColors[diagnostic.classification] || classColors.frio;

  const comparison = previousDiagnostic ? generateComparativeSummary(diagnostic, previousDiagnostic) : null;

  const challenges = diagnostic.main_challenges || [];
  const defaultSolution: BeezzySolution = { solution: "Consultoria Personalizada", module: "Parceiro Estratégico", description: "Análise e desenvolvimento de solução sob medida para este desafio específico.", deliverables: ["Diagnóstico personalizado", "Plano de ação customizado", "Acompanhamento semanal"], methodology_pillar: "Pilar 01 — Diagnóstico" };
  
  const commercialSolutions: Array<{ pain: string } & BeezzySolution> = challenges
    .map(c => ({ pain: c, ...(PAIN_SOLUTIONS[c] || defaultSolution) }));

  // Additional solutions based on biggest_pain
  if (diagnostic.biggest_pain) {
    const painParts = diagnostic.biggest_pain.split(CHIP_SEPARATOR).map(s => s.trim().toLowerCase());
    const painMappings: Array<{ keywords: string[]; challengeKey: string; fallbackSolution: string }> = [
      { keywords: ["vend", "comercial", "cliente", "receita", "faturamento"], challengeKey: "Time de vendas desorganizado", fallbackSolution: "Reestruturação Comercial Completa" },
      { keywords: ["financ", "caixa", "lucr", "prejuízo", "custo", "margem"], challengeKey: "Gestão financeira precária", fallbackSolution: "Gestão Financeira & Controle" },
      { keywords: ["equipe", "time", "pessoas", "funcionário", "colaborador", "rh", "reter", "talento"], challengeKey: "Retenção de talentos", fallbackSolution: "Gestão de Pessoas & Employer Branding" },
      { keywords: ["líder", "gestor", "gestão", "gerente", "direção", "liderança"], challengeKey: "Falta de liderança", fallbackSolution: "Desenvolvimento de Liderança & Governance" },
      { keywords: ["digital", "tecnolog", "sistema", "software", "automaç"], challengeKey: "Transformação digital", fallbackSolution: "Transformação Digital & Automação" },
      { keywords: ["marketing", "marca", "divulg", "rede social", "instagram", "presença"], challengeKey: "Falta de presença digital", fallbackSolution: "Posicionamento Digital Estratégico" },
      { keywords: ["cresc", "escal", "expand"], challengeKey: "Não consegue escalar", fallbackSolution: "Aceleração & Escalabilidade" },
      { keywords: ["process", "organiz", "bagunça", "caos", "manual", "caótico"], challengeKey: "Falta de processos definidos", fallbackSolution: "Gestão de Processos" },
      { keywords: ["comunic", "alinha", "feedback"], challengeKey: "Comunicação interna ruim", fallbackSolution: "Comunicação Organizacional Integrada" },
      { keywords: ["planejamento", "estratég"], challengeKey: "Não consegue escalar", fallbackSolution: "Aceleração & Escalabilidade" },
      { keywords: ["dependência", "dono", "operação"], challengeKey: "Não consegue escalar", fallbackSolution: "Aceleração & Escalabilidade" },
      { keywords: ["concorrência", "concorrente"], challengeKey: "Dificuldade em gerar leads", fallbackSolution: "MarTech & Aquisição de Clientes" },
    ];
    for (const mapping of painMappings) {
      if (painParts.some(part => mapping.keywords.some(k => part.includes(k))) && !commercialSolutions.find(s => s.solution === (PAIN_SOLUTIONS[mapping.challengeKey]?.solution || mapping.fallbackSolution))) {
        const sol = PAIN_SOLUTIONS[mapping.challengeKey] || defaultSolution;
        const matchedPain = diagnostic.biggest_pain!.split(CHIP_SEPARATOR).find(p => mapping.keywords.some(k => p.toLowerCase().includes(k))) || diagnostic.biggest_pain!;
        commercialSolutions.push({ pain: `Dor: "${matchedPain.trim()}"`, ...sol });
      }
    }
  }

  // Auto-detect from diagnostic flags
  if (!diagnostic.has_defined_processes && !commercialSolutions.find(s => s.pain === "Falta de processos definidos")) {
    commercialSolutions.push({ pain: "Empresa sem processos definidos", ...PAIN_SOLUTIONS["Falta de processos definidos"] });
  }
  if (!diagnostic.has_marketing_strategy && !commercialSolutions.find(s => s.solution.includes("MarTech"))) {
    commercialSolutions.push({ pain: "Sem estratégia de marketing ativa", ...PAIN_SOLUTIONS["Dificuldade em gerar leads"] });
  }
  if (!diagnostic.has_sales_team && !commercialSolutions.find(s => s.solution.includes("Comercial"))) {
    commercialSolutions.push({ pain: "Sem time comercial estruturado", ...PAIN_SOLUTIONS["Time de vendas desorganizado"] });
  }
  if (diagnostic.digital_presence_level && ["Inexistente", "Básico"].includes(diagnostic.digital_presence_level) && !commercialSolutions.find(s => s.solution.includes("Digital"))) {
    commercialSolutions.push({ pain: `Presença digital ${diagnostic.digital_presence_level.toLowerCase()}`, ...PAIN_SOLUTIONS["Falta de presença digital"] });
  }

  const sections = [
    {
      title: "Perfil da Empresa",
      items: [
        { label: "Segmento", value: diagnostic.company_segment },
        { label: "Porte", value: diagnostic.company_size },
        { label: "Colaboradores", value: diagnostic.employees_count },
        { label: "Faturamento anual", value: diagnostic.annual_revenue },
        { label: "Tempo de mercado", value: diagnostic.years_in_market },
        { label: "Comercial responsável", value: diagnostic.commercial_name },
      ],
    },
    {
      title: "Situação Atual",
      items: [
        { label: "Ferramentas atuais", value: diagnostic.current_tools },
        { label: "Processos definidos", value: diagnostic.has_defined_processes ? "✅ Sim" : "❌ Não" },
        { label: "Estratégia de marketing", value: diagnostic.has_marketing_strategy ? "✅ Sim" : "❌ Não" },
        { label: "Time comercial", value: diagnostic.has_sales_team ? "✅ Sim" : "❌ Não" },
        { label: "Presença digital", value: diagnostic.digital_presence_level },
        { label: "Capacidade de investimento", value: diagnostic.investment_capacity },
        { label: "Urgência da decisão", value: diagnostic.decision_urgency },
      ],
    },
    {
      title: "Tomada de Decisão",
      items: [
        { label: "Decisor principal", value: diagnostic.decision_maker },
        { label: "Processo decisório", value: diagnostic.decision_process },
        { label: "Stakeholders envolvidos", value: diagnostic.stakeholders_count },
        { label: "Orçamento definido", value: diagnostic.budget_defined ? "✅ Sim" : "❌ Não" },
        { label: "Faixa de orçamento", value: diagnostic.budget_range },
      ],
    },
  ];

  const richSections: Array<{
    title: string;
    icon: string;
    content?: string | null;
    items?: string[];
    type: "chips" | "text" | "display_chips";
    highlight?: boolean;
    extra?: string | null;
    options?: string[];
    chipColor?: "red" | "gold" | "blue" | "green";
  }> = [
    {
      title: "DESAFIOS IDENTIFICADOS",
      icon: "🚨",
      items: (diagnostic.main_challenges || []),
      type: "chips",
    },
    {
      title: "MAIOR DOR DO CLIENTE",
      icon: "🔥",
      content: diagnostic.biggest_pain,
      type: "display_chips",
      highlight: true,
      options: BIGGEST_PAIN_OPTIONS,
      chipColor: "red",
    },
    {
      title: "METAS DE CURTO PRAZO (3-6 MESES)",
      icon: "🎯",
      content: diagnostic.short_term_goals,
      type: "display_chips",
      options: SHORT_TERM_GOALS_OPTIONS,
      chipColor: "gold",
    },
    {
      title: "METAS DE LONGO PRAZO (1-3 ANOS)",
      icon: "🏔️",
      content: diagnostic.long_term_goals,
      type: "display_chips",
      options: LONG_TERM_GOALS_OPTIONS,
      chipColor: "blue",
    },
    {
      title: "META DE FATURAMENTO",
      icon: "💰",
      content: diagnostic.revenue_goal,
      type: "text",
      extra: diagnostic.growth_timeline ? `Prazo para crescimento: ${diagnostic.growth_timeline}` : null,
    },
    {
      title: "SOLUÇÕES JÁ TENTADAS",
      icon: "🔄",
      content: diagnostic.tried_solutions,
      type: "display_chips",
      options: TRIED_SOLUTIONS_OPTIONS,
      chipColor: "gold",
    },
    {
      title: "ANÁLISE DE CONCORRENTES",
      icon: "🏁",
      content: diagnostic.competitor_analysis,
      type: "text",
    },
    {
      title: "OBSERVAÇÕES ADICIONAIS",
      icon: "📝",
      content: diagnostic.additional_notes,
      type: "text",
    },
    {
      title: "PRÓXIMOS PASSOS",
      icon: "▶️",
      content: diagnostic.next_steps,
      type: "text",
      highlight: true,
    },
  ];

  const tabs = [
    { label: "Resultado", icon: <Target size={12} /> },
    ...(comparison ? [{ label: "Evolução", icon: <TrendingUp size={12} /> }] : []),
    { label: "Diagnóstico Comercial", icon: <Briefcase size={12} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-muted-foreground/50 hover:text-gold transition-colors rounded-lg hover:bg-gold-dim">
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="section-eyebrow">Resultado do Diagnóstico</p>
          <h2 className="font-heading text-foreground text-xl font-light tracking-tight">
            {lead.name} | {lead.company}
          </h2>
        </div>
      </div>

      {/* Score header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border ${cc.border} ${cc.bg} p-6`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`font-heading text-3xl font-bold ${cc.text}`}>{diagnostic.score}</p>
              <p className="font-heading text-[9px] text-muted-foreground/40 tracking-[0.1em]">SCORE</p>
            </div>
            <div className="w-px h-12 bg-border/20" />
            <div>
              <span className={`font-heading text-sm font-bold tracking-[0.1em] ${cc.text}`}>{cc.label}</span>
              <p className="font-heading text-[11px] text-foreground/50 mt-1 max-w-md">{diagnostic.summary}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[9px] text-muted-foreground/40">
              {new Date(diagnostic.meeting_date).toLocaleDateString("pt-BR")} · {diagnostic.meeting_type === "online" ? "Online" : diagnostic.meeting_type === "presencial" ? "Presencial" : "Telefone"}
            </p>
            {diagnostic.commercial_name && (
              <p className="font-heading text-[10px] text-muted-foreground/50 mt-0.5">{diagnostic.commercial_name}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/20 pb-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-heading text-[10px] tracking-[0.12em] font-semibold transition-all rounded-t-lg ${
              activeTab === i ? "text-gold border-b-2 border-gold" : "text-muted-foreground/40 hover:text-muted-foreground/60"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Resultado */}
      {activeTab === 0 && (
        <>
          {/* Compact info sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {sections.map((section, si) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.05 }}
                className="rounded-lg border border-border/40 bg-card/10 backdrop-blur-sm p-5"
              >
                <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-4 font-semibold">{section.title.toUpperCase()}</p>
                <div className="space-y-2.5">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex justify-between items-start gap-2">
                      <span className="font-heading text-[10px] text-muted-foreground/50 shrink-0">{item.label}</span>
                      <span className="font-heading text-xs text-foreground/80 text-right">{item.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rich sections */}
          <div className="space-y-4">
            {richSections.map((section, si) => {
              if (section.type === "chips" && section.items && section.items.length > 0) {
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.04 }}
                    className="rounded-lg border border-border/40 bg-card/10 backdrop-blur-sm p-5"
                  >
                    <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-3 font-semibold flex items-center gap-2">
                      <span>{section.icon}</span> {section.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item: string, ii: number) => (
                        <span key={ii} className="font-heading text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              }
              if (section.type === "display_chips" && section.content) {
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.04 }}
                    className={`rounded-lg border ${section.highlight ? "border-gold-border/40 bg-gold/5" : "border-border/40 bg-card/10"} backdrop-blur-sm p-5`}
                  >
                    <p className={`font-heading text-[10px] tracking-[0.2em] ${section.highlight ? "text-gold" : "text-gold/80"} mb-3 font-semibold flex items-center gap-2`}>
                      <span>{section.icon}</span> {section.title}
                    </p>
                    <DisplayChips value={section.content} options={section.options} highlightColor={section.chipColor || "gold"} />
                    {section.extra && (
                      <p className="font-heading text-[10px] text-muted-foreground/50 mt-2 pt-2 border-t border-border/20">
                        {section.extra}
                      </p>
                    )}
                  </motion.div>
                );
              }
              if (section.type === "text" && section.content) {
                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.04 }}
                    className={`rounded-lg border ${section.highlight ? "border-gold-border/40 bg-gold/5" : "border-border/40 bg-card/10"} backdrop-blur-sm p-5`}
                  >
                    <p className={`font-heading text-[10px] tracking-[0.2em] ${section.highlight ? "text-gold" : "text-gold/80"} mb-3 font-semibold flex items-center gap-2`}>
                      <span>{section.icon}</span> {section.title}
                    </p>
                    <p className={`font-heading text-sm ${section.highlight ? "text-foreground/90 font-medium" : "text-foreground/70"} whitespace-pre-wrap leading-relaxed`}>
                      {section.content}
                    </p>
                    {section.extra && (
                      <p className="font-heading text-[10px] text-muted-foreground/50 mt-2 pt-2 border-t border-border/20">
                        {section.extra}
                      </p>
                    )}
                  </motion.div>
                );
              }
              return null;
            })}
          </div>
        </>
      )}

      {/* Tab: Evolução */}
      {comparison && activeTab === 1 && (
        <div className="space-y-5">
          {/* Evolution summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border/40 bg-card/10 p-5"
          >
            <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-3 font-semibold">RESUMO DA EVOLUÇÃO</p>
            <p className="font-heading text-sm text-foreground/70">{comparison.evolutionSummary}</p>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/20">
              <div className="text-center">
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-1">ANTERIOR</p>
                <p className="font-heading text-lg font-bold text-muted-foreground/60">{previousDiagnostic!.score}</p>
              </div>
              <div className="flex-1 h-px bg-border/30 relative">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded font-heading text-[10px] font-bold ${
                  diagnostic.score > previousDiagnostic!.score ? "bg-green-500/10 text-green-400" : diagnostic.score < previousDiagnostic!.score ? "bg-red-500/10 text-red-400" : "bg-border/20 text-muted-foreground/40"
                }`}>
                  {diagnostic.score - previousDiagnostic!.score > 0 ? "+" : ""}{diagnostic.score - previousDiagnostic!.score} pts
                </div>
              </div>
              <div className="text-center">
                <p className="font-heading text-[9px] text-muted-foreground/40 mb-1">ATUAL</p>
                <p className={`font-heading text-lg font-bold ${cc.text}`}>{diagnostic.score}</p>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
              <CheckCircle2 size={16} className="text-green-400 mx-auto mb-1" />
              <p className="font-heading text-lg font-bold text-green-400">{comparison.resolvedItems.length}</p>
              <p className="font-heading text-[8px] tracking-[0.15em] text-green-400/60">RESOLVIDOS</p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
              <XCircle size={16} className="text-red-400 mx-auto mb-1" />
              <p className="font-heading text-lg font-bold text-red-400">{comparison.stillPending.length}</p>
              <p className="font-heading text-[8px] tracking-[0.15em] text-red-400/60">PENDENTES</p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
              <AlertTriangle size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="font-heading text-lg font-bold text-yellow-400">{comparison.newIssues.length}</p>
              <p className="font-heading text-[8px] tracking-[0.15em] text-yellow-400/60">NOVOS PROBLEMAS</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/10 p-3 text-center">
              <ArrowRightLeft size={16} className="text-muted-foreground/40 mx-auto mb-1" />
              <p className="font-heading text-lg font-bold text-muted-foreground/60">{comparison.changes.length}</p>
              <p className="font-heading text-[8px] tracking-[0.15em] text-muted-foreground/40">TOTAL ALTERAÇÕES</p>
            </div>
          </div>

          {/* Resolved items */}
          {comparison.resolvedItems.length > 0 && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-green-400 mb-3 font-semibold flex items-center gap-2">
                <CheckCircle2 size={12} /> DESAFIOS RESOLVIDOS
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.resolvedItems.map((item, i) => (
                  <span key={i} className="font-heading text-[10px] px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-medium line-through">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Still pending */}
          {comparison.stillPending.length > 0 && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-red-400 mb-3 font-semibold flex items-center gap-2">
                <XCircle size={12} /> DESAFIOS AINDA PENDENTES
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.stillPending.map((item, i) => (
                  <span key={i} className="font-heading text-[10px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* New issues */}
          {comparison.newIssues.length > 0 && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-yellow-400 mb-3 font-semibold flex items-center gap-2">
                <AlertTriangle size={12} /> NOVOS DESAFIOS IDENTIFICADOS
              </p>
              <div className="flex flex-wrap gap-2">
                {comparison.newIssues.map((item, i) => (
                  <span key={i} className="font-heading text-[10px] px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All changes detail */}
          {comparison.changes.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card/10 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-4 font-semibold">O QUE MUDOU — DETALHAMENTO COMPLETO</p>
              <div className="space-y-3">
                {comparison.changes.map((change, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 py-2.5 border-b border-border/15 last:border-0"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      change.type === "improved" || change.type === "resolved" ? "bg-green-500/10" :
                      change.type === "declined" || change.type === "new_issue" ? "bg-red-500/10" : "bg-gold/10"
                    }`}>
                      {change.type === "improved" || change.type === "resolved" ? <TrendingUp size={11} className="text-green-400" /> :
                       change.type === "declined" ? <TrendingDown size={11} className="text-red-400" /> :
                       change.type === "new_issue" ? <AlertTriangle size={11} className="text-red-400" /> :
                       <ArrowRightLeft size={11} className="text-gold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-xs text-foreground/80 font-semibold">{change.field}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-heading text-[10px] text-muted-foreground/40 line-through">{change.from}</span>
                        <ChevronRight size={10} className="text-muted-foreground/20" />
                        <span className={`font-heading text-[10px] font-medium ${
                          change.type === "improved" || change.type === "resolved" ? "text-green-400" :
                          change.type === "declined" || change.type === "new_issue" ? "text-red-400" : "text-gold"
                        }`}>{change.to}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Unchanged items */}
          {comparison.unchanged.length > 0 && (
            <div className="rounded-lg border border-border/30 bg-card/5 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground/50 mb-4 font-semibold flex items-center gap-2">
                <Minus size={12} /> SEM ALTERAÇÃO ({comparison.unchanged.length} itens)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {comparison.unchanged.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 px-3 rounded bg-card/10">
                    <span className="font-heading text-[10px] text-muted-foreground/40">{item.field}</span>
                    <span className="font-heading text-[10px] text-muted-foreground/50 font-medium">{item.from}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.changes.length === 0 && comparison.unchanged.length === 0 && (
            <div className="rounded-lg border border-border/30 bg-card/10 p-8 text-center">
              <Minus size={24} className="text-muted-foreground/20 mx-auto mb-2" />
              <p className="font-heading text-sm text-muted-foreground/40">Nenhuma mudança identificada entre os diagnósticos.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Diagnóstico Comercial */}
      {activeTab === (comparison ? 2 : 1) && (
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-gold-border/30 bg-gold/5 p-5"
          >
            <div className="flex items-start gap-3">
              <Briefcase size={18} className="text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-heading text-sm text-gold font-bold">Diagnóstico Comercial Beezzy</p>
                <p className="font-heading text-[11px] text-foreground/50 mt-1">
                  Mapeamento de dores identificadas e soluções Beezzy recomendadas para {lead.company}. 
                  Use este relatório como guia na apresentação comercial.
                </p>
              </div>
            </div>
          </motion.div>

          {commercialSolutions.length > 0 ? (
            <div className="space-y-4">
              {commercialSolutions.map((sol, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-lg border border-border/40 bg-card/10 overflow-hidden"
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[9px] tracking-[0.15em] text-red-400/70 font-semibold mb-1">DOR IDENTIFICADA</p>
                      <p className="font-heading text-sm text-foreground/80 font-semibold">{sol.pain}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-4 border-t border-border/20 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold-border/30 flex items-center justify-center shrink-0">
                      <Lightbulb size={16} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-heading text-[9px] tracking-[0.15em] text-gold/70 font-semibold">SOLUÇÃO BEEZZY</p>
                        {sol.module && <span className="font-heading text-[8px] px-2 py-0.5 rounded bg-gold/10 text-gold/60 border border-gold-border/20">{sol.module}</span>}
                      </div>
                      <p className="font-heading text-sm text-gold font-bold">{sol.solution}</p>
                      <p className="font-heading text-[11px] text-foreground/50 mt-1.5 leading-relaxed">{sol.description}</p>
                      {sol.deliverables && sol.deliverables.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/15">
                          <p className="font-heading text-[8px] tracking-[0.15em] text-muted-foreground/50 font-semibold mb-2">ENTREGÁVEIS</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {sol.deliverables.map((d: string, di: number) => (
                              <div key={di} className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-gold/40 shrink-0" />
                                <span className="font-heading text-[10px] text-foreground/60">{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {sol.methodology_pillar && (
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <Target size={9} className="text-muted-foreground/30" />
                          <span className="font-heading text-[9px] text-muted-foreground/40 italic">{sol.methodology_pillar}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border/30 bg-card/10 p-8 text-center">
              <Lightbulb size={24} className="text-muted-foreground/20 mx-auto mb-2" />
              <p className="font-heading text-sm text-muted-foreground/40">Nenhuma dor específica mapeada. Selecione desafios no diagnóstico para gerar recomendações.</p>
            </div>
          )}

          {/* Context from diagnostic answers */}
          {(diagnostic.biggest_pain || diagnostic.tried_solutions || diagnostic.short_term_goals || diagnostic.long_term_goals) && (
            <div className="rounded-lg border border-border/40 bg-card/10 p-5">
              <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-4 font-semibold">CONTEXTO DO CLIENTE</p>
              <div className="space-y-4">
                {diagnostic.biggest_pain && (
                  <div>
                    <p className="font-heading text-[9px] tracking-[0.15em] text-red-400/70 font-semibold mb-1.5">🔥 MAIOR DOR</p>
                    <DisplayChips value={diagnostic.biggest_pain} options={BIGGEST_PAIN_OPTIONS} highlightColor="red" />
                  </div>
                )}
                {diagnostic.tried_solutions && (
                  <div>
                    <p className="font-heading text-[9px] tracking-[0.15em] text-muted-foreground/50 font-semibold mb-1.5">🔄 JÁ TENTOU</p>
                    <DisplayChips value={diagnostic.tried_solutions} options={TRIED_SOLUTIONS_OPTIONS} highlightColor="gold" />
                  </div>
                )}
                {diagnostic.short_term_goals && (
                  <div>
                    <p className="font-heading text-[9px] tracking-[0.15em] text-muted-foreground/50 font-semibold mb-1.5">🎯 METAS CURTO PRAZO</p>
                    <DisplayChips value={diagnostic.short_term_goals} options={SHORT_TERM_GOALS_OPTIONS} highlightColor="gold" />
                  </div>
                )}
                {diagnostic.long_term_goals && (
                  <div>
                    <p className="font-heading text-[9px] tracking-[0.15em] text-muted-foreground/50 font-semibold mb-1.5">🏔️ METAS LONGO PRAZO</p>
                    <DisplayChips value={diagnostic.long_term_goals} options={LONG_TERM_GOALS_OPTIONS} highlightColor="blue" />
                  </div>
                )}
                {diagnostic.next_steps && (
                  <div>
                    <p className="font-heading text-[9px] tracking-[0.15em] text-gold/70 font-semibold mb-1">▶️ PRÓXIMOS PASSOS</p>
                    <p className="font-heading text-xs text-foreground/70 whitespace-pre-wrap font-medium">{diagnostic.next_steps}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary box */}
          <div className="rounded-lg border border-border/40 bg-card/10 p-5">
            <p className="font-heading text-[10px] tracking-[0.2em] text-gold/80 mb-3 font-semibold">RESUMO PARA O COMERCIAL</p>
            <div className="space-y-2 font-heading text-xs text-foreground/60 leading-relaxed">
              <p>
                <strong className="text-foreground/80">Cliente:</strong> {lead.company} ({diagnostic.company_segment || "Segmento não informado"})
              </p>
              <p>
                <strong className="text-foreground/80">Perfil:</strong> {diagnostic.company_size || "—"} · {diagnostic.employees_count || "—"} colaboradores · {diagnostic.annual_revenue || "Faturamento não informado"}
              </p>
              <p>
                <strong className="text-foreground/80">Dores:</strong> {challenges.length} desafios mapeados{diagnostic.biggest_pain ? ` | Principal: "${diagnostic.biggest_pain.split(CHIP_SEPARATOR)[0]}"` : ""}
              </p>
              <p>
                <strong className="text-foreground/80">Capacidade:</strong> Investimento {diagnostic.investment_capacity || "—"} · Urgência {diagnostic.decision_urgency || "—"} · Orçamento {diagnostic.budget_defined ? diagnostic.budget_range || "Definido" : "Não definido"}
              </p>
              <p>
                <strong className="text-foreground/80">Decisor:</strong> {diagnostic.decision_maker || "—"} · Processo: {diagnostic.decision_process || "—"}
              </p>
              <p>
                <strong className="text-foreground/80">Soluções recomendadas:</strong> {commercialSolutions.map(s => s.solution).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
