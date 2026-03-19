import { useState, useEffect } from "react";
import { Camera, Pencil, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao The Hive! 🐝",
    description: "Estamos felizes em ter você aqui. Vamos personalizar seu perfil para que todos possam te conhecer melhor.",
    icon: Sparkles,
    highlight: null,
  },
  {
    title: "Adicione sua foto",
    description: "Clique na sua foto de perfil para enviar uma imagem. Uma foto ajuda outros membros a te reconhecer.",
    icon: Camera,
    highlight: "avatar",
  },
  {
    title: "Edite seu nome",
    description: 'Clique em "Editar perfil" para alterar seu nome, adicionar uma bio e incluir seu CNPJ.',
    icon: Pencil,
    highlight: "edit",
  },
];

const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Add highlight class to relevant elements
    const step = steps[currentStep];
    if (step.highlight === "avatar") {
      document.querySelector("[data-onboarding='avatar']")?.classList.add("ring-2", "ring-gold", "ring-offset-2", "ring-offset-background");
    } else if (step.highlight === "edit") {
      document.querySelector("[data-onboarding='edit']")?.classList.add("ring-2", "ring-gold", "ring-offset-2", "ring-offset-background");
    }

    return () => {
      document.querySelector("[data-onboarding='avatar']")?.classList.remove("ring-2", "ring-gold", "ring-offset-2", "ring-offset-background");
      document.querySelector("[data-onboarding='edit']")?.classList.remove("ring-2", "ring-gold", "ring-offset-2", "ring-offset-background");
    };
  }, [currentStep]);

  if (!visible) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    onComplete();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] border border-gold/30 bg-card shadow-2xl shadow-gold/5 overflow-hidden">
          {/* Gold gradient top */}
          <div className="h-1.5 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />

          <div className="p-6">
            {/* Close */}
            <div className="flex justify-end -mt-1 -mr-1 mb-2">
              <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
              <Icon size={24} className="text-gold" />
            </div>

            {/* Content */}
            <h3 className="text-foreground text-base font-heading text-center mb-2">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-sm text-center leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? "w-6 bg-gold"
                      : idx < currentStep
                      ? "w-1.5 bg-gold/50"
                      : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="flex-1 text-muted-foreground text-[.65rem] tracking-wider uppercase font-heading h-10"
              >
                Pular
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-gold text-background hover:bg-gold-light text-[.65rem] tracking-wider uppercase font-heading h-10 gap-1.5"
              >
                {isLast ? "Começar!" : "Próximo"}
                <ArrowRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTutorial;
