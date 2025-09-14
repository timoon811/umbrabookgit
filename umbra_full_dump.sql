--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 15.13 (Homebrew)

-- Started on 2025-09-15 00:38:21 +03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.finance_transactions DROP CONSTRAINT "finance_transactions_projectId_fkey";
ALTER TABLE ONLY public.finance_transactions DROP CONSTRAINT "finance_transactions_counterpartyId_fkey";
ALTER TABLE ONLY public.finance_transactions DROP CONSTRAINT "finance_transactions_categoryId_fkey";
ALTER TABLE ONLY public.finance_transactions DROP CONSTRAINT "finance_transactions_accountId_fkey";
ALTER TABLE ONLY public.documentation_sections DROP CONSTRAINT "documentation_sections_projectId_fkey";
ALTER TABLE ONLY public.documentation DROP CONSTRAINT "documentation_sectionId_fkey";
ALTER TABLE ONLY public.documentation DROP CONSTRAINT "documentation_parentId_fkey";
ALTER TABLE ONLY public.deposits DROP CONSTRAINT "deposits_depositSourceId_fkey";
ALTER TABLE ONLY public.deposit_sources DROP CONSTRAINT "deposit_sources_projectId_fkey";
ALTER TABLE ONLY public.course_sections DROP CONSTRAINT "course_sections_courseId_fkey";
ALTER TABLE ONLY public.course_pages DROP CONSTRAINT "course_pages_sectionId_fkey";
ALTER TABLE ONLY public.analytics DROP CONSTRAINT "analytics_userId_fkey";
DROP INDEX public.users_telegram_key;
DROP INDEX public.users_telegram_idx;
DROP INDEX public.users_status_idx;
DROP INDEX public.users_role_idx;
DROP INDEX public.users_email_key;
DROP INDEX public.users_email_idx;
DROP INDEX public.finance_transactions_type_idx;
DROP INDEX public."finance_transactions_projectKey_idx";
DROP INDEX public."finance_transactions_projectId_idx";
DROP INDEX public.finance_transactions_date_idx;
DROP INDEX public."finance_transactions_categoryId_idx";
DROP INDEX public."finance_transactions_accountId_idx";
DROP INDEX public.documentation_slug_key;
DROP INDEX public.documentation_sections_key_key;
DROP INDEX public.deposits_processed_idx;
DROP INDEX public."deposits_mammothId_idx";
DROP INDEX public."deposits_id_depositSourceId_key";
DROP INDEX public."deposits_depositSourceId_idx";
DROP INDEX public."deposits_createdAt_idx";
DROP INDEX public."deposit_sources_projectId_idx";
DROP INDEX public."deposit_sources_isActive_idx";
DROP INDEX public.courses_slug_key;
DROP INDEX public.courses_slug_idx;
DROP INDEX public."courses_isPublished_idx";
DROP INDEX public.courses_category_idx;
DROP INDEX public.content_projects_type_idx;
DROP INDEX public."content_projects_isActive_idx";
DROP INDEX public.articles_slug_key;
DROP INDEX public.articles_slug_idx;
DROP INDEX public."articles_isPublished_idx";
DROP INDEX public.articles_category_idx;
DROP INDEX public."analytics_userId_idx";
DROP INDEX public."analytics_createdAt_idx";
DROP INDEX public.analytics_action_idx;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.finance_transactions DROP CONSTRAINT finance_transactions_pkey;
ALTER TABLE ONLY public.finance_projects DROP CONSTRAINT finance_projects_pkey;
ALTER TABLE ONLY public.finance_counterparties DROP CONSTRAINT finance_counterparties_pkey;
ALTER TABLE ONLY public.finance_categories DROP CONSTRAINT finance_categories_pkey;
ALTER TABLE ONLY public.finance_accounts DROP CONSTRAINT finance_accounts_pkey;
ALTER TABLE ONLY public.documentation_sections DROP CONSTRAINT documentation_sections_pkey;
ALTER TABLE ONLY public.documentation DROP CONSTRAINT documentation_pkey;
ALTER TABLE ONLY public.deposits DROP CONSTRAINT deposits_pkey;
ALTER TABLE ONLY public.deposit_sources DROP CONSTRAINT deposit_sources_pkey;
ALTER TABLE ONLY public.courses DROP CONSTRAINT courses_pkey;
ALTER TABLE ONLY public.course_sections DROP CONSTRAINT course_sections_pkey;
ALTER TABLE ONLY public.course_pages DROP CONSTRAINT course_pages_pkey;
ALTER TABLE ONLY public.content_projects DROP CONSTRAINT content_projects_pkey;
ALTER TABLE ONLY public.articles DROP CONSTRAINT articles_pkey;
ALTER TABLE ONLY public.analytics DROP CONSTRAINT analytics_pkey;
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
DROP TABLE public.users;
DROP TABLE public.finance_transactions;
DROP TABLE public.finance_projects;
DROP TABLE public.finance_counterparties;
DROP TABLE public.finance_categories;
DROP TABLE public.finance_accounts;
DROP TABLE public.documentation_sections;
DROP TABLE public.documentation;
DROP TABLE public.deposits;
DROP TABLE public.deposit_sources;
DROP TABLE public.courses;
DROP TABLE public.course_sections;
DROP TABLE public.course_pages;
DROP TABLE public.content_projects;
DROP TABLE public.articles;
DROP TABLE public.analytics;
DROP TABLE public._prisma_migrations;
DROP TYPE public."UserStatus";
DROP TYPE public."UserRole";
DROP TYPE public."TransactionType";
-- *not* dropping schema, since initdb creates it
--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- TOC entry 844 (class 1247 OID 37680)
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'INCOME',
    'EXPENSE',
    'TRANSFER'
);


--
-- TOC entry 838 (class 1247 OID 37661)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'MODERATOR',
    'MEDIA_BUYER',
    'SUPPORT',
    'PROCESSOR'
);


--
-- TOC entry 841 (class 1247 OID 37672)
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 37983)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 37823)
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    metadata text,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 37831)
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id text NOT NULL,
    title text NOT NULL,
    content text,
    slug text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 37841)
