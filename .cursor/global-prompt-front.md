Agis comme un staff engineer front-end.
But: livrer le front Web (Next.js App Router) et Mobile (React Native/Expo) pour une plateforme Tuteurs/Coachs/Mentors : recherche, profils, dispos, réservation, paiement (Stripe/Mobile Money UI), visioconf (LiveKit), évaluations, notifications.

Exigences front communes :
- Web: Next.js 14+ (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack Query, Zustand (state), next-intl (i18n FR/EN), axios client avec interceptors JWT, Zod pour schémas, eslint + biome/prettier.
- Mobile: Expo SDK récent, React Navigation, React Query, Zustand, i18next, axios + interceptors JWT, Nativewind (ou Tailwind RN), Reanimated, react-native-mmkv (storage), expo-secure-store, expo-notifications.
- Accessibilité: WCAG 2.1 AA, focus states, sémantique, aria labels.
- Perf: code-splitting, lazy routes, skeletons, image optimization, list virtualization.
- UI design system: tokens couleurs, typographie, boutons, inputs, Select, DateTimePicker, Modal/Sheet, Toast, Cards, Badges, Tabs.
- Sécurité: jamais stocker refresh token en JS accessible, gérer 401/refresh, CSRF (web forms), validation côté client avec Zod.
- Tests: Vitest/Testing Library (web), Jest/RTL (mobile), e2e web (Playwright).
- Rends: arborescence, fichiers clés, composants critiques, et commandes pour lancer.

🌐 1) Prompt SCAFFOLD — Web (Next.js App Router)
Crée un monorepo ou dossier /web avec Next.js 14 (App Router) et la stack suivante :
- Tailwind + shadcn/ui
- TanStack Query (QueryClient in providers)
- Zustand (global auth ui state)
- next-intl (FR/EN)
- axios instance avec interceptors (JWT attach, refresh flow)
- Zod pour validation (forms + API responses)
- Auth pages: /(auth)/login, /register, /otp
- Layouts: (marketing) public + (app) authentifié
- Providers: Query, Theme, Intl, Toaster
- Utils: date-fns-tz, currency formatter (XOF/EUR/USD)
- eslint, prettier/biome, lint-staged, husky

Pages initiales (squelettes réelles) :
- / (landing avec CTA)
- /app (dashboard élève)
- /app/search/tutors (liste + filtres)
- /app/search/coaches (liste + filtres)
- /app/profile/[id] (profil tuteur/coach/mentor)
- /app/booking/[id] (récap + paiement UI)
- /app/class/[bookingId] (join LiveKit via token)
- /app/settings (profil, sécurité 2FA, préférences notif)

Ajoute un .env.example pour NEXT_PUBLIC_API_URL, NEXT_PUBLIC_LIVEKIT_URL, i18n config.
Donne l’arborescence, fichiers clés (contenu), et commandes (install, dev).

📱 2) Prompt SCAFFOLD — Mobile (React Native / Expo)
Crée un app Expo (TypeScript) avec :
- React Navigation (stack + tabs)
- React Query + QueryClientProvider
- Zustand pour ui/local state
- axios instance + interceptors (JWT attach + refresh)
- i18next (FR/EN), expo-localization
- Nativewind (ou Tailwind RN)
- Storage: MMKV ou expo-secure-store (tokens)
- expo-notifications (push), permission screen
- Skeletons + placeholders d’accessibilité
- Ecrans:
  - Auth: Login, Register, OTP
  - Tabs: Home (dashboard), Search, Calendar, Messages, Settings
  - Search: Tutors (map/list), Coaches (list)
  - Profile: User profile detail
  - Booking: recap + payment sheet
  - Class: WebRTC view (LiveKit React Native)
  - Program: coaching/mentoring program detail

Ajoute app.json config locale + deep links.
Rends: arborescence, fichiers clés, et commandes (expo start).

🧩 3) Prompt API Client + Auth (Web & Mobile)
Génère un module `lib/api` (web) et `src/services/api` (mobile) :
- axios baseURL=ENV.API_URL, timeouts, JSON
- interceptors: attach JWT access, on 401 try refresh (refresh endpoint), queue concurrent 401, logout on failure
- typed helpers: get/post/patch/delete<T>
- error handling: ApiError type (status, code, message)
- Auth store (Zustand): user, accessToken, refreshToken (mobile: secure-store), login/logout/refresh actions
- Hook `useAuthGuard` (redirect to /login if !auth)
- Unit tests des helpers et interceptor refresh flow

🗺️ 4) Prompt Recherche & Filtres (UI/UX + a11y)
Implémente pages de recherche :
- Web: /app/search/tutors (carte + liste toggle), /app/search/coaches (liste)
- Filtres contrôlés: subject/domain, price range, rating, availability window, lang (coaches)
- Composants: FilterSheet (mobile), FilterSidebar (desktop), Sort (price asc, rating desc, distance asc)
- Tutor search: map (Mapbox GL JS) avec markers + cluster, synchronize list scroll ↔ map viewport
- Coach/Mentor: sans carte; afficher “programmes” et badges (100% online)

Inclure:
- hooks: useSearchQuery(params) (TanStack Query)
- skeletons & empty-states
- tests RTL pour interactions de filtres

📅 5) Prompt Calendrier & Disponibilités
Web:
- Composant Calendar (react-big-calendar ou FullCalendar) pour slots
- Afficher les créneaux bookables d’un provider (GET /availability/:providerId?from&to)
- Sélection d’un slot → route /app/booking/[providerId]?slot=...

Mobile:
- Composant agenda (react-native-calendars) + liste des slots par jour
- Bouton “Réserver” sur slot

