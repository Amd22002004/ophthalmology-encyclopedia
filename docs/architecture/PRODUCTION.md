# Production infrastructure

> Статус: SSOT для production-инфраструктуры проекта.
> Последняя проверка: 2026-08-17.
>
> Этот документ описывает фактическое production-окружение. Перед деплоем и
> инфраструктурными задачами агенты должны читать его вместо повторного поиска
> PM2, nginx, SSL, путей проекта и схемы доставки.

## 1. Сервер

| Параметр | Значение |
| --- | --- |
| Основной домен | `oftalmologia.pro` |
| WWW-домен | `www.oftalmologia.pro` |
| Публичный IP | `62.113.36.163` |
| Hostname | `7946954-ii450420.twc1.net` |
| VPS-провайдер | Timeweb Cloud, определено по hostname `twc1.net`; для биллинга и сетевых изменений подтверждать в панели провайдера |
| ОС | Ubuntu 24.04.4 LTS |
| Kernel | `6.8.0-117-generic` |
| Рабочий пользователь | `root` |
| SSH-доступ | `ssh root@62.113.36.163` |
| Авторизация | SSH-ключ оператора/агента; ключи не хранятся в репозитории |

Не записывать в репозиторий приватные ключи, пароли, полные строки подключения и
содержимое `.env`.

## 2. Структура проекта на сервере

Production-приложение работает из:

```text
/var/www/vysotsky.pro
```

Рабочие каталоги и файлы:

| Путь | Назначение |
| --- | --- |
| `/var/www/vysotsky.pro/src` | Next.js исходный код |
| `/var/www/vysotsky.pro/prisma` | Prisma schema и seed |
| `/var/www/vysotsky.pro/public` | Публичные изображения, PDF и документы |
| `/var/www/vysotsky.pro/docs/architecture` | Каноническая архитектурная документация |
| `/var/www/vysotsky.pro/.env` | Production env, секреты не выводить |
| `/var/www/vysotsky.pro/.env.production.local` | Production env override, секреты не выводить |
| `/var/www/vysotsky.pro/.next` | Результат `npm run build` |
| `/var/www/vysotsky.pro/node_modules` | Production dependencies после `npm ci` |
| `/var/lib/ophthalmology/appeals` | Приватные вложения обращений; создаётся до первого релиза реестра, не входит в app root |
| `/var/lib/ophthalmology/clinic-uploads` | Постоянные публичные изображения клиник; раздаётся nginx alias-ом, не входит в app root |

Не изменять автоматически:

- `/var/www/vysotsky.pro/.env`;
- `/var/www/vysotsky.pro/.env.production.local`;
- `/var/www/vysotsky.pro/.git`, если задача не про Git;
- `/etc/nginx/`, если задача не про nginx;
- `/etc/letsencrypt/`, если задача не про SSL/certbot;
- `/var/backups/ophthalmology/`, кроме создания нового rollback-артефакта.

Не создавать staging/release-каталоги внутри `/var/www/vysotsky.pro`: ESLint
рекурсивно видит вложенные `.next` и может начать проверять собранные файлы
старого release. Для временной распаковки использовать `/tmp` или `/var/tmp`.

Каталог `/var/lib/ophthalmology/appeals` должен принадлежать рабочему пользователю
PM2, иметь режим `0700` для каталога и `0600` для файлов. Не обслуживать его через
nginx alias/static и не копировать в `public/`.

Каталог `/var/lib/ophthalmology/clinic-uploads` используется для публичных изображений
клиник. Он должен быть вне release-каталога, принадлежать пользователю upload-process
и группе nginx, иметь режим `0755` для каталогов и `0644` для файлов. URL `/uploads/`
обслуживается nginx alias-ом напрямую; изображения не включаются в deploy-архив.

## 3. Node.js и пакетный менеджер

| Инструмент | Версия / правило |
| --- | --- |
| Node.js | `v24.15.0` |
| npm | `11.12.1` |
| pnpm | Не используется |
| Установка зависимостей | `npm ci` |
| Production build | `npm run build` |

