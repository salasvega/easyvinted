/*
  # Create Intelligent Planner Tables

  1. New Tables
    - `selling_suggestions`
      - `id` (uuid, primary key)
      - `article_id` (uuid, foreign key to articles)
      - `user_id` (uuid, foreign key to auth.users)
      - `suggested_date` (date) - Recommended publication date
      - `priority` (text) - Priority level: high, medium, low
      - `reason` (text) - Explanation for the suggestion
      - `status` (text) - Status: pending, accepted, rejected, scheduled
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `enable_planner_notifications` (boolean) - Enable planner notifications
      - `notification_days_before` (integer) - Days before optimal period to notify
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS selling_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_planner_notifications boolean DEFAULT true,
  notification_days_before integer DEFAULT 14,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selling suggestions"
  ON selling_suggestions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own selling suggestions"
  ON selling_suggestions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own selling suggestions"
  ON selling_suggestions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own selling suggestions"
  ON selling_suggestions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_selling_suggestions_user_id ON selling_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_selling_suggestions_article_id ON selling_suggestions(article_id);
CREATE INDEX IF NOT EXISTS idx_selling_suggestions_status ON selling_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
