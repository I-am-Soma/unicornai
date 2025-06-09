/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `nombre` (text, client name)
      - `prompt_inicial` (text, initial AI prompt)
      - `lista_servicios` (jsonb, services list)
      - `numero_whatsapp` (text, WhatsApp number)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on clients table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  prompt_inicial text,
  lista_servicios jsonb DEFAULT '[]'::jsonb,
  numero_whatsapp text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read clients
CREATE POLICY "Users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert clients
CREATE POLICY "Users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update clients
CREATE POLICY "Users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policy for authenticated users to delete clients
CREATE POLICY "Users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);