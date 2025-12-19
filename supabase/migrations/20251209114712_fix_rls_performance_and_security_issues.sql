/*
  # Fix RLS Performance and Security Issues

  ## Changes Made

  ### 1. RLS Policy Performance Optimization
  Optimized all RLS policies to use `(select auth.uid())` instead of `auth.uid()` 
  to prevent re-evaluation for each row, significantly improving query performance at scale.

  Tables affected:
  - `family_members` (4 policies)
  - `lots` (4 policies)
  - `custom_personas` (4 policies)
  - `lot_items` (3 policies)

  ### 2. Unused Index Cleanup
  Removed unused indexes to reduce storage overhead and improve write performance:
  - `idx_publication_jobs_run_at`
  - `idx_lots_seller_id`
  - `idx_selling_suggestions_lot_id`

  ### 3. Function Search Path Security
  Fixed mutable search_path issues for functions:
  - `update_lots_updated_at`
  - `check_article_lot_availability`

  ### 4. Password Security Enhancement
  Note: Leaked password protection (HaveIBeenPwned) must be enabled via Supabase Dashboard
  under Authentication > Settings > Enable Leaked Password Protection
*/

-- ============================================================================
-- 1. FIX RLS POLICIES - FAMILY_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own family members" ON public.family_members;
CREATE POLICY "Users can view own family members"
  ON public.family_members
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own family members" ON public.family_members;
CREATE POLICY "Users can create own family members"
  ON public.family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own family members" ON public.family_members;
CREATE POLICY "Users can update own family members"
  ON public.family_members
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own family members" ON public.family_members;
CREATE POLICY "Users can delete own family members"
  ON public.family_members
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 2. FIX RLS POLICIES - LOTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own lots" ON public.lots;
CREATE POLICY "Users can view own lots"
  ON public.lots
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own lots" ON public.lots;
CREATE POLICY "Users can create own lots"
  ON public.lots
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own lots" ON public.lots;
CREATE POLICY "Users can update own lots"
  ON public.lots
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own lots" ON public.lots;
CREATE POLICY "Users can delete own lots"
  ON public.lots
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 3. FIX RLS POLICIES - CUSTOM_PERSONAS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own custom personas" ON public.custom_personas;
CREATE POLICY "Users can view own custom personas"
  ON public.custom_personas
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own custom personas" ON public.custom_personas;
CREATE POLICY "Users can create own custom personas"
  ON public.custom_personas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own custom personas" ON public.custom_personas;
CREATE POLICY "Users can update own custom personas"
  ON public.custom_personas
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own custom personas" ON public.custom_personas;
CREATE POLICY "Users can delete own custom personas"
  ON public.custom_personas
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- 4. FIX RLS POLICIES - LOT_ITEMS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own lot items" ON public.lot_items;
CREATE POLICY "Users can view own lot items"
  ON public.lot_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own lot items" ON public.lot_items;
CREATE POLICY "Users can create own lot items"
  ON public.lot_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own lot items" ON public.lot_items;
CREATE POLICY "Users can delete own lot items"
  ON public.lot_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lots
      WHERE lots.id = lot_items.lot_id
      AND lots.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 5. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_publication_jobs_run_at;
DROP INDEX IF EXISTS public.idx_lots_seller_id;
DROP INDEX IF EXISTS public.idx_selling_suggestions_lot_id;

-- ============================================================================
-- 6. FIX FUNCTION SEARCH PATH ISSUES
-- ============================================================================

-- Recreate update_lots_updated_at function with secure search_path
DROP FUNCTION IF EXISTS public.update_lots_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_lots_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_lots_updated_at ON public.lots;
CREATE TRIGGER set_lots_updated_at
  BEFORE UPDATE ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lots_updated_at();

-- Recreate check_article_lot_availability function with secure search_path
DROP FUNCTION IF EXISTS public.check_article_lot_availability() CASCADE;
CREATE OR REPLACE FUNCTION public.check_article_lot_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if article is already in another lot
  IF EXISTS (
    SELECT 1 
    FROM public.lot_items 
    WHERE article_id = NEW.article_id 
    AND lot_id != NEW.lot_id
  ) THEN
    RAISE EXCEPTION 'Article is already assigned to another lot';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS check_article_availability ON public.lot_items;
CREATE TRIGGER check_article_availability
  BEFORE INSERT OR UPDATE ON public.lot_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_article_lot_availability();