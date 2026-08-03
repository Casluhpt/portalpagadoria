import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/api/public/concorrencia/sair')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { userId, modulo } = await request.json();
          
          if (!userId || !modulo) {
            return new Response('Missing parameters', { status: 400 });
          }

          const { data: leavingUser } = await supabase
            .from('concorrencia_fila')
            .select('status')
            .eq('user_id', userId)
            .eq('modulo', modulo)
            .maybeSingle();

          const { error } = await supabase
            .from('concorrencia_fila')
            .delete()
            .eq('user_id', userId)
            .eq('modulo', modulo);

          if (error) throw error;

          if (leavingUser?.status === 'ativo') {
            const { data: next } = await supabase
              .from('concorrencia_fila')
              .select('id')
              .eq('modulo', modulo)
              .eq('status', 'aguardando')
              .order('entrou_em', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (next) {
              await supabase
                .from('concorrencia_fila')
                .update({ status: 'ativo', ativo_desde: new Date().toISOString() })
                .eq('id', next.id);
            }
          }

          return new Response('ok');
        } catch (e) {
          console.error('Error in beacon sair:', e);
          return new Response('error', { status: 500 });
        }
      }
    }
  }
})
