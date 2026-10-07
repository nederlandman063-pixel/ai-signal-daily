CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), issue_date date NOT NULL UNIQUE,
  title text NOT NULL, summary text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN CREATE TYPE story_category AS ENUM ('MODELS','AGENTS','APPS','RESEARCH','BUSINESS','INFRA'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('CONFIRMED','COMPANY_CLAIM','ANALYSIS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE source_kind AS ENUM ('PRIMARY','CORROBORATING','ANALYSIS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE, rank integer NOT NULL CHECK (rank > 0), is_lead boolean NOT NULL DEFAULT false,
  category story_category NOT NULL, title text NOT NULL, dek text NOT NULL, excerpt text NOT NULL,
  body text NOT NULL CHECK (char_length(body) >= 1000), takeaway text NOT NULL,
  image_url text NOT NULL, image_alt text NOT NULL, image_credit text,
  published_at timestamptz NOT NULL, read_time integer NOT NULL CHECK (read_time > 0),
  verification_status verification_status NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(issue_id, rank)
);
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  label text NOT NULL, url text NOT NULL, source_type source_kind NOT NULL, is_primary boolean NOT NULL DEFAULT false, published_at timestamptz
);
CREATE TABLE IF NOT EXISTS x_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_handle text NOT NULL, url text NOT NULL, verified boolean NOT NULL CHECK (verified), published_at timestamptz
);
CREATE INDEX IF NOT EXISTS stories_issue_rank_idx ON stories(issue_id, rank);
CREATE UNIQUE INDEX IF NOT EXISTS stories_one_lead_per_issue_idx ON stories(issue_id) WHERE is_lead;
CREATE INDEX IF NOT EXISTS stories_category_idx ON stories(category);
CREATE INDEX IF NOT EXISTS stories_search_idx ON stories USING gin(to_tsvector('simple', title || ' ' || dek || ' ' || body));
CREATE INDEX IF NOT EXISTS sources_story_idx ON sources(story_id);
CREATE INDEX IF NOT EXISTS x_posts_story_idx ON x_posts(story_id);
