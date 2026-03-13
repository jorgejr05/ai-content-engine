import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ success: false, error: 'postId não fornecido' });
  }

  try {
    // Buscar o post
    const { data: post, error } = await supabase
      .from('generated_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return res.status(404).json({ success: false, error: 'Post não encontrado.' });
    }

    // Marcar como publicado (a integração real com Buffer pode ser configurada depois)
    await supabase.from('generated_posts').update({ status: 'published' }).eq('id', postId);

    return res.json({ success: true, message: 'Post marcado como publicado!' });

  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
