import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: ({
      description,
      variant,
    }: {
      title: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      if (variant === "destructive") {
        sonnerToast.error(description);
      } else {
        sonnerToast.success(description);
      }
    },
  };
}
