import { createClient } from 'npm:@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Check if required environment variables are available
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Edge function configuration error: Missing required environment variables',
          details: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in the Supabase dashboard'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user by email using admin client
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ role: null, message: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get role from user metadata
    const role = user.user_metadata?.authorized_role || user.user_metadata?.role || 'Sales Associate';

    console.log(`User ${email} has role: ${role}`);

    return new Response(
      JSON.stringify({ role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-user-role function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'EDGE_FUNCTION_ERROR'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});