-- Name: content_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT 'documentation'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 212 (class 1259 OID 37719)
-- Name: course_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_pages (
    id text NOT NULL,
    title text NOT NULL,
    content text,
    blocks text,
    "order" integer DEFAULT 0 NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "sectionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 211 (class 1259 OID 37709)
-- Name: course_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_sections (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "courseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 210 (class 1259 OID 37698)
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    slug text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 37804)
-- Name: deposit_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_sources (
    id text NOT NULL,
    name text NOT NULL,
    token text NOT NULL,
    "projectId" text NOT NULL,
    commission double precision DEFAULT 20.0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 37814)
-- Name: deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposits (
    id text NOT NULL,
    "depositSourceId" text NOT NULL,
    "mammothId" text NOT NULL,
    "mammothLogin" text NOT NULL,
    "mammothCountry" text NOT NULL,
    "mammothPromo" text,
    token text NOT NULL,
    amount double precision NOT NULL,
    "amountUsd" double precision NOT NULL,
    "commissionPercent" double precision NOT NULL,
    "commissionAmount" double precision NOT NULL,
    "commissionAmountUsd" double precision NOT NULL,
    "netAmount" double precision NOT NULL,
    "netAmountUsd" double precision NOT NULL,
    "workerPercent" integer NOT NULL,
    domain text NOT NULL,
    "txHash" text,
    processed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 214 (class 1259 OID 37739)
-- Name: documentation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentation (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    slug text NOT NULL,
    content text,
    blocks text,
    "sectionId" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 213 (class 1259 OID 37729)
-- Name: documentation_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentation_sections (
    id text NOT NULL,
    name text NOT NULL,
    key text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 215 (class 1259 OID 37749)
-- Name: finance_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_accounts (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'OTHER'::text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    commission double precision DEFAULT 0 NOT NULL,
    cryptocurrencies text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 37772)
-- Name: finance_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_categories (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'EXPENSE'::text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 216 (class 1259 OID 37762)
-- Name: finance_counterparties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_counterparties (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'CLIENT'::text NOT NULL,
    email text,
    phone text,
    address text,
    "taxNumber" text,
    "bankDetails" text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 37783)
-- Name: finance_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_projects (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    budget double precision,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 37793)
-- Name: finance_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_transactions (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "counterpartyId" text,
    "categoryId" text,
    "projectId" text,
    "projectKey" text,
    type public."TransactionType" NOT NULL,
    amount double precision NOT NULL,
    "commissionPercent" double precision DEFAULT 0 NOT NULL,
    "commissionAmount" double precision DEFAULT 0 NOT NULL,
    "netAmount" double precision NOT NULL,
    "originalAmount" double precision NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 209 (class 1259 OID 37687)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    telegram text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 3996 (class 0 OID 37983)
-- Dependencies: 225
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6b20648e-2f09-4629-8e92-9dc5d2994801	f569465c80bc2b91a1d701ca70af06fbb3e79c894e7cb6bdce678c460817af0a	2025-09-15 01:47:27.557009+05	20241215000000_add_user_shifts_assignment		\N	2025-09-15 01:47:27.557009+05	0
2bce6709-be0e-44a1-960d-99785747b20a	d0c36b71e258d6489124b21c18ebfb1c40441d140d98c5f9c3cc0d639ed46291	2025-09-15 01:47:32.611575+05	20250830110336_init_postgresql_with_telegram_status		\N	2025-09-15 01:47:32.611575+05	0
5652fa6f-ccd5-4890-8afb-33ba615043cf	db952a1c713a1900c31e132c9975aa4a2edb521025f57af2916470b681aba1ad	2025-09-15 01:47:33.976418+05	20250830145452_add_processor_system		\N	2025-09-15 01:47:33.976418+05	0
17e608c6-b48b-4818-9ce6-9a7793483937	63e071f5fe129e2dcc3f5f91fcb4700cf27d7ccb7a5fd800beb321325f00f0d9	2025-09-15 01:47:42.783665+05	20250831131712_add_crypto_support_to_processor_deposits		\N	2025-09-15 01:47:42.783665+05	0
566ae5d5-a896-4e00-a013-bf47a0844ca0	dd2be4fd7226e57b377df8adca2fd4aa8bb670669ff267796f16b4c7e79e90de	2025-09-15 01:47:43.86251+05	20250831211521_add_bonus_grid_and_motivations		\N	2025-09-15 01:47:43.86251+05	0
9745f577-e051-431a-85ba-ffad04a71275	de494cbf510aafe532228d1100a250d749eba79a88eec3004a85092e1a4d9184	2025-09-15 01:47:44.929603+05	20250831212553_add_processing_instructions_and_scripts		\N	2025-09-15 01:47:44.929603+05	0
d6628db3-45e6-4cf6-9c69-897715b17196	14ad2fab83782900abf886d1a712ccf16101983e202ceed7a984f527b7ce0b1d	2025-09-15 01:47:46.100394+05	20250831215844_add_user_wallets		\N	2025-09-15 01:47:46.100394+05	0
c2a3f803-be0a-4c0f-8ac4-f3e013da8253	9d60ff571eb085e6204a8ef617456cf8b4a6a072c3d8fb3d5615c7d7040cc209	2025-09-15 01:47:47.164296+05	20250903172911_add_transfer_exchange_support		\N	2025-09-15 01:47:47.164296+05	0
23387a5b-48e7-4b92-b271-6eb8c8cbeec0	e64010eb2025697ac7456c9f4dec6274251edd0a0289124051c0662df640b2bc	2025-09-15 01:47:48.258447+05	20250907163912_add_shift_types_and_penalties		\N	2025-09-15 01:47:48.258447+05	0
50a63e1a-33d4-4aac-acb6-407d266865fd	1e70018c929a4918f189511aa953e52b97631c63d92a2f731bcb7aaa50c1339c	2025-09-15 01:47:49.348341+05	20250907164636_add_shift_tracking		\N	2025-09-15 01:47:49.348341+05	0
e5111205-1073-44f2-9910-993a899a475e	d8492e78950f1f33f3e8738f134217c61ed0a1d1a25de4f8c434d07540950289	2025-09-15 01:47:50.381357+05	20250911222542_add_content_projects_support		\N	2025-09-15 01:47:50.381357+05	0
f680b94b-3e4c-4630-a1f3-080f89dec5ba	20a872ecea694a2e7df175a8161c2858ecb88bccc02d37635e86dd6afb2db0b2	2025-09-15 01:47:51.415004+05	20250912203326_update_user_roles_system		\N	2025-09-15 01:47:51.415004+05	0
\.


--
-- TOC entry 3993 (class 0 OID 37823)
-- Dependencies: 222
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics (id, "userId", action, metadata, ip, "userAgent", "createdAt") FROM stdin;
\.


--
-- TOC entry 3994 (class 0 OID 37831)
-- Dependencies: 223
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articles (id, title, content, slug, category, "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3995 (class 0 OID 37841)
-- Dependencies: 224
-- Data for Name: content_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_projects (id, name, description, type, "isActive", "createdAt", "updatedAt") FROM stdin;
e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	Umbra Platform Документация	Основная документация платформы, перенесенная из старой системы	documentation	t	2025-09-14 20:40:21.717	2025-09-14 20:40:21.717
\.


--
-- TOC entry 3983 (class 0 OID 37719)
-- Dependencies: 212
-- Data for Name: course_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_pages (id, title, content, blocks, "order", "isPublished", "sectionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3982 (class 0 OID 37709)
-- Dependencies: 211
-- Data for Name: course_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course_sections (id, title, description, "order", "isPublished", "courseId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3981 (class 0 OID 37698)
-- Dependencies: 210
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, title, description, slug, category, level, "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3991 (class 0 OID 37804)
-- Dependencies: 220
-- Data for Name: deposit_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deposit_sources (id, name, token, "projectId", commission, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3992 (class 0 OID 37814)
-- Dependencies: 221
-- Data for Name: deposits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deposits (id, "depositSourceId", "mammothId", "mammothLogin", "mammothCountry", "mammothPromo", token, amount, "amountUsd", "commissionPercent", "commissionAmount", "commissionAmountUsd", "netAmount", "netAmountUsd", "workerPercent", domain, "txHash", processed, "createdAt") FROM stdin;
\.


--
-- TOC entry 3985 (class 0 OID 37739)
-- Dependencies: 214
-- Data for Name: documentation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentation (id, title, description, slug, content, blocks, "sectionId", "order", "isPublished", "parentId", "createdAt", "updatedAt") FROM stdin;
8cf6b896-c79c-4a33-825f-15c6a9f103b6	Где взять домен?		page-18	porkbun.com\\nНадежный, проверенный, анонимный регистратор доменов. Возможна оплата с крипты или арендных карт. Быстрое обновление NS.\\n\\nЕсли вяжешь к какому-либо серверу - не забудь прокинуть его через cloudflare	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	3	t	\N	2025-09-03 15:50:14.565	2025-09-04 13:02:17.589
e3dfbe29-b8a0-43ad-bebe-3ead3e213d99	Где купить прокси? Какие прокси покупать?		page-22	proxyline.net\\nmobileproxy.space\\nproxyempire.io\\n\\nПодробнее о том какие именно прокси брать смотри в Facebook Ads -> Step-By-Step Guide: раздел Прокси	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	2	t	\N	2025-09-03 15:52:03.049	2025-09-04 13:02:20.156
f40be597-ec98-431f-ad04-82585afc4d08	С какого сорса начать? Какие источники используете?		page-21	Если ты задаешь такой вопрос, то в таком случае лучше точно не начинать с платных источников трафика. Стоит попробовать УБТ Шортс, Рилс или Тикток. Как начать лить убт с этих источников смотри в соответвующей вкладке.\\n\\n\\nМы используем разные источники УБТ шортс, рилс, тикток, самые большие обьемы у нас из FB, но все мы начинали с УБТ	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	0	t	\N	2025-09-03 15:50:56.768	2025-09-04 13:15:16.764
94437457-8a50-4d58-9907-9a5d6a76ddc3	Где купить аккаунты?		page-19	Где берут аккаунты наши ребята:\\n\\nmakemoneyfb.shop\\nfb1.shop\\nfbstore.ru\\ndark.shopping\\n\\nПодробнее о том какой аккаунт брать и чем они отличаются читай в заметке Facebook Ads -> Аккаунты ФБ	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	4	t	\N	2025-09-03 15:50:30.148	2025-09-04 13:02:27.868
c8c0463f-351d-407d-b541-eefd340fde23	Аккаунты ФБ	Представь, что Facebook - это большой магазин, а ты хочешь продавать в нем свои товары через рекламу. Но чтобы рекламировать, тебе нужен "пропуск" в этот магазин - аккаунт. Этот гайд покажет тебе, как получить такой пропуск и правильно им пользоваться, чтобы не выгнали из магазина.	page-23	Как работать с аккаунтами\\n\\nМы разберем все виды аккаунтов, как их получить и как безопасно использовать.\\n\\n# ГЛАВА 1: ИЗ ЧЕГО СОСТОИТ АККАУНТ FACEBOOK\\n\\nПрежде чем покупать аккаунты, давай разберемся, как устроен Facebook изнутри. Это как машина - чтобы водить, нужно знать, где руль, газ и тормоз.\\n\\n## 1.1 ЧТО ЕСТЬ В КАЖДОМ АККАУНТЕ\\n\\nПредставь Facebook аккаунт как квартиру с разными комнатами:\\n\\nТВОЙ ЛИЧНЫЙ ПРОФИЛЬ\\n   - Это твоя "визитка" в Facebook\\n   - Здесь твои фото, друзья, посты\\n   - Отсюда ты входишь в систему\\n\\nРЕКЛАМНЫЙ КАБИНЕТ\\n   - Это как касса в магазине - отсюда платишь за рекламу\\n   - Здесь создаешь объявления\\n   - Смотришь, сколько потратил и сколько заработал\\n\\nБИЗНЕС-МЕНЕДЖЕР (BM)\\n   - Это как офис управляющего - управляешь сразу несколькими аккаунтами\\n   - Привязываешь страницы и пиксели\\n   - Раздаешь доступы помощникам\\n\\nСТРАНИЦА (FAN PAGE)\\n   - Это как витрина магазина - от ее имени показывается реклама\\n   - Создается специально под твой товар\\n   - Может быть заблокирована, если Facebook заподозрит неладное\\n\\nПИКСЕЛЬ FACEBOOK\\n   - Это как счетчик посетителей в магазине\\n   - Считает, кто кликнул по рекламе\\n   - Показывает, сколько людей купило товар\\n\\nБез понимания этих "комнат" ты будешь как слепой в темноте - спотыкаться и ошибаться.\\n\\n# ГЛАВА 2: КАКОЙ АККАУНТ ВЫБРАТЬ ДЛЯ РЕКЛАМЫ?\\n\\nПредставь, что аккаунты Facebook - это разные машины для поездки. У каждой свои преимущества и недостатки. Давай разберем, какую "машину" выбрать для твоего бизнеса.\\n\\n## 2.1 ВЗЛОМАННЫЕ АККАУНТЫ (БРУТ)\\n\\nЭто аккаунты, которые взломали хакеры:\\n- Берут чужие аккаунты с простыми паролями\\n- У них долгая история в Facebook\\n- Продают на черном рынке\\n\\nПлюсы:\\n- Facebook им доверяет (долгая история)\\n- Мало проверяют при запуске рекламы\\n\\nМинусы:\\n- Владелец может вернуть аккаунт\\n- Рискованно - могут забанить в любой момент\\n- Неэтично и незаконно\\n\\n## 2.2 УКРАДЕННЫЕ ДАННЫЕ (ЛОГИ)\\n\\nИнформация, украденная вирусами:\\n- Хакеры крадут логины и пароли\\n- Копируют все действия пользователя\\n- Продают как "готовые аккаунты"\\n\\nПлюсы:\\n- Полная копия реального человека\\n- Высокий уровень доверия Facebook\\n\\nМинусы:\\n- Совсем незаконно\\n- Риск, что Facebook заметит подозрительную активность\\n- Могут забанить при малейшей ошибке\\n\\n## 2.3 АРЕНДОВАННЫЕ АККАУНТЫ\\n\\nАккаунты, которые сдают в аренду:\\n- Настоящие люди сдают свои аккаунты\\n- Можно сразу запускать рекламу\\n- У них хорошая история\\n\\nПлюсы:\\n- Быстрый старт рекламы\\n- Низкий риск блокировки\\n- Facebook быстро одобряет рекламу\\n\\nМинусы:\\n- Дорого платить за аренду\\n- Владелец может сам зайти в аккаунт\\n- Зависимость от чужого человека\\n\\n## 2.4 ПРОФЕССИОНАЛЬНЫЕ АККАУНТЫ\\n\\nАккаунты от рекламных агентств:\\n- Создают специально для рекламы\\n- Имеют повышенные лимиты на траты\\n- С гарантией и поддержкой\\n\\nПлюсы:\\n- Можно тратить много денег на рекламу\\n- Помощь специалистов\\n- Стабильная работа\\n\\nМинусы:\\n- Очень дорого\\n- Нужно подписывать договор\\n- Строгие правила\\n\\n## 2.5 АККАУНТЫ ПОСЛЕ БЛОКИРОВКИ (ПЗРД)\\n\\nАккаунты, которые уже блокировали за рекламу:\\n- Были забанены Facebook за рекламу\\n- Прошли восстановление\\n- Facebook им теперь доверяет\\n\\nПлюсы:\\n- Лучше всего подходят для рекламы\\n- Меньше проверок от Facebook\\n- Можно тратить много денег\\n\\nМинусы:\\n- Дороже обычных аккаунтов\\n- Нужно проверять историю блокировок\\n\\n## 2.6 ПРОДВИНУТЫЕ АККАУНТЫ (KING)\\n\\nАккаунты с максимальным доверием:\\n- Долго "натаскивали" как реального пользователя\\n- Имитируют поведение обычного человека\\n- Готовы к запуску рекламы\\n\\nПлюсы:\\n- Минимальный риск блокировки\\n- Можно тратить большие бюджеты\\n- Стабильная работа\\n\\nМинусы:\\n- Долго готовить самому\\n- Дорого покупать готовые\\n\\n## 2.7 МАССОВО СОЗДАННЫЕ АККАУНТЫ (АВТОРЕГИ)\\n\\nАккаунты, созданные автоматически:\\n- Программа сама регистрирует тысячи аккаунтов\\n- Минимальная информация в профиле\\n- Нуждаются в доработке\\n\\nВиды:\\n- Новые автореги (только созданы)\\n- Старые автореги (созданные давно)\\n\\nПлюсы:\\n- Дешево стоят\\n- Можно купить много сразу\\n- Полный контроль над ними\\n\\nМинусы:\\n- Facebook им не доверяет\\n- Нужно долго "натаскивать"\\n- Высокий риск блокировки\\n\\nДЛЯ РЕКЛАМЫ КАЗИНО И СТАВОК лучше всего подойдут: ПЗРД аккаунты, King аккаунты и качественные автореги.\\n\\n# ГЛАВА 3: ГДЕ КУПИТЬ АККАУНТЫ ДЛЯ РЕКЛАМЫ\\n\\nТеперь давай разберемся, где покупать аккаунты. Это как выбор магазина - лучше идти в проверенный супермаркет, чем на рынок к случайным людям.\\n\\n3.1 НАДЕЖНЫЕ МАГАЗИНЫ ДЛЯ ПОКУПКИ\\n\\nНЕ покупай аккаунты у случайных людей в Telegram! Используй проверенные магазины:\\n\\nFB1.SHOP\\n   - Работают давно, много положительных отзывов\\n   - Хорошая репутация среди арбитражников\\n   - Разные виды аккаунтов на выбор\\n\\nMAKEMONEYFB.SHOP\\n   - Специально созданы для людей, занимающихся рекламой\\n   - Готовые комплекты аккаунтов и настроек\\n   - Быстрая и качественная поддержка\\n\\nПочему эти магазины надежные:\\n- Дают гарантию на качество аккаунтов\\n- Вернут деньги, если аккаунт не работает\\n- Проверяют каждый аккаунт перед продажей\\n\\n# 3.2 ЧТО ОБЯЗАТЕЛЬНО ПРОВЕРИТЬ ПЕРЕД ПОКУПКОЙ\\n\\nПредставь, что покупаешь подержанную машину - нужно проверить все! Вот что смотреть:\\n\\n- ВОЗРАСТ АККАУНТА: минимум 2-3 года (как стаж водителя)\\n- ДЕНЬГИ НА СЧЕТЕ: $100-200 (чтобы сразу запускать рекламу)\\n- БИЗНЕС-МЕНЕДЖЕР: должен быть настроен\\n- СТРАНА АККАУНТА: выбери нужную географию\\n- СТРАНИЦА: должна быть создана (Fan Page)\\n- РЕКЛАМНЫЙ КАБИНЕТ: активный и рабочий\\n\\n## 3.3 ГОТОВЫЕ КОМПЛЕКТЫ (СЕТАПЫ)\\n\\nМожно купить сразу готовый "набор инструментов":\\n- Главный аккаунт + 9 дополнительных\\n- Все настроено: менеджер, кабинеты, счетчики\\n- Готовые группы людей для рекламы\\n- Цена: $100-500\\n\\nПреимущества готовых сетапов:\\n- Не нужно ничего настраивать самому\\n- Все работает сразу после покупки\\n- Можно запускать рекламу через 10 минут\\n\\n# ГЛАВА 4: СОЗДАНИЕ СВОИХ АККАУНТОВ\\n\\nЕсли ты не хочешь покупать готовые аккаунты, можешь создать их сам. Но учти - это долгий и сложный процесс.\\n\\n## 4.1 РУЧНАЯ РЕГИСТРАЦИЯ\\n\\nВ теории можно создать аккаунт вручную:\\n- Зайти на Facebook\\n- Заполнить все поля\\n- Подтвердить email и номер телефона\\n\\nНо на практике это почти невозможно:\\n- Facebook очень умный - распознает подозрительную активность\\n- 99% таких аккаунтов блокируют сразу\\n- На создание одного аккаунта уйдет час времени\\n\\n## 4.2 АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ\\n\\nМожно использовать специальные программы:\\n- Программа сама заполняет все поля\\n- Создает сотни аккаунтов за раз\\n- Работает через прокси и специальные браузеры\\n\\nНо это сложно для новичков. Лучше сразу купить готовые аккаунты - сэкономишь время и нервы.\\n\\n# ГЛАВА 5: "НАТАСКИВАНИЕ" АККАУНТОВ (ФАРМ)\\n\\nЭто самый важный этап! Фарм - это когда ты "натаскиваешь" аккаунт вести себя как настоящий человек. Без этого Facebook заподозрит неладное и забанит.\\n\\n## 5.1 ПОЧЕМУ НУЖЕН ФАРМ\\n\\nFacebook следит за каждым аккаунтом как за подопытным:\\n- Если аккаунт ведет себя как робот - сразу бан\\n- Если ведет себя как обычный человек - получает доверие\\n- Доверие = меньше проверок + можно тратить больше денег\\n\\n## 5.2 ЧТО ДЕЛАТЬ ДЛЯ "НАТАСКИВАНИЯ"\\n\\nНужно имитировать поведение реального пользователя:\\n- Читать новости в ленте\\n- Ставить лайки под постами\\n- Писать комментарии\\n- Добавлять друзей\\n- Публиковать свои посты и истории\\n- Играть в игры\\n- Посещать разные разделы Facebook\\n\\nГлавное правило: не переусердствуй! Настоящие люди не лайкают каждую фотографию подряд.\\n\\n## 5.3 ПЛАН "НАТАСКИВАНИЯ" НА 2-4 НЕДЕЛИ\\n\\nПЕРВЫЕ ДНИ: активность 5-10 минут в сутки (как будто случайно зашел)\\nДРУЗЬЯ: добавляй 10-20 человек в день (не больше!)\\nПОСТЫ: публикуй 1-2 поста в неделю\\nЛАЙКИ: ставь 20-50 лайков в день\\nКОММЕНТАРИИ: пиши 5-10 комментариев в день\\n\\nВремя фарма: минимум 2-4 недели, лучше месяц.\\n\\n## 5.4 ПРОГРАММЫ ДЛЯ АВТОМАТИЧЕСКОГО ФАРМА\\n\\nЕсли у тебя много аккаунтов, используй программы:\\n- Автоматически ставят лайки и комментарии\\n- Управляют сразу несколькими аккаунтами\\n- Имитируют поведение человека\\n\\nНо осторожно! Слишком активная автоматизация может привести к бану.\\n\\n# ГЛАВА 6: ОБЯЗАТЕЛЬНЫЕ ИНСТРУМЕНТЫ ДЛЯ РАБОТЫ\\n\\nБез этих инструментов ты не сможешь безопасно работать с аккаунтами Facebook. Это как инструменты для автомеханика.\\n\\n## 6.1 ПРОКСИ (СКРЫВАЕМ СВОЙ IP-АДРЕС)\\n\\nОбязательный инструмент для каждого аккаунта:\\n- Скрывает твой реальный адрес в интернете\\n- Позволяет работать из разных стран\\n- Защищает от блокировки\\n\\nВиды прокси:\\n- РЕЗИДЕНЦИАЛЬНЫЕ (лучшие для Facebook) - реальные домашние адреса\\n- МОБИЛЬНЫЕ (идеально для арбитража) - как будто ты заходишь с телефона\\n- ДАТА-ЦЕНТР (дешевые, но не для Facebook) - обычные серверы\\n\\nРекомендуемые сервисы:\\n- LTE Boost (надежный партнер)\\n- Asocks.com (хороший выбор)\\n- Mobileproxy.space (специально для Facebook)\\n\\nЦена: $50-200 в месяц.\\n\\n## 6.2 СПЕЦИАЛЬНЫЕ БРАУЗЕРЫ (АНТИДЕТЕКТ)\\n\\nДля работы с несколькими аккаунтами одновременно:\\n- Создают отдельные "комнаты" для каждого аккаунта\\n- Меняют "отпечатки" устройств\\n- Имитируют разные телефоны и компьютеры\\n\\nЛучшие браузеры:\\n- Dolphin Anty (рекомендую начать с него)\\n- Linken Sphere (для продвинутых)\\n- Multilogin (самый мощный)\\n\\nЦена: $100-300 за лицензию.\\n\\nСовет: начинай с Dolphin Anty - оптимальное соотношение цены и качества.\\n\\n6.3 ДОПОЛНИТЕЛЬНЫЕ ПОМОЩНИКИ\\n\\n- ВИРТУАЛЬНЫЕ НОМЕРА: для регистрации аккаунтов\\n- ВРЕМЕННЫЕ ПОЧТЫ: одноразовые email адреса\\n- СЕРВИСЫ SMS: для получения кодов подтверждения\\n\\n# ГЛАВА 7: ПОЧЕМУ FACEBOOK БЛОКИРУЕТ АККАУНТЫ\\n\\nFacebook очень умный - он анализирует все, что ты делаешь. Если заметит подозрительное, сразу заблокирует. Понимай причины банов, чтобы их избежать.\\n\\n## 7.1 ПРОБЛЕМЫ С ПОВЕДЕНИЕМ\\n\\nFacebook следит за тем, как ты ведешь себя:\\n- ВРЕМЯ АКТИВНОСТИ: заходишь всегда в одно время?\\n- ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ: делаешь все быстро как робот?\\n- КАЧЕСТВО ПОСТОВ: публикуешь нормальный контент или спам?\\n- ОБЩЕНИЕ: взаимодействуешь с друзьями или сидишь как призрак?\\n\\n## 7.2 ТЕХНИЧЕСКИЕ ПРОБЛЕМЫ\\n\\nТвой компьютер оставляет "следы":\\n- IP-АДРЕС: твой реальный адрес в интернете\\n- БРАУЗЕР: какую программу ты используешь\\n- ОТПЕЧАТОК УСТРОЙСТВА: уникальные характеристики твоего ПК\\n- МЕСТОПОЛОЖЕНИЕ: из какой страны ты заходишь\\n\\n## 7.3 РЕШЕНИЕ ПРОБЛЕМ С IP-АДРЕСОМ\\n\\nВарианты маскировки:\\n- МОБИЛЬНЫЙ ИНТЕРНЕТ: не подходит для всех стран\\n- ПРОКСИ: лучший вариант для работы\\n- VPN: не рекомендую для рекламы (Facebook их легко распознает)\\n\\n## 7.4 ПРОБЛЕМЫ С "ОТПЕЧАТКОМ" УСТРОЙСТВА\\n\\nКаждый компьютер имеет уникальный "паспорт":\\n- Размер экрана\\n- Версия браузера\\n- Какие шрифты установлены\\n- Характеристики железа\\n\\nСпециальные браузеры меняют этот "паспорт" для каждого аккаунта.\\n\\n# ГЛАВА 8: ПРАВИЛА БЕЗОПАСНОСТИ ПРИ РАБОТЕ\\n\\nБезопасность - это не шутки. Один неверный шаг и все аккаунты полетят в бан.\\n\\n## 8.1 КАК ОРГАНИЗОВАТЬ РАБОТУ\\n\\n- РАЗДЕЛЯЙ АККАУНТЫ: каждый в своем "отдельном браузере"\\n- РАЗНЫЕ ПРОКСИ: для каждого аккаунта свой IP-адрес\\n- НЕ РАБОТАЙ СРАЗУ СО ВСЕМИ: максимум 2-3 аккаунта одновременно\\n- ДЕЛАЙ ПЕРЕРЫВЫ: не сиди за компьютером сутками\\n\\n## 8.2 ЗАЩИТА ОТ ВЗЛОМА\\n\\n- СЛОЖНЫЕ ПАРОЛИ: не "123456"\\n- ДВУХФАКТОРНАЯ ЗАЩИТА: дополнительный код на телефон\\n- МЕНЯЙ ПАРОЛИ: регулярно, каждые 1-2 месяца\\n- ХРАНИ ДАННЫЕ: в защищенном месте, не на обычном компьютере\\n\\n## 8.3 ЧТО ДЕЛАТЬ, ЕСЛИ ЗАБЛОКИРОВАЛИ\\n\\nПлан действий при бане:\\n- НЕ пытайся восстановить сразу (хуже сделаешь)\\n- ПОДОЖДИ 30-60 дней (пусть "остынет")\\n- РАБОТАЙ С ДРУГИМИ АККАУНТАМИ\\n- РАЗБЕРИСЬ В ПРИЧИНЕ: что пошло не так?\\n\\n## 8.4 СМЕНА АККАУНТОВ\\n\\n- НЕ ИСПОЛЬЗУЙ ОДИН АККАУНТ ВЕЧНО: максимум 2-3 месяца\\n- МЕНЯЙ АККАУНТЫ: регулярно\\n- ДЕРЖИ ЗАПАС: всегда имей 5-10 аккаунтов про запас\\n- ТЕСТИРУЙ НОВЫЕ: сначала попробуй на маленьких бюджетах\\n\\n# ГЛАВА 9: РОСТ И МАСШТАБИРОВАНИЕ\\n\\nКогда научился работать с 1-2 аккаунтами, пора расти и зарабатывать больше.\\n\\n## 9.1 ПОСТЕПЕННЫЙ РОСТ БИЗНЕСА\\n\\n- НАЧИНАЙ С МАЛОГО: 3-5 аккаунтов для начала\\n- ТЕСТИРУЙ КАЖДЫЙ НОВЫЙ: не запускай сразу большие бюджеты\\n- РАСТИ ПОСТЕПЕННО: добавляй по 2-3 аккаунта в неделю\\n- НЕ ПЕРЕГРУЖАЙ СЕБЯ: управляй только тем, что можешь проконтролировать\\n\\n## 9.2 АВТОМАТИЗАЦИЯ ПРОЦЕССОВ\\n\\n- ИСПОЛЬЗУЙ ПРОГРАММЫ: для управления аккаунтами\\n- АВТОМАТИЗИРУЙ РУТИНУ: создание постов, лайки\\n- НАСТРОЙ МОНИТОРИНГ: отслеживай результаты автоматически\\n- СОЗДАВАЙ ШАБЛОНЫ: для быстрой настройки новых аккаунтов\\n\\n## 9.3 РАБОТА С КОМАНДОЙ\\n\\n- НАНИМАЙ ПОМОЩНИКОВ: для фарма аккаунтов\\n- РАСПРЕДЕЛЯЙ ЗАДАЧИ: каждому свое направление\\n- ВЕДИ УЧЕТ: система отчетов и контроля\\n- КОНТРОЛИРУЙ КАЧЕСТВО: проверяй работу помощников\\n\\n# ШАГ 10: ПРАКТИЧЕСКАЯ РАБОТА С АККАУНТАМИ\\n\\nТеперь перейдем к практике. Мы купили аккаунты и инструменты, пора все настроить и подготовить к работе.\\n\\n## 10.1 УСТАНОВКА АНТИДЕТЕКТ БРАУЗЕРА\\n\\nПервый шаг - установка Dolphin Anty, лучшего браузера для арбитража:\\n\\nПереходи на dolphin-anty.com\\nРегистрируйся с промокодом FBKILLA для скидки 20%\\nСкачивай и устанавливай браузер\\nАктивируй бесплатные 10 профилей для теста\\n\\nПочему Dolphin лучший:\\n- Реальные fingerprints пользователей\\n- Управление множеством профилей\\n- Автоматизация фарма\\n- Интеграция с прокси\\n\\n## 10.2 НАСТРОЙКА ПРОКСИ\\n\\nДобавляем прокси в Dolphin:\\n\\nВ браузере переходи во вкладку "Прокси"\\nНажимай "+" для добавления\\nВводи данные прокси в формате: IP:PORT:LOGIN:PASSWORD\\nПроверяй работоспособность через встроенный чекер\\n\\nРекомендуемые прокси-сервисы:\\n\\nAsocks:\\n- Платеж: 3$/GB\\n- Промокод: FBKILLATEST (бонус 3GB)\\n- Поддержка HTTP/HTTPS/SOCKS\\n- Более 150 геолокаций\\n\\nMobile proxy:\\n- Промокод: FBKILLA (скидка 21%)\\n- Безлимитный трафик\\n- Стабильные мобильные IP\\n\\nLteboost:\\n- Промокод: FBKILLA (скидка 5%)\\n- Мобильные прокси\\n- Быстрая смена IP\\n\\nСовет: используй мобильные прокси USA для Facebook.\\n\\n## 10.3 ПОКУПКА АККАУНТОВ\\n\\nРекомендуемые магазины:\\n\\nMake Money.shop:\\n- Аккаунты разных типов\\n- Промокод: от FB-killa (5 аккаунтов + 20% скидка)\\n- Собственный фарм-отдел\\n- Техподдержка 24/7\\n\\nFb1shop:\\n- Широкий ассортимент\\n- Business Manager'ы\\n- Проверенные аккаунты\\n\\nЧто проверять при покупке:\\n- Возраст аккаунта (минимум 2-3 года)\\n- Наличие BM и Fan Page\\n- Баланс в рекламном кабинете\\n- Геолокация (USA/EU)\\n\\n## 10.4 СОЗДАНИЕ ПРОФИЛЯ В АНТИКЕ\\n\\nДобавляем аккаунт в Dolphin:\\n\\n1. В браузере нажимай "+" для нового профиля\\n2. Вводи имя профиля\\n3. Вставляй User-Agent из файла аккаунта\\n4. Вставляй cookies из файла аккаунта\\n5. В заметках сохраняй логин/пароль/email\\n\\nВажно: каждый профиль должен иметь свой прокси!\\n\\n## 10.5 ФАРМ АККАУНТОВ\\n\\nФарм - это имитация реального поведения пользователя. Обязательно для всех аккаунтов!\\n\\nПОШАГОВАЯ СХЕМА ФАРМА (5 ДНЕЙ):\\n\\nДень 1: Заполнение профиля\\n- Добавь фото профиля (без метаданных)\\n- Заполни информацию: место рождения, образование, работа\\n- Добавь семейное положение, интересы\\n\\nДень 2: Социальная активность внутри FB\\n- Создай посты на стене\\n- Загрузи фото в галерею\\n- Подпишись на тематические группы\\n- Добавь друзей (5-10 в день)\\n\\nДень 3: Активность с группами\\n- Лайкай/комментируй/репости чужие посты\\n- Лайкай/комментируй посты в группах\\n- Добавляй друзей из групп\\n- Играй в Facebook игры\\n\\nДень 4: Создание Fan Page\\n- Перейди в Pages → Create Page\\n- Выбери категорию (Health/Beauty для нутры)\\n- Заполни все поля: сайт, адрес, телефон\\n- Добавь посты релевантные офферу\\n\\nДень 5: Активность вне FB\\n- Регистрируйся на сайтах с Facebook логином\\n- Нагоняй cookies для траста\\n- Посещай разные сайты с пикселем Facebook\\n\\nРезультат фарма: аккаунт получает траст, меньше банов, выше лимиты.\\n\\n## 10.6 СОЗДАНИЕ FAN PAGE\\n\\nВажный элемент для запуска рекламы:\\n\\n1. В профиле аккаунта иди в Pages\\n2. Создай новую страницу\\n3. Выбери категорию релевантную офферу\\n4. Заполни:\\n5.    - Название (ассоциативное для нутры)\\n6.    - Описание\\n7.    - Сайт (релевантный офферу)\\n8.    - Адрес и телефон (из генератора личности)\\n9. Добавь посты и фото\\n10. Подключи к Business Manager\\n\\n10.7 СХЕМЫ ЗАПУСКА РЕКЛАМЫ\\n\\nЕсть 3 основные схемы работы с аккаунтами:\\n\\nСхема 1: Линкинг к King аккаунту\\n- Добавляешь автореги в друзья к King\\n- Передаешь права на рекламный кабинет\\n- Управляешь всем с одного King аккаунта\\n\\nСхема 2: Линкинг через Business Manager\\n- Создаешь BM на King аккаунте\\n- Привязываешь Fan Page авторегов\\n- Линкуешь рекламные кабинеты\\n- Управляешь через BM\\n\\nСхема 3: Работа с личек (простая)\\n- Запускаешь рекламу напрямую с авторегов\\n- Без передачи прав\\n- Быстрее, но рискованнее\\n\\nРекомендация: используй схему 2 (через BM) - самая безопасная.\\n\\n## 10.8 ПЕРЕДАЧА ПРАВ АККАУНТОВ\\n\\nКак передать права на управление:\\n\\nДля схемы 1 (к King):\\n1. Добавь авторег в друзья с King аккаунта\\n2. В Ads Manager авторега → Settings → Ad Roles\\n3. Добавь King аккаунт как администратора\\n4. Подтверди запрос\\n\\nДля схемы 2 (к BM):\\n1. В BM King аккаунта → Pages → Add → Request access\\n2. Вставь ссылку на Fan Page авторега\\n3. Выбери Full Control\\n4. Подтверди запрос с авторега\\n\\nДля рекламных кабинетов:\\n   - Скопируй ID кабинета авторега\\n   - В BM → Ad Accounts → Add → Request access\\n   - Вставь ID и запроси Full Control\\n   - Подтверди с авторега\\n\\nРезультат: все аккаунты управляются из одного места.\\n\\nФИНАЛЬНЫЕ СОВЕТЫ ПО РАБОТЕ С АККАУНТАМИ\\n\\nВСЕГДА ПРОВЕРЯЙ АККАУНТЫ перед покупкой - лучше перестраховаться\\nНИКОГДА НЕ ЭКОНОМЬ на прокси и специальных браузерах - это основа безопасности\\n"НАТАСКИВАЙ" ВСЕ АККАУНТЫ перед использованием - минимум 2-4 недели\\nМЕНЯЙ АККАУНТЫ регулярно - максимум 2-3 месяца на одном\\nСЛЕДИ ЗА ОБНОВЛЕНИЯМИ Facebook - алгоритмы постоянно меняются\\nНЕ ИСПОЛЬЗУЙ ПОДОЗРИТЕЛЬНЫЕ МЕТОДЫ - лучше работать чисто\\nВЕДИ УЧЕТ всех расходов на аккаунты и инструменты\\nДЕРЖИ ЗАПАС аккаунтов - всегда имей 5-10 на случай банов\\n\\nЗапомни главное: аккаунты - это твой основной инструмент в заработке на рекламе. Инвестируй в качественные аккаунты и инструменты, и они принесут тебе хорошую прибыль!\\n\\nУдачи в заработке на Facebook! Если будешь следовать этому гайду, успех гарантирован! 💰	\N	40eb6d4d-0e6a-4460-a24b-6426acc9251e	0	t	\N	2025-09-04 09:22:20.216	2025-09-07 09:30:26.14
08f0dfe7-ea94-4e34-acba-a6deaf1e20b0	Какие ГЕО лить? Что по стате?		page-20	123	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	1	f	\N	2025-09-03 15:50:42.583	2025-09-04 13:02:14.429
b1f31de3-7a3f-4508-869b-7240a97227f9	Полезные сервисы		page-1	### Вот что тебе поможет в работе с Reels:\\n\\nАналитика и планирование: Later, Hootsuite, Buffer\\nМонтаж видео: CapCut, InShot, Adobe Premiere Rush\\nДизайн: Canva, Adobe Express\\nПоиск трендов: TrendTok, Popular Reels\\nБезопасность: Pure VPN, NordVPN	\N	3e4a6abe-a8bb-4582-b763-b04aaaa731c7	1	t	\N	2025-08-31 14:41:54.766	2025-09-04 08:51:31.743
43101f5e-01b2-4a97-b4c1-15201236e0f0	Где быстро зарегать почту?		page-24	senthy.ru или @senthyBot\\n\\nУдобный сервис для быстрого создания почтовых адресов, не требует регистрации (если есть телеграм), письма приходят прямо в личку тг. Один аккаунт - множество разных адресов	\N	9a0bbfe8-bcb0-4999-8d64-714a735952d9	5	t	\N	2025-09-04 12:45:24.555	2025-09-04 13:02:25.31
60bc1001-9875-4e7e-997d-a4bc0f4734b2	Схемы: предиктор		page-14	# 🔗 Как устроена схема связки\\n\\n> Крео → Ленд, на котором описан инструмент для получения предсказаний по игре "Crash" → Бот-предсказатель коэффициентов → Платформа\\n\\n1. Лид видит крео, где в реальном времени выигрывают в игре "Crash", получая коэффициенты из бота.\\n2. По клику попадает на **ленд**, с которого попадает в бота.\\n3. Бот выдает тестовый период 1 час и ссылку на платформу.\\n4. Ссылка содержит промокод, который дает лиду $30.\\n5. За этот час лид может протестировать бота, получить преимущество над платформой и накрутить себе баланс, а дальше пытаться вывести.\\n\\n> Второй сценарий: лиду не хватило часа и он хочет купить дополнительный доступ в бота → накрутить баланс → пытаться вывести.\\n\\n# 📋 Как получить связку\\n\\n## Требования для получения связки\\n\\n1. 🤖 Два Telegram бота, созданные через @BotFather (один основной для работы, второй для поддержки и общения)\\n2. 👤 Telegram ID администратора, который сможет просматривать статистику в основном боте (количество новых пользователей, активность и т.д.)\\n3. 📘 Для Facebook трафика: необходимо предоставить ID пикселя и токен доступа через бота @ShareFbPixelBot командой:\\n\\n> /new [ID_ПИКСЕЛЯ] [ТОКЕН_ДОСТУПА]\\n\\n## 💬 Пример сообщения для получения связки\\n\\nПривет! Хочу получить схему связки на предиктора. Буду лить FB/УБТ/TT (выбрать свой источник)\\n\\nТокен основного бота: 9999999:XXXXXXXXXXXXXXXXXXXXXXXX\\nЮзернейм этого бота: @usernamemainbot\\nТокен бота-поддержки: 9999999:XXXXXXXXXXXXXXXXXXXXXXXX\\nЮзернейм этого бота: @usenamesupportbot\\nTelegram ID администратора: 1234567890\\nFacebook пиксель: добавлен в бота/не нужен (для других источников кроме FB)\\n\\n---\\n\\n> **INFO**: Названия ботов\\n> 🤖 Основной бот: "QueenCrashHack" или подобное название\\n> 🔧 Бот поддержки:"QueenCrash Support" или похожее название\\n> 🖼️ Аватарки ботов: используйте предоставленные аватарки или создайте свои собственные - это не критично для функциональности\\n\\n## 🔗 Получение ссылки на залив\\n\\n⏳ Спустя некоторое время вы получите ссылку на залив для Facebook или любого другого вашего источника.\\n\\n🔒 **Важно**: ссылка может быть заклоачена, поэтому попасть в бота может быть невозможно при прямом переходе (без рекламы).\\n\\n✅ **Признак корректной работы**: если ссылка ведет на ленд, а с ленда на YouTube - значит все в порядке, вас просто заклоачили.\\n\\n❌ **Если возникли проблемы**: ссылка на каком-либо этапе ничего не делает или показывает ошибку - обратитесь к куратору.\\n\\n## 🎫 Промокоды и статистика\\n\\n📝 Куратор сообщит вам **название промокода**, который необходимо создать через бота.\\n\\n📊 Для отслеживания статистики используйте бота **`@OwnUmbraBot`** - он позволит мониторить регистрации и депозиты по вашему промокоду.\\n\\n## ⚙️ Админ-панель бота\\n\\n🔧 В основном боте (если вы указали верный ID) доступна команда **`/admin`** с следующими функциями:\\n\\n- 👥 Просмотр количества вступлений в бота\\n- 📢 Создание рассылок по базе пользователей\\n- 🌐 Привязка собственного домена (при необходимости)\\n\\n## Примеры крео\\n\\nПозже\\n\\n## Аватарки для ботов\\n\\n![](Позже)	\N	a1f920e4-7904-48a3-b8dc-fcc209d70249	2	t	\N	2025-09-02 08:26:41.251	2025-09-04 13:18:14.392
fbd27d2b-c888-48c0-85b1-d3cfb07820d6	Схемы: HR мотив		page-15	Суть связки в том, что мы устраиваем лида на работу саппортом в казино, где он должен работать, выполняя различные задания, за которые он получает выплаты\\n\\nСвязка на этапе масштабирования. Скоро будет дополнительная информация и возможность лить ее вместе с нами!	\N	a1f920e4-7904-48a3-b8dc-fcc209d70249	3	t	\N	2025-09-02 09:03:31.858	2025-09-04 08:51:31.755
f49ec03a-78a3-4354-843e-56afe5fa6c69	page1		page-25		\N	4e929b8b-912e-45f7-9af0-6a2d7070b875	3	f	\N	2025-09-08 13:57:18.676	2025-09-08 14:38:51.091
dd4efda5-a3b1-493d-8d65-9e14510ca4f8	Работа с нашими ботами		page-5	У нас есть два бота для работы с платформами Gambler и Elysium.\\n\\n@Ownumbrabot - Elysium\\n\\n@ownumbra2bot - Gambler\\n\\n## Функционал\\n\\nСоздание промокодов, привязка своего домена, просмотр статистики по своему промокоду, заказ выплат\\n\\n# Elysium Bot\\n\\n![mm.png](/uploads/images/1756712112194_mm.png)\\n\\n## Как создать промокод\\n\\nStart -> Настройки -> Промокоды -> Создать промокод -> Ввод суммы промокода -> Ввод названия промокода\\n\\n## Как заказать выплату\\n\\nStart -> Профиль -> Привязать кошелек -> Ввода TRON TRX кошелька\\n\\nStart -> Профиль -> Вывод средств\\n\\n# Gambler Bot\\n\\n![mmg.png](/uploads/images/1756712539906_mmg.png)\\n\\n## Создать промокод\\n\\nStart -> Материалы -> Создать промокод -> Ввод суммы промокода -> Ввод названия промокода ->\\n\\n## Как заказать выплату\\n\\nStart -> Профиль -> Привязать кошелек\\nStart -> Профиль -> Заказать выплату	\N	7a6b5b69-0794-4245-b7ec-6ff263aa5989	3	t	\N	2025-08-30 12:46:19.585	2025-09-04 16:06:38.476
54aa5bf1-a1be-4d03-8387-e2eb3f6fab72	Стример поднял $1кк прямо во время трансляции		page-12	# Эмоциональные нарезки стримов\\n\\nСуть подхода заключается в создании коротких видеонарезок с яркими моментами крупных выигрышей в онлайн-казино, взятых из трансляций известных зарубежных стримеров. В самих роликах стандартные вставки с надписями вроде «перейти в канал» или ссылки на биографию заменяются на ваш собственный домен или целевой ресурс.\\n\\nДля реализации этого метода можно использовать площадки Twitch или Kick. Там выбираются стримеры с живой реакцией и эмоциональной подачей — это ключевой фактор, ведь зрителю важно чувствовать азарт и вовлечение. Задача сводится к тому, чтобы найти наиболее впечатляющие моменты, когда у стримера случается большой занос, и сохранить их с помощью записи экрана. На основе этих фрагментов формируются динамичные короткие ролики.\\n\\nОчень важно не ограничиваться шаблонными вариантами — не стоит брать «заезженные» слоты, которые уже набили оскомину и зрителям, и стримерам. Наоборот, выгоднее искать новые или менее популярные игры: это привлекает внимание, вызывает интерес и помогает выделиться среди множества однотипных нарезок.\\n\\nГотовый контент можно продвигать как через УБТ, так и через платные источники трафика. Такой подход совмещает эффект «живого» контента с возможностью гибко масштабировать рекламные кампании.\\n\\n## Примеры нарезок\\n\\n> **ERROR**: будут позже\\n\\n## Выбор платформы\\n\\nПлатформу лучше выбирать ту, где самый высокий % РТП у слотов, а особенно у слота, который был в видосе.	\N	a1f920e4-7904-48a3-b8dc-fcc209d70249	0	t	\N	2025-09-01 07:41:29.634	2025-09-04 08:51:31.752
143a6ee7-e235-4199-b59d-56ff500a00fa	Суть работы		page-7	## Твои задачи в Umbra Team\\n\\nВ Umbra Team твоя работа — не разбрасывать ссылки, а выстраивать стратегию привлечения игроков в казино через чётко продуманные воронки. Каждое действие должно приводить к регистрации и депозиту.\\n\\n### Как устроен процесс\\n\\nМы используем разные источники трафика — как платные (Facebook Ads, TikTok Ads, Google Ads), так и условно-бесплатные (YouTube, TikTok органика, мобильные механики).\\n\\nДальше трафик попадает в наши воронки:\\n\\n\\t•\\tPWA или iOS-приложения, где пользователю предлагают тестировать игры и получать вознаграждения.\\n\\n\\t•\\tЛендинги под инвестиционные или бонусные платформы, которые мотивируют к регистрации.\\n\\n\\t•\\tTelegram-боты с предложением быстрых заработков.\\n\\n\\t•\\tВ отдельных случаях — прямая интеграция с казино через схемы обхода модерации.\\n\\nДвижение выстроено так:\\n\\nТрафик → вовлечение → регистрация → депозит.\\n\\nФинансовая модель зависит от оффера и гео: CPL, CPA или RevShare. Мы работаем как с лицензированными казино, так и с фейковыми проектами — выбор зависит от стратегии, бюджета и региона.\\n\\n### Что у тебя будет в работе\\n\\n\\t•\\tГотовые инструменты: приложения, домены, тексты, креативы, прокладки, трекеры.\\n\\n\\t•\\tМетодичка — пошаговая инструкция с актуальными связками и примерами.\\n\\n\\t•\\tНаставник — который сопровождает на каждом этапе, чтобы ты не оставался один на один с кабинетами и техническими нюансами.\\n\\n\\t•\\tГотовые воронки, протестированные и приносящие деньги прямо сейчас.\\n\\n### Важно понимать\\n\\nНе имеет значения, есть ли у тебя опыт. Всё обучение и практические шаги уже выстроены. Главное — включиться, выполнять задачи и тестировать гипотезы.\\n\\nUmbra Team — это не место для «попробовать». Здесь либо работаешь и выходишь в плюс, либо освобождаешь место тем, кто готов.	\N	7a6b5b69-0794-4245-b7ec-6ff263aa5989	0	t	\N	2025-08-30 14:26:46.455	2025-09-04 16:06:29.927
f98366a0-2b34-4d52-b1fd-3d052876d6f5	Step-By-Step Guide		page-17	# ПОЛНЫЙ ПОШАГОВЫЙ ГАЙД ПО АРБИТРАЖУ ТРАФИКА В FACEBOOK ADS ДЛЯ IGAMING\\n\\nКак работать с Facebook Ads\\n\\n## ШАГ 1: ПОДГОТОВКА АККАУНТОВ И ПИКСЕЛЯ\\n\\nПрежде чем запускать рекламу, нужно подготовить все технические компоненты.\\n\\n## 1.1 ПОКУПКА БМ И СЕТАПОВ ДЛЯ АРБИТРАЖА\\n\\nЭто первый и самый важный шаг в работе с Facebook Ads. Без качественных аккаунтов ты не сможешь запустить ни одну кампанию.\\n\\n### 1.1.1 ПОКУПКА БМ\\n\\nВыбери надежных продавцов в тематических сообществах:\\n- Ищи аккаунты с историей минимум 2-3 года\\n- Цена: $50-200 за качественный аккаунт\\n- Покупай сразу 5-10 аккаунтов для ротации\\n\\n### 1.1.2 ГОТОВЫЕ СЕТАПЫ ДЛЯ АРБИТРАЖА\\n\\nЭто готовые "коробочные" решения со всеми настройками:\\n- Business Manager с привязанными аккаунтами\\n- Настроенный пиксель\\n- Готовые аудитории (если нужны)\\n- Цена: $100-500 за полный сетап\\n- Преимущество: экономит время на настройку\\n\\n### 1.1.3 ПРОКСИ ДЛЯ РАБОТЫ\\n\\nОбязательный элемент для безопасности:\\n- Тип: Residential/Semi-Dedicated (не дата-центровые!)\\n- География: США/Европа (в зависимости от твоего таргета)\\n- Количество: минимум 10-20 прокси\\n- Сервисы: Bright Data, Oxylabs, Smartproxy\\n- Цена: $5-50 в месяц\\n\\n### 1.1.4 АНТИДЕТЕКТ БРАУЗЕРЫ\\n\\nДля работы с множеством аккаунтов:\\n- Linken Sphere, Dolphin Anty, Multilogin\\n- Создавай отдельные профили для каждого БП\\n- Настраивай fingerprints под реальных пользователей\\n- Цена: $0-300 за лицензию, есть бесплатные тарифы с ограниченным количеством профилей\\n\\n### 1.2 НАСТРОЙКА ПИКСЕЛЯ FACEBOOK\\n\\nЭто критически важно для оптимизации под гемблинг-офферы:\\n\\nВ Events Manager создай новый пиксель\\nПолучи код пикселя и установи его на лендинг:\\n   - Вставь в <head> раздел сайта\\n   - Или через Google Tag Manager\\n   - Или через плагины для твоей CMS\\n\\nНастрой базовые события:\\n   - Lead - для сбора контактов\\n   - CompleteRegistration - для регистраций\\n   - Purchase - для депозитов\\n   - AddToCart - для добавления денег\\n\\nТестируй пиксель через Facebook Pixel Helper\\n\\n### 1.3 СОЗДАНИЕ КАСТОМНЫХ АУДИТОРИЙ\\n\\nДля арбитража нужны конкретные аудитории:\\n\\nАудитория по сайту оффера:\\n   - Люди, посетившие лендинг\\n   - Те, кто кликнул по кнопке регистрации\\n   - Пользователи, добавившие деньги в корзину\\n\\nАудитория по списку:\\n   - Импортируй email/телефоны из предыдущих кампаний\\n   - Создай сегменты по странам и языкам\\n\\nExclusion аудитории:\\n   - Исключи тех, кто уже зарегистрировался\\n   - Убери ботов и некачественный трафик\\n\\n### 1.4 LOOKALIKE АУДИТОРИИ ДЛЯ ГЕМБЛИНГА\\n\\nСамый эффективный инструмент для арбитража:\\n\\nКак создать:\\n1. Возьми source аудиторию конвертеров (тех, кто сделал депозит)\\n2. Выбери размер 1-2% (самые похожие пользователи)\\n3. Укажи географию целевого рынка\\n\\nПочему это работает в гемблинге:\\n- Алгоритм находит людей с похожим поведением\\n- Высокая конверсия в регистрации и депозиты\\n- Стабильные результаты при правильной настройке\\n\\n### 1.5 ПОДГОТОВКА КРЕАТИВОВ\\n\\nДля гемблинга нужны специфические креативы:\\n\\nСоздай 5-10 разных вариантов:\\n   - Слот-машины с выигрышами\\n   - Бонусные предложения\\n   - VIP-статусы и джекпоты\\n   - Эмоциональные триггеры (азарт, адреналин)\\n\\nФорматы для тестирования:\\n   - Статичные изображения 1080x1080\\n   - Короткие видео 15-30 секунд\\n   - Stories формат 9:16\\n\\nТексты для заголовков:\\n   - "ВЫИГРАЙ $1000 СЕЙЧАС!"\\n   - "БЕСПЛАТНЫЕ СПИНЫ НА СТАРТ"\\n   - "ЭКСКЛЮЗИВНЫЙ БОНУС 200%"\\n   - "ИГРАЙ И ВЫИГРЫВАЙ КАЖДЫЙ ДЕНЬ"\\n\\n## ШАГ 2: СОЗДАНИЕ ПЕРВОЙ КАМПАНИИ ДЛЯ ГЕМБЛИНГА\\n\\nТеперь создадим кампанию, которая будет эффективно работать на гемблинг-офферы.\\n\\n### 2.1 ВЫБОР ЦЕЛИ КАМПАНИИ\\n\\nДля гемблинга подходит только одна цель:\\n\\nВыбери "Conversions"\\nУкажи событие "Purchase" (депозит)\\nЭто позволит оптимизировать под реальные деньги\\n\\nПочему не "Traffic" или "App Installs"?\\n- В гемблинге важны именно депозиты\\n- Facebook лучше оптимизирует под конечное действие\\n- Получаешь более качественный трафик\\n\\n### 2.2 НАСТРОЙКА КАМПАНИИ\\n\\nНазвание кампании:\\n   - "GAMBLING_USA_Deposit_Test_2024"\\n   - Включи гео, оффер, цель и дату\\n\\nБюджет и расписание:\\n   - Campaign Budget: $50-100 в день для теста\\n   - Schedule: круглосуточно\\n   - Start time: 00:00 по времени таргета\\n\\nA/B тестирование:\\n   - Создай несколько кампаний сразу\\n   - Каждая с разными настройками таргета\\n   - Сравнивай результаты через 3-5 дней\\n\\n### 2.3 НАСТРОЙКА АДСЕТА ДЛЯ ГЕМБЛИНГА\\n\\nНазвание адсета:\\n   - "Men_25-55_USA_Wide_Conversions"\\n\\nАудитория:\\n   - География: выбери конкретную страну (USA, UK, DE)\\n   - Возраст: 25-55 лет (платежеспособная аудитория)\\n   - Пол: мужчины (основная ЦА в гемблинге)\\n   - Язык: английский/местный\\n\\nПлейсменты:\\n   - Facebook Feed (основной)\\n   - Instagram Feed\\n   - Facebook Stories\\n   - Instagram Stories\\n   - Убери Audience Network (там много ботов)\\n\\nОптимизация:\\n   - Conversion event: Purchase\\n   - Attribution: 1 day click\\n   - Ставка: Automatic (Lowest Cost)\\n\\n### 2.4 СОЗДАНИЕ ОБЪЯВЛЕНИЙ\\n\\nФормат объявления:\\n   - Single image или carousel\\n   - Размер изображения: 1080x1080\\n\\nКреативы для гемблинга:\\n   - Яркие слот-машины с выигрышами\\n   - Большие суммы выигрышей ($1000+)\\n   - Бонусные предложения\\n   - Эмоциональные заголовки\\n\\nТекст объявления:\\n   - Primary text: 125 символов максимум\\n   - Headline: 40 символов\\n   - Description: 30 символов\\n\\nПризыв к действию:\\n   - "Sign Up" или "Play Now"\\n   - Не используй "Download" - это блокируется\\n\\n### 2.5 НАСТРОЙКА URL И ТРЕКИНГА\\n\\nWebsite URL:\\n   - Вставь ссылку из трекера\\n   - Убедись, что домен не в черном списке\\n\\nURL Parameters:\\n   - fb_pixel={fb_pixel_id}\\n   - sub1=campaign_name\\n   - sub2=adset_name\\n   - sub3=creative_name\\n\\nDynamic Creative:\\n   - Включи для автоматического тестирования\\n   - Facebook сам выберет лучшие комбинации\\n   - Экономит время на ручное A/B тестирование\\n\\n### 2.6 ЗАПУСК КАМПАНИИ\\n\\n1. Отправь на модерацию\\n2. Проверь статус через 1-2 часа\\n3. Если отклонено - исправь и отправь снова\\n4. Мониторь первые показы\\n\\nПочему важно правильно настроить с первого раза:\\n- Facebook запоминает паттерны\\n- Хороший старт = лучшие результаты\\n- Неправильная настройка = перерасход бюджета\\n\\n## ШАГ 3: ТЕСТИРОВАНИЕ КАМПАНИИ И ПЕРВЫЕ РЕЗУЛЬТАТЫ\\n\\nКампания запущена, теперь нужно правильно протестировать ее и собрать данные.\\n\\n### 3.1 ПЕРВЫЕ 24-48 ЧАСОВ: МОНИТОРИНГ ЗАПУСКА\\n\\nЧто проверять сразу после запуска:\\n\\nСтатус модерации:\\n   - Approved = нормально\\n   - Rejected = исправляй причину\\n   - In Review = жди 1-2 часа\\n\\nПервые показы:\\n   - Должны появиться в течение 1-2 часов\\n   - Если нет показов - проверь бюджет и таргет\\n\\nСтоимость клика:\\n   - В гемблинге нормальная CPC: $0.5-2\\n   - Если выше $3 - проблема с таргетом\\n\\nПервые конверсии:\\n   - Жди минимум 50 кликов для первой конверсии\\n   - Если нет регистраций - проблема с лендингом\\n\\n### 3.2 ПЕРВАЯ НЕДЕЛЯ: СБОР ДАННЫХ\\n\\nЗа первые 7 дней ты должен собрать:\\n\\nМинимум 50-100 регистраций\\nМинимум 10-20 депозитов\\nСтабильную стоимость лида (CPL)\\n\\nЧто отслеживать ежедневно:\\n- CPL (Cost Per Lead) - стоимость регистрации\\n- CPA (Cost Per Action) - стоимость депозита\\n- CTR (Click Through Rate) - кликабельность\\n- Conversion Rate - конверсия регистрация→депозит\\n\\n### 3.3 АНАЛИЗ ПЕРВЫХ РЕЗУЛЬТАТОВ\\n\\nЧерез 3-5 дней анализируй:\\n\\nХорошие показатели для гемблинга:\\n   - CPL: $5-15 (зависит от гео)\\n   - CPA: $20-50\\n   - CR: 15-25%\\n   - ROI: > 100%\\n\\nПлохие показатели:\\n   - CPL > $25 - меняй креативы\\n   - CPA > $100 - проблема с оффером\\n   - CR < 5% - слабый лендинг\\n\\nСегментация результатов:\\n   - Какие креативы лучше конвертят\\n   - Какие плейсменты работают\\n   - Какие аудитории эффективнее\\n\\n## ШАГ 4: ОПТИМИЗАЦИЯ КАМПАНИИ ПОСЛЕ ТЕСТИРОВАНИЯ\\n\\nПосле сбора данных начинаем оптимизацию - это ключ к прибыльности в арбитраже.\\n\\n### 4.1 ОПТИМИЗАЦИЯ КРЕАТИВОВ\\n\\nЧто делать если креативы не работают:\\n\\nСоздай новые креативы:\\n   - Измени цвета и дизайн\\n   - Поменяй суммы выигрышей\\n   - Добавь urgency (ограниченное время)\\n   - Протестируй разные форматы\\n\\nA/B тестирование:\\n   - Запускай по 2-3 креатива одновременно\\n   - Давай минимум 100 кликов на каждый\\n   - Выключай худшие варианты\\n\\nЛучшие практики для гемблинга:\\n   - Используй реальные фото выигрышей\\n   - Добавляй социальное доказательство\\n   - Показывай бонусы и акции\\n\\n### 4.2 ОПТИМИЗАЦИЯ ТАРГЕТА\\n\\nЕсли аудитория не конвертит:\\n\\nСузь возрастные рамки:\\n   - Попробуй 30-45 лет вместо 25-55\\n   - Или 25-35 для молодой аудитории\\n\\nИзменение географии:\\n   - Перейди на другой город/регион\\n   - Попробуй похожие страны\\n\\nДобавь интересы:\\n   - Gaming, Casino, Poker\\n   - Sports betting, Lottery\\n   - Но не переусердствуй - максимум 2-3\\n\\n### 4.3 ОПТИМИЗАЦИЯ БЮДЖЕТА И СТАВОК\\n\\nУправление бюджетом:\\n   - Увеличивай бюджет на хорошие адсеты (+20-50%)\\n   - Уменьшай или отключай плохие\\n   - Используй дневные лимиты\\n\\nСтратегии ставок:\\n   - Если CPL растет - переключайся на Bid Cap\\n   - Если CPA низкий - можно попробовать Cost Cap\\n   - Автоматическая ставка для большинства случаев\\n\\n### 4.4 ОПТИМИЗАЦИЯ ПЛЕЙСМЕНТОВ\\n\\nАнализ по плейсментам:\\n   - Facebook Feed обычно лучше всех\\n   - Instagram Stories для мобильной аудитории\\n   - Facebook Stories для вовлечения\\n\\nЧто отключить:\\n   - Audience Network (много ботов)\\n   - Instagram Explore (дорого и неэффективно)\\n   - Marketplace (не для гемблинга)\\n\\n### 4.5 СОЗДАНИЕ НОВЫХ КАМПАНИЙ НА ОСНОВЕ ДАННЫХ\\n\\nДублируй успешные адсеты:\\n   - Копирование рабочего таргета\\n   - Использование лучших креативов\\n   - Повышение бюджета\\n\\nСоздай кампании для ретаргетинга:\\n   - Аудитория: посетители без депозита\\n   - Специальные креативы с urgency\\n   - Более агрессивные ставки\\n\\nТестируй новые подходы:\\n   - Разные гео в одной стране\\n   - Новые офферы на той же аудитории\\n   - Разные стратегии оптимизации\\n\\n## ШАГ 5: МАСШТАБИРОВАНИЕ ПРИБЫЛЬНЫХ КАМПАНИЙ\\n\\nКогда нашел работающую связку - время масштабировать.\\n\\n### 5.1 ПРИЗНАКИ ГОТОВНОСТИ К МАСШТАБИРОВАНИЮ\\n\\nСтабильные метрики 7+ дней:\\n   - CPL < $20\\n   - CPA < $60\\n   - ROI > 150%\\n\\nМинимум 20-30 депозитов\\nПоложительная динамика\\n\\n### 5.2 СТРАТЕГИИ МАСШТАБИРОВАНИЯ\\n\\nГоризонтальное масштабирование:\\n   - Создай больше адсетов с тем же таргетом\\n   - Разные креативы в каждом адсете\\n   - Увеличивай бюджет постепенно\\n\\nВертикальное масштабирование:\\n   - Увеличивай бюджет на успешных адсетах\\n   - Добавляй новые похожие аудитории\\n   - Расширяй географию\\n\\nСоздание дополнительных кампаний:\\n   - Ретаргетинг брошенных корзин\\n   - Lookalike на конвертерах\\n   - Кампании на похожие офферы\\n\\n### 5.3 УПРАВЛЕНИЕ МАСШТАБИРОВАННЫМИ КАМПАНИЯМИ\\n\\nАвтоматизация:\\n   - Настрой автоправила для бюджета\\n   - Автоматическое выключение убыточных адсетов\\n   - Уведомления о превышении CPA\\n\\nМониторинг:\\n   - Ежедневный анализ метрик\\n   - Сравнение ROI по кампаниям\\n   - Отслеживание изменений алгоритма Facebook\\n\\nРиски масштабирования:\\n   - Рост CPA при увеличении бюджета\\n   - Изменения в алгоритмах Facebook\\n   - Сезонные колебания\\n\\n### 5.4 МАКСИМАЛЬНЫЙ СКЕЙЛ\\n\\nКогда достиг пика:\\n\\nДобавляй новые гео\\nТестируй новые вертикали\\nСоздавай несколько потоков одновременно\\nАвтоматизируй рутинные процессы\\n\\n# ФИНАЛЬНЫЕ СОВЕТЫ\\n\\nВсегда тестируй новые связки параллельно\\nНе держись за убыточные кампании\\nМасштабируй только проверенные комбинации\\nСледи за изменениями в политиках Facebook\\nАвтоматизируй всё, что можно автоматизировать\\n\\nУдачи! Главное - терпение и системный подход.	\N	40eb6d4d-0e6a-4460-a24b-6426acc9251e	1	t	\N	2025-09-03 15:08:40.706	2025-09-04 12:48:18.42
943098f7-5f59-46ba-8533-8ce22ab5ef35	Добро пожаловать		page-4	### Здесь вы найдете всё необходимое для продуктивной работы:\\n\\n•\\tМануалы и инструкции – пошаговые руководства, которые помогут вам быстро разобраться в инструментах и процессах.\\n\\n•\\tГотовые связки – проверенные решения для запуска и масштабирования, которые можно применять сразу.\\n\\n•\\tПолезные материалы – советы, стратегии, лайфхаки и аналитика для повышения эффективности.\\n\\n•\\tСообщество и поддержка – пространство, где можно обменяться опытом, задать вопросы и получить обратную связь.\\n\\nUmbra Platform — это экосистема знаний и практических инструментов, созданная для того, чтобы вы могли действовать быстрее, умнее и прибыльнее.	\N	4e929b8b-912e-45f7-9af0-6a2d7070b875	0	t	\N	2025-08-30 12:46:18.808	2025-09-08 14:38:49.102
3c220166-8361-4fad-a5be-6d11e3beaf28	Анти-детект браузеры		page-10	Dolphin Anty\\n\\nЧто такое антидетект-браузер в арбитраже трафика\\n\\nАнтидетект-браузер (часто сокращённо — антик) — это специальный софт, который позволяет изменять или маскировать цифровой отпечаток устройства. Проще говоря, благодаря такому инструменту рекламная сеть будет видеть не реального пользователя, например, из Турции с Windows 11, а совершенно иной профиль — скажем, посетителя из Польши, работающего через MacBook.\\n\\nУ каждой рекламной площадки действуют собственные правила модерации, которые контролируются антифрод-системами и их ботами. Если эти правила нарушаются, все аккаунты, заведённые с одного и того же IP, сразу попадают под бан. Чтобы обойти подобные ограничения и вести работу с множеством профилей одновременно, арбитражники используют современные антидетект-браузеры.\\n\\nГлавная функция Dolphin Anty и аналогичных решений — маскировать реальные данные пользователя и создавать новые аккаунты, которые выглядят как настоящие профили живых людей в сети.\\n\\nАнтидетект для арбитражников устанавливается на компьютер как отдельная программа. Далее вручную настраиваются параметры устройства: геолокация, язык, часовой пояс, характеристики браузера, прокси и другие данные. В топовых антидетектах уже предусмотрен список таких настроек. Плюс в них встроен специальный cookies-бот, который автоматически «прогревает» профиль, собирая куки через обычный серфинг сайтов.\\n\\nПосле заполнения базовых данных и подключения cookies остаётся привязать купленные прокси.\\nОкно браузера с подменёнными параметрами открывается автоматически. Если же профиль создан некачественно, антифрод-система и её боты очень быстро отправят такой аккаунт в бан. Чтобы убедиться в корректности прокси и уникальности нового браузерного отпечатка, используют специальные сервисы-чекеры: Pixelscan, Whoer.net, IPper, Browserleaks и другие. Эти инструменты показывают всю информацию, которую площадка способна «считать» о пользователе.\\n\\nУстановка.\\n\\nСначала создайте аккаунт на официальном сайте сервиса.\\nЗатем скачайте установщик, выбрав версию под своё устройство/операционную систему.\\nПосле загрузки запустите инсталлятор и установите программу на компьютер.\\n\\n![]()	\N	fbb49d88-165f-4bc9-812d-2ba63dca3ebc	0	f	\N	2025-08-30 14:27:51.361	2025-09-04 12:40:04.293
55bca699-a9ee-4e3e-8e28-d36789019090	Step-By-Step Guide		page-16	ПОЛНОЕ РУКОВОДСТВО ПО РАБОТЕ С TIKTOK: ОТ НАСТРОЙКИ ДО ПРОЛИВА\\n\\nПривет!  Хочу рассказать тебе обо всём, что тебе нужно знать о работе с TikTok. Мы разберём этот процесс шаг за шагом, от самых основ до продвинутых техник. Ты узнаешь, как правильно настроить свой телефон, уникализировать контент, заливать видео, избегать банов и использовать карусель для максимальной конверсии.\\n\\n# ЧАСТЬ 1: ПОДГОТОВКА ТВОЕГО ТЕЛЕФОНА\\n\\nСначала нам нужно правильно настроить твой iPhone, потому что TikTok очень чувствителен к любым несоответствиям. Представь себе: ты хочешь притвориться американцем, но твой телефон выдаёт тебя с головой. Поэтому давай настроим всё идеально.\\n\\nПервым делом ты берёшь свой iPhone (желательно модель XR или новее - старые версии не получают обновлений iOS, что может привести к блокировке аккаунтов). Ты извлекаешь SIM-карту и обновляешь систему до последней версии iOS (минимум 17.7).\\n\\nТеперь переходим к настройкам. Ты открываешь "Настройки" и начинаешь менять всё по порядку:\\n\\nЯзык устройства: Удаляешь все лишние языки, оставляешь только нужный. Для США выбираешь English (US), для других регионов - English (UK). Помни: если ты изначально настроил телефон на США, а потом меняешь регион, система может предложить English (UK) - просто соглашайся, это сэкономит тебе время.\\n\\nГеолокация: Полностью отключаешь её. Это важно, чтобы TikTok не видел твоё реальное местоположение.\\n\\nРегион: Меняешь на нужный тебе для пролива. Если ты работаешь с США - ставишь США, если с Германией - Германию. Главное правило: регион всегда должен совпадать с сервером VPN, к которому ты подключишься позже.\\n\\nРаскладка клавиатуры: Удаляешь все лишние раскладки. Для США оставляешь только English (US), для других регионов - только English (UK). Путь: Настройки → General → Keyboard → Keyboards.\\n\\nЧасовой пояс: Устанавливаешь тот, который соответствует твоему региону пролива. Путь: Настройки → General → Date & Time → Time Zone.\\n\\nСброс настроек: Это самый важный шаг! Ты сбрасываешь настройки локации и сети перед каждой установкой TikTok. Не бойся - с телефона ничего не удалится, просто перезагрузится и нужно будет подключиться к Wi-Fi заново. Рекомендую сначала сбрасывать локацию, потом сеть. Путь: Настройки → General → Transfer or Reset iPhone → Reset → Reset Location & Privacy → Reset Network Settings.\\n\\nВот такая вот подготовка. Теперь твой телефон готов притвориться жителем любой страны!\\n\\n# ЧАСТЬ 2: УНИКАЛИЗАЦИЯ КОНТЕНТА - ИСКУССТВО ОБМАНА АЛГОРИТМОВ\\n\\nТеперь давай поговорим о самом главном - уникализации контента. TikTok - это умная система, которая распознаёт спам и одинаковый контент за километр. Поэтому тебе нужно научиться делать каждый ролик уникальным, даже если он основан на одном и том же креативе.\\n\\nПредставь: у тебя есть базовое видео (крео), которое ты получил от бота. Но просто залить его - значит обречь себя на нули или бан. Поэтому мы будем его видоизменять.\\n\\nПервым делом ты скачиваешь приложение Pinterest и регистрируешься там. Это твой источник фоновых изображений. В поисковике пишешь что-то вроде "cars", "nature", "city" или любую тему, которая подходит под твой креатив. Скачиваешь понравившиеся фото.\\n\\nТеперь открываешь CapCut (лучший редактор для TikTok). Создаёшь новый проект. Во вкладке "Photos" выбираешь скачанную фотку. Сразу ищи вкладку "Aspect Ratio" и выбираешь шаблон 9:16 (формат TikTok). Если нужно, растягиваешь фото, чтобы убрать чёрные поля. Главное - сделать красиво!\\n\\nДалее находишь вкладку "Overlay" → "Add overlay". Из раздела "Videos" выбираешь свой креатив и добавляешь его в проект. Выбираешь видеодорожку, нажимаешь "Splice" и двигаешь ползунок примерно на 75-63%. Это поможет тебе наложить видео на фон.\\n\\nТеперь растягиваешь фоновое фото по всей длине креатива и убираешь чёрную концовку. Возвращаешься назад и во вкладке "Text" нажимаешь "Auto captions". Выбираешь стиль субтитров в "Templates" и жмёшь "Generate".\\n\\nОсторожно! Субтитры почти всегда накладываются неправильно в том месте, где персонаж произносит домен. Тебе нужно вручную отредактировать их, чтобы в этот момент домен отображался точно так же, как в оригинальном креативе.\\n\\nКогда всё готово - жмёшь "Export". Креатив уникализирован! А самое крутое: в следующий раз тебе не нужно повторять весь процесс. Просто нажимаешь на фоновое фото, находишь "Replace" и выбираешь новое изображение. Новый уник готов!\\n\\n# ЧАСТЬ 3: ПОЛУЧЕНИЕ И НАСТРОЙКА АККАУНТОВ\\n\\nТеперь тебе нужны аккаунты для работы. Ты можешь купить их в специальных ботах (цена от 7-12 рублей за штуку), попросить у наставника или получить в боте. Вот проверенные магазины:\\n\\n@ttgetcode_bot\\n@mutedshopbot\\n@METAonStorebot\\n@TikTok_Proliv_accs_bot\\n\\nСкачиваешь TikTok (без VPN можно) и нажимаешь "Log in". Выбираешь первый пункт "Use Phone / email / username". Переходишь на вкладку "email / username", вставляешь почту от купленного аккаунта и жмёшь "Далее".\\n\\nTikTok попросит код с почты. Тут ты переходишь в бота и нажимаешь кнопку "IMAP". Вводишь почту и получаешь код. Вставляешь его в TikTok.\\n\\nЕсли всё сделано правильно - ты в аккаунте! Но будь внимателен: если входишь в несколько аккаунтов одновременно, TikTok может дополнительно попросить пароль.\\n\\n# ЧАСТЬ 4: ЗАЛИВ ВИДЕО - ИСКУССТВО ПОДБОРА ХЭШТЕГОВ\\n\\nТеперь самая ответственная часть - залив видео. Правило номер один: на один аккаунт заливаешь максимум 6 одинаковых видео. Больше - и получишь теневой бан. Самый простой способ - залив из галереи.\\n\\nНажимаешь "+" для залива видео. Выбираешь свой уникализированный креатив и жмёшь "Next".\\n\\nТеперь самое сложное - хэштеги. Чтобы подобрать правильные, тебе нужно установить VPN на компьютер и подключиться к серверу нужной страны (для США - американский сервер).\\n\\nЗатем заходишь на сайт: https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en\\n\\nВо вкладке "Industry" выбираешь категорию "Finance Services". Ставишь галочку "New to Top 100". В списке ищешь хэштеги с графиком, который смотрит вверх (трендовые).\\n\\nОткрываешь каждый такой хэштег и изучаешь:\\n- График популярности в твоём регионе\\n- Возрастную аудиторию\\n- Географию людей, использующих этот хэштег\\n\\nВыбираешь 5-10 подходящих хэштегов, которые соответствуют твоей аудитории.\\n\\nПосле этого отключаешь комментарии ("Allow comments") и сохранение ("Save to Device"). Готово! Видео залито.\\n\\n# ЧАСТЬ 5: ПРОБЛЕМЫ И ИХ РЕШЕНИЕ\\n\\nРабота с TikTok - это не только успех, но и постоянная борьба с проблемами. Давай разберём самые частые.\\n\\nНули - видео висит без просмотров, но теневого бана нет. Причина всегда в креативе. Что делать:\\n- Добавь больше прозрачности\\n- Поменяй фоновое фото\\n- Добавь анимацию\\n- Передвинь элементы вверх/вниз\\n\\nБаны - видео удаляется спустя 15 минут. Обычно TikTok распознаёт 6 одинаковых видео как спам. Решение: заливай по 3 одинаковых, 3 с одним уником, 3 с другим.\\n\\nОбщие правила избежания проблем:\\n- Постоянно уникализируй видео\\n- Не используй банворды (free, money, crypto) в описаниях, названиях аккаунтов, био\\n- Домен указывай БЕЗ точки!\\n- Для уникализации текста используй разные раскладки клавиатуры\\n- Снимай видео горизонтально, потом поворачивай - качество упадёт, но уникализация сработает\\n- Держи iOS обновлённой\\n- Тестируй хэштеги без банвордов\\n\\nЕсли подозреваешь, что проблема в креативе - запиши любое видео с камеры (минимум 5 секунд). Если оно не тенистся - значит дело в твоём контенте.\\n\\n# ЧАСТЬ 6: TIKTOK КАРУСЕЛЬ - ПРОДВИНУТАЯ ТЕХНИКА\\n\\nТеперь давай поговорим о карусели - это настоящий прорыв в работе с TikTok. Это система, которая позволяет автоматически собирать просмотры и регистрации.\\n\\nСначала настраиваешь гео телефона на нужный регион. Ставишь язык английский или язык той страны, в которую льёшь. Если приложение доступно только в определённых странах - используй сервис https://www.fakexy.com/fake-address-countries для смены региона App Store.\\n\\nЕсли льёшь во Францию - ставь французский везде, и так далее.\\n\\nСбрасываешь настройки сети и скачиваешь TikTok (можно без VPN).\\n\\nРабота с креативами:\\n- Публикуешь 2 фото: домен промо и получение бонуса\\n- Переходишь в бота и создаёшь промо (maxwin 1500-2500$)\\n- Как только промо готово - получаешь креатив\\n- Нажимаешь "Creo Beta"\\n- Выбираешь язык\\n\\nЯзыки и регионы:\\n- Английский: США, Австралия, Новая Зеландия, Великобритания, Ирландия, Мальта, Малайзия\\n- Немецкий: Германия, Австрия, Бельгия, Швейцария\\n- Французский: Франция, Реюньон\\n\\nВыбираешь домен, и креатив готов!\\n\\nРегистрация аккаунта:\\n- Скачиваешь TikTok\\n- Включаешь HMA VPN\\n- Заходишь в TikTok\\n- Регистрируешься через Email\\n- Ставишь год рождения 2005-1994 с рандомным месяцем и днём\\n- Почту берёшь из @TempMail_org_bot\\n\\nВажные нюансы:\\n- Делай фото новостей вручную (1 фото на 1 аккаунт) - скрины уже не принимают\\n- То же самое с фото вывода\\n- Если всё равно тени/баны - снимай фото дальше от монитора, камеру поставь на 0.6\\n\\nТени могут быть из-за хэштегов - тут всё зависит от твоего выбора. HMA VPN - самый актуальный, другие могут тень или банить.\\n\\nРезультат карусели:\\nПосле пролива и набора просмотров у тебя получится карусель. Лайков и сохранений там немного, но регистрации идут хорошо при 50 аккаунтах в день.\\n\\nХэштеги берёшь здесь: https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en\\n\\nВажно знать:\\nДепозиты приходят в случайное время - может быть после 2 регистраций, а может после 100. 1 аккаунт карусели даёт 1-2 регистрации после добора просмотров (если не ночное время в твоей стране). Лей количеством!\\n\\nУдачи в работе с TikTok! 🚀	\N	9481fea5-3613-4df7-96d3-32490d1d4d78	0	t	\N	2025-09-03 14:31:48.24	2025-09-04 08:51:31.74
adaefa96-3b69-4d77-b0e1-01fe52336484	Стратегия работы с Reels		page-6	## Подготовка смартфона\\n\\nЛучше всего взять отдельный телефон для работы с Инстой. Так ты не рискуешь своим основным аккаунтом и сможешь нормально управлять контентом.\\n\\n### 1. Чистим цифровые следы\\n\\nВынь симку перед сбросом (это важно!)\\n\\nСбрось сетевые настройки через Settings > Reset Network Settings\\n\\nДля полной безопасности лучше сделать полный сброс до заводских настроек\\n\\n### 2. Бэкап данных\\n\\nОбязательно сохрани все важное перед сбросом\\n\\nИспользуй облако или скопируй на комп\\n\\n- \\n\\n### 3. Настраиваем безопасное соединение\\n\\nПоставь нормальный VPN (например, Pure VPN)\\n\\nЛучший вариант — прокси со статичным IP\\n\\nНе меняй геолокацию часто — Инста это палит и может кинуть в тень\\n\\n- \\n\\n- \\n\\n> Лайфхак: Стабильный IP — это ключ к успеху. Инста жестко отслеживает смену геолокации и может тебя забанить или скрыть твой контент от других.\\n\\n## Настраиваем аккаунт\\n\\nПравильный аккаунт — это 50% успеха в Reels.\\n\\nГде взять аккаунт?\\n\\nКогда выбираешь аккаунт, смотри на это:\\n\\nВозраст: Лучше брать старые аккаунты (от 6 месяцев)\\n\\nПодписчики: Нужно минимум 1000+ для старта\\n\\nГео: США и Индия дают лучшие результаты\\n\\nАктивность: Должны быть старые посты и комменты\\n\\nКупить можно на специальных площадках, но проверяй историю аккаунта внимательно.\\n\\n- \\n\\n- \\n\\n- \\n\\n### Оформляем профиль\\n\\nНормальное оформление профиля реально повышает доверие:\\n\\nИмя пользователя\\n\\nИспользуй нормальные имена (типа Jenny.Stone)\\n\\n- \\n\\n### 2. Био\\n\\n- Создай образ эксперта в своей нише\\n\\n- Для финансовой темы: покажи себя как специалиста по инвестициям\\n\\n- Упомяни свои интересы и опыт\\n\\n- Добавь призыв к действию и уникальное предложение\\n\\n> **INFO**: Пример крутого био: "Финансовый аналитик с 5-летним опытом | Делюсь фишками пассивного дохода | Эксклюзивные инвест-возможности для подписчиков (промокод: INVEST10)"\\n\\n### 3. Внешний вид\\n\\n- Ставь качественную фотку\\n\\n- Сделай единый стиль для всего контента\\n\\n- Подгони существующий контент под свою тему\\n\\n# Прогреваем аккаунт\\n\\n> **INFO**: Правильный прогрев — это критически важно. Без него ты просто сольешь аккаунт.\\n\\n## План прогрева на 14 дней\\n\\n### Фаза 1: Имитируем обычного юзера (Дни 1-2)\\n\\n- Не постим ничего первые 48 часов.\\n\\nВедем себя как обычный пользователь:\\n\\n - Листаем ленту 2-3 часа в день с перерывами\\n\\n - Лайкаем выборочно (не больше 40-50 в день)\\n\\n - Оставляем нормальные комменты (5-10 в день)\\n\\n - Делаем перерывы между сессиями 40-60 минут\\n\\n### Фаза 2: Начинаем тематическое взаимодействие (Дни 3-7)\\n\\n- Начинаем взаимодействовать с контентом в твоей нише\\n\\n- Ищем по ключевым словам твоей темы\\n\\n- Подписываемся на 10-15 тематических аккаунтов каждый день\\n\\nНачинаем постить по такому графику:\\n\\n**День | Фото | Видео | Stories | Reels**\\n\\n       3    |      2    |       1      |      1       |     0\\n\\n       4    |      3    |       1      |      1       |     0\\n\\n       5    |      4    |       1      |      2      |     1\\n\\n       6    |      1     |       1      |      1       |     0\\n\\n       7    |       1    |       0     |      3      |     2\\n\\n### Фаза 3: Активно продвигаемся (Дни 8-14)\\n\\n- Переходим к регулярным постам основного контента\\n\\n- Держим стабильный график: 1-3 Reels, 1 фото и 1-3 Stories каждый день\\n\\n- Начинаем взаимодействие с аудиторией через опросы и вопросы в Stories\\n\\n- Отвечаем на все комменты для повышения вовлеченности\\n\\n> **INFO**: Автоматизация процесса (для iPhone)\\n\\nЧтобы не делать всё руками на айфоне:\\n\\n1. Включи "Универсальный доступ > Управление голосом"\\n\\n1. Создай жесты через Commands > Create New Command > Action > Run Custom Gesture\\n\\n1. Настрой естественные движения для листания и лайков\\n\\n1. Используй голосовые команды (например, "repeat Surfing 99 times")\\n\\nВажно: Автоматизация должна выглядеть естественно. Не делай слишком быстрые действия и однообразные паттерны, иначе Инста тебя спалит.\\n\\n# Делаем крутые Reels\\n\\nЧто нужно для успешного Reels-контента\\n\\n1. Визуал\\n\\n- Используй высокое разрешение (минимум 1080p)\\n\\n- Делай нормальное освещение\\n\\n- Применяй цветокоррекцию\\n\\n- Делай яркие, цепляющие кадры\\n\\n1. Структура\\n\\n- Первые 3 секунды должны цеплять, иначе люди пролистнут\\n\\n- Делай четкий сценарий\\n\\n- В конце добавляй сильный призыв к действию\\n\\n1. Оптимизация публикации\\n\\n- Используй релевантные хэштеги (7-10 штук)\\n\\n- Пиши нормальное описание с ключевыми словами\\n\\n- Выбирай трендовую музыку из рекомендаций Инсты\\n\\n- Указывай геолокацию для расширения охвата\\n\\n# Анализируем результаты\\n\\nПостоянно смотри на свои метрики:\\n\\n- Охват и показы\\n\\n- Время просмотра\\n\\n- Сколько досматривают до конца\\n\\n- Действия аудитории (сохранения, репосты)\\n\\nЕсли 3-4 рилса подряд в нулях — скипай акк или серьезно меняй стратегию контента.\\n\\n# Финальные мысли\\n\\nЧтобы поднять аккаунт в Reels, нужен системный подход: техническая подготовка, стратегия контента и постоянная оптимизация на основе аналитики. Следуй этой стратегии, адаптируй под свою нишу, и ты сможешь эффективно развивать аккаунт и монетизировать аудиторию.\\n\\nПомни, что алгоритмы Инсты постоянно меняются, поэтому нужно быть в курсе новых трендов и подстраиваться под них.\\n\\n> *Это руководство основано на лучших практиках, но не гарантирует конкретных результатов. Эффективность зависит от твоей ниши, качества контента и актуальных алгоритмов платформы.*	\N	3e4a6abe-a8bb-4582-b763-b04aaaa731c7	0	t	\N	2025-08-30 13:54:35.339	2025-09-04 08:51:31.743
cf5a3a0a-d38b-4817-8d98-befcfb308bf5	Словарь		page-8	## Базовые определения в арбитраже\\n\\nАрбитраж трафика (Traffic Arbitrage) – искусство управления потоками пользователей с целью превращения их активности в прибыль. Главная суть: закупать трафик по минимальной цене и монетизировать его через офферы, продукты или собственные платформы с максимальной маржой.\\n\\nОффер (Offer) – структурированное рекламное предложение внутри партнёрской сети: включает продукт, выплаты, доступные гео и готовые материалы. За выполненное целевое действие партнёр получает вознаграждение.\\n\\nЛид (Lead) – потенциальный клиент, совершивший действие, нужное системе: регистрация, заявка, подписка, депозит и т.д.\\n\\nКонверсия / CR (Conversion Rate) – ключевой коэффициент эффективности: показывает, какой процент пользователей выполнил целевое действие. Формула:\\n\\n(Целевые действия ÷ Визиты) × 100%.\\n\\nСвязка (Affiliate Funnel / Combo) – собранная «рабочая машина» из оффера, источника трафика, креативов и лендингов, которая приносит прибыль при масштабировании.\\n\\nROI (Return on Investment) – показатель рентабельности:\\n\\n(Доход – Расход) ÷ Расход × 100%.\\n\\nАппрув (Approval Rate) – процент лидов, подтверждённых рекламодателем. Чем выше аппрув, тем чище и ценнее трафик.\\n\\nФрод (Fraud) – искусственно созданный или некачественный трафик: мультиаккаунты, боты, скликивание, подделка данных.\\n\\nХолд (Hold Period) – проверочный период перед выплатой, когда рекламодатель оценивает качество лида. Может занимать от пары часов до нескольких месяцев.\\n\\nГЕО / GEO (Geolocation) – географический регион трафика. Tier-1 – премиум страны (США, Канада, Великобритания), Tier-3 – массовые, но дешёвые регионы (Индия, Вьетнам, Индонезия).\\n\\nВоронка / Funnel – структурированная цепочка шагов пользователя: преленд → лендинг → форма → заказ → целевое действие.\\n\\n## Финансовые показатели и метрики эффективности\\n\\nCPC (Cost per Click) – цена одного клика по рекламе.\\n\\nCPM (Cost per Mille) – стоимость тысячи показов.\\n\\nCPA (Cost per Action) – модель, где платят за конкретное действие: регистрация, покупка, депозит.\\n\\nCPL (Cost per Lead) – оплата за лид, то есть за контакт потенциального клиента.\\n\\nCPI (Cost per Install) – оплата за установку приложения.\\n\\nCPS (Cost per Sale) – фиксированная выплата за продажу.\\n\\nRevShare (Revenue Share) – схема дележа прибыли: вебмастер получает % от дохода рекламодателя с привлечённого клиента.\\n\\nEPC (Earnings per Click) – средняя прибыль на один клик:\\n\\n(Общий доход ÷ Количество кликов).\\n\\nCTR (Click-Through Rate) – кликабельность рекламы:\\n\\n(Клики ÷ Показы) × 100%.\\n\\nLTV (Lifetime Value) – суммарная ценность клиента за всё время взаимодействия с продуктом.\\n\\nARPU (Average Revenue Per User) – средний доход с пользователя.\\n\\nARPPU (Average Revenue Per Paying User) – доход от одного платящего пользователя.\\n\\n## Каналы и источники трафика\\n\\nFacebook Ads – флагманский источник с богатым функционалом таргетинга и алгоритмами оптимизации.\\n\\nGoogle Ads – экосистема рекламных инструментов Google (поиск, YouTube, КМС и др.).\\n\\nTikTok Ads – источник с высоким вовлечением, низкой ценой клика и молодёжной ЦА.\\n\\nNative Ads – реклама под видом органического контента (Taboola, Outbrain, MGID).\\n\\nPush-трафик (Push Notifications) – уведомления в браузерах и приложениях, ведущие на офферы.\\n\\nPopunder / Clickunder – рекламная страница, открывающаяся в фоне или в новой вкладке.\\n\\nEmail-маркетинг – привлечение лидов через e-mail рассылки.\\n\\nSEO-трафик – бесплатные переходы из поисковиков.\\n\\nTelegram-трафик – потоки из чатов, каналов и групп Telegram.\\n\\n## Классификация трафика\\n\\nWhite Hat Traffic – полностью «чистый» и легальный.\\n\\nGrey Hat Traffic – полулегальный, с обходом правил.\\n\\nBlack Hat Traffic – запрещённые практики (спам, хак, скрипты).\\n\\nWarm Traffic – пользователи с предварительным доверием или знанием бренда.\\n\\nCold Traffic – аудитория, впервые видящая продукт.\\n\\n## Схемы и стратегии арбитража\\n\\nФарминг аккаунтов – выращивание и подготовка профилей для рекламы.\\n\\nКлоакинг (Cloaking) – маскировка контента для обхода модерации.\\n\\nСплит-тест (A/B Test) – параллельное тестирование разных креативов/аудиторий.\\n\\nБрут (Brute Force) – подбор логинов/паролей, редко применим в арбитраже.\\n\\nДорвей (Doorway Page) – промежуточные страницы для перенаправления.\\n\\n## Работа с рекламными кабинетами\\n\\nBM (Business Manager) – бизнес-менеджер Meta для аккаунтов, пикселей и доступа.\\n\\nAd Campaign (РК) – набор объявлений под общей целью.\\n\\nTrust Score – «индекс доверия» аккаунта.\\n\\nBan Wave – массовые блокировки после обновлений алгоритмов.\\n\\nЗалив – запуск рекламной кампании.\\n\\n## Креативы и лендинги\\n\\nКреатив – рекламный материал (баннер, видео, текст).\\n\\nЛендинг (Landing Page) – страница конверсии.\\n\\nПреленд (Prelanding Page) – «прокладка» между рекламой и лендингом для прогрева.\\n\\nCTA (Call to Action) – призыв к действию.\\n\\n## Безопасность и платежи\\n\\nVirtual Cards – виртуальные карты для оплаты рекламы.\\n\\nАнтидетект-браузер – браузер для работы с мультиаккаунтами (Indigo, AdsPower, GoLogin).\\n\\nПрокси (Proxy) – смена IP для распределённой работы.\\n\\nАвтозалив – автоматизация создания и запуска кампаний.\\n\\nШейв – «срезание» реальных конверсий сетью.\\n\\nДохлый аккаунт – акк без шансов на работу.\\n\\n## Дополнительные термины (часть 1)\\n\\nА/Б-тест / Split-Test – метод анализа, при котором сравниваются два и более варианта креативов, лендингов или аудиторий. Цель – выявить наиболее эффективный вариант и масштабировать его.\\n\\nAgency Ad Account (Агентский кабинет) – арендованный рекламный кабинет, предоставленный агентством или посредником. Обычно имеет более высокий лимит и стабильность.\\n\\nAdvertiser / Рекламодатель – компания или человек, предлагающий оффер и оплачивающий целевые действия.\\n\\nАккаунт (Account / Акк) – учётная запись с доступом к рекламным системам или соцсетям.\\n\\nАпселл (Upsell) – предложение более дорогого продукта или дополнительных опций клиенту после первой покупки.\\n\\nAffiliate (Аффилэйт) – партнёр (вебмастер), который привлекает трафик и получает вознаграждение.\\n\\nБаннер (Banner) – графический рекламный элемент: статичный или анимированный.\\n\\nBid / Бид – ставка в рекламной системе, определяющая, сколько вы готовы платить за действие/клик/показ.\\n\\nBidding / Биддинг – процесс управления ставками для получения лучшего результата.\\n\\nBlacklist (Блеклист) – список запрещённых или неэффективных площадок для показов рекламы.\\n\\nBot / Бот – программа, имитирующая действия живого пользователя. В арбитраже может использоваться для фрода или тестирования.\\n\\nБурж (Burzh Traffic) – иностранный трафик, чаще всего из Tier-1 стран.\\n\\nWhitelist (Вайтлист) – список площадок, признанных эффективными и приносящими качественный трафик.\\n\\nВебмастер (Webmaster) – человек, работающий с трафиком, офферами и связками.\\n\\nVertical / Вертикаль – категория офферов: нутра, дейтинг, гемблинг, беттинг и др.\\n\\nVirtual Hosting / Виртуальный хостинг – размещение сайтов на одном сервере, где ресурсы делятся между несколькими проектами.\\n\\nВирусный маркетинг (Viral Marketing) – способ распространения контента силами самих пользователей.\\n\\nWordstat (Вордстат) – инструмент анализа ключевых запросов от Яндекса.\\n\\nGeo-targeting / Гео-таргетинг – настройка рекламы по географическому признаку.\\n\\n## Дополнительные термины (часть 2)\\n\\nDeeplink / Диплинк – ссылка, ведущая не на главную страницу, а на конкретный раздел или продукт.\\n\\nДосрочка (Fast Payout) – досрочная выплата заработанных средств от партнёрской сети.\\n\\nИнвайт (Invite) – приглашение в закрытую партнёрскую программу.\\n\\nInstalls / Инсталлы – количество установок мобильного приложения.\\n\\nCase Study / Кейс – подробный разбор связки или кампании с цифрами и результатами.\\n\\nClick / Клик – действие пользователя по нажатию на объявление.\\n\\nClick Fraud / Кликфрод – искусственное накручивание кликов.\\n\\nConversion / Конверт – процент соотношения кликов к выполненным действиям.\\n\\nКонтекстная реклама – реклама, показываемая по ключевым словам и контенту сайта.\\n\\nContent / Контент – совокупность текстов, визуалов и медиа на сайте.\\n\\nTo Pour / Лить – запускать трафик на оффер.\\n\\nMislead / Мислид – реклама, вводящая пользователя в заблуждение.\\n\\nМобильный трафик – переходы с мобильных устройств.\\n\\nНативная реклама – реклама, гармонично встроенная в основной контент.\\n\\nNutra / Нутра – ниша офферов по здоровью и красоте.\\n\\nAffiliate Network / Партнёрка – сеть, соединяющая рекламодателей и вебмастеров.\\n\\nPin Submits / Пины – офферы с подтверждением через SMS-код.\\n\\nPopunder / Попандер – страница, открывающаяся в фоне.\\n\\nPopup / Попап – всплывающее окно с рекламой.\\n\\nPostback / Постбек – система передачи данных о лидах в трекер.\\n\\nBridge Page / Прокладка – промежуточная страница для «подогрева» перед оффером.\\n\\nPush Notifications / Пуши – рекламные уведомления на мобильных и ПК.\\n\\nRebill / Ребил – повторный платёж по подписке.\\n\\nReferral / Реферал – клиент, пришедший по вашей партнёрской ссылке.\\n\\nReferral Link / Рефка – партнёрская ссылка для привлечения пользователей.\\n\\nSubID / Саб – метка для отслеживания источника трафика.\\n\\nSweepstakes / Свипстейки – офферы с розыгрышами призов.\\n\\nSocial Traffic / Социалка – трафик из соцсетей.\\n\\nTargeting / Таргет – настройка аудитории по параметрам.\\n\\nTeaser / Тизер – рекламный формат с коротким текстом и изображением.\\n\\nTeaser Network / Тизерка – сеть для размещения тизеров.\\n\\nТоварка / Physical Goods – офферы с физическими товарами.\\n\\nTracker / Трекер – система аналитики для арбитража.\\n\\nTrigger Emails / Триггерные рассылки – автоматические письма, отправляемые при определённых действиях пользователя.\\n\\nTA / Целевая аудитория – группа людей, наиболее заинтересованных в продукте.\\n\\nЦелевой переход – клик, который реально может привести к действию.\\n\\nAPI / АПИ – интерфейс для обмена данными между системами.\\n\\n## Маркетинговые термины\\n\\nBrand Identity / Айдентика – визуальный стиль бренда: логотип, цвета, шрифты.\\n\\nВиральность (Virality) – способность контента распространяться вирусно.\\n\\nGeotargeting / Геотаргет – настройка рекламы по местоположению.\\n\\nInfluencer Marketing – продвижение через блогеров и лидеров мнений.\\n\\nЛид-магнит – бесплатный материал в обмен на контакт.\\n\\nМедиаплан – расписанный план рекламных активностей.\\n\\nНативка – формат рекламы, встроенной в контент.\\n\\nМасштабирование – увеличение объёмов трафика.\\n\\nОрганика – бесплатные переходы из поиска или соцсетей.\\n\\nПосадочная страница – лендинг, куда приводят трафик.\\n\\nПиксель – код для отслеживания действий пользователей.\\n\\nРетаргетинг – повторный показ рекламы пользователям.\\n\\nПлейсмент – конкретное место размещения рекламы.\\n\\nПромоакции – конкурсы, скидки, офферы для вовлечения.\\n\\nПарсеры – софты для сбора данных о целевой аудитории.\\n\\nПосев – массовое распространение контента по площадкам.\\n\\nРеференс – пример или эталон для создания креатива.\\n\\nСквозная аналитика – полное отслеживание пути клиента.\\n\\nСтавка – цена за показ или действие.\\n\\nСупер-ГЕО – точный локальный таргетинг.\\n\\nТовар-локомотив – продукт-приманка.\\n\\nФлагман – ключевой продукт бренда.\\n\\nТрипваер – дешёвый продукт-вход для воронки.\\n\\nUSP / УТП – уникальное торговое предложение.\\n\\nШейры – репосты.\\n\\nЯдро ЦА – самая вовлечённая часть аудитории.\\n\\n## Маркетинговые модели и аббревиатуры\\n\\nAIDA – модель воронки: внимание → интерес → желание → действие.\\n\\nCPF (Cost per Follower) – стоимость подписчика.\\n\\nCPO (Cost per Order) – стоимость одного заказа.\\n\\nCRM – система управления клиентами.\\n\\nCAC (Customer Acquisition Cost) – стоимость привлечения одного клиента.\\n\\nER (Engagement Rate) – уровень вовлечённости (лайки, комменты ÷ подписчики).\\n\\nERR (Engagement Rate by Reach) – вовлечённость относительно охвата.\\n\\nKPI (Key Performance Indicator) – ключевой показатель эффективности.\\n\\nROAS (Return on Ad Spend) – возврат вложений в рекламу.\\n\\nROMI (Return on Marketing Investment) – эффективность маркетинга в целом.\\n\\nLTV (Lifetime Value) – прибыль от клиента за весь срок его жизни.\\n\\nLookalike Audience (LAL) – «похожие» аудитории, схожие с исходной ЦА.\\n\\nSFS (Shout for Shout) – взаимный пиар в соцсетях.\\n\\nSMO (Social Media Optimization) – оптимизация соцсетей.\\n\\nTOV (Tone of Voice) – стиль общения бренда.\\n\\nUGC (User Generated Content) – контент, созданный пользователями.\\n\\nUTM-метки – параметры в ссылках для аналитики.	\N	7a6b5b69-0794-4245-b7ec-6ff263aa5989	1	t	\N	2025-08-30 14:26:47.217	2025-09-04 16:06:33.344
f0cdf251-0692-422a-904c-378074a12675	Работа с доменами		page-9	Чтобы связка работала корректно и у вас была возможность разместить лендинг, необходимо выбрать домен. В Umbra предусмотрено два варианта подключения — выберите тот, что подходит именно вам.\\n\\n🔹 Вариант 1: Использовать общий домен Umbra\\n\\nПлюсы:\\n•\\tНе требует настроек — всё работает сразу.\\n•\\tМгновенный запуск после активации.\\n\\nМинусы:\\n\\n•\\tДомен общий для всех пользователей.\\n\\n•\\tНизкий уровень траста, выше вероятность блокировок при больших объёмах трафика.\\n\\n•\\tДоступен только один дефолтный лендинг (без возможности выбора).\\n\\n🔹 Вариант 2: Привязать собственный домен\\n\\nРекомендуемый вариант для тех, кто хочет:\\n\\n•\\tЛить трафик на уникальный домен, не делящийся с другими.\\n\\n•\\tПолучить доступ к 21 эксклюзивному лендингу Umbra, оптимизированному под разные офферы, GEO и аудитории.\\n\\n•\\tПовысить доверие пользователей и снизить риск блокировок.\\n\\nГде купить домен?\\n\\nСервис\\tТип\\tОсобенности\\n\\n1REG - Обычный Дешёвые .com и .org\\n\\nFastDomain- Обычный\\tХорошие цены\\n\\nNamecheap - Обычный Крупный и надёжный регистратор\\n\\n@bpdomains_bot - Анонимный\\tБыстрая покупка домена прямо в Telegram\\n\\nKehr Domains - Анонимный Удобный и быстрый сервис\\n\\nИнструкция по привязке домена в Umbra\\n\\nШаг 1. Выбор лендинга\\n\\nПосле подтверждения оплаты и добавления домена откроется список из 21 лендинга Umbra. Выберите подходящий под стратегию (игровая платформа, бонус-сервис, инвест-платформа и др.).\\n\\nШаг 2. Получение NS-записей\\n\\nUmbra автоматически сгенерирует NS-записи для подключения домена. Пример:\\n\\n> mira.ns.cloudflare.com  \\n> evgen.ns.cloudflare.com\\n\\n(Значение TTL оставляйте по умолчанию).\\n\\nШаг 3. Настройка у регистратора\\n\\nВ панели управления доменом найдите раздел «DNS» или «NS-записи» и замените текущие данные на предоставленные Umbra. Сохраните изменения.\\n\\n⏳ Обновление может занять от 5 минут до 2 часов.\\n\\nШаг 4. Проверка привязки\\n\\nВернитесь в Umbra Bot и нажмите «Проверить домен». Если всё корректно — система подтвердит успешное подключение.\\n\\nШаг 5. Готово!\\n\\n🎉 Теперь у вас привязан собственный домен, выбран лендинг и сгенерирован персональный промокод. Можно переходить к настройке преленда и запуску кампаний.\\n\\n📌 Советы от Umbra\\n\\n•\\tПеред покупкой убедитесь, что домен не использовался в сомнительных проектах — это влияет на траст.\\n\\n•\\tЕсли привязка долго не проходит — очистите DNS-кэш или проверьте записи через dnschecker.org.\\n\\n•\\tДля максимальной скорости и стабильности рекомендуем зоны: .com, .org, .co, .click.	\N	7a6b5b69-0794-4245-b7ec-6ff263aa5989	2	t	\N	2025-08-30 14:26:48.065	2025-09-04 16:06:34.437
57e2a28d-e52b-4cd3-977d-aa2f5b963876	УБТ YT Shorts	Данное руководство содержит подробную информацию по подготовке и проведению пролива на платформе YouTube Shorts. Ты узнаешь все этапы процесса от настройки устройства до анализа результатов.	page-11	# Стратегия работы\\n\\n## Подготовка устройства\\n\\nПервый этап - правильная настройка твоего мобильного устройства для проведения пролива.\\nТебе необходимо выполнить полный сброс устройства до заводских настроек. Перед этим обязательно создай резервную копию важных данных (фото, контакты, приложения). После сброса настрой параметры устройства согласно целевому региону. Подробные изображения с настройками доступны в соответствующих руководствах.\\nНастройка региона: устройство должно работать без SIM-карты, регион и язык интерфейса должны соответствовать твоему целевому геолокационному таргету. Для примера рассмотрим настройку под США - в разделе Settings > Language & Region установи регион United States.\\nИзменение языка: для американского таргета установи English (US). Важно использовать именно вариант (US), а не общий English.\\nНастройка клавиатуры: удали русскую раскладку, оставив только английскую. Перейди в Settings > Keyboards для настройки.\\nОтключение геолокации: в разделе Settings > Location отключи все службы определения местоположения.\\nНастройка App Store: измени регион аккаунта в App Store > Profile > Country/Region. Для генерации необходимых данных используй специализированные сервисы, такие как usaddressgenerator.com.\\nУстановка VPN: в филиалах обычно предоставляются бесплатные VPN. Установи рекомендованный VPN (например, PureVPN) и авторизуйся с предоставленными учетными данными.\\nНастройка точки доступа: настрой раздачу интернета через твое мобильное устройство. Это необходимо для обеспечения чистого IP-адреса, так как домашний роутер часто имеет "грязный" IP, что негативно влияет на продвижение видео. Если функция недоступна, следуй специальным гайдам по восстановлению режима модема для iOS/Android.\\n\\n## Подготовка аккаунта\\n\\nСуществует два основных подхода к подготовке аккаунта: приобретение готового или создание нового.\\nВариант 1 - приобретение аккаунта: рекомендуется покупать каналы с историей от 2-3 лет. Этот подход подходит для пользователей с опытом и бюджетом. Покупку можно осуществить на специализированных маркетплейсах, таких как FunPay.\\nВариант 2 - самостоятельное создание: при регистрации укажи возраст соответствующим образом (год рождения 2000-2003 является оптимальным). Измени дату рождения, поскольку система по умолчанию устанавливает завтрашнюю дату. Это необходимо для имитации обычного пользователя.\\nПосле создания аккаунта дай ему "отлежаться" в течение суток. Затем начни активность: в течение первых 5 минут интенсивно подписывайся на тематические каналы, ставь оценки, оставляй комментарии. Все как обычно - действуй естественно, как обычный пользователь.\\nНастройка профиля: установи приложение YouTube Studio.\\nВ интерфейсе аккаунта доступны разделы Dashboard/Content/Analytics/Comments/Earn. Пока эти функции могут быть не актуальны, но в будущем они пригодятся. Нажми на аватар и выбери редактирование.\\nДобавь баннер канала, аватар, описание и ссылку. Выполняй действия постепенно. Баннер и аватар могут быть простыми. Ссылка зависит от целевого контента. Сохрани изменения.\\n\\n## Создание контента\\n\\nДля создания контента потребуется специализированное программное обеспечение.\\nУстанови CapCut из официального магазина приложений. Это инструмент для уникализации видео.\\nСоздание проекта: подготовь черный фон. Загрузи его в приложение, нажав на кнопку "+". Измени соотношение сторон на 9:16 (формат Shorts) - для этого сдвинь нижнюю панель чуть вправо и выбери "Соотношение сторон". Обязательно удали стандартную концовку видео.\\nПодготовка исходного материала: найди подходящий контент в TikTok (например, "Elon Musk Edit"). Скопируй ссылку на видео через функцию "Поделиться". Используй сервисы для скачивания видео без водяных знаков TikTok.\\nДобавь скачанное видео в CapCut как наложение согласно инструкциям туториалов.\\nВ твоем распоряжении инструменты кадрирования, изменения размеров элементов, добавления текста. Ничего абсолютно сложного в этом процессе нет. Для дополнительного улучшения используй автоматические субтитры, особенно при работе с deepfake-контентом.\\n\\n## Публикация видео\\n\\nПосле подготовки контента приступай к публикации.\\nОткрой YouTube, нажми кнопку загрузки и выбери видео. Следуй стандартной процедуре с учетом следующих нюансов:\\n- Добавь музыкальное сопровождение с нулевой громкостью\\n- Примени визуальные фильтры\\n- Используй релевантные хэштеги (#elonmusk, #csgo и т.д.)\\n- Сосредоточься на визуальном контенте, минимизируй текст\\nВот подробные туториалы по публикации Shorts.\\n\\n##  Аналитика в YT STUDIO\\n\\nYouTube Studio предоставляет инструменты для анализа результатов.\\nВ Studio доступны данные об охвате аудитории, географии зрителей, источниках трафика и времени просмотра. Эта информация крайне важна для оптимизации пролива и понимания эффективности твоих действий.\\nПерейди к анализу конкретного видео в Studio.\\n\\n### Оценка эффективности\\n\\nКлючевым показателем успеха является количество просмотров из раздела "Shorts Feed" (рекомендации YouTube). Если в течении 12 часов после публикации у тебя набрано не менее 10 просмотров из рекомендаций, видео успешно попало в пролив.\\n\\n## Возможные проблемы\\n\\nПри отсутствии результатов в рекомендациях проверь следующие аспекты. Варианты решения просты:\\n1. Измени VPN-сервер - текущий может не соответствовать твоему целевому региону.\\n2. Проверь качество аккаунта - недостаточная "отлежка" или низкое качество приобретенного аккаунта.\\n3. Выполни сброс сетевых настроек и измени название Wi-Fi сети (SSID). Для этого перейди в настройки точки доступа и измени ее название - это просто. Используй специализированные гайды: для Android - https://www.youtube.com/watch?v=iCHS4tkRnIo, для iOS - https://www.youtube.com/watch?v=TuSZ-kthAEc&t=5s.\\n4. Обеспечь уникальность контента - YouTube ужесточил требования к крео, поэтому полностью измени видео.\\n5. Не размещай ссылки в комментариях, не используй накрутку просмотров и подписчиков. Это приведет к блокировке аккаунта.\\n6. Ограничься одним видео в сутки. Лучше использовать несколько каналов с одним видео на канал ежедневно. НАРУШЕНИЕ ХОТЬ ОДНОГО ПРАВИЛА УБЬЕТ ТВОЙ АККАУНТ!!!	\N	d3bdc450-4af7-4441-bfaa-268375b7ad60	0	t	\N	2025-09-01 07:28:15.011	2025-09-04 08:51:31.735
a268994c-a887-480f-84cf-6e8f279ceb55	О нас		page-2	### Umbra Team — закрытое комьюнити арбитражников\\n\\nUmbra Team — это профессиональное сообщество, где арбитраж трафика перестаёт быть хаотичной игрой и превращается в систему. Здесь работают только проверенные подходы, связки и инструменты, которые ежедневно приносят результат.\\n\\nМы не создаём иллюзию «лёгких денег». Мы даём рабочую базу и поддерживаем каждого участника в реальных условиях арбитража.\\n\\n## Чем мы занимаемся\\n\\n1.\\tУсловно-бесплатный трафик (УБТ): TikTok, YouTube, Instagram, мобильные решения, push-механики.\\n\\n2.\\tПлатный трафик: Facebook Ads, TikTok Ads, Google Ads и другие рекламные системы.\\n\\n3.\\tСобственные PWA и iOS-приложения: высокий траст, продуманная защита и масштабируемость.\\n\\n4.\\tВоронки и креативы под любую вертикаль: готовые конструкции, адаптированные под задачу.\\n\\n5.\\tОбучение и сопровождение: от первых шагов до выхода на стабильный профит.\\n\\n## Почему выбирают Umbra Team\\n\\n•\\tВозможность выйти на реальные деньги уже с первых недель.\\n\\n•\\tОбучение от действующих практиков, которые сами ежедневно заливают трафик.\\n\\n•\\tСистема: от креатива до депозита — без разрывов и хаоса.\\n\\n•\\tДоступ к закрытым инструментам, доменам и приложениями с трастом.\\n\\n•\\tПостоянная техническая поддержка и наставничество.\\n\\n•\\tПроверенные офферы, гарантированные выплаты и стабильная работа.\\n\\n## Для кого это\\n\\n•\\tДля новичков, которые хотят стартовать без лишней теории и потерь.\\n\\n•\\tДля арбитражников, у которых есть трафик, но нет стабильного профита.\\n\\n•\\tДля тех, кто хочет расти: расширять команду, увеличивать бюджеты и масштабироваться.\\n\\n## Что вы получаете\\n\\n•\\tПолную систему обучения, построенную на практике.\\n\\n•\\tЛичного наставника для сопровождения.\\n\\n•\\tИнструменты, расходники и готовые рабочие решения.\\n\\n•\\tПоддержку команды 24/7.\\n\\n•\\tОплату за депозиты от 50%.\\n\\n> **SUCCESS**: Umbra Team — это не чат и не «комьюнити ради галочки». Это рабочая система, где каждое действие направлено на результат.	\N	4e929b8b-912e-45f7-9af0-6a2d7070b875	1	t	\N	2025-08-30 08:48:53.612	2025-09-08 14:38:49.603
17aade97-b413-4ee7-bf55-56b229065502	Дрейк раздает $2500		page-13	# Новостной подход\\n\\nМетод заключается в создании «новостных роликов» с рекламным подтекстом.\\n\\nВ качестве основы можно использовать оформление крупных зарубежных изданий — таких как BBC News, CNN, The New York Times, The Washington Post, NBC News и других популярных медиа. Суть в том, чтобы визуально «подменить» новость на собственный материал, сохранив узнаваемый стиль.\\n\\nКак это делается:\\n\\n## Выбор источника\\n\\nОткрываем новостной сайт в браузере и выбираем интересную публикацию.\\n\\nРедактирование контента. Через инструмент «Просмотр кода элемента» (доступен в большинстве браузеров по правой кнопке мыши) можно заменить заголовок и картинку. Таким образом внешне страница выглядит как настоящая новость, но с нужным вам содержанием. Для этого применяются простые правки в HTML-коде: меняем текст, ссылки, изображения.\\n\\n## Подготовка визуала\\n\\nСкриншотим или записываем экран с изменённой страницей, чтобы получить готовый фрагмент под новостной ролик.\\n\\n## Озвучка\\n\\nЧтобы ролик выглядел убедительнее, добавляется озвучка. Для этого отлично подходит сервис Eleven Labs:\\nвставляем подготовленный заголовок,\\nгенерируем реалистичную голосовую дорожку,\\nможно добавить пару слов о «промокоде» или упоминание вашего предложения.\\n\\n## Итог\\n\\nТаким образом получается короткий «новостной сюжет» в узнаваемом стиле крупных СМИ, но с вашим посылом. Такой формат вызывает доверие у зрителя, ведь он ассоциируется с официальной подачей информации.\\n\\nПродвигать подобные ролики можно в социальных сетях, на видеоплатформах или через таргетированную рекламу — в зависимости от твоих бюджетов	\N	a1f920e4-7904-48a3-b8dc-fcc209d70249	1	t	\N	2025-09-02 08:16:57.396	2025-09-04 08:51:31.754
2fc6215c-19a8-487b-8be4-6fcf40ce79c7	Правила работы в Umbra Team		page-3	## Методичка — твой главный инструмент\\n\\n\\t•\\tВ методичке собраны инструкции, воронки, креативы, скрипты и кейсы, проверенные на практике.\\n\\n\\t•\\tПеред тем как обращаться к тимлиду или в чат, проверь ответы в методичке. Большинство вопросов уже разобраны там.\\n\\n\\t•\\tДокумент обновляется регулярно. Следи за разделом «Новое» и не пропускай актуальные дополнения.\\n\\n1. Командное взаимодействие\\n\\n\\t•\\tВнутри команды ценится уважение. Агрессия, токсичность, хаос или игнорирование правил — основание для исключения.\\n\\n\\t•\\tВопросы без конкретики («что делать?», «с чего начать?») перенаправляются в методичку.\\n\\n\\t•\\tРабочие чаты предназначены исключительно для задач, аналитики и отчётов. Лишний шум исключается.\\n\\n## Дисциплина и вовлечённость\\n\\n\\t•\\tОтсутствие активности более 48 часов без предупреждения = исключение. Umbra Team держится на движении, а не на ожидании.\\n\\n\\t•\\tРабочая норма — не менее 6–8 часов в день. Если твоя цель — прибыль, времени и усилий придётся вкладывать достаточно.\\n\\n\\t•\\tЕсли понимаешь, что не справляешься по мотивации или времени — освободи место тому, кто готов работать.\\n\\n## Результаты превыше слов\\n\\nUmbra Team — это не «курс» и не «чат для общения». Это рабочая система, где каждый участник получает:\\n\\n\\t•\\tдоступ к приватным связкам и воронкам,\\n\\n\\t•\\tготовые креативы и технические решения,\\n\\n\\t•\\tметодичку с сотнями практических примеров,\\n\\n\\t•\\tподдержку команды и личное наставничество,\\n\\n\\t•\\tвозможность выйти на прибыль уже в первый месяц.\\n\\n## Задачи и отчётность\\n\\n\\t•\\tВсе цели и дедлайны фиксируются в трекере или у тимлида.\\n\\n\\t•\\tМинимальные требования:\\n\\n\\t•\\tотчёт по выполненной работе,\\n\\n\\t•\\tскриншоты запусков,\\n\\n\\t•\\tкраткий разбор результатов,\\n\\n\\t•\\tесли нужна помощь — дай фактуру: что запускал, какие метрики, где упёрся.\\n\\n\\t•\\tФормат «ничего не работает» здесь не принимается.\\n\\n## Конфиденциальность и защита команды\\n\\n\\t•\\tВсё, что происходит в Umbra Team, остаётся внутри Umbra Team.\\n\\n\\t•\\tЛюбая утечка информации = немедленное удаление из команды, отзыв доступов и блокировка.\\n\\n> Ты вошёл в систему, где каждый элемент уже отлажен. Твоя задача — действовать по правилам, использовать всё, что даёт команда, и показывать результат.	\N	4e929b8b-912e-45f7-9af0-6a2d7070b875	2	t	\N	2025-08-30 12:46:17.867	2025-09-08 14:38:50.189
\.


--
-- TOC entry 3984 (class 0 OID 37729)
-- Dependencies: 213
-- Data for Name: documentation_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentation_sections (id, name, key, description, "order", "isVisible", "projectId", "createdAt", "updatedAt") FROM stdin;
4e929b8b-912e-45f7-9af0-6a2d7070b875	Umbra platform	section-1	Автоматически созданный раздел section1	0	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 08:26:35.322	2025-09-04 08:51:31.772
9a0bbfe8-bcb0-4999-8d64-714a735952d9	Частые вопросы	section-8	Автоматически созданный раздел section1	8	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-09-03 15:50:00.944	2025-09-04 08:51:31.772
7a6b5b69-0794-4245-b7ec-6ff263aa5989	Работа	section-6	Автоматически созданный раздел section1	1	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 11:56:36.515	2025-09-04 08:51:31.772
fbb49d88-165f-4bc9-812d-2ba63dca3ebc	Это база	section-9	Автоматически созданный раздел section1	2	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-09-04 08:50:31.34	2025-09-04 08:51:31.772
d3bdc450-4af7-4441-bfaa-268375b7ad60	YouTube Shorts	section-2	Автоматически созданный раздел section1	3	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 11:00:33.707	2025-09-04 08:51:31.773
9481fea5-3613-4df7-96d3-32490d1d4d78	УБТ Tik-Tok	section-3	Автоматически созданный раздел section1	4	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 11:00:46.235	2025-09-04 08:51:31.773
3e4a6abe-a8bb-4582-b763-b04aaaa731c7	УБТ Instagram	section-4	Автоматически созданный раздел section1	5	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 11:00:56.404	2025-09-04 08:51:31.773
40eb6d4d-0e6a-4460-a24b-6426acc9251e	Facebook Ads	section-5	Автоматически созданный раздел section1	6	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-08-30 11:01:11.6	2025-09-04 08:51:31.773
a1f920e4-7904-48a3-b8dc-fcc209d70249	Связки	section-7	Автоматически созданный раздел section1	7	t	e0c3c4d9-01fa-48b3-bc2f-f2046e64085e	2025-09-02 08:00:06.393	2025-09-04 08:51:31.774
\.


--
-- TOC entry 3986 (class 0 OID 37749)
-- Dependencies: 215
-- Data for Name: finance_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finance_accounts (id, name, type, currency, balance, commission, cryptocurrencies, "isArchived", "createdAt", "updatedAt") FROM stdin;
b8234dfd-fe25-4985-bf78-9a5b140d3364	Счет процессора Талгат	PROCESSOR	USD	-4.75	0	\N	f	2025-09-01 18:28:27.89	2025-09-01 18:28:27.898
78709f66-db74-4426-9af8-4464b34b0f4c	Trust Talgat	CRYPTO_WALLET	USD	0	2	["BTC","SOL","ETH","XRP","BNB"]	f	2025-09-02 13:21:21.569	2025-09-02 13:21:21.569
3bc95950-a90d-4ca0-a914-758cd4434344	Trust Talgat	BANK	USD	0	2	\N	f	2025-09-02 13:21:37.738	2025-09-02 13:21:37.738
\.


--
-- TOC entry 3988 (class 0 OID 37772)
-- Dependencies: 217
-- Data for Name: finance_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finance_categories (id, name, type, description, color, "isArchived", "createdAt", "updatedAt") FROM stdin;
2ce94042-cd93-4a78-9063-11c66e246a2b	Пополнение BroCard 	INCOME		#ef4444	f	2025-09-02 13:20:16.079	2025-09-02 13:20:16.079
0d590e6e-4bbe-4254-9914-33632479f7dc	Трафик	EXPENSE		#f97316	f	2025-09-02 13:20:30.091	2025-09-02 13:20:30.091
36642d8c-149c-486f-9f98-766399ab1aaa	Аккаунты	EXPENSE	Покупка аккаунтов	#ef4444	f	2025-09-03 14:26:33.9	2025-09-03 14:26:33.9
43faf3f4-c6c6-4bf4-b023-741d0bd0adb4	Домены	EXPENSE		#ef4444	f	2025-09-03 14:31:44.257	2025-09-03 14:31:44.257
c5c6e14c-430a-41d6-9ac9-88107e70a0d7	Хостинги	EXPENSE		#ef4444	f	2025-09-03 14:31:51.63	2025-09-03 14:31:51.63
1b98bff4-f9d2-45b3-a716-6fc91e638182	Креативы	EXPENSE		#ef4444	f	2025-09-03 14:32:21.174	2025-09-03 14:32:21.174
34c1cdb9-3713-4ffa-9f5f-47b447df702f	Канал TG	EXPENSE		#ef4444	f	2025-09-03 14:32:38.59	2025-09-03 14:32:38.59
f3a38b88-6046-4c5e-8b03-938b06cd499f	Боты	EXPENSE		#ef4444	f	2025-09-03 14:32:46.806	2025-09-03 14:32:46.806
2be10f9e-2de7-4148-bc9e-e0064c2dd3a9	накрутка подписчиков	EXPENSE		#ef4444	f	2025-09-03 14:32:56.773	2025-09-03 14:32:56.773
c0ce46c7-f754-45a9-bdaf-5234bd9beab1	Лендинг	EXPENSE		#ef4444	f	2025-09-03 14:33:13.224	2025-09-03 14:33:13.224
ef40fc40-0196-45ce-b71e-4d7666fa8e27	покупка канала	EXPENSE		#ef4444	f	2025-09-03 14:33:31.056	2025-09-03 14:33:31.056
a13c0258-c7ac-44ee-8caf-e2f6deaf62c0	реклама в пабликах	EXPENSE		#ef4444	f	2025-09-03 14:34:10.074	2025-09-03 14:34:10.074
12a42f2b-ea87-4636-94ff-2fc8e9cda67d	найм сотрудников	EXPENSE		#ef4444	f	2025-09-03 14:34:18.576	2025-09-03 14:34:18.576
8f928849-65ee-4d5c-88c5-141fb0628733	Выплаты учред	EXPENSE		#ef4444	f	2025-09-03 14:34:35.499	2025-09-03 14:34:35.499
4f0d02d1-d993-4dfa-b15b-fff352899323	возврат инвестиций	EXPENSE		#ef4444	f	2025-09-03 14:34:43.995	2025-09-03 14:34:43.995
06cfe200-c714-4561-bd7b-42e801eda9a7	tyver spy	EXPENSE		#ef4444	f	2025-09-03 14:35:17.391	2025-09-03 14:35:17.391
c4cb2796-68a8-4075-88d8-e96d58089f1c	Dolphin	EXPENSE		#ef4444	f	2025-09-03 14:35:27.945	2025-09-03 14:35:27.945
849993f4-7fa5-4b7c-8b67-7b451100efd1	Keitaro	EXPENSE		#ef4444	f	2025-09-03 14:35:34.435	2025-09-03 14:35:34.435
66fc753e-a8a7-499d-a7a3-8a391f647ec4	Серверы	EXPENSE		#ef4444	f	2025-09-03 14:35:43.891	2025-09-03 14:35:43.891
e9583c30-14a6-4b45-998f-85c4a658486e	Аванс	EXPENSE		#ef4444	f	2025-09-03 14:36:27.655	2025-09-03 14:36:27.655
283dd2b8-951e-4da9-bcf3-a85991934c56	Бонусы	EXPENSE		#ef4444	f	2025-09-03 14:36:33.406	2025-09-03 14:36:33.406
ec533ec5-ecf5-4e76-93ec-2ca2f67838d7	Зарплата (оклад)	EXPENSE		#ef4444	f	2025-09-03 14:36:48.533	2025-09-03 14:36:48.533
914080b2-fb25-4d9d-b679-832c352ff26a	Прокси	EXPENSE		#ef4444	f	2025-09-03 14:37:23.352	2025-09-03 14:37:23.352
ae57e812-b42f-444c-84d2-5b1a2b7232af	crm система	EXPENSE		#ef4444	f	2025-09-03 14:37:46.052	2025-09-03 14:37:46.052
0fcb035a-1935-471e-86dd-8f90627f0d1b	оплата AI	EXPENSE		#ef4444	f	2025-09-03 14:37:59.272	2025-09-03 14:37:59.272
a6276e12-746a-463d-b261-d20f673960f4	Выплаты Воркерам	EXPENSE		#ef4444	f	2025-09-03 14:38:31.874	2025-09-03 14:38:31.874
\.


--
-- TOC entry 3987 (class 0 OID 37762)
-- Dependencies: 216
-- Data for Name: finance_counterparties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finance_counterparties (id, name, type, email, phone, address, "taxNumber", "bankDetails", "isArchived", "createdAt", "updatedAt") FROM stdin;
cc0bfdf9-4717-4889-8512-d0da6901de1a	Талгат	EMPLOYEE	\N	\N	\N	\N	\N	f	2025-09-02 13:18:31.687	2025-09-02 13:18:31.687
f19dafe0-ffad-4e59-9eb8-a18f1b10f285	Магжан	CLIENT	\N	\N	\N	\N	\N	f	2025-09-02 13:18:37.13	2025-09-02 13:18:37.13
409d0b98-4e10-4f71-b128-7402a888fb24	Данил (Каролин)	CLIENT	\N	\N	\N	\N	\N	f	2025-09-03 14:16:17.164	2025-09-03 14:16:17.164
\.


--
-- TOC entry 3989 (class 0 OID 37783)
-- Dependencies: 218
-- Data for Name: finance_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finance_projects (id, name, description, status, "startDate", "endDate", budget, "isArchived", "createdAt", "updatedAt") FROM stdin;
cmezxtcrd0000mx2mgx6vsdk6	Магжан (Gambler HR)		ACTIVE	\N	\N	\N	f	2025-08-31 14:01:15.866	2025-09-03 14:17:21.98
cmezwf5p70000n62sxoixilt8	Талгат (Gambler HR)		ACTIVE	\N	\N	\N	f	2025-08-31 13:22:13.915	2025-09-03 14:17:27.931
cmf48p3gt0000n22mopwrho7c	Назар (Gambler HR)		ACTIVE	\N	\N	\N	f	2025-09-03 14:16:57.677	2025-09-03 14:17:48.812
\.


--
-- TOC entry 3990 (class 0 OID 37793)
-- Dependencies: 219
-- Data for Name: finance_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finance_transactions (id, "accountId", "counterpartyId", "categoryId", "projectId", "projectKey", type, amount, "commissionPercent", "commissionAmount", "netAmount", "originalAmount", description, date, "createdAt", "updatedAt") FROM stdin;
79008b7b-24bd-44d8-8f6f-1be8eb738951	b8234dfd-fe25-4985-bf78-9a5b140d3364	\N	\N	\N	\N	EXPENSE	4.75	0	0	4.75	4.75	Выплата зарплаты за период 2025-08-27 - 2025-09-01	2025-09-01 18:28:27.893	2025-09-01 18:28:27.894	2025-09-01 18:28:27.894
\.


--
-- TOC entry 3980 (class 0 OID 37687)
-- Dependencies: 209
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, name, password, telegram, role, status, "isBlocked", "createdAt", "updatedAt") FROM stdin;
cmf0yd2c40005nw2nv1m0hq5g	vasiapupkintop977@gmail.com	Роман	$2b$10$nsQ/OvnVFFk6g5SN3.MD3uIyfBxrnrdGQr445dBa7YZzQPpWxZkK6	@rdsrtv	PROCESSOR	APPROVED	f	2025-09-01 07:04:21.652	2025-09-07 18:19:37.864
cmey694vg0000i82fga7hji1h	admin@umbra-platform.dev	Administrator	$2b$12$w7YrpSGjLiUW5L3hMZwrtelLA7ivcE7hmvkCuOdWoqv7gUSTzKZ/C	@admin	ADMIN	APPROVED	f	2025-08-30 08:21:56.716	2025-08-30 08:21:56.716
cmeya1g4c0000jv2rdq0jt2u2	aa@tmteam.kz	aa aa	$2b$10$Vtokr3FGXw7EbPeIjihSqeANtD1Sy3eqiqjIp2yXrT3fYXAbtYsc.	@aaaaaaa	ADMIN	APPROVED	f	2025-08-30 10:07:56.508	2025-08-30 11:00:10.851
cmf2gxnux0008n42svwfkv75b	luxurykilldd@gmail.com	Эл	$2b$10$5sjIZ/jzlffos4ft6lvRW.QDBHyjyXEISAYBCAhu1iijnQxKtdgO6	@tg_piug	PROCESSOR	APPROVED	f	2025-09-02 08:32:01.929	2025-09-08 15:18:50.072
cmf25f3x10002n42sc4xr135d	kimxbeng@gmail.com	Lyuto	$2b$10$f3zO10pjmxyiil3kx8izDOGUYOAVSc9TJYGJq.1g1WeQwHO51IBXe	@lyuto2	PROCESSOR	APPROVED	f	2025-09-02 03:09:40.501	2025-09-08 15:51:46.74
cmf1m2x350002l22s8tja1in6	talgat.k-26@mail.ru	Talgat	$2b$10$gqDjTeioCjj/MjZQPJVP1evCZ0ic3f5aHKGvdHKwet4XcvvdlZ4IW	@talgat0100	USER	REJECTED	f	2025-09-01 18:08:19.073	2025-09-01 18:08:34.572
cmf1m2dvk0001l22sqgk6xlww	peekaboo1444@gmail.com	Талгат	$2b$10$uMWLblx3mLaX9S7B4lylv.9fcUQg2feBsfjb40PUOcrIbK5aih2m6	@talgat010	PROCESSOR	APPROVED	f	2025-09-01 18:07:54.177	2025-09-01 18:25:54.165
cmf2hp6g0000an42scgur7e0p	osnova950@gmail.com	Oznzo	$2b$10$kh4X50PmIA1zCpvzlJA6WOJ.fDlUe3.z0eiz2ikF627kaBcrpdWhS	@ozoxocc	USER	APPROVED	f	2025-09-02 08:53:25.728	2025-09-02 13:01:55.065
cmf2hg67z0009n42sa5yz2dgg	godddamn992@gmail.com	whotfareyou	$2b$10$Y8q98B4OZA9mkZwpSHvx0uIHSiGeZsKmpMSy9k/K3A59kfn03hzhi	@etna_vera_vela	USER	APPROVED	f	2025-09-02 08:46:25.535	2025-09-02 13:01:57.246
cmf2ggvow0007n42sigmmr6tj	boomius67@gmail.com	Даниил	$2b$10$31pwkZbfG3q4GG.zUrsVn.qRPSc6/cHKZKrCFrf0zGel5sA0CsSpm	@chaoztg	USER	APPROVED	f	2025-09-02 08:18:58.929	2025-09-02 13:02:01.493
cmf2frzlu0006n42s1nuklj9r	rostirollasalik@gmail.com	green edge	$2b$10$bFSS1mqB2B8M6TQq1SWxM.mlY8Eox0M6IuYx0q.FbiIUE.dec8oCq	@mychemplon	USER	APPROVED	f	2025-09-02 07:59:37.603	2025-09-02 13:02:03.739
cmf2abg8f0005n42s2ajgu1x5	elpatcha66@gmail.com	Hephap	$2b$10$s8aLRLFwLiugI7/NVWK8wunyHjl/Db4tzpyr9cKBArl39LwkXDCta	@romashkalolol	USER	APPROVED	f	2025-09-02 05:26:47.92	2025-09-02 13:02:05.97
cmf29ders0004n42sfdd5k15p	sskweezy@proton.me	Леша Свитолин	$2b$10$mZnnoXSoNxRzD6cX6aLhw./4W53G2z4Sbn9XsMPeHcGiHcQ4pw/Fu	@ffrmqr	USER	APPROVED	f	2025-09-02 05:00:19.72	2025-09-02 13:02:08.008
cmf1q4r3w0001n42s72rnf0ak	xmr1488@gmail.com	Oleksandr	$2b$10$/Y0NUMqSqJck0YkdppDkxeMZLtG87omjjvlpwLcVRKbtG216eYB3m	@imposya88	USER	APPROVED	f	2025-09-01 20:01:43.1	2025-09-02 13:02:12.345
cmf1on3xi0000n42sn3v7i2ik	zelenvol15@gmail.com	cima	$2b$10$40d8lpIfzyLU3sDFB.rhdOlhqkemhVRQn0xv5QU0XKxkJQEpq7aWi	@cimexs	USER	APPROVED	f	2025-09-01 19:20:00.295	2025-09-02 13:02:14.204
cmf1nx4k90000os2uo291sxje	zhanbota.education@gmail.com	Lyapotaaaa	$2b$10$dY3yoTKMNgm2opxS335kuOx/t0zuPKQp8CrLrX49lQDQw7UL9z3F.	@lyapotaaaaa	USER	APPROVED	f	2025-09-01 18:59:48.057	2025-09-02 13:02:16.309
cmf1mxf5n0000i52mdac5ncu4	almaz.0431@gmail.com	Almaz	$2b$10$SqNwsPBJIuMlUJiWEEKZRuAw3ANHTHOMrhseHUQoc8VIyEVM799iO	@traff_killer	USER	APPROVED	f	2025-09-01 18:32:02.171	2025-09-02 13:02:18.671
cmezz8dd00003mx2mo0t2d6la	mailforavttttr@gmail.com	Kastl Kastl	$2b$10$abqTinXSM57v6pDPS9oX8uPHFRkksRIqOgkHn9vtFfFCPLtcCrRqK	@glory13376	USER	APPROVED	f	2025-08-31 14:40:56.101	2025-09-02 13:02:22.694
cmf04stb80000l22mtbo7shmv	klakan@proton.me	Cesar	$2b$10$mA/hk9pMe5OM6T/dhNvbJOpzcVtwUGLbbCaahu872E3ws9sUQWd0i	@memento_mori_148	USER	APPROVED	f	2025-08-31 17:16:47.973	2025-09-02 13:02:25.234
cmf0t4v9d0002nw2nm05lofbi	jeriver941@noidem.com	kyc	$2b$10$NPzKM6dDjUR1ziljZpnSoeDmorwGqUex/gCJYQGuy1tZBv8PsrEx6	@ddw25043	USER	APPROVED	f	2025-09-01 04:38:01.153	2025-09-02 13:02:27.368
cmf0p3t0u0001nw2n60q1w6jt	yelisey123123123@gmail.com	obigizeee	$2b$10$gaz.VXrcAVuueQwidXnvse2.cXzm2f4xil/RzhfccwOmN74qQFrgK	@joohjijamammoto	USER	APPROVED	f	2025-09-01 02:45:13.135	2025-09-02 13:02:29.916
cmf0ou26b0000nw2n9lf6anut	ananas.bebra@mail.ru	Василий Курашов	$2b$10$Wiow.f5O3gpZKtmCY2IVj.6PqtcV7IOHTHG3hnMzgH/pmcwcgS.22	@mazzdasor	USER	APPROVED	f	2025-09-01 02:37:38.435	2025-09-02 13:02:32.589
cmf01hv910000lo2lc9mwt633	azuzekmr@pm.me	Privet	$2b$10$rpIiWkVQdsx7ECBqGYC41.9lJU4RAeZQrLvgemu6OUpKeb6u9.IUW	@privetppoka	USER	APPROVED	f	2025-08-31 15:44:18.421	2025-09-02 13:02:36.287
cmf00z0gg0000l82tk8wxp0zt	brownvalentine997@gmail.com	Povlovich	$2b$10$.SKbdAxboHIpjzxLXhFJTuEu1GEZAvL8oejWQeiLDeA1NmDN/hFzO	@povlovich	USER	APPROVED	f	2025-08-31 15:29:38.704	2025-09-02 13:02:39.769
cmf005ilm0004q12lt3ntozyg	astrelias2003@gmail.com	Elijah Str	$2b$10$fCJ3cbn0zvk5DLPcubzyn.XOJwCoUtGIA3uGXBFMFP4ZryhQ43Kae	@elghmwacc	USER	APPROVED	f	2025-08-31 15:06:42.538	2025-09-02 13:02:42.132
cmf003et00003q12l2qc1n55e	vityna@gmail.com	Витюня	$2b$10$6rKa.C0EMsbeB5veuAPdsu.2vJOpjSA7gLwpYPYdviM0Qj2qfzb9a	@viktor	USER	APPROVED	f	2025-08-31 15:05:04.309	2025-09-02 13:02:44.364
cmezzzn9g0001q12lulvmc1gk	pasha.seli@yandex.ru	All Cash	$2b$10$xWyPlwVGufQpmwZPrhaew.ol8ur8Kmd3DKlQRGOerjo/i4hUSe2nu	@allcasheu	USER	APPROVED	f	2025-08-31 15:02:08.645	2025-09-02 13:02:46.685
cmezzzuk40002q12l5sp0dwsb	dfsdf@gmail.com	ываывавы	$2b$10$SXUKXClEnzqtXjiLVmF12efpqVoog1kQnrUQ0yFVXgOyBB11gm952	@qweqwe	USER	APPROVED	f	2025-08-31 15:02:18.1	2025-09-02 13:02:49.478
cmf00bvlu0005q12ljfcfvnpf	katalan.@gmail.com	Parabellum	$2b$10$wvgCrndX3wkktrAU2xn38OTbR1zOmHyxzh9ThVUo.YVQ3IxMwF/5i	@iopwork	USER	APPROVED	f	2025-08-31 15:11:39.33	2025-09-02 13:02:51.739
cmezztv7t0008mx2mwlj3do07	gagahahha@yandex.ru	джон сина	$2b$10$GwIoPAdvCOltUrI7s5refuccrD6a5b8Et2KQ1sODNtPl/BDePuv6y	@vortinkof	USER	APPROVED	f	2025-08-31 14:57:39.017	2025-09-02 13:02:56.266
cmezzcich0005mx2mzspwhtmj	dghol1998@gmail.com	Давид	$2b$10$FDzHHGIYsjXhizeslFEb9eoOJhwZY/G10FhvmdYyDkmvvcsRHUOoS	@c6hog	USER	APPROVED	f	2025-08-31 14:44:09.186	2025-09-02 13:02:59.84
cmf1ju51n0000l22sehhffmk5	wildboarsgeorgy@gmail.com	похотливый мс	$2b$10$dHX.sLYqqQIgdze/L2pGg.YkjN6alahw62WlZ6eXG/lBMHMbsBf4K	@samesigned	USER	APPROVED	f	2025-09-01 17:05:30.252	2025-09-02 13:03:02.354
cmf0ybfww0004nw2nnayxhcvo	gaztutu@gmail.com	Ben	$2b$10$h7MvPlBWMWhMibItWtvwXeUEGakz2j69vHUDoOiA6OcdetK0rGyo6	@user53411	USER	APPROVED	f	2025-09-01 07:03:05.936	2025-09-02 13:03:08.149
cmf0y9bai0003nw2nib5sid2g	sondracurry1@gmail.com	Mercury	$2b$10$DvjmmFiV1FkwHI0qyZDKVOll9HMEflLJMYgWIfT8lC.AnldJgTXVG	@mercury_link	USER	APPROVED	f	2025-09-01 07:01:26.634	2025-09-02 13:03:11.184
cmezzt0tj0007mx2m1obqol7k	looovvveeemeee208@gmail.com	Олег Лабанов	$2b$10$YVU/N8KXKOLfiMvUiXA00.FeDOqR4UFtaO5rXp2zPHUsWcIEbLMtG	@iloveth1slife	USER	APPROVED	f	2025-08-31 14:56:59.623	2025-09-02 13:03:13.288
cmezzi1ia0006mx2m8w1o7n4s	cqustgame@gmail.com	Давид	$2b$10$4/e3HT/GQ52PJ84cok8Tw.dXwA34NGp4/JBnYOn9RiI15MnpaOgFa	@shtenze	USER	APPROVED	f	2025-08-31 14:48:27.298	2025-09-02 13:03:15.381
cmezz8x1u0004mx2mp3d8l3qx	kondensinsert@gmail.com	kondensator	$2b$10$ZybMC6fG0TVFbgdZP2xKcuEkHJ2POWOKDTQtLm3RLve2PgIBe/aIq	@kodertg	USER	APPROVED	f	2025-08-31 14:41:21.619	2025-09-02 13:03:18.272
cmf264jlm0003n42syhgyid44	lannt050@gmail.com	lannt	$2b$10$j/DUv.NiRbfo1dH3nknxue/Us9jYg4dsXVKvoRv8AXR3jT0Iugpnq	@lannt12	ADMIN	APPROVED	f	2025-09-02 03:29:27.226	2025-09-03 13:47:28.937
cmf2k9lg7000bn42sy64uwgp4	rtty9718@gmail.com	Ivan Ivanov	$2b$10$vPyIJr/wP06dNviHXshHJezimdcRWDcCeOhPlkzpZ6oI8bYqpVq5K	@bl444ck	USER	APPROVED	f	2025-09-02 10:05:17.528	2025-09-02 13:01:52.161
cmf5ss6xd0008l42mx1vufuon	no@gmail.com	________________________	$2b$10$dGzKriR6.8YcKLRrpmhsQ.pMjyQgXaC6aBkPzFm24MxSmcflCfcde	@whoareeee	USER	APPROVED	f	2025-09-04 16:27:00.625	2025-09-04 16:50:52.006
cmf30oj7o000dn42sq1xmlp2l	tataracom8@gmail.com	Олег Мальков	$2b$10$Db12qmOiXFGCjwldqninuezDrGQ20260J5r5CoDjHhlvQJvy6T0vO	@maf1c	USER	APPROVED	f	2025-09-02 17:44:48.324	2025-09-03 03:41:30.232
cmf5sqj240007l42m2790tpdy	asdw20011@gmail.com	Danil	$2b$10$UTnYS5zEZGgn6jC9KOMjteCm67s7YK9fHQw7p9HjiELeiJQY9SGl.	@asdw20011	USER	APPROVED	f	2025-09-04 16:25:43.037	2025-09-04 16:50:55.143
cmf3pk7ia000gn42s05usq1sf	v00693249@gmail.com	Сергей	$2b$10$kvY6LBlNJFK7TiBTgigu.OEvNRm72LnYmFHW3fBkA4xfTb9PHVhha	@sergeuuio	USER	APPROVED	f	2025-09-03 05:21:16.931	2025-09-03 06:54:27.503
cmf3nmscx000fn42sqxfoektr	gaoyong0915@gmail.com	gaoyong	$2b$10$6Nup4oWsdQPz.zeKA8HxPu2JiB2SDgS1pF.gbGV60wa9OYbviqsOC	@black_shackle	USER	APPROVED	f	2025-09-03 04:27:18.033	2025-09-03 06:54:30.392
cmf5tob3j0009l42m20k9hqym	xuyxuy836@gmail.com	Gena	$2b$10$OsqOW8syEg4RUCTmpDMNlOgiyLLy8vVMX2Fc0os65doV/nnTGcn3G	@gena_159	USER	APPROVED	f	2025-09-04 16:51:59.023	2025-09-04 16:54:46.708
cmf3sw63o000hn42s5znwsda6	lackysbrunosamp@gmail.com	Иван Иванаов	$2b$10$DqCYrgT9c8sfZ4CAxQml9ewz22Dq7fVX5XA1O5I2BxsCeKbibGr1u	@skermam	USER	APPROVED	f	2025-09-03 06:54:33.828	2025-09-03 07:02:15.818
cmf44ske6000jn42so0245o3f	un1onfnn@gmail.com	alex union	$2b$10$KZYIUbnX5xDorLyKKf4BfuF3wRFFKnUEcX8S9Aqcg097bIIsavg4i	@un1onn	USER	APPROVED	f	2025-09-03 12:27:41.118	2025-09-03 13:47:09.019
cmf445yz5000in42s3odrc5un	licijomyjored@gmail.com	4realz	$2b$10$ya5cImtvRSYeKnaXLM4j9u5Wxf/E62aSS/v1zVwUKDj6rENkzdF7u	@for_realz	USER	APPROVED	f	2025-09-03 12:10:06.93	2025-09-03 13:47:11.873
cmf5v0wbt0001mf2l9fy55234	generosodidenaro@outlook.com	Giorgio Armani	$2b$10$WOXwqeqyAg3xe9u10.WxuukDDEhICFm725Mo/jzX.uDIMNixVSneK	@giorgiowork	USER	APPROVED	f	2025-09-04 17:29:46.025	2025-09-04 17:53:02.655
cmf49x6p70001n22mvbi5zav5	wihatof806@lanipe.com	noname228	$2b$10$hujYQpF0Jjg40juCgw/9Reh7OQVGRauGlzWR51Bj5WBm4/jjSXpbu	@https://t.me/moralisty	USER	APPROVED	f	2025-09-03 14:51:14.731	2025-09-03 15:21:30.905
cmf5uj8tg0000mf2lg91chv3s	randomemail@gmx.de	Геннадий Вячеславкин	$2b$10$wuIv2qhgtUYE/274xmjLA.XbryDGZko/zIlwBwDIH3Eu8TGV9Ozve	@lvlrockstar49	USER	APPROVED	f	2025-09-04 17:16:02.405	2025-09-04 17:53:06.877
cmf5iko7q0003l42mnu0s4tv6	filatov-54cvl@rambler.ru	1 12	$2b$10$evy6jKMSD4ZS2EvwtBBeo.ynVzvF9umD0nrL6bgLklLg0JISqU7Fa	@https://t.me/wgorrrr	USER	APPROVED	f	2025-09-04 11:41:13.622	2025-09-04 12:59:20.42
cmf59p3tg0002l42m7lqnsccd	ofmanagerchatsss@gmail.com	Gnom	$2b$10$i.p7e6TcLjaXE4OIqvRnuO7nm4szzbW9kheAiUqr0Cb6RyKnSUbj2	@https://t.me/gnomiktt	USER	APPROVED	f	2025-09-04 07:32:43.924	2025-09-04 12:59:22.975
cmf59o5860001l42m9md0etyw	micalo2734@lanipe.com	Gendaii Voronov	$2b$10$0AZ/hwftb8Fhgr0z.NbIAOECMmrZi4ucniEvXJE0RAu.OnOPag8Du	@bembem14m	USER	APPROVED	f	2025-09-04 07:31:59.095	2025-09-04 12:59:25.463
cmf55qcmp0000l42mqmd0xr8e	funandrun45@gmail.com	Андрей	$2b$10$MYv4AlW1e11QJn.xenYui.ByRvRqR3K.DideghaQbOVLFlg1XtkU.	@zahlebish	USER	APPROVED	f	2025-09-04 05:41:43.537	2025-09-04 12:59:27.771
cmf5s0m3r0006l42m58te4p42	tsoul410@gmail.com	Кандратьев	$2b$10$b1C8pxxS2YZc3.xoTKvZCuJG7NX5mYz97Z.d96DQ8mkmraqwx32iS	@wia453	USER	APPROVED	f	2025-09-04 16:05:33.927	2025-09-04 16:05:49.032
cmf5rgjbj0005l42mnpkv45cl	antonshkagusev8888@gmail.com	Попа	$2b$10$m.TofS5JfM5WgM5VTRIp8ewGguPi/Vrh2TUhDTHbcSCkFFEN6zXPm	@antonshter	USER	APPROVED	f	2025-09-04 15:49:57.199	2025-09-04 16:05:51.515
cmf5rgds40004l42mhloybxtp	yakrutoi2209@gmail.com	Андрей Андреевич Фурман	$2b$10$hBhVTqCU5IpoL4vPptg52eLB8BadVSndU/LFKIHIUC0Iy6eON3czm	@nedovolen8	USER	APPROVED	f	2025-09-04 15:49:50.02	2025-09-04 16:05:53.627
cmf6yn2fs000cmf2letffu55t	deekeypipipu@gmail.com	Виктор Сигма	$2b$10$5iROArYKpmUiX3eN0bE7KOnBuHsnW.CzPd.pLjlCGS.mAmRPYXPz2	@ghiiiillppp	USER	APPROVED	f	2025-09-05 11:58:45.4	2025-09-05 14:14:59.388
cmf6xv2id000bmf2lb6nvc3n1	zoeroll524@gmail.com	Artem Artemov	$2b$10$5uxmWZZ/AXzdH79.LP3tSOSlAOjUKQj0unic0/RUqrYfgV2awLl.K	@dxqxsx	USER	APPROVED	f	2025-09-05 11:36:59.125	2025-09-05 14:15:02.798
cmf6w8wcq000amf2l5eakgdke	h0hoojkmwl9b@taoxuent.com	pencil pencil	$2b$10$zRJLib3tomCchJfL14B2JOvewteF3RdUtiSAmKhREu.PfrGpJtwdu	@moneyhodf	USER	APPROVED	f	2025-09-05 10:51:45.098	2025-09-05 14:15:05.929
cmf6s6pdr0009mf2l3270et5o	rloyl@vk.com	Rufat Sadr	$2b$10$jPzUBiKiO31AcZlAE8Pmje1vski7XBdvqxqPyIqx.VOXozPsUl5jO	@rufatus	USER	APPROVED	f	2025-09-05 08:58:04.288	2025-09-05 14:15:08.394
cmf6nyyfn0008mf2lf5xebope	maksimhov@gmail.com	Максипм	$2b$10$.lm79EAwE6gFtlvvINSBl.IMUqIO/MIvsJHYn6Z90NhPEjrTSzYpG	@willerggs	USER	APPROVED	f	2025-09-05 07:00:04.307	2025-09-05 14:15:10.825
cmf6im55z0007mf2ltnnv1uor	youwantmyface1@gmail.com	Хунсос	$2b$10$jnTVh2wHbBV4IXepcJ0ei.9HoMz8WB/NVpcUKYeHRJ15n6B.7S0wi	@esface	USER	APPROVED	f	2025-09-05 04:30:08.423	2025-09-05 14:15:13.243
cmf6ey1zl0006mf2lq5aaoo8t	7cmgm@powerscrews.com	Петр Топлес	$2b$10$Afe56RkLT.WKxQKno6CgYujjvr.WExwBLU/HvtnXW4Hs/EXn.6Lri	@cardinalgr	USER	APPROVED	f	2025-09-05 02:47:25.713	2025-09-05 14:15:16.076
cmf6a7opq0005mf2l4u9miyf1	mongouser@outlook.com	zachem fio	$2b$10$svIgG1vAEWRy6eExQGY91OpnVdRBk5eakrmWRcSI9Ei9iTkwUPWZO	@krkn_dose	USER	APPROVED	f	2025-09-05 00:34:56.99	2025-09-05 14:15:18.449
cmf65eyah0004mf2lrrezq55i	cloudfame1337@gmail.com	Иван Ебланов	$2b$10$bvYAAqtwnWix5C/WhgA/QuePAKB/dUj9RcKs0FGDtRYVO3M0nLDRS	@cloudfame1337	USER	APPROVED	f	2025-09-04 22:20:37.914	2025-09-05 14:15:21.739
cmf60tdna0003mf2l58a8jmpc	dark@us.fn	Gamer	$2b$10$BUar7ESYNsmHGrl/kh4HQOl8JCBVL/8sjoEYSdApiyHrUxKLE.e5m	@greyxsup	USER	APPROVED	f	2025-09-04 20:11:52.919	2025-09-05 14:15:23.933
cmf60ifnj0002mf2lbw8pabod	zorr7692@gmail.com	Дима	$2b$10$Z1oa7eiH.h5FnMuzJKo5RewSSyhnjNEfP/3pvkoO25e9jDbfqM.Pq	@zorra03	USER	APPROVED	f	2025-09-04 20:03:22.303	2025-09-05 14:15:26.428
cmf84ufam000imf2lf97kz9vx	363aquamarine@powerscrews.com	erano	$2b$10$NxHxM42Jg1YPYfzYhq.Sau/htrKaMVW.fTkbUlbnxXrfJKX9JNBmu	@skilzzz	USER	APPROVED	f	2025-09-06 07:40:12.527	2025-09-06 13:40:34.905
cmf7g8vt9000gmf2l0930n1di	therifachannel@gmail.com	Emil	$2b$10$GeBKW8JGCskDYs2EdCDH7OqDFoUYHAmp4idJmN5kJiEEE5JuPrZs2	@xkhatai	USER	APPROVED	f	2025-09-05 20:11:36.718	2025-09-06 13:40:39.787
cmf7ecwlk000fmf2lrn67izkd	sven98mannikor@proton.me	Yes Choppski	$2b$10$IlU.7ojJeF4Itrk50jZMUOHr8Kxgw9JdrYeOR2VnxZxbTysPhwMki	@https://t.me/yeschoppskiii	USER	APPROVED	f	2025-09-05 19:18:45.129	2025-09-06 13:40:41.82
cmf7dnjww000emf2ltz8mztih	dienamars@gmail.com	Андрей Шамов	$2b$10$CIO5CQZeu3guRNDqDQBRWeYvd0vYFl9gSPCgHVzvXSmIKLZQt6emi	@dienamars	USER	APPROVED	f	2025-09-05 18:59:02.289	2025-09-06 13:40:44.189
cmf76nexa000dmf2lavm6g655	upopopo829@gmail.com	b b	$2b$10$iGQeglhojuo4GMAT932fCujzQP.YBuK/9a6RHnHP5auE3DhrfjenO	@gogo123asd	USER	APPROVED	f	2025-09-05 15:42:58.511	2025-09-06 13:40:47.896
cmf2kr963000cn42s35bia693	ccc@xyu.kz	Caroline	$2b$10$x/q0dqBcKwb3bBB2vgrhY.5Fn222yuZtgVXA1EYPkadksYHfezP3q	@hennessyo	ADMIN	APPROVED	f	2025-09-02 10:19:01.42	2025-09-12 16:07:37.546
cmf8ccb99000lmf2lgqy9den7	richardsswen@hotmail.com	Kirill K	$2b$10$tATfCrdIeI.xIMEs424xde0ILXDM0hepmV3Y64KmWW/XEKsAy7BZq	@swaggerr272	USER	APPROVED	f	2025-09-06 11:10:04.413	2025-09-06 13:40:28.012
cmf8fjqkc000omf2ls5iehwd8	ggferretggg@gmail.com	Никита Хорьков	$2b$10$M.m2aDtJNrnTmBX95d.pOOs66nVhRLD8Kbzp93kEWPWnwY1ZgM8iK	@ggggferret	USER	APPROVED	f	2025-09-06 12:39:49.692	2025-09-06 13:40:20.006
cmf8fepsq000nmf2lsjyg8m04	nojaf98867@mirarmax.com	Арсен Маркарян	$2b$10$UFv5SReHSLCo0XMoFEki..0yQevS7dGhSa7CHc6kX6G3K8OSL6wYq	@razinnf	USER	APPROVED	f	2025-09-06 12:35:55.418	2025-09-06 13:40:23.274
cmf8f52sv000mmf2laweuiucr	pfijsdipf@gmail.com	fsdfsdf	$2b$10$/JiIeaSml1M3z0KoB7FV6eOOBQXYuRXsxEmWf9/8tR8SwZQSZ8ntm	@usnrasjtg227	USER	APPROVED	f	2025-09-06 12:28:25.712	2025-09-06 13:40:25.697
cmezzx8480000q12l7qcwe0sc	maximumpayne333@gmail.com	Джек Трисмегист	$2b$10$MF4QwQANsC8kg/kh8LTyBuPN.bqeKjfjyyc1qM8lRd6kndZtZ6toK	@youung_thhoompson	USER	APPROVED	f	2025-08-31 15:00:15.704	2025-09-02 13:02:53.787
cmf3425dd000en42swr93axgn	sgshdvdhh@gmail.com	Alex	$2b$10$884IciX9rN1CWd3SWxGIPeu/s5MhcFb.wYvN9g5xx4BfMtwdULua6	@bdbdhhd	USER	APPROVED	f	2025-09-02 19:19:22.417	2025-09-03 03:41:27.53
cmf861kcm000jmf2l82m137xr	iaia233@mail.ru	Максим Князев	$2b$10$DVOWn5lez7euPB/7KxIuP.Bp4NRkF1EyVJloe233hH4WjVdpQPgb2	@prrezalito	USER	APPROVED	f	2025-09-06 08:13:45.286	2025-09-06 13:40:32.397
cmf88hwog000kmf2lddx40j0x	ethan.bronkss@gmail.com	Ethan	$2b$10$oBcxVw2uOcqj8eyHGFEGyuElsmUEoxG9ciafgNoE4mdGhBa3FR4MC	@bitmarw	USER	APPROVED	f	2025-09-06 09:22:26.992	2025-09-06 13:40:30.159
cmf7kan18000hmf2liq2fizz6	blazerussialow@gmail.com	Андрей	$2b$10$i63uCn28TzgtOZ8TXkUdqORRR6qidXglxiSgpp5wUJCbEH5XU2u8e	@blazerussialow@gmail.com	USER	APPROVED	f	2025-09-05 22:04:57.116	2025-09-06 13:40:37.595
cmf8hvmxi000pmf2l9oxh1m6g	danagorod04@gmail.com	Абат Бекбусинов	$2b$10$qna8ou.SSrmdsTUuCEC/r.HNnTNPoAi7sqtmOAae4YcQXkgl7RjyK	@lolerbousint	USER	APPROVED	f	2025-09-06 13:45:04.086	2025-09-06 13:47:48.39
cmf8imknr000qmf2lggtjfnrm	karensumter1972@sublimifmail.com	asd	$2b$10$X4yJzNEaIlUDmRVsreSIyu3JIjNGFqAtf5SXikyUkhyA7sNAnmVcu	@korobok_govna	USER	APPROVED	f	2025-09-06 14:06:00.855	2025-09-06 19:22:18.743
cmf9izdbw0001j72lgoc7vfgo	ggreencatt@gmail.com	Артур Переведенцев	$2b$10$vYutVAaTHfrDEjTpyISpO.3Y4CDy.4DG8J2w38qF36l08vaql5wXy	@stxs_ss	USER	APPROVED	f	2025-09-07 07:03:44.061	2025-09-07 09:13:29.777
cmf9lgom40002j72l308kh616	iraidaezubsh@inbox.ru	Adlaros	$2b$10$r1UYwEfqaR.hnVKo09pxoOJoHIv2YuJJjlDyjcLGiZFxLW7oXy3gC	@hesoyam_traff	USER	APPROVED	f	2025-09-07 08:13:11.068	2025-09-07 09:13:29.777
cmf9n2qd00003j72ll9l5hgom	tigoji8936@dpwev.com	Андре Траффик	$2b$10$7m8SFwkWhqiFh/73P6WgwuFcEfLPUgf0TvP9CV.R2ZdUE3WfSxzdO	@gargantia_end	USER	APPROVED	f	2025-09-07 08:58:19.38	2025-09-07 09:13:29.777
cmf9nczti0004j72l3tv4iif4	jaron.hipolito@freedrops.org	full name	$2b$10$68axjwVo/j5IEE5xpDQHuOSMgbKK.vz16PxvuzxZpUnHziB4hGKy2	@web3wom	USER	APPROVED	f	2025-09-07 09:06:18.198	2025-09-07 09:13:29.777
cmf9tb87w0005j72lq68ew13z	killianjones902103@gmail.com	Mada Baner	$2b$10$JT00Cad2OGaYNFSvTDgYk.c72S03IgAEoXw6X7u/jJkbMm2hac3IK	@madabanner	USER	APPROVED	f	2025-09-07 11:52:53.468	2025-09-07 12:55:34.903
cmfa2eg8q0006j72lmzpn59rg	tikofi8436@mirarmax.com	sdgsdfg	$2b$10$mESScEOUIUkZowgr4j4fVujJ1lbvM1u4FrK6wdikDFRsg3rS./mAK	@sedgsdg	USER	APPROVED	f	2025-09-07 16:07:20.378	2025-09-07 17:15:16.262
cmfa6oj510007j72lavyad223	k31mi.on3@gmail.com	Рори	$2b$10$VoOGT9jqSifuLeGSeiyMie42T5IGKFxx1zxBBjPJ814FSGWRBU352	@roryfvckyouboring	PROCESSOR	APPROVED	f	2025-09-07 18:07:09.158	2025-09-07 18:18:40.315
cmfa786eg0008j72lu3i3e5n8	biznesmennn000@gmail.com	Иван Иванов	$2b$10$2.wgcc1xQtFzk6MmK5tyx.yrOKikR0EYHn9tq9iEwG3FWyFR9UFuy	@timson6	PROCESSOR	APPROVED	f	2025-09-07 18:22:25.768	2025-09-07 18:24:12.445
cmfa7aybz0009j72ltmxigmbx	maks.kaaaaas.111@mail.ru	arizona	$2b$10$DcaBBuJIS9aT8yMFspZiv.yfkCHkf1DX2ppG8xlKWi8mBqbriDlfK	@blesskzz	PROCESSOR	APPROVED	f	2025-09-07 18:24:35.28	2025-09-07 18:25:44.863
cmfb63hsc000dj72lel2eu7jl	yungriger@gmail.com	FDSTD	$2b$10$rhUhZXJGOw3rVDTrHiMFK.jGV4vN3Ugm0zN5QX5JWQGP7.BpxK8YS	@fuuuust	USER	APPROVED	f	2025-09-08 10:38:33.804	2025-09-08 11:25:38.125
cmfavbmhq000cj72l62feb55w	misha.zloy1@mail.ru	Смирнов Михаил	$2b$10$58/tL3mdFSVZbwFMJ20RvexU6EBSm7xS8mwhPx//7/lTVFPAgBjOe	@vor_vorishka	USER	APPROVED	f	2025-09-08 05:36:57.374	2025-09-08 11:25:41.206
cmfarigml000bj72luptwtf04	rkgod@bk.ru	Андрей трафф	$2b$10$yt1fEc.WJn0wJm0Ot/3mfuVvxq2ME9F3gcBuVcJQnLtXxgwJl6vIG	@suprerior_tour	USER	APPROVED	f	2025-09-08 03:50:17.901	2025-09-08 11:25:43.596
cmfa7qys7000aj72lp9pc245y	xapomxapom0@gmail.com	Питер Паркер	$2b$10$lKzijSDghLjavBOU.yX/pObj2X.Qw7hfp5FJW5FM/56X3EanaIBsG	@ciel64	PROCESSOR	APPROVED	f	2025-09-07 18:37:02.36	2025-09-08 14:05:27.827
cmfckyllo0004pz2lj6eutxpj	w0139338@gmail.com	Архип Шульженко	$2b$10$qlNG4x0qZ.XJcKmcIuJJYO49fMtvhPsGw6ZC2wwanEc31ftatd1oW	@mentalitiesmyblood	USER	APPROVED	f	2025-09-09 10:22:25.884	2025-09-09 14:12:02.527
cmfche35t0003pz2ly8xriyo4	viv675277@gmail.com	Torch	$2b$10$4jqn3WvpBjemEadw28hpoej5UOb0a3sZBwbhE8Dd5vIHXWXJW.icS	@furabetona	USER	APPROVED	f	2025-09-09 08:42:30.017	2025-09-09 14:12:05.467
cmfcf9prn0002pz2lmqw2ik0k	panav19134@inupup.com	Gena	$2b$10$JcuNmKPUQXHOSM7ZWyy5ZeY97ijcRP9.7ohpVLOomwNdiTcyXoHTy	@gena	USER	APPROVED	f	2025-09-09 07:43:06.803	2025-09-09 14:12:07.977
cmfcc1c4e0001pz2ld3h5japk	meadows05207@undimail.com	Кирилл Кирилл	$2b$10$YsMcNbRTUwRFDw1leM4/1.OGwvWpHyyjmU5toSZ2l.7uxZJQZsvIK	@itisnotnormal	USER	APPROVED	f	2025-09-09 06:12:37.022	2025-09-09 14:12:10.097
cmfc7onl20000pz2ltqaow866	darkpako@tutamail.com	Dark Pako	$2b$10$efQwcGYDWeRK4TH0KhdcwuerV/4zeKy1bnQcXVsfq2QwWq1Py4bkK	@star1k_7	USER	APPROVED	f	2025-09-09 04:10:46.887	2025-09-09 14:12:12.005
cmfcuto6z0005pz2l5fj0v5jf	rewerter404@gmail.com	Stimer	$2b$10$IveutNuerxWnDdXhTyLHMubLpkrBScOl9E5IUsIT/Y6JAKdk65Or.	@hisokir2	USER	APPROVED	f	2025-09-09 14:58:32.124	2025-09-09 17:17:14.563
cmfdjduqr0008pz2lc8w4zdx5	xiha711@gmail.com	Freddie Simmons	$2b$10$IzfOYnTgTljaI8av91ldRO0qmHVPl0fTPcZ6OGTBwYonk5dBKSE.K	@xiha711@gmail.com	USER	APPROVED	f	2025-09-10 02:26:04.516	2025-09-10 06:33:41.52
cmfd72ziu0007pz2l36elxdki	olga.panfiloova@gmail.com	Sinrise	$2b$10$FbSvzabDBJzKxIYyPjWL7.a/RodBGpPBi5iqdX92C8Enx0ecelZO.	@sunrise3	USER	APPROVED	f	2025-09-09 20:41:42.103	2025-09-10 06:33:44.262
cmfd52j4d0006pz2llrdz33d9	kjsfng@mechanicspedia.com	Semen Zdanovich	$2b$10$NHltIa1djFA9oVTOqLKyvuCk8dxTv/GXd6gYG.l0J4/Jh6TrXQ/hq	@https://t.me/irudi666i	USER	APPROVED	f	2025-09-09 19:45:21.613	2025-09-10 06:33:48.4
cmfeg26k6000bpz2ludcv4qw9	wblack.heisenberg@gmail.com	Максим	$2b$10$ctTQwja1QjfN/ZwA3Z.8Y.qe5n40dEeimyLhqwELoCK4nSU/1rOgm	@youngtreeze	USER	APPROVED	f	2025-09-10 17:40:47.286	2025-09-11 10:24:11.759
cmfefwky6000apz2lrkf63qgq	viksvdju@vargosmail.com	rexs	$2b$10$HW1VPyrrvFxeXNk5w3bLWOvXCnIj56KZbKVwX/HMAz.HHdURnoSnq	@rexs38	USER	APPROVED	f	2025-09-10 17:36:25.998	2025-09-11 10:24:14.178
cmfe2lrfn0009pz2laqmooee1	stuilbergjohn@gmail.com	Дикси	$2b$10$HozTMCl5iN45vmgNy8NGtuC0F1yKMOQqEPeImjuKiMBkjw3nYxaF2	@itsdiksi	USER	APPROVED	f	2025-09-10 11:24:06.18	2025-09-11 10:24:16.527
cmfgc7d5i000cpz2lshblr0yf	arina.zaitseva007@gmail.com	Николай	$2b$10$RZd3zoJvgK8ZrvR/xN.2zesxCU2k0rhNUJU12ckePgBHgNtl.Hpl2	@hdhdh01	USER	APPROVED	f	2025-09-12 01:28:22.998	2025-09-12 15:52:21.421
cmfgr3dwc000dpz2lvbrbtvbz	lonelyshafix@gmail.com	Марк Рудовский	$2b$10$vnHyJfFrwp.9rJ/x0YRM1uooh8Pn0aGl76IarNGxEn9x/WXdB7IAO	@amgspleef	USER	APPROVED	f	2025-09-12 08:25:11.58	2025-09-12 15:52:23.861
cmf979sk60000j72lff8cpeia	dokke.naz@icloud.com	Nazar	$2b$10$pE1zf3pbRjwAeiQLt6P3q.fnWb8pLezUHj3SPcmn2tbXkMeOqdPo.	@dark_sidely	ADMIN	APPROVED	f	2025-09-07 01:35:54.967	2025-09-12 16:11:35.344
cmfh7nyok000epz2lt1kiduc2	workormorg3@proton.me	Zalipex	$2b$10$lVQNOiFnXe1Fc4deUZoBl.vERyGQkRiu..Hy4oyq674xyo..ESlAi	@etocortex	USER	APPROVED	f	2025-09-12 16:09:05.493	2025-09-12 16:11:41.19
cmfi2y2wg000gpz2l0p7dkryc	tramnephima63@gmail.com	Руслан ICANHELP	$2b$10$YknttcHRlZipbdLth4QAI.WEbWXDQGc8ZvrDAEHpLuIfdGH0ojLYi	@helpgiving	USER	APPROVED	f	2025-09-13 06:44:45.617	2025-09-13 08:34:25.661
cmfh8ufaq000fpz2lov31ce7j	toigaming123@gmail.com	Marc Jacobs	$2b$10$DT//Aq1b1TiBfO8ciSG8Y.xES1tvAYXLL7rMCU7.D0264WQuBB8FG	@horg8888	USER	APPROVED	f	2025-09-12 16:42:06.578	2025-09-13 08:34:28.452
\.


--
-- TOC entry 3828 (class 2606 OID 37991)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3815 (class 2606 OID 37830)
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 3820 (class 2606 OID 37840)
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- TOC entry 3825 (class 2606 OID 37850)
-- Name: content_projects content_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_projects
    ADD CONSTRAINT content_projects_pkey PRIMARY KEY (id);


--
-- TOC entry 3778 (class 2606 OID 37728)
-- Name: course_pages course_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_pages
    ADD CONSTRAINT course_pages_pkey PRIMARY KEY (id);


--
-- TOC entry 3776 (class 2606 OID 37718)
-- Name: course_sections course_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT course_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3772 (class 2606 OID 37708)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 3803 (class 2606 OID 37813)
-- Name: deposit_sources deposit_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_sources
    ADD CONSTRAINT deposit_sources_pkey PRIMARY KEY (id);


--
-- TOC entry 3810 (class 2606 OID 37822)
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- TOC entry 3783 (class 2606 OID 37748)
-- Name: documentation documentation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentation
    ADD CONSTRAINT documentation_pkey PRIMARY KEY (id);


--
-- TOC entry 3781 (class 2606 OID 37738)
-- Name: documentation_sections documentation_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentation_sections
    ADD CONSTRAINT documentation_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3786 (class 2606 OID 37761)
-- Name: finance_accounts finance_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_accounts
    ADD CONSTRAINT finance_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3790 (class 2606 OID 37782)
-- Name: finance_categories finance_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_categories
    ADD CONSTRAINT finance_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3788 (class 2606 OID 37771)
-- Name: finance_counterparties finance_counterparties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_counterparties
    ADD CONSTRAINT finance_counterparties_pkey PRIMARY KEY (id);


--
-- TOC entry 3792 (class 2606 OID 37792)
-- Name: finance_projects finance_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_projects
    ADD CONSTRAINT finance_projects_pkey PRIMARY KEY (id);


--
-- TOC entry 3797 (class 2606 OID 37803)
-- Name: finance_transactions finance_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3764 (class 2606 OID 37697)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3812 (class 1259 OID 37877)
-- Name: analytics_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_action_idx ON public.analytics USING btree (action);


--
-- TOC entry 3813 (class 1259 OID 37878)
-- Name: analytics_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_createdAt_idx" ON public.analytics USING btree ("createdAt");


--
-- TOC entry 3816 (class 1259 OID 37876)
-- Name: analytics_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "analytics_userId_idx" ON public.analytics USING btree ("userId");


--
-- TOC entry 3817 (class 1259 OID 37881)
-- Name: articles_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_category_idx ON public.articles USING btree (category);


--
-- TOC entry 3818 (class 1259 OID 37882)
-- Name: articles_isPublished_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "articles_isPublished_idx" ON public.articles USING btree ("isPublished");


--
-- TOC entry 3821 (class 1259 OID 37880)
-- Name: articles_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_slug_idx ON public.articles USING btree (slug);


--
-- TOC entry 3822 (class 1259 OID 37879)
-- Name: articles_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);


--
-- TOC entry 3823 (class 1259 OID 37884)
-- Name: content_projects_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "content_projects_isActive_idx" ON public.content_projects USING btree ("isActive");


--
-- TOC entry 3826 (class 1259 OID 37883)
-- Name: content_projects_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_projects_type_idx ON public.content_projects USING btree (type);


--
-- TOC entry 3769 (class 1259 OID 37860)
-- Name: courses_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_category_idx ON public.courses USING btree (category);


--
-- TOC entry 3770 (class 1259 OID 37859)
-- Name: courses_isPublished_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "courses_isPublished_idx" ON public.courses USING btree ("isPublished");


--
-- TOC entry 3773 (class 1259 OID 37858)
-- Name: courses_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_slug_idx ON public.courses USING btree (slug);


--
-- TOC entry 3774 (class 1259 OID 37857)
-- Name: courses_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX courses_slug_key ON public.courses USING btree (slug);


--
-- TOC entry 3801 (class 1259 OID 37870)
-- Name: deposit_sources_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deposit_sources_isActive_idx" ON public.deposit_sources USING btree ("isActive");


--
-- TOC entry 3804 (class 1259 OID 37869)
-- Name: deposit_sources_projectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deposit_sources_projectId_idx" ON public.deposit_sources USING btree ("projectId");


--
-- TOC entry 3805 (class 1259 OID 37873)
-- Name: deposits_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deposits_createdAt_idx" ON public.deposits USING btree ("createdAt");


--
-- TOC entry 3806 (class 1259 OID 37871)
-- Name: deposits_depositSourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deposits_depositSourceId_idx" ON public.deposits USING btree ("depositSourceId");


--
-- TOC entry 3807 (class 1259 OID 37875)
-- Name: deposits_id_depositSourceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "deposits_id_depositSourceId_key" ON public.deposits USING btree (id, "depositSourceId");


--
-- TOC entry 3808 (class 1259 OID 37872)
-- Name: deposits_mammothId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "deposits_mammothId_idx" ON public.deposits USING btree ("mammothId");


--
-- TOC entry 3811 (class 1259 OID 37874)
-- Name: deposits_processed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deposits_processed_idx ON public.deposits USING btree (processed);


--
-- TOC entry 3779 (class 1259 OID 37861)
-- Name: documentation_sections_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documentation_sections_key_key ON public.documentation_sections USING btree (key);


--
-- TOC entry 3784 (class 1259 OID 37862)
-- Name: documentation_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX documentation_slug_key ON public.documentation USING btree (slug);


--
-- TOC entry 3793 (class 1259 OID 37863)
-- Name: finance_transactions_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finance_transactions_accountId_idx" ON public.finance_transactions USING btree ("accountId");


--
-- TOC entry 3794 (class 1259 OID 37864)
-- Name: finance_transactions_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finance_transactions_categoryId_idx" ON public.finance_transactions USING btree ("categoryId");


--
-- TOC entry 3795 (class 1259 OID 37867)
-- Name: finance_transactions_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_date_idx ON public.finance_transactions USING btree (date);


--
-- TOC entry 3798 (class 1259 OID 37865)
-- Name: finance_transactions_projectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finance_transactions_projectId_idx" ON public.finance_transactions USING btree ("projectId");


--
-- TOC entry 3799 (class 1259 OID 37866)
-- Name: finance_transactions_projectKey_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finance_transactions_projectKey_idx" ON public.finance_transactions USING btree ("projectKey");


--
-- TOC entry 3800 (class 1259 OID 37868)
-- Name: finance_transactions_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_type_idx ON public.finance_transactions USING btree (type);


--
-- TOC entry 3761 (class 1259 OID 37853)
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- TOC entry 3762 (class 1259 OID 37851)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3765 (class 1259 OID 37854)
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- TOC entry 3766 (class 1259 OID 37855)
-- Name: users_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_status_idx ON public.users USING btree (status);


--
-- TOC entry 3767 (class 1259 OID 37856)
-- Name: users_telegram_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_telegram_idx ON public.users USING btree (telegram);


--
-- TOC entry 3768 (class 1259 OID 37852)
-- Name: users_telegram_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_telegram_key ON public.users USING btree (telegram);


--
-- TOC entry 3840 (class 2606 OID 37940)
-- Name: analytics analytics_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3830 (class 2606 OID 37890)
-- Name: course_pages course_pages_sectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_pages
    ADD CONSTRAINT "course_pages_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES public.course_sections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3829 (class 2606 OID 37885)
-- Name: course_sections course_sections_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT "course_sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3838 (class 2606 OID 37930)
-- Name: deposit_sources deposit_sources_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposit_sources
    ADD CONSTRAINT "deposit_sources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.finance_projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3839 (class 2606 OID 37935)
-- Name: deposits deposits_depositSourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT "deposits_depositSourceId_fkey" FOREIGN KEY ("depositSourceId") REFERENCES public.deposit_sources(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3832 (class 2606 OID 37905)
-- Name: documentation documentation_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentation
    ADD CONSTRAINT "documentation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.documentation(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3833 (class 2606 OID 37900)
-- Name: documentation documentation_sectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentation
    ADD CONSTRAINT "documentation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES public.documentation_sections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3831 (class 2606 OID 37895)
-- Name: documentation_sections documentation_sections_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentation_sections
    ADD CONSTRAINT "documentation_sections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.content_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3834 (class 2606 OID 37925)
-- Name: finance_transactions finance_transactions_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT "finance_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public.finance_accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3835 (class 2606 OID 37915)
-- Name: finance_transactions finance_transactions_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT "finance_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.finance_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3836 (class 2606 OID 37920)
-- Name: finance_transactions finance_transactions_counterpartyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT "finance_transactions_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES public.finance_counterparties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3837 (class 2606 OID 37910)
-- Name: finance_transactions finance_transactions_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT "finance_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.finance_projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


-- Completed on 2025-09-15 00:38:22 +03

--
-- PostgreSQL database dump complete
--

