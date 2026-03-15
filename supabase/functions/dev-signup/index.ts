import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client with service role — can create confirmed users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[dev-signup] Starting signup for:', email);

    // Check if user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[dev-signup] List users error:', listError.message);
    }
    const existingUser = users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log('[dev-signup] User already exists, updating password and confirming');
      // Update password and ensure confirmed
      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: { full_name: name || existingUser.user_metadata?.full_name || email.split('@')[0] },
        }
      );
      if (updateError) {
        console.error('[dev-signup] Update error:', updateError.message);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = existingUser.id;
      console.log('[dev-signup] User updated:', userId);
    } else {
      // Create new user with email pre-confirmed
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name || email.split('@')[0] },
      });

      if (createError) {
        console.error('[dev-signup] Create error:', createError.message);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = created.user!.id;
      console.log('[dev-signup] User created:', userId);
    }

    // Now sign in with the confirmed credentials to get a real session
    // Use the regular anon client for sign-in so we get proper session tokens
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[dev-signup] SignIn error:', signInError.message);
      return new Response(
        JSON.stringify({ error: signInError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[dev-signup] Session created for user:', signInData.user?.id);

    return new Response(
      JSON.stringify({
        session: signInData.session,
        user: signInData.user,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[dev-signup] Unexpected error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
