import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  team_member_id: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { team_member_id }: RequestBody = await req.json();
    
    if (!team_member_id) {
      throw new Error('team_member_id is required');
    }

    // Get team member details
    const { data: teamMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', team_member_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch team member: ${fetchError.message}`);
    }

    if (!teamMember) {
      throw new Error('Team member not found');
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.warn('Could not check existing users:', listError.message);
    }

    const userExists = existingUsers?.users?.some(u => u.email === teamMember.email);

    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User account already exists',
          user_exists: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Generate temporary password if not exists
    const tempPassword = teamMember.temp_password || `temp${Math.random().toString(36).slice(-8)}`;

    // Create user account
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: teamMember.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: teamMember.name,
        role: teamMember.role
      }
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    // Update team member with temp password if it wasn't set
    if (!teamMember.temp_password) {
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ temp_password: tempPassword })
        .eq('id', team_member_id)
        .eq('user_id', user.id);

      if (updateError) {
        console.warn('Could not update temp password:', updateError.message);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User account created successfully',
        user_id: newUser.user?.id,
        temp_password: tempPassword
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in force_sync_team_member:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});