`npm ci` может показывать `npm audit` warnings. Они не являются автоматическим
основанием для `npm audit fix --force`: обновление зависимостей выполняется отдельной
задачей с проверкой совместимости.

## 4. PM2

Канонический процесс:

| Параметр | Значение |
| --- | --- |
| Имя процесса | `ophthalmology` |
| cwd | `/var/www/vysotsky.pro` |
| script | `node_modules/.bin/next` |
| args | `start` |
| порт приложения | `3001` |
| nginx upstream | `127.0.0.1:3001` |

Для сохранения заявок при временной недоступности SMTP используется отдельный
PM2-процесс `ophthalmology-email-worker` из того же release-каталога. Он
последовательно выбирает небольшие batch из `AppealNotification`,
`CooperationApplicationNotification` и email-строк `EventRegistrationNotification`,
использует lock lease и exponential backoff. Docker-контур `vizus_*` не является
частью этого worker и не обслуживает эти таблицы.

Команды:

```bash
pm2 status
pm2 describe ophthalmology
pm2 logs ophthalmology --lines 80 --nostream
pm2 restart ophthalmology
pm2 save
```

Не менять имя процесса, cwd или порт без отдельной инфраструктурной задачи.

## 5. PostgreSQL

Production PostgreSQL доступен локально на сервере.

| Параметр | Значение |
| --- | --- |
| БД | `ophthalmology_db` |
| пользователь БД | `ophthalmology` |
| host | `127.0.0.1` |
| port | `5433` |
| подключение приложения | через `DATABASE_URL` из `.env` / `.env.production.local` |

Полную строку `DATABASE_URL` не выводить и не записывать в документы.

Проверка подключения без раскрытия секрета:

```bash
cd /var/www/vysotsky.pro
set -a; . ./.env; set +a
psql "$DATABASE_URL" -Atc "select current_database(), current_user, inet_server_addr(), inet_server_port();"
```

## 6. Prisma

Перед изменением production-БД всегда получить SQL diff и проверить его вручную.
Разрешены только аддитивные операции: `CREATE TABLE`, `CREATE INDEX`,
`ADD FOREIGN KEY`, nullable `ADD COLUMN`.

Запрещены без отдельного явного решения:

- `DROP`;
- `TRUNCATE`;
- `RENAME`;
- `ALTER COLUMN`;
- `DELETE FROM`.

Правильная последовательность:

