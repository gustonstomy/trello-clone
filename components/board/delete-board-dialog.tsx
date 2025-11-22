/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
import { Board } from "../../types";

interface DeleteBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  organizationSlug: string;
}

export default function DeleteBoardDialog({
  open,
  onOpenChange,
  board,
  organizationSlug,
}: DeleteBoardDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleDelete = async () => {
    if (confirmText !== board.name) {
      toast({
        title: "Error",
        description: "Please type the board name correctly",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Delete the board
      // Cascade will delete all related data (lists, cards, activities, etc.)
      const { error } = await supabase
        .from("boards")
        .delete()
        .eq("id", board.id);

      console.log("board", board.id);

      if (error) throw error;

      toast({
        title: "Board deleted",
        description: `${board.name} has been permanently deleted`,
      });

      // Redirect to organization page
      router.push(`/dashboard/org/${organizationSlug}`);
      router.refresh();
    } catch (error: any) {
      console.error("Delete board error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete board",
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
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            Delete Board
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{board.name}</strong> and all associated lists, cards, and
            activity history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">
              Type the board name to confirm:
            </p>
            <Input
              placeholder={board.name}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> All data will be permanently deleted,
              including all lists, cards, and activity history.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== board.name || isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Board"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
