export type TemporalEdition = {
  id: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string | null;
  verifiedAt?: Date | string | null;
  historicalUseAllowed?: boolean;
};

export type EventPeriod = {
  date?: Date | string | null;
  from?: Date | string | null;
  to?: Date | string | null;
};

type VerificationReason =
  | "EVENT_DATE_UNKNOWN"
  | "INVALID_EVENT_INTERVAL"
  | "NO_APPLICABLE_EDITION"
  | "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE"
  | "AMBIGUOUS_EDITIONS"
  | "EVENT_INTERVAL_SPANS_EDITIONS";

export type ApplicableEditionResult<T extends TemporalEdition> =
  | {
      status: "APPLICABLE";
      edition: T;
    }
  | {
      status: "REQUIRES_VERIFICATION";
      reason: VerificationReason;
      candidates: T[];
    };

function toTimestamp(value: Date | string): number {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError(`Некорректная дата нормативного периода: ${String(value)}`);
  }
  return timestamp;
}

function editionContainsDate(edition: TemporalEdition, timestamp: number) {
  const startsAt = toTimestamp(edition.effectiveFrom);
  const endsAt = edition.effectiveTo == null ? Number.POSITIVE_INFINITY : toTimestamp(edition.effectiveTo);
  return startsAt <= timestamp && timestamp <= endsAt;
}

function editionIsVerifiedForDate(edition: TemporalEdition, timestamp: number) {
  if (edition.verifiedAt == null) return false;
  if (edition.historicalUseAllowed === true) return true;
  return timestamp >= toTimestamp(edition.verifiedAt);
}

function editionIntersectsInterval(edition: TemporalEdition, from: number, to: number) {
  const startsAt = toTimestamp(edition.effectiveFrom);
  const endsAt = edition.effectiveTo == null ? Number.POSITIVE_INFINITY : toTimestamp(edition.effectiveTo);
  return startsAt <= to && endsAt >= from;
}

/**
 * Выбирает редакцию только по периоду проверяемого события. Концы периода
 * считаются включительными: юридическая дата утраты силы хранится как последний
 * день действия, а не как техническая полуоткрытая граница.
 */
export function selectApplicableEdition<T extends TemporalEdition>(
  editions: readonly T[],
  event: EventPeriod,
): ApplicableEditionResult<T> {
  if (event.date != null) {
    const timestamp = toTimestamp(event.date);
    const legalCandidates = editions.filter((edition) => editionContainsDate(edition, timestamp));
    const candidates = legalCandidates.filter((edition) => editionIsVerifiedForDate(edition, timestamp));

    if (candidates.length === 1) {
      return { status: "APPLICABLE", edition: candidates[0] };
    }

    return {
      status: "REQUIRES_VERIFICATION",
      reason:
        candidates.length > 1
          ? "AMBIGUOUS_EDITIONS"
          : legalCandidates.length > 0
            ? "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE"
            : "NO_APPLICABLE_EDITION",
      candidates,
    };
  }

  if (event.from == null || event.to == null) {
    return {
      status: "REQUIRES_VERIFICATION",
      reason: "EVENT_DATE_UNKNOWN",
      candidates: [],
    };
  }

  const from = toTimestamp(event.from);
  const to = toTimestamp(event.to);
  if (from > to) {
    return {
      status: "REQUIRES_VERIFICATION",
      reason: "INVALID_EVENT_INTERVAL",
      candidates: [],
    };
  }

  const legalCandidates = editions.filter((edition) => editionIntersectsInterval(edition, from, to));
  const candidates = legalCandidates.filter(
    (edition) => editionIsVerifiedForDate(edition, from) && editionIsVerifiedForDate(edition, to),
  );
  if (candidates.length > 1) {
    return {
      status: "REQUIRES_VERIFICATION",
      reason: "EVENT_INTERVAL_SPANS_EDITIONS",
      candidates,
    };
  }

  if (candidates.length === 1 && editionContainsDate(candidates[0], from) && editionContainsDate(candidates[0], to)) {
    return { status: "APPLICABLE", edition: candidates[0] };
  }

  return {
    status: "REQUIRES_VERIFICATION",
    reason:
      legalCandidates.length > 0
        ? "EDITION_TEXT_NOT_VERIFIED_FOR_EVENT_DATE"
        : "NO_APPLICABLE_EDITION",
    candidates,
  };
}
