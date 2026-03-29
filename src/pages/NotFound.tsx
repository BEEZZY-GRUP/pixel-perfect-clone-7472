import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageBackground from "@/components/PageBackground";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <PageBackground />
      <div className="relative z-10 text-center">
        <h1 className="font-display font-black text-[8rem] leading-none tracking-tight text-gold/20">
          404
        </h1>
        <p className="font-heading text-[.7rem] tracking-[.25em] uppercase text-muted-foreground mb-8 font-semibold">
          Página não encontrada
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 group border border-gold bg-gold/10 hover:bg-gold text-gold hover:text-background font-heading text-xs tracking-[0.2em] px-6 py-3 transition-all duration-300 rounded-lg font-bold"
        >
          VOLTAR AO INÍCIO
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export default NotFound;
