-- Requires the pgvector extension.
create extension if not exists vector;

-- Ingestion job queue. One row per YouTube video.
-- Handles gotcha #1 (captions not ready at upload) via attempts + next_retry_at.
create table if not exists ingest_jobs (
  id            bigserial primary key,
  video_id      text not null unique,
  course        text,
  materia       text,
  status        text not null default 'pending',   -- pending | processing | done | failed
  attempts      int  not null default 0,
  next_retry_at timestamptz not null default now(),
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists ingest_jobs_status_idx on ingest_jobs (status, next_retry_at);

-- Full plain-text transcript, one row per video. Deliberately NOT keyed by
-- model_version: the text is a property of the lecture, not of the embedding
-- model, so re-embedding with a different model reuses this instead of
-- re-downloading the captions.
create table if not exists transcripts (
  id          bigserial primary key,
  video_id    text not null unique,
  course      text,
  materia     text,
  content     text not null,
  segments    int  not null,
  duration_ms int  not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Embedded transcript chunks. Each row = one time-window with citation metadata.
-- NOTE: vector(768) matches nomic-embed-text (local via Ollama). If you swap the embedding
-- model, change this dimension to match (e.g. 768 for many local models).
create table if not exists transcript_chunks (
  id            bigserial primary key,
  video_id      text not null,
  course        text,
  materia       text,
  chunk_index   int  not null,
  start_ms      int  not null,
  end_ms        int  not null,
  content       text not null,
  content_hash  text not null,
  embedding     vector(768) not null,
  model_version text not null,
  created_at    timestamptz not null default now(),
  unique (video_id, chunk_index, model_version)
);

create index if not exists transcript_chunks_materia_idx on transcript_chunks (materia);

-- Approximate nearest-neighbour index for cosine distance.
-- Build it AFTER you have some rows; tune `lists` ~ sqrt(#rows).
create index if not exists transcript_chunks_embedding_idx
  on transcript_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
