# P1.1 — participant auth и доступ к существующим профилям

> Статус: **локальная реализация, production не применена**. Документ описывает
> границу личного кабинета и не расширяет публичный семантический граф.

## Назначение

P1.1 добавляет личный кабинет участника для уже существующей воронки
`CooperationApplication`. Заявка, аккаунт и доступ к публичному профилю — разные
факты:

- `User` — учётная запись участника, не `AdminUser` и не публичный Doctor/Clinic;
- `CooperationApplication.userId` — явная связь принятой заявки с User;
- `CooperationEntityMatch` — административно проверенное соответствие заявки
  существующему `Doctor` или `Clinic`;
- `UserDoctorLink` — подтверждаемая связь пользователя с существующим врачом;
- `UserClinicAccess` — подтверждаемый доступ представителя к существующей клинике.

Публичные Doctor и Clinic не копируются и не создаются автоматически.

## Auth boundary

Админ-панель сохраняет `admin_session` и `AdminUser`. Участники используют отдельную
cookie `participant_session`, отдельный тип сессии и отдельный secret
`PARTICIPANT_SESSION_SECRET`. В локальной среде допускается fallback для разработки;
production без отдельного participant secret должен завершать выдачу сессии ошибкой.

Сессия участника содержит `userId`, email и `sessionVersion`. Таблица `UserSession`
не создаётся: увеличение `User.sessionVersion` при password reset/security-событии
отзывает все старые participant-сессии, а logout уничтожает текущую cookie.

## Invitation lifecycle

Администратор выбирает существующий профиль из результатов ручного duplicate detector
и сохраняет `CooperationEntityMatch` со статусом `PENDING` или `CONFIRMED`. Затем
создаётся одноразовый `Invitation`:

1. raw token генерируется только в памяти;
2. в БД сохраняется только SHA-256 `tokenHash`;
3. предыдущие действующие invitation для заявки отзываются перед reissue;
4. `expiresAt`, `usedAt` и `revokedAt` проверяются атомарно при принятии;
5. ошибка доставки фиксируется в `InvitationDelivery`, а повторная отправка создаёт
   новый token через reissue.

`InvitationDelivery` переиспользует существующий cooperation SMTP mailer и outbox-
паттерн, но является отдельной таблицей, потому что P0
`CooperationApplicationNotification` имеет уникальность `(applicationId, kind)` и
не может безопасно представлять несколько reissue одного приглашения. Raw token не
попадает в audit, логи, analytics или admin UI.

## Existing User и связи каталога

Если нормализованный email уже есть, новый User не создаётся и пароль не меняется.
Принятие разрешается только после входа аккаунтом с тем же email, что указан в
invitation.

После принятия:

- заявка получает `userId`, но не становится автоматически `ACTIVE` и не создаёт
  membership;
- подтверждённый `Doctor` получает `UserDoctorLink` со статусом `CONFIRMED`;
- неоднозначный Doctor получает `UserDoctorLink` со статусом `PENDING`;
- подтверждённая Clinic получает `UserClinicAccess` со статусом `CONFIRMED`;
- неоднозначная Clinic получает `UserClinicAccess` со статусом `PENDING`;
- у одной Clinic может быть несколько пользователей-представителей;
- при отсутствии однозначного соответствия не создаётся ни Doctor, ни Clinic.

`UserDoctorLink` и `UserClinicAccess` — access-control relations. Они не являются
медицинскими связями графа и не меняют публичный смысл карточек. Кабинет показывает
публичную страницу только для подтверждённых связей.

## Security и audit

Mutations проверяют same-origin, login/invitation/reset/reissue используют DB-backed
HMAC fingerprint rate limit, чувствительные routes получают `noindex`, `no-store` и
`Referrer-Policy: no-referrer`. Password reset использует hash-only token, expiry,
one-time use и увеличивает `sessionVersion`.

`AuthAuditEvent` фиксирует создание, отправку, ошибку, reissue, revoke и acceptance
invitation, создание/связывание User, pending/confirmed Doctor/Clinic access и
password reset. Пароли, password hash, raw token и session secrets в audit не
сохраняются.

## Scope P1.1

В P1.1 входят login/logout, password reset, invitation, admin match/invite/revoke/
reissue, acceptance новым и существующим User, базовый cabinet и audit. Редактор
профиля Doctor/Clinic, публикации, документы, membership и сложный RBAC остаются
следующими этапами.
