"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const searchTitle = "Поиск по сайту";
const searchDescription =
  "Поиск по заболеваниям, врачам, клиникам, поставщикам, оборудованию, публикациям, рекомендациям и нормативным материалам.";

function SearchForm({ inputRef }: { inputRef?: RefObject<HTMLInputElement | null> }) {
  return (
    <form action="/search" className="mt-4 flex gap-2">
      <Input
        autoFocus
        className="text-base sm:text-sm"
        name="q"
        placeholder="Введите заболевание, процедуру, врача или документ"
        ref={inputRef}
      />
      <Button type="submit">
        <Search className="h-4 w-4" />
        Найти
      </Button>
    </form>
  );
}

/**
 * Поиск по сайту. `fullScreen` используется в шапке до 1024 px: поле открывается
 * на весь экран с фокусом в нём и закрывается кнопкой «Закрыть» или Esc.
 */
export function SearchDialog({ trigger, fullScreen = false }: { trigger: ReactNode; fullScreen?: boolean }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Сочетание ⌘K/Ctrl+K обслуживает только основной диалог, иначе при двух
    // экземплярах в шапке открылись бы оба.
    if (fullScreen) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullScreen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {fullScreen ? (
        <DialogContent
          className="inset-0 h-dvh w-full max-w-none translate-x-0 rounded-none border-0 p-4 shadow-none sm:p-6"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          showCloseButton={false}
        >
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              <DialogHeader className="pr-0">
                <DialogTitle>{searchTitle}</DialogTitle>
                <DialogDescription>{searchDescription}</DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button className="shrink-0" type="button" variant="outline">
                  Закрыть
                </Button>
              </DialogClose>
            </div>
            <SearchForm inputRef={inputRef} />
          </div>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{searchTitle}</DialogTitle>
            <DialogDescription>{searchDescription}</DialogDescription>
          </DialogHeader>
          <SearchForm />
        </DialogContent>
      )}
    </Dialog>
  );
}
