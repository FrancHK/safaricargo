-- Migration: add cargo_items column to sc_shipments
-- Stores the multi-type cargo breakdown with sub-item rows (idadi/bei/jumla).
-- Shape:
--   [
--     {
--       "type": "box",
--       "label": "Box / Sanduku",
--       "quantity": 5,         -- total across sub_items
--       "subtotal": 24000,     -- total across sub_items
--       "sub_items": [
--         { "quantity": 2, "unit_price": 5000, "subtotal": 10000 },
--         { "quantity": 1, "unit_price": 14000, "subtotal": 14000 }
--       ]
--     }
--   ]

ALTER TABLE public.sc_shipments
  ADD COLUMN IF NOT EXISTS cargo_items jsonb DEFAULT '[]'::jsonb;

-- Optional: index for queries that filter by cargo_type within the array
-- CREATE INDEX IF NOT EXISTS idx_sc_shipments_cargo_items
--   ON public.sc_shipments USING gin (cargo_items);

COMMENT ON COLUMN public.sc_shipments.cargo_items IS
  'Array of cargo lines: each has type, label, quantity, subtotal, and sub_items[] with per-row quantity/unit_price/subtotal.';
