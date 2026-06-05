"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Clinic } from "@/generated/prisma/client";
import { updateClinicAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded hover:bg-slate-700 disabled:opacity-50 transition-colors"
    >
      {pending ? "Сохранение..." : "Сохранить"}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}

export default function ClinicEditForm({ clinic }: { clinic: Clinic }) {
  const updateWithId = updateClinicAction.bind(null, clinic.id);
  const [state, action] = useActionState(updateWithId, {});

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
          Изменения сохранены
        </p>
      )}

      <Field
        label="Название *"
        name="title"
        defaultValue={clinic.title}
        required
      />
      <Field
        label="Регион"
        name="region"
        defaultValue={clinic.region ?? ""}
      />
      <Field
        label="Адрес"
        name="address"
        defaultValue={clinic.address ?? ""}
      />
      <Field
        label="Сайт"
        name="website"
        type="url"
        defaultValue={clinic.website ?? ""}
        placeholder="https://"
      />

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={clinic.description ?? ""}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="omsEnabled"
          name="omsEnabled"
          type="checkbox"
          defaultChecked={clinic.omsEnabled}
          className="w-4 h-4 rounded border-gray-300 accent-slate-700"
        />
        <label htmlFor="omsEnabled" className="text-sm font-medium text-gray-700">
          Принимает по ОМС
        </label>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
