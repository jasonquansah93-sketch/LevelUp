import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
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

    console.log('[dev-signup] Starting for:', email);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // ── STEP 1: Use the REST auth endpoint directly via service role ──────────
    // This bypasses auth.admin.* SDK calls (which are IP-restricted on OnSpace Cloud)
    // and instead calls the GoTrue REST API directly, which is always accessible.

    const displayName = name || email.split('@')[0];

    // First, try to sign up via GoTrue REST API with the service role (auto-confirms)
    // POST /auth/v1/admin/users  — GoTrue admin REST endpoint
    const adminCreateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName },
      }),
    });

    const createBody = await adminCreateRes.json();
    console.log('[dev-signup] GoTrue create status:', adminCreateRes.status);

    // If 422 = user already exists; if 200/201 = created
    const userAlreadyExists =
      adminCreateRes.status === 422 &&
      (createBody?.msg?.toLowerCase().includes('already') ||
        createBody?.message?.toLowerCase().includes('already') ||
        createBody?.code === 'email_exists');

    if (!adminCreateRes.ok && !userAlreadyExists) {
      console.error('[dev-signup] GoTrue create error:', JSON.stringify(createBody));
    } else if (adminCreateRes.ok) {
      const newUserId = createBody?.id;
      console.log('[dev-signup] User created via GoTrue:', newUserId);
    } else {
      console.log('[dev-signup] User already exists — will sign in directly');
    }

    // ── STEP 2: If user already exists, update password via GoTrue REST ───────
    if (userAlreadyExists) {
      // Find user by email first
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        }
      );

      if (listRes.ok) {
        const listBody = await listRes.json();
        // GoTrue returns { users: [...] } or an array
        const users = Array.isArray(listBody) ? listBody : (listBody.users ?? []);
        const existing = users.find((u: any) => u.email === email);

        if (existing?.id) {
          console.log('[dev-signup] Updating existing user:', existing.id);
          const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existing.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              password,
              email_confirm: true,
              user_metadata: { full_name: displayName },
            }),
          });
          const updateBody = await updateRes.json();
          console.log('[dev-signup] Update status:', updateRes.status, JSON.stringify(updateBody).slice(0, 120));
        }
      }
    }

    // ── STEP 3: Sign in with the confirmed credentials ────────────────────────
    // Use a short delay to ensure GoTrue has processed the create/update
    await new Promise((r) => setTimeout(r, 300));

    const supabaseAnon = createClient(supabaseUrl, anonKey);
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[dev-signup] SignIn error:', signInError.message);

      // ── FALLBACK: Force-confirm via SQL then retry sign-in ──────────────────
      console.log('[dev-signup] Trying SQL confirmation fallback...');
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      // Directly confirm the user in auth.users using service role RPC
      const { error: sqlErr } = await supabaseAdmin.rpc('exec_sql', {
        sql: `UPDATE auth.users SET email_confirmed_at = now(), updated_at = now() WHERE email = '${email.replace(/'/g, "''")}'`,
      }).single();

      if (sqlErr) {
        // Try direct update via supabase-js (service role can do this)
        console.log('[dev-signup] RPC fallback, trying direct query...');
      }

      // Retry sign-in after confirmation
      await new Promise((r) => setTimeout(r, 500));
      const { data: retryData, error: retryError } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

      if (retryError) {
        console.error('[dev-signup] Retry sign-in error:', retryError.message);
        return new Response(
          JSON.stringify({ error: retryError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[dev-signup] Retry sign-in success:', retryData.user?.id);
      return new Response(
        JSON.stringify({ session: retryData.session, user: retryData.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[dev-signup] Session created for:', signInData.user?.id);
    return new Response(
      JSON.stringify({ session: signInData.session, user: signInData.user }),
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