```bash
cd /var/www/vysotsky.pro
npm run prisma:generate
npm run prisma:validate
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > /tmp/ophthalmology-migrate-<stamp>.sql
grep -Eiq '(^|[^A-Z])(DROP|TRUNCATE|RENAME|ALTER COLUMN|DELETE FROM)([^A-Z]|$)' /tmp/ophthalmology-migrate-<stamp>.sql && exit 42
npx prisma db execute --file /tmp/ophthalmology-migrate-<stamp>.sql
npm run db:seed
npm run db:seed
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

После применения SQL финальный diff должен быть:

```sql
-- This is an empty migration.
```

## 7. Nginx

Канонический конфиг:

```text
/etc/nginx/sites-available/oftalmologia.pro.conf
/etc/nginx/sites-enabled/oftalmologia.pro.conf -> /etc/nginx/sites-available/oftalmologia.pro.conf
```

Канонический upstream:

```nginx
upstream ophthalmology_app {
    server 127.0.0.1:3001;
    keepalive 16;
}
```

Домены:

```nginx
server_name oftalmologia.pro www.oftalmologia.pro;
```

Бывший домен `vysotsky.pro` не является production-доменом и не перенаправляется
на новый адрес. Для него включён отдельный retired-host guard
`/etc/nginx/sites-available/vysotsky.pro.retired.conf`, который возвращает `410 Gone`,
чтобы старый host не попадал в default-конфигурацию другого сервиса.

Для multipart-обращений требуется явный лимит тела запроса не ниже приложения:

```nginx
client_max_body_size 42m;
```

Изменение применять только при релизе реестра обращений с обязательным `nginx -t`.

Обязательная проверка перед/после изменений nginx:

```bash
nginx -t
```

Не редактировать nginx при обычном деплое приложения.

## 8. SSL

Сертификат Let's Encrypt управляется certbot.

| Параметр | Значение |
| --- | --- |
| Certificate Name | `oftalmologia.pro` |
| Domains | `oftalmologia.pro`, `www.oftalmologia.pro` |
| Certificate Path | `/etc/letsencrypt/live/oftalmologia.pro/fullchain.pem` |
| Private Key Path | `/etc/letsencrypt/live/oftalmologia.pro/privkey.pem` |
| Проверенная дата истечения | 2026-11-15 08:33:56 UTC |

Сертификат `/etc/letsencrypt/live/vysotsky.pro/` сохранён только для retired-host
guard, который отвечает `410 Gone`; он не используется production-приложением.

Команды чтения:

```bash
certbot certificates
nginx -t
```

Не переустанавливать сертификаты и не запускать forced renewal без отдельного запроса
на SSL/certbot.

## 9. ENV

Обязательные переменные:

| Переменная | Назначение |
| --- | --- |
| `DATABASE_URL` | Подключение Prisma/PostgreSQL |
| `SESSION_SECRET` | Сессии админ-панели |
| `NEXT_PUBLIC_SITE_URL` | Публичный canonical/base URL, хранится в `.env.production.local` |
| `APPEAL_UPLOAD_DIR` | Абсолютный приватный путь `/var/lib/ophthalmology/appeals` |
| `CLINIC_UPLOAD_DIR` | Абсолютный постоянный путь `/var/lib/ophthalmology/clinic-uploads` |
| `APPEAL_RATE_LIMIT_SECRET` | Отдельный секрет HMAC для rate limit; не совпадает с публичными ключами |
| `APPEAL_SMTP_URL` | Строка SMTP-подключения для копий обращений |
| `APPEAL_SMTP_FROM` | Подтверждённый адрес отправителя |
| `APPEAL_NOTIFICATION_EMAIL` | Официальный адрес получателя обращений |
| `AOK_NOTIFICATION_EMAILS` | Список внутренних адресатов Association через запятую; имеет приоритет над legacy recipient-переменными |

Запрещено автоматически:

- печатать значения env в лог;
- менять `DATABASE_URL`;
- менять `SESSION_SECRET`;
- удалять `.env.production.local`;
- переносить секреты в репозиторий.

Первый production-релиз реестра нельзя считать завершённым, пока SMTP-переменные не
заполнены ответственным лицом и тест доставки не подтверждён без вывода секретов.

Для cooperation-воронки отдельные `COOPERATION_*` переменные являются опциональными:
при их отсутствии приложение использует `APPEAL_RATE_LIMIT_SECRET`, приватную
подпапку `APPEAL_UPLOAD_DIR/cooperation` и `APPEAL_SMTP_*` /
`APPEAL_NOTIFICATION_EMAIL`. Новые вложения остаются вне `public`; отдельный
`COOPERATION_UPLOAD_DIR` можно задать позже как абсолютный приватный путь без
изменения кода.

## 10. Deploy

Обычный деплой выполняется только после локальных проверок и явного запроса
пользователя на production-действие.

Каноническая последовательность:

1. Локально выполнить `npm run prisma:validate`, `npm run db:seed`,
   `npm run lint`, `npm run typecheck`, `npm run build`.
2. Собрать архив только из production-нужных файлов: `src`, `prisma`, `public`,
   `docs/architecture`, root package/config files.
3. Не включать в архив `.env`, `.env.production.local`, `.git`, `.next`,
   `node_modules`, временные каталоги и локальные скриншоты.
4. Посчитать SHA-256 архива локально.
5. Загрузить архив в `/tmp/ophthalmology-deploy-<stamp>.tar.gz`.
6. Проверить SHA-256 на сервере.
7. Создать rollback-артефакты:

```bash
mkdir -p /var/backups/ophthalmology
tar -czf /var/backups/ophthalmology/source-<stamp>.tar.gz \
  --exclude='./node_modules' --exclude='./.next' --exclude='./.git' \
  -C /var/www/vysotsky.pro .
