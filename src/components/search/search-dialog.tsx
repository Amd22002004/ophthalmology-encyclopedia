"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Поиск по энциклопедии</DialogTitle>
          <DialogDescription>
            Поиск по заболеваниям, врачам, клиникам, поставщикам, оборудованию,
            публикациям, рекомендациям и нормативным материалам.
          </DialogDescription>
        </DialogHeader>
        <form action="/search" className="mt-4 flex gap-2">
          <Input
            autoFocus
            name="q"
            placeholder="Введите заболевание, процедуру, врача или документ"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
            Найти
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
