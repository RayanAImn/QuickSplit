-- Migration: 20260415120000_initial_schema.sql
-- Created: 2026-04-15
-- Description: Initial QuickSplit schema — bills, split_items, transactions tables

-- ─── Bills ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_name       TEXT         NOT NULL,
  payer_phone      TEXT         NOT NULL,
  description      TEXT         NOT NULL,
  total_amount     NUMERIC(10,2) NOT NULL,
  num_people       INTEGER      NOT NULL,
  amount_per_person NUMERIC(10,2) NOT NULL,
  status           TEXT         NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'pending', 'settled')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Split Items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS split_items (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id                   UUID         NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  receiver_name             TEXT         NOT NULL DEFAULT '',
  amount                    NUMERIC(10,2) NOT NULL,
  status                    TEXT         NOT NULL DEFAULT 'unpaid'
                                         CHECK (status IN ('unpaid', 'paid')),
  paid_at                   TIMESTAMPTZ,
  streampay_ref             TEXT,
  streampay_product_id      TEXT,
  streampay_payment_link_id TEXT,
  streampay_payment_link_url TEXT,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  split_item_id  UUID         NOT NULL REFERENCES split_items(id) ON DELETE CASCADE,
  streampay_ref  TEXT         NOT NULL,
  amount         NUMERIC(10,2) NOT NULL,
  status         TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'completed', 'failed')),
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bills_payer_phone_idx       ON bills(payer_phone);
CREATE INDEX IF NOT EXISTS bills_status_idx            ON bills(status);
CREATE INDEX IF NOT EXISTS split_items_bill_id_idx     ON split_items(bill_id);
CREATE INDEX IF NOT EXISTS split_items_status_idx      ON split_items(status);
CREATE INDEX IF NOT EXISTS transactions_split_item_id_idx ON transactions(split_item_id);
