-- Drop existing policies and recreate them with authenticated role only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can insert their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can update their own travel data" ON public.user_travel_data;
DROP POLICY IF EXISTS "Users can delete their own travel data" ON public.user_travel_data;

-- Recreate policies with explicit authenticated role
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own travel data" 
ON public.user_travel_data FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel data" 
ON public.user_travel_data FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel data" 
ON public.user_travel_data FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel data" 
ON public.user_travel_data FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);