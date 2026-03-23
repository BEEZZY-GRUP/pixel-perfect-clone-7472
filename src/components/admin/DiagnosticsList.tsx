import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function DiagnosticsList() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-mono text-xs tracking-[0.2em] text-primary font-semibold">DIAGNÓSTICOS</h2>
        <p className="font-mono text-[10px] text-muted-foreground mt-1">Em breve</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border bg-card/20 p-12 flex flex-col items-center justify-center gap-4"
      >
        <FileText size={32} className="text-muted-foreground/30" />
        <p className="font-mono text-sm text-muted-foreground">Nenhum diagnóstico disponível.</p>
        <p className="font-mono text-[10px] text-muted-foreground/50">Esta funcionalidade será liberada em breve.</p>
      </motion.div>
    </div>
  );
}
