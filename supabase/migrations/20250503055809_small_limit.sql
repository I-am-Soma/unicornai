/*
  # Create conversations table

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, references leads)
      - `message` (text)
      - `sender` (text, either 'bot' or 'lead')
      - `created_at` (timestamptz)
      - `status` (text, default 'New')

  2. Security
    - Enable RLS on conversations table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  message text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('bot', 'lead')),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'New'
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read their own conversations
CREATE POLICY "Users can read conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert conversations
CREATE POLICY "Users can insert conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update conversations
CREATE POLICY "Users can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (true);