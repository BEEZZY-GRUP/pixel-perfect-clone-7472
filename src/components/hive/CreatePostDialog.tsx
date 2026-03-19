import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  defaultCategorySlug: string | null;
  isAdmin?: boolean;
}

const CreatePostDialog = ({ open, onOpenChange, categories, defaultCategorySlug, isAdmin }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const defaultCat = categories.find((c) => c.slug === defaultCategorySlug);
  const [categoryId, setCategoryId] = useState(defaultCat?.id || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Filter out staff-only categories for non-admin
  const availableCategories = categories.filter((c) => !c.staff_only || isAdmin);

  const createPost = useMutation({
    mutationFn: async () => {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const forceAnon = selectedCat?.slug === "confessionario";
      const { error } = await supabase.from("posts").insert({
        user_id: user!.id,
        category_id: categoryId,
        title: title.trim(),
        content: content.trim(),
        is_anonymous: forceAnon ? true : isAnonymous,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Publicação criada!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao criar publicação."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    createPost.mutate();
  };

  // Update categoryId when dialog opens with new default
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const cat = categories.find((c) => c.slug === defaultCategorySlug);
      if (cat && !cat.staff_only) setCategoryId(cat.id);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-background border-border max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wider text-foreground">
            Nova Publicação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-heading">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-secondary border border-border text-foreground text-sm px-3 py-2 rounded-sm"
              required
            >
              <option value="">Selecione...</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-heading">
              Título
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da publicação"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-heading">
              Conteúdo
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[140px]"
              maxLength={5000}
              required
            />
          </div>

          {/* Confessionário is always anonymous — show info notice */}
          {categories.find((c) => c.id === categoryId)?.slug === "confessionario" && (
            <p className="text-xs text-gold/70 bg-gold/5 border border-gold/10 px-3 py-2 rounded-sm">
              🔒 Publicações no Confessionário são sempre anônimas. Apenas administradores podem ver o autor.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPost.isPending}
              className="bg-gold text-background hover:bg-gold-light font-heading text-xs tracking-widest uppercase"
            >
              {createPost.isPending ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
