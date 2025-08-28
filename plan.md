2) Scaffold monorepo + modules NestJS

Colle ce prompt pour que Cursor génère la base du repo.

Create a NestJS modular monolith skeleton with the following structure:

/backend
  /src
    /modules
      /auth
      /profiles
      /search
      /availability
      /booking
      /sessions
      /evaluations
      /payments
      /notifications
      /admin
    /common (dto, guards, filters, interceptors, utils)
    main.ts (Fastify)
    app.module.ts
  /test (Jest)
  ormconfig / prisma config (choose one)
  package.json, tsconfig.json, eslintrc, nest-cli.json
  .env.example
  README.md

Requirements:
- Fastify adapter + Pino logger.
- TypeORM (Postgres) with migrations OR Prisma (pick one and set up).
- Redis client and BullMQ config (global module).
- Health check endpoint (/health).
- OpenAPI docs at /docs.
- Example entities & DTOs for Users and TutorProfile.
- Provide npm scripts: dev, start, build, test, migration:generate/run.
- Output: file tree, key files content, and commands to run.

3) Implémentation “Booking + Paiements” (end-to-end)

À utiliser quand tu veux coder le cœur réservation + paiement.

Implement booking + payment E2E:

Use cases:
- POST /bookings: create pending booking with Redis distributed lock on (providerId, start, end).
- POST /payments/intent: create Stripe payment intent for booking, return client secret.
- POST /payments/webhooks: handle Stripe webhook (succeeded/failed). Use BullMQ queue to confirm booking on success. Idempotent with a webhook events table.

Details:
- Entities: Booking(id, studentId, providerId, providerType, mode, start, end, status, price), Payment(id, bookingId, provider, providerRef, status, amount, currency).
- Status flow: pending -> confirmed | canceled | refunded.
- Validation: class-validator DTOs; require Idempotency-Key header on sensitive POST.
- Security: JWT guard; RBAC so only student can book, provider cannot book for self.
- Logs: Pino context logs (bookingId, userId).
- Tests: unit tests for service logic + integration test for webhook path (mock Stripe SDK).
- Provide API examples (curl) and sample payloads.
- Output: new/changed files diff + commands to run migrations and tests.

4) Visioconférence (LiveKit) – génération de token

Pour intégrer LiveKit proprement côté backend.

Add sessions module integration with LiveKit:

Endpoints:
- GET /sessions/token?bookingId=... -> returns JWT to join the LiveKit room.
- Create room lazily if not exists; room name = bookingId.
- Ensure booking.status === confirmed before issuing token.
- Token grants: join, publish/subscribe. Distinguish roles (tutor/learner) via JWT claims.
- Add minimal config in .env.example: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL.

Include:
- LiveKit server SDK usage (issue token).
- Unit tests for happy path and forbidden when booking not confirmed.
- Update README with configuration & example curl.

5) Notifications asynchrones (BullMQ)

Pour câbler email/SMS/push sans bloquer les requêtes.

Implement notifications module using BullMQ:

- Queues: notifications (email, sms, push).
- Producer: publish on events: booking_confirmed, payment_succeeded, evaluation_posted.
- Consumers: workers in a separate Nest process (worker.ts). Add bull-board or simple /admin/queues endpoint (protected) to inspect.
- Providers: Email (Brevo/Sendgrid), SMS (Twilio), Push (FCM). Create adapter interfaces and a basic fake provider for dev.
- Retry strategy with exponential backoff and DLQ (dead-letter).
- Tests: unit test the producer and a consumer handler with a fake provider.
- Update .env.example with provider keys (dummy).

6) Recherche (FTS Postgres) Tuteurs vs Coach/Mentor

Pour la recherche intelligente version MVP.

Implement search module with Postgres FTS:

- Tutors search: subject + geo radius + price + rating. If PostGIS not available, assume (lat,lng) columns and compute rough distance; else use ST_DWithin.
- Coaches/Mentors search: expertise + language + price + rating (no geo filter).
- Expose: GET /search/tutors?subject=...&lat=...&lng=...&radiusKm=... ; GET /search/coaches?expertise=...&lang=...
- Add GIN indexes and tsvector columns; migration scripts included.
- Return paginated results with facets (min/avg price, count by rating bucket).
- Tests: unit tests for repository queries (with seed).

7) Docker-compose Dev (DB/Redis/MinIO/Mailhog)

Pour obtenir un environnement local clé en main.

Create docker-compose for development including:
- postgres:16 with volume and healthcheck
- redis:7
- minio (S3 compatible) + console
- mailhog (SMTP sink)
- api (Nest dev) and worker (BullMQ consumer) services
Provide .env.example for connections and update README with `docker compose up` instructions and first migration command.

8) OpenAPI contract + DTOs + Guards

Pour documenter et cadrer les contrats.

Generate/complete OpenAPI for key endpoints:
- /auth/login, /auth/refresh
- /search/tutors, /search/coaches
- /bookings (POST), /bookings/:id (GET)
- /payments/intent (POST), /payments/webhooks (POST)
- /sessions/token (GET)
Include DTOs with class-validator schemas; secure endpoints via JWT bearer. Mount Swagger UI at /docs. Ensure examples are present for each path.

9) Tests de charge (k6/Artillery) + SLO

Pour valider les perf avant prod.

Add basic load tests using k6:
- Scenarios for: search, create booking, create payment intent, webhook simulate.
- Targets: P95 < 200ms for search, < 150ms for booking create (DB/index tuned).
- Output: k6 script + README instructions + example results JSON.
Recommend DB indexes and Redis cache TTL to meet SLOs.

10) Refactor/perf review ciblé

Quand tu veux optimiser une zone “chaude”.

Do a performance refactor of the booking module:
- Identify hot paths and DB queries (EXPLAIN notes).
- Add Redis lock (SET NX PX) around slot creation to prevent double-booking.
- Ensure idempotency-key middleware on POST /bookings; store keys in Redis with TTL.
- Batch related reads with SELECT ... WHERE id IN (...) and add missing indexes.
- Output: code diff + rationale + benchmark notes (before/after).

11) Back-office Admin (KYC, litiges, queues)

Pour démarrer un panel admin simple.

Create minimal admin endpoints (JWT + RBAC=admin):
- GET /admin/users?role=...
- POST /admin/kyc/:userId/verify (approve/reject)
- GET /admin/bookings?status=...
- GET /admin/queues (BullMQ summary)
- Include pagination, filtering, and audit logging.
- Add e2e test for admin guard and a couple of endpoints.

12) Commit & PR prompts (qualité)

Utilise-les dans la discussion de PR avec Cursor.

Write a conventional commit message summarizing:
- scope: booking|payments|sessions|infra|search
- type: feat|fix|perf|refactor|test|docs
- a short imperative summary
- a body with rationale and breaking changes if any

Review this diff as a staff engineer:
- Check security, input validation, idempotency, error handling.
- Verify DB indexes/migrations and transaction boundaries.
- Suggest performance improvements and code simplifications.
- Ensure tests cover happy/edge cases.
Return a concise checklist of issues and suggested fixes.

Astuces d’utilisation dans Cursor

Colle d’abord le prompt “System/Workspace” pour ancrer le contexte.

Travaille module par module (prompts 2→11).

Demande toujours à Cursor de montrer l’arborescence + fichiers modifiés + commandes pour lancer.

Si la réponse est trop verbeuse, dis : “Show only file diffs and commands.”