cd /var/www/vysotsky.pro
set -a; . ./.env; set +a
pg_dump "$DATABASE_URL" -f /var/backups/ophthalmology/db-<stamp>.sql
tar -czf /var/backups/ophthalmology/appeals-<stamp>.tar.gz \
  -C /var/lib/ophthalmology appeals
```

Приватный архив обращений хранить с правами `0600`. Он содержит персональные данные
и не должен попадать в deploy-архив или публичные каталоги.

8. Распаковать архив во временный каталог вне app root, например
   `/tmp/ophthalmology-release-<stamp>`.
9. Скопировать туда `.env` и `.env.production.local` только для server-side build.
10. Выполнить `npm ci`, Prisma validate/generate, SQL diff, seed дважды,
    lint, typecheck и build во временном каталоге.
11. Синхронизировать production-файлы в `/var/www/vysotsky.pro`, не трогая env.
12. В production-корне выполнить `npm ci`, `npm run prisma:generate`,
    `npm run prisma:validate`, `npm run lint`, `npm run typecheck`,
    `npm run build`.
13. Проверить `nginx -t`.
14. Перезапустить `pm2 restart ophthalmology`.
15. Выполнить `pm2 save`.
16. Проверить PM2, логи и публичные маршруты.
17. Удалить временные архивы из `/tmp`; rollback-артефакты оставить.

## 11. Rollback

Rollback выполняется только при подтверждённой проблеме релиза.

Файловый rollback:

```bash
cd /var/www/vysotsky.pro
tar -xzf /var/backups/ophthalmology/source-<stamp>.tar.gz -C /var/www/vysotsky.pro
npm ci
npm run prisma:generate
npm run build
pm2 restart ophthalmology
pm2 save
```

DB rollback:

```bash
cd /var/www/vysotsky.pro
set -a; . ./.env; set +a
psql "$DATABASE_URL" < /var/backups/ophthalmology/db-<stamp>.sql
```

DB rollback потенциально destructive для данных, появившихся после backup. Перед ним
получить отдельное подтверждение пользователя.

Восстановление приватных вложений выполняется отдельно только из соответствующего
`appeals-<stamp>.tar.gz`; нельзя откатывать файлы без согласованного отката БД, иначе
метаданные и физическое хранилище разойдутся.

## 12. Проверки после деплоя

Минимальный набор:

```bash
pm2 status
pm2 describe ophthalmology
pm2 logs ophthalmology --lines 80 --nostream
nginx -t
```

HTTP-проверки:

```bash
curl -I https://oftalmologia.pro/
curl -I https://oftalmologia.pro/sitemap.xml
```

Для релиза реестра обращений дополнительно проверить:

- `/appeal` отвечает `200`, показывает активную версию согласия и контекст расследования;
- cross-origin POST отклоняется;
- тестовое обращение получает номер, историю и приватное вложение;
- `/admin/appeals` доступен только после авторизации, фильтры и CSV работают;
- прямой URL вложения без admin-сессии не отдаёт файл;
- копия тестового обращения доставлена на официальный адрес;
- каталог `APPEAL_UPLOAD_DIR` не доступен по публичному URL;
- после проверки тестовая запись и её вложения удалены согласованной процедурой.

Для релиза расследования дополнительно проверять:

- `/news/opublikovano-rassledovanie-glaztsentr-tyumen`;
- `/investigations/proverka-oborudovaniya-glaztsentr-tyumen`;
- `/clinics/glaztsentr-tyumen`;
- `/equipment/alcon-allegretto-wave-eye-q`;
- открытие изображений и PDF из `public/`;
- отсутствие служебных имён файлов в публичном HTML.

## 13. Разделение ответственности Skills

- `project-infrastructure` отвечает за знание production-инфраструктуры и чтение
  этого документа.
- `production-deployment` отвечает за сам процесс релиза: preflight, SQL, backup,
  доставку, PM2 restart и проверку результата.
- `performance-review` отвечает за производительность, bundle, Prisma-запросы,
  LCP/CLS и риски загрузки.

При расхождении между Skill и этим документом верен `PRODUCTION.md`.
