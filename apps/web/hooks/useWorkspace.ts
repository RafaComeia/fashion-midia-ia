'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  segment: string | null;
  plan: string;
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const workspaceId = user?.user_metadata?.workspace_id as string | undefined;
      if (!workspaceId) { setLoading(false); return; }

      const { data } = await supabase
        .from('workspaces')
        .select('id, name, slug, logo_url, segment, plan')
        .eq('id', workspaceId)
        .single();

      setWorkspace(data ?? null);
      setLoading(false);
    };

    void load();
  }, []);

  return { workspace, loading };
}
