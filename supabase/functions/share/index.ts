import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    
    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: 'Workspace ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user owns the workspace
    const { data: workspace, error: workspaceError } = await supabaseClient
      .from('workspaces')
      .select('id, owner')
      .eq('id', workspaceId)
      .eq('owner', user.id)
      .single();

    if (workspaceError || !workspace) {
      return new Response(
        JSON.stringify({ error: 'Workspace not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate a unique share token
    const shareToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Store the share token in a shares table (you'd need to create this table)
    const { error: shareError } = await supabaseClient
      .from('workspace_shares')
      .insert({
        workspace_id: workspaceId,
        token: shareToken,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (shareError) {
      console.error('Error creating share:', shareError);
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the share URL
    const shareUrl = `${Deno.env.get('FRONTEND_URL')}/shared/${shareToken}`;

    return new Response(
      JSON.stringify({ 
        shareUrl,
        expiresAt: expiresAt.toISOString(),
        token: shareToken,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/* 
Example usage from client:

const response = await fetch(`${SUPABASE_URL}/functions/v1/share`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ workspaceId: 'your-workspace-id' }),
});

const { shareUrl } = await response.json();

Note: You'll need to create a workspace_shares table:

create table public.workspace_shares (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  token text unique not null,
  created_by uuid references auth.users(id),
  expires_at timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_workspace_shares_token on public.workspace_shares(token);
create index idx_workspace_shares_workspace_id on public.workspace_shares(workspace_id);
*/
