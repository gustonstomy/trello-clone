/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BoardHeaderProps {
  board: any;
}

export default function BoardHeader({ board }: BoardHeaderProps) {
  const router = useRouter();

  return (
    <>
      <div className="hidden md:flex items-center justify-between ">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
          {board.description && (
            <p className="text-white/80 text-sm">{board.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col md:hidden md:flex-row md:items-center space-x-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20 w-full flex items-center justify-start"
        >
          <ArrowLeft className="h-5 w-5" />
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
        </Button>
        {board.description && (
          <p className="text-white/80 text-sm">{board.description}</p>
        )}
      </div>
    </>
  );
}
