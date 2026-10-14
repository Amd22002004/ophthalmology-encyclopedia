/**
 * Одна оговорка на страницу с медицинскими иллюстрациями вместо подписи под
 * каждой картинкой (ТЗ правок по сайту v1.0, §1).
 */
export const illustrationNoteText = "Иллюстрации на странице схематичны и не заменяют очную диагностику.";

export function IllustrationNote() {
  return <p className="text-sm leading-6 text-muted-foreground">{illustrationNoteText}</p>;
}
