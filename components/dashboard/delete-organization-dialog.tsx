/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Organization } from "../../types";

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
}

export default function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organization,
}: DeleteOrganizationDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const supabase = createClient();

  const handleDelete = async () => {
    if (confirmText !== organization.name) {
      toast({
        title: "Error",
        description: "Please type the organization name correctly",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Delete the organization
      // Cascade will delete all related data (boards, lists, cards, etc.)
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", organization.id);

      if (error) throw error;

      toast({
        title: "Organization deleted",
        description: `${organization.name} has been permanently deleted`,
      });

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();

      // Invalidate organizations query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
    } catch (error: any) {
      console.error("Delete organization error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px] bg-linear-to-br from-[#003465] via-[#001f3f] to-[#003465] text-white ">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 bg-white w-fit rounded-lg px-2 py-1">
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white">
            This action cannot be undone. This will permanently delete{" "}
            <strong>{organization.name}</strong> and all associated boards,
            lists, and cards.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">
              Type the organization name to confirm:
            </p>
            <Input
              placeholder={organization.name}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="text-[#003465]" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== organization.name || isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Organization"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
