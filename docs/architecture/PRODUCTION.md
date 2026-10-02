# Production infrastructure

> Статус: SSOT для production-инфраструктуры проекта.
> Последняя проверка: 2026-10-02.
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
| RAM | 3.8 GB + swap 4 GB (`/swapfile`, закреплён в `/etc/fstab`) |
| Рабочий пользователь | `root` |
| SSH-доступ | `ssh root@62.113.36.163` |
| Авторизация | SSH-ключ оператора `~/.ssh/id_ed25519`; сами ключи в репозитории не хранятся |

Не записывать в репозиторий приватные ключи, пароли, полные строки подключения и
содержимое `.env`.

Deploy-ключ CI (`~/.ssh/id_ed25519_deploy`) для диагностики не годится: в
`authorized_keys` он ограничен forced command и умеет запускать только `deploy.sh`,
шелл по нему не выдаётся.

VPS общий. На той же машине работает отдельный Docker-стек проекта VIZUS
(`/opt/vizus`, `/opt/vizus-crm`, контейнеры `vizus_frontend` и `vizus_postgres`,
домены `vizus1.ru`, `vizus1nv.ru`, `mhglaz.ru`, `prozrenie89.ru` и другие). Отсюда
следуют запреты:

- не удалять Docker-образы и volume: теги `vizus_frontend:<дата>` — это механизм
  rollback чужого проекта. Безопасно чистится только build cache
  (`docker builder prune`);
- не трогать `/etc/nginx` вне `oftalmologia.pro.conf`;
- помнить, что RAM и диск делятся с этим стеком, поэтому запас всегда меньше, чем
  кажется по общему объёму.

## 2. Структура проекта на сервере

Production-приложение работает из:

```text
/var/www/oftalmologia.pro
```

Рабочие каталоги и файлы:

| Путь | Назначение |
| --- | --- |
| `/var/www/oftalmologia.pro/src` | Next.js исходный код |
| `/var/www/oftalmologia.pro/prisma` | Prisma schema и seed |
| `/var/www/oftalmologia.pro/public` | Публичные изображения, PDF и документы |
| `/var/www/oftalmologia.pro/docs/architecture` | Каноническая архитектурная документация |
| `/var/www/oftalmologia.pro/.env` | Production env, секреты не выводить |
| `/var/www/oftalmologia.pro/.env.production.local` | Production env override, секреты не выводить |
| `/var/www/oftalmologia.pro/.next` | Результат production build |
| `/var/www/oftalmologia.pro/node_modules` | Production dependencies после `npm ci` |
| `/var/lib/ophthalmology/appeals` | Приватные вложения обращений; создаётся до первого релиза реестра, не входит в app root |
| `/var/lib/ophthalmology/clinic-uploads` | Постоянные публичные изображения клиник; раздаётся nginx alias-ом, не входит в app root |

Не изменять автоматически:

- `/var/www/oftalmologia.pro/.env`;
- `/var/www/oftalmologia.pro/.env.production.local`;
- `/var/www/oftalmologia.pro/.git`, если задача не про Git;
- `/etc/nginx/`, если задача не про nginx;
- `/etc/letsencrypt/`, если задача не про SSL/certbot;
- `/var/backups/ophthalmology/`, кроме создания нового rollback-артефакта.

Не создавать staging/release-каталоги внутри `/var/www/oftalmologia.pro`: ESLint
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
| Production build | `NODE_OPTIONS='--max-old-space-size=1536' npm run build -- --webpack` |

Swap обязателен: при 3.8 GB RAM и нулевом swap `npm ci` убивался OOM-killer'ом
(SIGKILL, exit 137) до завершения установки.

`npm ci` может показывать `npm audit` warnings. Они не являются автоматическим
основанием для `npm audit fix --force`: обновление зависимостей выполняется отдельной
задачей с проверкой совместимости.

## 4. PM2

Канонический процесс:

| Параметр | Значение |
| --- | --- |
| Имя процесса | `ophthalmology-oftalmologia` |
| cwd | `/var/www/oftalmologia.pro` |
| script | `node_modules/.bin/next` |
| args | `start` |
| порт приложения | `3002` |
| nginx upstream | `127.0.0.1:3002` |

Для сохранения заявок при временной недоступности SMTP используется отдельный
PM2-процесс `ophthalmology-email-worker-oftalmologia` из того же release-каталога. Он
последовательно выбирает небольшие batch из `AppealNotification`,
`CooperationApplicationNotification` и email-строк `EventRegistrationNotification`,
использует lock lease и exponential backoff. Docker-контур `vizus_*` не является
частью этого worker и не обслуживает эти таблицы.

Команды:

```bash
pm2 status
pm2 describe ophthalmology-oftalmologia
pm2 logs ophthalmology-oftalmologia --lines 80 --nostream
pm2 restart ophthalmology-oftalmologia
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
cd /var/www/oftalmologia.pro
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
cd /var/www/oftalmologia.pro
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
    server 127.0.0.1:3002;
    keepalive 16;
}
```

Домены:

```nginx
server_name oftalmologia.pro www.oftalmologia.pro;
```

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

