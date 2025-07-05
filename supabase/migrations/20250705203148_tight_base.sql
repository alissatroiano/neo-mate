/*
  # Fix Profile Creation Issues

  1. Debugging
    - Add logging to track user creation process
    - Ensure trigger function is working properly
    - Add error handling and logging

  2. Profile Creation
    - Recreate the handle_new_user function with better error handling
    - Ensure trigger is properly attached
    - Add manual profile creation option

  3. Security
    - Maintain existing RLS policies
    - Ensure proper permissions are set
*/

-- First, let's check if the profiles table exists and has the right structure
DO $$
BEGIN
  -- Ensure profiles table exists with correct structure
  CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
  );

  -- Ensure unique constraint on email
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Drop and recreate the handle_new_user function with enhanced logging
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user triggered for user ID: %', NEW.id;
  
  -- Extract email and name
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  RAISE LOG 'Creating profile for email: %, name: %', user_email, user_name;
  
  -- Insert the profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    now(),
    now()
  );
  
  RAISE LOG 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'Profile already exists for user: %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    -- Don't fail the user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Create a function to manually create missing profiles (for debugging)
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(user_id uuid, email text, created boolean) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING
  RETURNING id, email, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log current state
DO $$
DECLARE
  user_count integer;
  profile_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  RAISE LOG 'Current state - Users: %, Profiles: %', user_count, profile_count;
END $$;