import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

const VaultDeleteConfirm = ({ open, onClose, title, description, onConfirm }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
    setLoading(false);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={() => onClose()}>
      <AlertDialogContent className="bg-[#111] border-white/10 text-[#F2F0E8]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#F2F0E8]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#F2F0E8]/50">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 border-white/10 text-[#F2F0E8]/60 hover:bg-white/10">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VaultDeleteConfirm;
