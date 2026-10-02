"use client";

import { Trash2 } from "lucide-react";

export function DeleteRegistrationButton({
  action,
  fullName,
  publicNumber,
}: {
  action: (formData: FormData) => Promise<void>;
  fullName: string;
  publicNumber: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(submitEvent) => {
        const confirmed = window.confirm(
          `Удалить регистрацию ${publicNumber} — ${fullName}?\n\nВместе с ней будут удалены внутренние заметки, история статусов и записи outbox. Действие необратимо.`,
        );
        if (!confirmed) submitEvent.preventDefault();
      }}
    >
      <button
        aria-label={`Удалить регистрацию ${publicNumber}`}
        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        title="Удалить регистрацию"
        type="submit"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
