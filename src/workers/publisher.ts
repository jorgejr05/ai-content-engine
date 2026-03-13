import { supabase } from '../config/supabase';
import fetch from 'node-fetch';

const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;

// ID do perfil no Buffer (você encontra na URL do Buffer ou via API)
// Precisaremos solicitar ao usuário depois
const BUFFER_PROFILE_ID = process.env.BUFFER_PROFILE_ID;

export async function publishPost(postId: string) {
  console.log(`🚀 Iniciando processo de publicação para o post: ${postId}`);

  if (!BUFFER_ACCESS_TOKEN || !BUFFER_PROFILE_ID) {
    console.error('❌ Erro: BUFFER_ACCESS_TOKEN ou BUFFER_PROFILE_ID não configurados.');
    return { success: false, error: 'Credenciais do Buffer ausentes.' };
  }

  // Busca o post no Supabase
  const { data: post, error } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) {
      console.error('❌ Post não encontrado no banco.');
      return { success: false, error: 'Post não encontrado.' };
  }

  if (post.status === 'published') {
      console.warn('⚠️ Este post já foi publicado.');
      return { success: false, error: 'Post já publicado.' };
  }

  const textToPublish = post.content_json?.full_post || post.content_json?.body || '';

  try {
      // Endpoint da API do Buffer para criar updates
      // https://buffer.com/developers/api/updates#updatescreate
      const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`
          },
          body: new URLSearchParams({
              text: textToPublish,
              'profile_ids[]': BUFFER_PROFILE_ID,
              now: 'true' // Publica imediatamente
          })
      });

      const result = await response.json() as any;

      if (response.ok && result.success) {
          // Atualiza status no banco para 'published'
          await supabase.from('generated_posts').update({ status: 'published' }).eq('id', postId);
          console.log('✅ Post publicado com sucesso no Buffer!');
          return { success: true };
      } else {
          console.error('❌ Falha ao publicar no Buffer:', result.message || JSON.stringify(result));
          return { success: false, error: result.message || 'Erro na API do Buffer' };
      }

  } catch (err: any) {
      console.error('❌ Erro interno ao chamar Buffer API:', err.message);
      return { success: false, error: err.message };
  }
}
