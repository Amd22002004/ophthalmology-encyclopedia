"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function tabContentClass(extra = "") {
  return `mt-4 space-y-5 data-[state=inactive]:hidden ${extra}`;
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

function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 4,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
      />
    </div>
  );
}

function CounterField({
  label,
  name,
  defaultValue,
  maxLength,
  multiline,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const over = value.length > maxLength;
  const sharedProps = {
    id: name,
    name,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(e.target.value),
    className:
      "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y",
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className={`text-xs ${over ? "text-red-600" : "text-gray-400"}`}>
          {value.length} / {maxLength}
        </span>
      </div>
      {multiline ? (
        <textarea rows={3} {...sharedProps} />
      ) : (
        <input type="text" {...sharedProps} />
      )}
    </div>
  );
}

function ImageField({
  label,
  name,
  currentUrl,
}: {
  label: string;
  name: string;
  currentUrl: string | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={label}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xs text-gray-400">нет файла</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            id={name}
            name={name}
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {currentUrl && (
            <p className="mt-1 truncate text-xs text-gray-400">{currentUrl}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { value: "main", label: "Основная информация" },
  { value: "contacts", label: "Контакты" },
  { value: "address", label: "Адрес" },
  { value: "requisites", label: "Реквизиты" },
  { value: "hours", label: "График работы" },
  { value: "social", label: "Социальные сети" },
  { value: "seo", label: "SEO" },
  { value: "images", label: "Изображения" },
] as const;

function ShowOnMapButton() {
  const handleClick = () => {
    const lat = (document.getElementById("latitude") as HTMLInputElement | null)?.value.trim();
    const lng = (document.getElementById("longitude") as HTMLInputElement | null)?.value.trim();
    const address = (document.getElementById("address") as HTMLInputElement | null)?.value.trim();

    let url: string;
    if (lat && lng) {
      url = `https://yandex.ru/maps/?pt=${encodeURIComponent(lng)},${encodeURIComponent(lat)}&z=16&l=map`;
    } else if (address) {
      url = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    } else {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      Показать на карте
    </button>
  );
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function ClinicEditForm({ clinic }: { clinic: Clinic }) {
  const updateWithId = updateClinicAction.bind(null, clinic.id);
  const [state, action] = useActionState(updateWithId, {});
  const [phone1 = "", phone2 = "", phone3 = ""] = clinic.phones ?? [];

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

      <Tabs defaultValue="main">
        <TabsList className="h-auto flex-wrap justify-start gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Основная информация */}
        <TabsContent forceMount value="main" className={tabContentClass()}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Название *" name="title" defaultValue={clinic.title} required />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Юридическое наименование"
                name="legalName"
                defaultValue={clinic.legalName ?? ""}
                placeholder="ООО «...»"
              />
            </div>
            <div>
              <label htmlFor="clinicType" className="block text-sm font-medium text-gray-700 mb-1">
                Тип филиала
              </label>
              <select
                id="clinicType"
                name="clinicType"
                defaultValue={clinic.clinicType ?? ""}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">— не указан —</option>
                <option value="centre">Центр</option>
                <option value="cabinet">Кабинет</option>
                <option value="mntk">МНТК</option>
                <option value="clinic">Клиника</option>
                <option value="oms">ОМС-точка</option>
              </select>
            </div>
            <Field
              label="Сеть (networkName)"
              name="networkName"
              defaultValue={clinic.networkName ?? ""}
              placeholder="Визус-1"
            />
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                id="status"
                name="status"
                defaultValue={clinic.status ?? "active"}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="active">active — отображается на сайте</option>
                <option value="inactive">inactive — скрыт из публичного каталога</option>
              </select>
            </div>
            <div className="flex items-end gap-3 pb-2">
              <input
                id="omsEnabled"
                name="omsEnabled"
                type="checkbox"
                defaultChecked={clinic.omsEnabled}
                className="h-4 w-4 rounded border-gray-300 accent-slate-700"
              />
              <label htmlFor="omsEnabled" className="text-sm font-medium text-gray-700">
                Принимает по ОМС
              </label>
            </div>
          </div>
          <TextAreaField
            label="Описание"
            name="description"
            defaultValue={clinic.description ?? ""}
            rows={5}
          />
          <TextAreaField
            label="Специализации (через запятую)"
            name="specializationTags"
            defaultValue={clinic.specializationTags?.join(", ") ?? ""}
            rows={3}
            placeholder="Лазерная коррекция, Лечение катаракты, Диагностика"
          />
        </TabsContent>

        {/* Контакты */}
        <TabsContent forceMount value="contacts" className={tabContentClass()}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Телефон 1" name="phone1" defaultValue={phone1} placeholder="8 (3452) 309-500" />
            <Field label="Телефон 2" name="phone2" defaultValue={phone2} placeholder="8 (3452) 309-501" />
            <Field label="Телефон 3" name="phone3" defaultValue={phone3} placeholder="8 (3452) 309-502" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" defaultValue={clinic.email ?? ""} placeholder="example@mail.ru" />
            <Field label="Сайт" name="website" type="url" defaultValue={clinic.website ?? ""} placeholder="https://" />
          </div>
          <Field
            label="Ссылка для записи (Записаться)"
            name="appointmentUrl"
            type="url"
            defaultValue={clinic.appointmentUrl ?? ""}
            placeholder="https://"
          />
        </TabsContent>

        {/* Адрес */}
        <TabsContent forceMount value="address" className={tabContentClass()}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Регион" name="region" defaultValue={clinic.region ?? ""} />
            <Field label="Город" name="city" defaultValue={clinic.city ?? ""} />
          </div>
          <Field label="Полный адрес" name="address" defaultValue={clinic.address ?? ""} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Широта (latitude)"
              name="latitude"
              type="text"
              defaultValue={clinic.latitude != null ? String(clinic.latitude) : ""}
              placeholder="57.152985"
            />
            <Field
              label="Долгота (longitude)"
              name="longitude"
              type="text"
              defaultValue={clinic.longitude != null ? String(clinic.longitude) : ""}
              placeholder="65.541734"
            />
          </div>
          <TextAreaField
            label="Embed-код карты (mapEmbed)"
            name="mapEmbed"
            defaultValue={clinic.mapEmbed ?? ""}
            rows={3}
            placeholder="<iframe src=... ></iframe>"
          />
          <ShowOnMapButton />
        </TabsContent>

        {/* Реквизиты */}
        <TabsContent forceMount value="requisites" className={tabContentClass()}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="ИНН" name="inn" defaultValue={clinic.inn ?? ""} placeholder="7202137064" />
            <Field label="КПП" name="kpp" defaultValue={clinic.kpp ?? ""} placeholder="720301001" />
            <Field label="ОГРН" name="ogrn" defaultValue={clinic.ogrn ?? ""} placeholder="1027200000000" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Лицензия"
              name="license"
              defaultValue={clinic.license ?? ""}
              placeholder="ЛО-72-01-003284 от 16.01.2020"
            />
            <Field
              label="Дата лицензии"
              name="licenseDate"
              type="date"
              defaultValue={toDateInputValue(clinic.licenseDate)}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Руководитель" name="directorName" defaultValue={clinic.directorName ?? ""} />
            <Field
              label="Год основания"
              name="foundedYear"
              type="number"
              defaultValue={clinic.foundedYear != null ? String(clinic.foundedYear) : ""}
              placeholder="1998"
            />
          </div>
        </TabsContent>

        {/* График работы */}
        <TabsContent forceMount value="hours" className={tabContentClass()}>
          <TextAreaField
            label="График работы"
            name="workingHours"
            defaultValue={clinic.workingHours ?? ""}
            rows={5}
            placeholder={"Пн-Пт: 08:00–20:00\nСб: 09:00–18:00\nВс: выходной"}
          />
        </TabsContent>

        {/* Социальные сети */}
        <TabsContent forceMount value="social" className={tabContentClass()}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="VK" name="vkUrl" type="url" defaultValue={clinic.vkUrl ?? ""} placeholder="https://vk.com/..." />
            <Field
              label="Telegram"
              name="telegramUrl"
              type="url"
              defaultValue={clinic.telegramUrl ?? ""}
              placeholder="https://t.me/..."
            />
            <Field
              label="YouTube"
              name="youtubeUrl"
              type="url"
              defaultValue={clinic.youtubeUrl ?? ""}
              placeholder="https://youtube.com/..."
            />
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent forceMount value="seo" className={tabContentClass()}>
          <CounterField
            label="SEO Title"
            name="seoTitle"
            defaultValue={clinic.seoTitle ?? ""}
            maxLength={60}
          />
          <CounterField
            label="SEO Description"
            name="seoDescription"
            defaultValue={clinic.seoDescription ?? ""}
            maxLength={160}
            multiline
          />
          <CounterField
            label="SEO Keywords"
            name="seoKeywords"
            defaultValue={clinic.seoKeywords ?? ""}
            maxLength={255}
          />
        </TabsContent>

        {/* Изображения */}
        <TabsContent forceMount value="images" className={tabContentClass()}>
          <ImageField label="Логотип" name="logoFile" currentUrl={clinic.logoUrl} />
          <ImageField label="Фото клиники (обложка)" name="coverFile" currentUrl={clinic.coverImageUrl} />
          <ImageField label="Фото фасада" name="facadeFile" currentUrl={clinic.facadeImageUrl} />
        </TabsContent>
      </Tabs>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