Accessibilité: navigation clavier, aria labels; fuseaux horaires (date-fns-tz)
Tests: snapshot + interaction base

👤 6) Prompt Profil Détail + Avis + Programmes
Page /app/profile/[id] :
- Header: avatar, nom, badges KYC, rating, prix
- Sections:
  - About (bio), compétences/expertises
  - Disponibilités (aperçu semaine + CTA voir plus)
  - Programmes (coaching/mentorat): cartes (sessions_count, objectifs, prix pack, CTA “s’inscrire”)
  - Avis: liste paginée + tri (récents, mieux notés)
- Sticky CTA mobile “Réserver un créneau” / “Choisir un programme”
- Web + Mobile: composants réutilisables Card, Badge, Rating, Price, Tag

💳 7) Prompt Paiement UI (Stripe + Mobile Money)
Web:
- Intégrer Stripe Elements (CardElement), configuration locale (FR/EN), format monétaire XOF/EUR
- UI flows:
  - Pay-per-session: client_secret → confirmCardPayment
  - Mobile Money: bouton “Payer via Mobile Money” → redirection/OTP provider (UI d’attente + polling status)
- Récap clair: tuteur/coach/mentor, date/heure, prix, politique annulation

Mobile:
- stripe-react-native (CardField/PaymentSheet)
- Flow identique; état “en attente de confirmation” + toasts
- Echecs: fallback, support link

Ajoute exemples de composants PaymentSummary, PaymentStatus.

🎥 8) Prompt Classe Virtuelle (LiveKit)
Intègre LiveKit :

Web:
- Page /app/class/[bookingId] : récupérer token via /sessions/token
- Composants: Grid vidéo (participants), Controls (mic/cam/screen), Chat latéral, Raise hand
- États: réseau instable → message, fallback audio-only
- Shortcut keys (m/v/s)

Mobile:
- LiveKit RN: vue vidéo, boutons mic/cam/switch camera, low bandwidth mode

Accessibilité: labels, focus order; Perf: unmount on leave; Tests basiques UI.

📝 9) Prompt Évaluations / Quiz UI
Composants pour quiz/feedback:
- Form wizard avec steps, barre d’avancement
- Types: QCM (checkbox/radio), réponses courtes (textarea), upload fichier (S3 presign URL)
- Autosave brouillon (local state) + submit final
- Résultats: score, feedback texte, ressources recommandées
- A11y: labels, aria-live pour validation
- Tests RTL sur QCM et submit

🔔 10) Prompt Notifications & Messagerie
Notifications:
- Centre de notifications: /app/notifications (catégories, filtre, pagination)
- Toaster global + in-app banners
- Préférences utilisateur (email/sms/push)

Messagerie:
- Vue conversations + thread (liste messages, composer, fichiers)
- Indicateurs lu/non-lu, typing
- Anti-abus: bouton report/block
- Virtualization pour longues listes

🛠️ 11) Prompt Design System & Accessibilité
Crée un design system minimal:
- tokens: couleurs (neutres + accent brand), spacing, radius, shadows
- typographie: display/h1/h2/body/small
- composants: Button, Input, Select, Textarea, Checkbox/Radio, Switch, Modal/Sheet, Tooltip, Badge, Card, Tabs, Toast, Skeleton
- variantes (primary/secondary/ghost/destructive), états (hover/active/disabled/focus-visible)
- a11y: aria attrs, focus ring, roles corrects
- storybook (web) si possible

Publie les tokens dans un fichier tokens.ts et réutilise via tailwind config.

🌍 12) Prompt i18n & Formats (FR/EN + XOF)
Met en place i18n :
- Web: next-intl avec namespaces (common, auth, search, profile, booking, payments, class, notifications)
- Mobile: i18next + resources
- Hook useCurrency (XOF/EUR/USD), formatter datetime local (date-fns-tz)
- Fichiers d’exemples FR/EN et commutation de langue

🔬 13) Prompt Tests & Qualité
Web:
- Vitest + Testing Library config
- Tests unitaires sur hooks (useAuth, useSearchQuery)
- Tests UI sur pages search & booking recap
- Playwright minimal: login flow → book → payment mock → success

Mobile:
- Jest + @testing-library/react-native
- Tests sur navigation, auth flow, list virtualization

CI note: scripts npm test, lint; coverage report

🚀 14) Prompt Performance & DX
Optimisations :
- Web: next/image, route-level code splitting, dynamic import, React.useDeferredValue pour listes, RSC pour data statique, memo & virtualization
- Mobile: FlashList (Shopify) ou RecyclerListView pour longues listes, Reanimated pour micro-interactions
- Skeletons & Suspense fallbacks
- Mesures Web Vitals & perf marks; profiling RN devtools

🎁 Bonus — “Un coup pour tout faire”

Si tu veux démarrer très vite, lance d’abord ces deux prompts :

A. Web starter

Scaffolde /apps/tutor-platform-frontend (Next.js App Router + Tailwind + shadcn/ui + TanStack Query + Zustand + next-intl + axios interceptors) avec routes: /, /app, /app/search/tutors, /app/search/coaches, /app/profile/[id], /app/booking/[id], /app/class/[bookingId], /app/settings. Ajoute .env.example, providers, layout, composants UI de base (Button, Input, Card, Modal, Toast), et un README avec commandes.


B. Mobile starter

Scaffolde /apps/tutor-platform-mobile (Expo TS + React Navigation + React Query + Zustand + i18next + axios interceptors + Nativewind) avec onglets: Home, Search, Calendar, Messages, Settings. Ajoute écrans Auth (Login/Register/OTP), pages Search (Tutors/Coaches), Profile, Booking Recap, Class (LiveKit placeholder), et README avec commandes Expo.
