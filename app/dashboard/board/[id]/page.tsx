"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useAuth } from "../../../../hooks/use-auth";
import { useBoard } from "../../../../hooks/use-board";
import { useBoardStore } from "../../../../store/board-store";
import { Button } from "../../../../components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Card } from "../../../../types";
import BoardHeader from "../../../../components/board/board-header";
import BoardList from "../../../../components/board/board-list";
import CreateListDialog from "../../../../components/board/create-list-dialog";
import { Card as UiCard, CardContent } from "../../../../components/ui/card";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import CardItem from "../../../../components/board/card-item";
import { createClient } from "../../../../lib/supabase/client";

export default function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [showCreateList, setShowCreateList] = useState(false);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const { currentBoard, lists, cards, setBoard, setLists, setCards } =
    useBoardStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: boardData, isLoading: isBoardLoading } = useBoard(
    resolvedParams.id
  );

  useEffect(() => {
    if (boardData) {
      setBoard(boardData);
      setLists(boardData.lists);

      boardData.lists.forEach((list) => {
        if (list.cards) {
          setCards(list.id, list.cards);
        }
      });
    }
  }, [boardData, setBoard, setLists, setCards]);

  useEffect(() => {
    if (!user) return;

    const listsChannel = supabase
      .channel(`board-${resolvedParams.id}-lists`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `board_id=eq.${resolvedParams.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("lists")
              .select("*")
              .eq("id", payload.new.id)
              .single();
            if (data) useBoardStore.getState().addList(data);
          } else if (payload.eventType === "UPDATE") {
            useBoardStore.getState().updateList(payload.new.id, payload.new);
          } else if (payload.eventType === "DELETE") {
            useBoardStore.getState().deleteList(payload.old.id);
          }
        }
      )
      .subscribe();

    const cardsChannel = supabase
      .channel(`board-${resolvedParams.id}-cards`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cards",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("cards")
              .select("*")
              .eq("id", payload.new.id)
              .single();
            if (data) useBoardStore.getState().addCard(data.list_id, data);
          } else if (payload.eventType === "UPDATE") {
            useBoardStore.getState().updateCard(payload.new.id, payload.new);
          } else if (payload.eventType === "DELETE") {
            useBoardStore.getState().deleteCard(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(listsChannel);
      supabase.removeChannel(cardsChannel);
    };
  }, [user, resolvedParams.id, supabase]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    let foundCard: Card | null = null;
    Object.values(cards).forEach((listCards) => {
      const card = listCards.find((c) => c.id === activeId);
      if (card) foundCard = card;
    });

    setActiveCard(foundCard);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeList = Object.keys(cards).find((listId) =>
      cards[listId].some((card) => card.id === activeId)
    );

    let overList = Object.keys(cards).find((listId) =>
      cards[listId].some((card) => card.id === overId)
    );

    if (!overList && overId.startsWith("droppable-")) {
      overList = overId.replace("droppable-", "");
    }

    if (!activeList) return;

    if (activeList === overList) {
      const listCards = cards[activeList];
      const oldIndex = listCards.findIndex((card) => card.id === activeId);
      const newIndex = listCards.findIndex((card) => card.id === overId);

      const reorderedCards = arrayMove(listCards, oldIndex, newIndex);
      setCards(activeList, reorderedCards);
    } else if (overList) {
      const activeListCards = [...cards[activeList]];
      const overListCards = [...(cards[overList] || [])];

      const activeCardIndex = activeListCards.findIndex(
        (card) => card.id === activeId
      );

      let insertIndex = overListCards.length;
      if (!overId.startsWith("droppable-")) {
        const overCardIndex = overListCards.findIndex(
          (card) => card.id === overId
        );
        if (overCardIndex !== -1) {
          insertIndex = overCardIndex;
        }
      }

      const [movedCard] = activeListCards.splice(activeCardIndex, 1);
      movedCard.list_id = overList;
      overListCards.splice(insertIndex, 0, movedCard);

      setCards(activeList, activeListCards);
      setCards(overList, overListCards);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let sourceListId: string | null = null;
    let destListId: string | null = null;
    let newPosition = 0;

    Object.entries(cards).forEach(([listId, listCards]) => {
      const cardIndex = listCards.findIndex((c) => c.id === activeId);
      if (cardIndex !== -1) {
        sourceListId = listId;
      }
      const overIndex = listCards.findIndex((c) => c.id === overId);
      if (overIndex !== -1) {
        destListId = listId;
        newPosition = overIndex;
      }
    });

    if (!destListId && overId.startsWith("droppable-")) {
      destListId = overId.replace("droppable-", "");
      newPosition = cards[destListId]?.length || 0;
    }

    if (!sourceListId) return;

    try {
      if (activeId.startsWith("list-")) {
        const activeListId = activeId.replace("list-", "");
        const overListId = overId.replace("list-", "");

        const oldIndex = lists.findIndex((list) => list.id === activeListId);
        const newIndex = lists.findIndex((list) => list.id === overListId);

        if (oldIndex !== newIndex) {
          const reorderedLists = arrayMove(lists, oldIndex, newIndex);
          setLists(reorderedLists);

          const updates = reorderedLists.map((list, index) => ({
            id: list.id,
            position: index,
          }));

          for (const update of updates) {
            await supabase
              .from("lists")
              .update({ position: update.position })
              .eq("id", update.id);
          }
        }
      } else {
        const finalDestListId = destListId || sourceListId;
        const destCards = cards[finalDestListId];

        await supabase
          .from("cards")
          .update({
            list_id: finalDestListId,
            position: newPosition,
          })
          .eq("id", activeId);

        const updates = destCards.map((card, index) => ({
          id: card.id,
          position: index,
        }));

        for (const update of updates) {
          if (update.id !== activeId) {
            await supabase
              .from("cards")
              .update({ position: update.position })
              .eq("id", update.id);
          }
        }

        if (sourceListId !== finalDestListId) {
          await supabase.from("card_activities").insert({
            card_id: activeId,
            user_id: user?.id,
            action: "moved",

            details: {
              from_list_id: sourceListId,
              to_list_id: finalDestListId,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating positions:", error);
    }
  };

  if (isBoardLoading) {
    return (
      <div className="flex items-center justify-center py-20 h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  if (!currentBoard) {
    return <div>Board not found</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-12 shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 p-2 rounded-xl border border-[#1976D2]/40">
          <BoardHeader board={currentBoard} />
          <Button
            onClick={() => setShowCreateList(true)}
            variant="secondary"
            className="w-full lg:w-72 bg-white/20 hover:bg-white/30 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a list
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {lists.length === 0 ? (
            <UiCard className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 border-dashed mt-36">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 rounded-full bg-[#0085FF]/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  No lists yet
                </h3>
                <p className="text-blue-200 text-center mb-6 max-w-md">
                  Create your first list to start organizing cards and tasks for
                  this board
                </p>
                <Button
                  onClick={() => setShowCreateList(true)}
                  className="bg-[#0085FF]/10 hover:shadow-xl hover:shadow-[#0085FF]/40 text-white font-bold py-6 px-8 text-lg transition-all transform hover:scale-105"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create List
                </Button>
              </CardContent>
            </UiCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto overflow-x-hidden pb-4 no-scrollbar">
              <SortableContext
                items={lists.map((list) => `list-${list.id}`)}
                strategy={horizontalListSortingStrategy}
              >
                {lists.map((list) => (
                  <BoardList
                    key={list.id}
                    list={list}
                    cards={cards[list.id] || []}
                  />
                ))}
              </SortableContext>
            </div>
          )}

          <DragOverlay>
            {activeCard && (
              <div className="rotate-3">
                <CardItem card={activeCard} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateListDialog
        open={showCreateList}
        onOpenChange={setShowCreateList}
        boardId={currentBoard.id}
      />
    </div>
  );
}
