export type PublishableContent = {
  isPublished: boolean;
  publishedAt: Date | null;
};

/**
 * Единственный публичный шлюз для записей с отложенной публикацией.
 * `effectiveFrom` описывает юридическое действие нормы и не участвует в
 * видимости материала на сайте.
 */
export function publishedContentWhere(now = new Date()) {
  return {
    isPublished: true,
    publishedAt: { lte: now },
  } as const;
}

export function evidenceValidatedContentWhere(now = new Date()) {
  return {
    ...publishedContentWhere(now),
    evidenceValidatedAt: { not: null },
  } as const;
}

export function isPubliclyVisibleAt(content: PublishableContent, now = new Date()) {
  return (
    content.isPublished &&
    content.publishedAt !== null &&
    content.publishedAt.getTime() <= now.getTime()
  );
}
