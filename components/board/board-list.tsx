/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useAuth } from "../../hooks/use-auth";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Card as CardType, List } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import CardItem from "./card-item";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useToast } from "../../hooks/use-toast";
import { useBoardStore } from "../../store/board-store";

interface BoardListProps {
  list: List;
  cards: CardType[];
}

export default function BoardList({ list, cards }: BoardListProps) {
  const { user } = useAuth();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.name);
  const { toast } = useToast();
  const supabase = createClient();
  const { deleteList, updateList } = useBoardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `list-${list.id}`,
    data: {
      type: "list",
      list,
    },
  });

  // Add droppable zone for the list to accept cards even when empty
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `droppable-${list.id}`,
    data: {
      type: "list",
      listId: list.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("cards")
        .insert({
          list_id: list.id,
          title: newCardTitle.trim(),
          description: newCardDescription.trim() || null,
          position: cards.length,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately add the card to the store for instant UI update
      useBoardStore.getState().addCard(list.id, data);

      // Log activity
      await supabase.from("card_activities").insert({
        card_id: data.id,
        user_id: user.id,
        action: "created",
        details: { list_id: list.id },
      });

      setNewCardTitle("");
      setNewCardDescription("");
      setIsAddingCard(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create card",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim() || editedTitle === list.name) {
      setIsEditingTitle(false);
      setEditedTitle(list.name);
      return;
    }

    try {
      const { error } = await supabase
        .from("lists")
        .update({ name: editedTitle.trim() })
        .eq("id", list.id);

      if (error) throw error;

      updateList(list.id, { name: editedTitle.trim() });
      setIsEditingTitle(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update list",
        variant: "destructive",
      });
      setEditedTitle(list.name);
    }
  };

  const handleDeleteList = async () => {
    try {
      const { error } = await supabase.from("lists").delete().eq("id", list.id);

      if (error) throw error;

      deleteList(list.id);
      toast({
        title: "List deleted",
        description: "The list has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete list",
        variant: "destructive",
      });
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="shrink-0 w-72">
      <div className="bg-gray-100 rounded-lg p-3 max-h-[calc(100vh-200px)] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTitle();
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setEditedTitle(list.name);
                }
              }}
              className="h-8 font-semibold"
              autoFocus
            />
          ) : (
            <h3
              className="font-semibold text-sm cursor-pointer hover:bg-gray-200 px-2 py-1 rounded flex-1"
              onClick={() => setIsEditingTitle(true)}
              {...attributes}
              {...listeners}
            >
              {list.name}
            </h3>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDeleteList}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={setDroppableRef}
          className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-[100px]"
        >
          <SortableContext
            items={cards.map((card) => card.id)}
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </SortableContext>
        </div>

        {isAddingCard ? (
          <div className="space-y-2">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }
              }}
              autoFocus
            />
            <Textarea
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              placeholder="Enter card description (optional)..."
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }
              }}
              className="resize-none"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddCard} size="sm">
                Add Card
              </Button>
              <Button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                  setNewCardDescription("");
                }}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingCard(true)}
            variant="ghost"
            className="w-full justify-start text-sm"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a card
          </Button>
        )}
      </div>
    </div>
  );
}
