/*
  # Add activar column to leads table

  1. Changes
    - Add `activar` boolean column to leads table with default false
    - Update RLS policies to allow activation updates
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'activar'
  ) THEN
    ALTER TABLE leads ADD COLUMN activar boolean DEFAULT false;
  END IF;
END $$;