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
      return new Response(
        JSON.stringify({ 
          error: 'Email is required',
          type: 'VALIDATION_ERROR'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get environment variables with fallback handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      
      return new Response(
        JSON.stringify({ 
          error: 'Edge function configuration error: Missing required environment variables',
          type: 'CONFIG_ERROR',
          details: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in the Supabase dashboard under Edge Functions settings'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate environment variables format
    if (!supabaseUrl.startsWith('https://') || !supabaseServiceKey.startsWith('eyJ')) {
      console.error('Invalid environment variable format');
      
      return new Response(
        JSON.stringify({ 
          error: 'Edge function configuration error: Invalid environment variable format',
          type: 'CONFIG_ERROR',
          details: 'Environment variables appear to be malformed'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase admin client with error handling
    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize Supabase client',
          type: 'CLIENT_ERROR',
          details: clientError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user by email using admin client with timeout
    console.log(`Attempting to fetch user data for email: ${email}`);
    
    let users;
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error('Error fetching users from Supabase:', error);
        
        // Handle specific Supabase errors
        if (error.message?.includes('JWT')) {
          return new Response(
            JSON.stringify({ 
              error: 'Authentication error with service role key',
              type: 'AUTH_ERROR',
              details: 'Service role key may be invalid or expired'
            }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        throw error;
      }
      
      users = data.users;
    } catch (fetchError) {
      console.error('Network or API error:', fetchError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user data from Supabase',
          type: 'NETWORK_ERROR',
          details: fetchError.message
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find user by email
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return new Response(
        JSON.stringify({ 
          role: null, 
          message: 'User not found',
          type: 'USER_NOT_FOUND'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get role from user metadata with fallback
    const role = user.user_metadata?.authorized_role || 
                 user.user_metadata?.role || 
                 'Sales Associate';

    console.log(`Successfully found user ${email} with role: ${role}`);

    return new Response(
      JSON.stringify({ 
        role,
        message: 'Role retrieved successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in check-user-role function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        type: 'INTERNAL_ERROR',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});