### 10.1. Основной путь: GitHub Actions

Штатный релиз запускается workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml):

- push в `main` разворачивает соответствующий commit автоматически;
- `workflow_dispatch` допускает явный `ref`, если нужно повторно развернуть уже
  существующий branch, tag или commit;
- job использует защищённый GitHub Environment `production` и затем проверяет
  ключевые публичные маршруты;
- параллельный ручной деплой во время активного workflow запрещён.

Контракт вызова VPS (ломается при «улучшении» workflow):

- ssh передаёт **только аргументы** — `--ref <sha>`. Путь к скрипту подставляет
  forced command в `authorized_keys` deploy-ключа. Если вписать путь в команду ssh,
  скрипт получит его как свой первый аргумент и упадёт с `unknown arg`.
- ref должен быть **commit sha**: рабочая копия на VPS отслеживает `origin/main` и
  локальной ветки `main` не имеет, поэтому `main^{commit}` там не разрешается.
- аргумент начинается с `--`, поэтому перед адресом обязателен разделитель `--`,
  иначе ssh примет его за свою опцию.

Требования к секретам репозитория (`VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`):

- `VPS_SSH_KEY` — OpenSSH-ключ **без passphrase**: CI не может его ввести. Workflow
  срезает `\r` и добавляет завершающий `\n`, а затем проверяет ключ через
  `ssh-keygen -y`; запароленный или битый ключ даёт `error in libcrypto`.
- `VPS_HOST` и `VPS_USER` не должны содержать переносов строк: лишний `\n` в host
  даёт `hostname contains invalid characters`.
- `VPS_KNOWN_HOSTS` в `env:` шага не передан, поэтому host key каждый раз снимается
  через `ssh-keyscan`. Включать пиннинг можно только после проверки содержимого
  секрета, иначе деплой остановится на host key verification.

### 10.1.1. Прерванный деплой

`deploy.sh` делает бэкапы, затем `git reset --hard`, затем `npm ci` и build. Если
`npm ci` или build падает, рабочая копия уже переключена на новый commit, а
`node_modules` неполный. Сайт при этом продолжает отдаваться живым PM2-процессом из
памяти.

В этом состоянии **нельзя перезапускать PM2 и перезагружать сервер**: `next start`
не поднимется на неполных зависимостях, и сайт ляжет. Сначала восстановить
зависимости и сборку, и только потом перезапускать процесс.

Перед push обязательны локальные проверки из этого раздела. Релиз считается
завершённым только после успешного job, серверного build/restart и post-release
проверок. Если workflow не подтвердил один из этих этапов, нельзя повторно запускать
релиз вслепую: сначала нужно изучить job log и фактическое состояние production.

### 10.2. Ручной резервный путь

Ручной архивный деплой используется только при недоступности штатного workflow или
для диагностического восстановления. Каноническая последовательность:

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
  -C /var/www/oftalmologia.pro .
cd /var/www/oftalmologia.pro
set -a; . ./.env; set +a
pg_dump "$DATABASE_URL" -f /var/backups/ophthalmology/db-<stamp>.sql
tar -czf /var/backups/ophthalmology/appeals-<stamp>.tar.gz \
  -C /var/lib/ophthalmology appeals
```

Приватный архив обращений хранить с правами `0600`. Он содержит персональные данные
и не должен попадать в deploy-архив или публичные каталоги.

8. Распаковать архив во временный каталог вне app root, например
   `/tmp/oftalmologia-release-<stamp>`.
9. Скопировать туда `.env` и `.env.production.local` только для server-side build.
10. Выполнить `npm ci`, Prisma validate/generate, SQL diff, seed дважды,
    lint, typecheck и build во временном каталоге.
11. Синхронизировать production-файлы в `/var/www/oftalmologia.pro`, не трогая env.
12. В production-корне выполнить `npm ci`, `npm run prisma:generate`,
    `npm run prisma:validate`, `npm run lint`, `npm run typecheck`,
     `NODE_OPTIONS='--max-old-space-size=1536' npm run build -- --webpack`.
13. Проверить `nginx -t`.
14. Перезапустить `pm2 restart ophthalmology-oftalmologia` и
    `pm2 restart ophthalmology-email-worker-oftalmologia`.
15. Выполнить `pm2 save`.
16. Проверить PM2, логи и публичные маршруты.
17. Удалить временные архивы из `/tmp`; rollback-артефакты оставить.

## 11. Rollback

Rollback выполняется только при подтверждённой проблеме релиза.

Файловый rollback:

```bash
cd /var/www/oftalmologia.pro
tar -xzf /var/backups/ophthalmology/source-<stamp>.tar.gz -C /var/www/oftalmologia.pro
npm ci
npm run prisma:generate
NODE_OPTIONS='--max-old-space-size=1536' npm run build -- --webpack
pm2 restart ophthalmology-oftalmologia
pm2 save
```

DB rollback:

```bash
cd /var/www/oftalmologia.pro
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
pm2 describe ophthalmology-oftalmologia
pm2 logs ophthalmology-oftalmologia --lines 80 --nostream
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
