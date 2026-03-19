-- ============================================================
-- MIGRATION: Add client file policies
-- Run this in Supabase SQL Editor to add missing RLS policies
-- ============================================================

-- 1. Add policies for clients to manage their own files in the 'files' table
-- (These allow clients to create folders, upload, rename, and delete their own files)

DO $$
BEGIN
  -- Select policy for clients to view their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_select_own_files' AND tablename = 'files'
  ) THEN
    CREATE POLICY "clients_select_own_files" ON public.files
      FOR SELECT USING (client_id = auth.uid());
  END IF;

  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert_own_files' AND tablename = 'files'
  ) THEN
    CREATE POLICY "clients_insert_own_files" ON public.files
      FOR INSERT WITH CHECK (client_id = auth.uid());
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_update_own_files' AND tablename = 'files'
  ) THEN
    CREATE POLICY "clients_update_own_files" ON public.files
      FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'clients_delete_own_files' AND tablename = 'files'
  ) THEN
    CREATE POLICY "clients_delete_own_files" ON public.files
      FOR DELETE USING (client_id = auth.uid());
  END IF;

  -- Admin/Editor select policy for all files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_editors_select_all_files' AND tablename = 'files'
  ) THEN
    CREATE POLICY "admins_editors_select_all_files" ON public.files
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
      );
  END IF;
END $$;

-- 2. Add storage policies for social-files bucket
-- (Only run if bucket exists and policies don't exist yet)

DO $$
BEGIN
  -- Check if bucket exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'social-files') THEN
    -- Client SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_select_own_social_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_select_own_social_files" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'social-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client INSERT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert_own_social_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_insert_own_social_files" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'social-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client UPDATE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_update_own_social_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_update_own_social_files" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'social-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client DELETE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_delete_own_social_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_delete_own_social_files" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'social-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Admin/Editor full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'admins_editors_all_social_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "admins_editors_all_social_files" ON storage.objects
        FOR ALL USING (
          bucket_id = 'social-files'
          AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
        );
    END IF;
  END IF;
END $$;

-- 3. Add storage policies for web-files bucket

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'web-files') THEN
    -- Client SELECT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_select_own_web_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_select_own_web_files" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'web-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client INSERT
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert_own_web_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_insert_own_web_files" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'web-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client UPDATE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_update_own_web_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_update_own_web_files" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'web-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Client DELETE
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'clients_delete_own_web_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "clients_delete_own_web_files" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'web-files'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- Admin/Editor full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = 'admins_editors_all_web_files' AND tablename = 'objects'
    ) THEN
      CREATE POLICY "admins_editors_all_web_files" ON storage.objects
        FOR ALL USING (
          bucket_id = 'web-files'
          AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','editor'))
        );
    END IF;
  END IF;
END $$;

-- Done!
-- Verify policies were created:
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('files', 'objects')
ORDER BY tablename, policyname;
