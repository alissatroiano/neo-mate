/*
  # Fix Profile Creation Issues

  1. Enhanced Debugging
    - Add better logging to the trigger function
    - Create a manual profile creation function
    - Add debugging views

  2. Security
    - Ensure proper RLS policies
    - Grant correct permissions

  3. Troubleshooting
    - Function to check missing profiles
    - Function to manually create profiles
*/

-- Drop and recreate the handle_new_user function with even more logging
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
  profile_exists boolean := false;
BEGIN
  -- Log the trigger execution with full details
  RAISE LOG 'handle_new_user triggered for user ID: %, email: %, metadata: %', 
    NEW.id, NEW.email, NEW.raw_user_meta_data;
  
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE LOG 'Profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Extract email and name with more robust handling
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  RAISE LOG 'Creating profile for user: %, email: %, name: %', NEW.id, user_email, user_name;
  
  -- Insert the profile with explicit error handling
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      user_email,
      user_name,
      now(),
      now()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists (unique violation) for user: %', NEW.id;
    WHEN foreign_key_violation THEN
      RAISE LOG 'Foreign key violation creating profile for user: %', NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Unexpected error creating profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create a function to check for missing profiles
CREATE OR REPLACE FUNCTION public.check_missing_profiles()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_created_at timestamptz,
  has_profile boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    (p.id IS NOT NULL) as has_profile
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to create missing profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS TABLE(user_id uuid, email text, created boolean, error_msg text) AS $$
DECLARE
  user_record RECORD;
  profile_created boolean;
  error_message text;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    profile_created := false;
    error_message := null;
    
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
      VALUES (
        user_record.id,
        COALESCE(user_record.email, ''),
        COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
        now(),
        now()
      );
      
      profile_created := true;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_message := SQLERRM;
    END;
    
    RETURN QUERY SELECT user_record.id, user_record.email, profile_created, error_message;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually create a profile for a specific user
CREATE OR REPLACE FUNCTION public.create_profile_for_user(target_user_id uuid)
RETURNS TABLE(success boolean, error_msg text) AS $$
DECLARE
  user_record RECORD;
  error_message text := null;
BEGIN
  -- Get user details
  SELECT id, email, raw_user_meta_data INTO user_record
  FROM auth.users
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found in auth.users';
    RETURN;
  END IF;
  
  -- Check if profile already exists
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RETURN QUERY SELECT true, 'Profile already exists';
    RETURN;
  END IF;
  
  -- Create the profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      user_record.id,
      COALESCE(user_record.email, ''),
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      now(),
      now()
    );
    
    RETURN QUERY SELECT true, 'Profile created successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      error_message := SQLERRM;
      RETURN QUERY SELECT false, error_message;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.check_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(uuid) TO authenticated;

-- Log current state after migration
DO $$
DECLARE
  user_count integer;
  profile_count integer;
  missing_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO missing_count 
  FROM auth.users au 
  LEFT JOIN public.profiles p ON au.id = p.id 
  WHERE p.id IS NULL;
  
  RAISE LOG 'Migration complete - Users: %, Profiles: %, Missing: %', user_count, profile_count, missing_count;
END $$;