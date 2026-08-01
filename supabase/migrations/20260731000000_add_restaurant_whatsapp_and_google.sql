ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS whatsapp_owner_number TEXT DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS google_review_link TEXT DEFAULT '';
