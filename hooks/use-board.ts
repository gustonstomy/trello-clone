import { useQuery } from "@tanstack/react-query";
import { createClient } from "../lib/supabase/client";
import { Board, List, Card } from "../types";

interface BoardData extends Board {
  lists: (List & {
    cards: Card[];
  })[];
}

export function useBoard(boardId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select(
          `
          *,
          lists (
            *,
            cards (*)
          )
        `
        )
        .eq("id", boardId)
        .single();

      if (error) throw error;

      // Sort lists and cards in memory since deep sorting in Supabase can be tricky
      const board = data as unknown as BoardData;

      if (board.lists) {
        board.lists.sort((a, b) => a.position - b.position);

        board.lists.forEach((list) => {
          if (list.cards) {
            list.cards.sort((a, b) => a.position - b.position);
          }
        });
      }

      return board;
    },
    enabled: !!boardId,
  });
}
