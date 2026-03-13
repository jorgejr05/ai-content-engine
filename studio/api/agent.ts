import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], action, details } = req.body;

  try {
    // 1. Ações Diretas (sem LLM se necessário)
    if (action === 'SAVE_TO_CENTRAL') {
      const { platform, content } = details || {};
      const { error } = await supabase.from('generated_posts').insert({
        platform,
        content_json: content,
        status: 'pending'
      });
      return res.json({ success: !error, error: error?.message });
    }

    if (action === 'SUBMIT_FEEDBACK') {
      const { topic, platform, is_positive, sample } = details || {};
      const { error } = await supabase.from('ai_feedback').insert({
        content_topic: topic,
        platform,
        is_positive,
        content_sample: sample
      });
      return res.json({ success: !error });
    }

    // 2. Buscar aprendizados anteriores (Feedback Loop)
    const { data: learning } = await supabase
      .from('ai_feedback')
      .select('content_topic, platform, is_positive')
      .eq('is_positive', true)
      .limit(5);

    const learnPrompt = learning?.length 
      ? `O usuário gosta de conteúdos sobre: ${learning.map(l => l.content_topic).join(', ')}.` 
      : '';

    // 3. Classificação de Intenção e Memória via LLM
    const intentResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Você é o "Growth Strategist Agent" do ecossistema AI Content Studio.
Sua base de conhecimento inclui: Fontes Monitoradas (RSS/Reddit), Insights Gerados, Conteúdos Pendentes e Trend Hunter.

Sua missão: IA Curating & Flywheel Gen. Use Llama 3 para avaliar relevância e gerar posts/imagens.

Capacidades:
- SEARCH: Busca em notícias/discussions. Filtre por tema se fornecido.
- RESEARCH: Analisa e resume sinais captados (IA Curating).
- MULTI_GENERATE: Gera pacotes para LinkedIn, Instagram (Carousel de 5 slides), TikTok (Roteiro) e Twitter/X (Thread).
- STATUS: Saúde do sistema.

Diretriz de Humanização: Seja proativo e estratégico. ${learnPrompt}

Responda SEMPRE em JSON:
{
  "action": "SEARCH" | "RESEARCH" | "MULTI_GENERATE" | "STATUS" | "CHAT",
  "topic": "tema",
  "response": "texto humanizado",
  "next_suggestion": "dica proativa",
  "data": {}
}`
        },
        ...history.slice(-8).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: message }
      ],
      response_format: { type: 'json_object' }
    });

    const aiResult = JSON.parse(intentResponse.choices[0]?.message?.content || '{}');
    let actionResult: any = {};

    switch (aiResult.action) {
      case 'SEARCH':
      case 'RESEARCH': {
        let query = supabase.from('content_sources').select('id, title, url, source, created_at, content_text');
        if (aiResult.topic) query = query.ilike('title', `%${aiResult.topic}%`);

        const { data: sources } = await query.order('created_at', { ascending: false }).limit(10);

        if (aiResult.action === 'RESEARCH' && sources && sources.length > 0) {
          const researchResp = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{
              role: 'user',
              content: `IA Curating: Resuma estas notícias e extraia padrões virais para PMEs. Fale sobre o ecossistema Flywheel.\n\n${sources.map(s => `- ${s.title}: ${s.content_text?.substring(0, 300)}`).join('\n')}`
            }]
          });
          actionResult = {
            summary: researchResp.choices[0]?.message?.content,
            sources: sources.map(s => ({ id: s.id, title: s.title, url: s.url, source: s.source })),
          };
        } else {
          actionResult = { sources: sources || [] };
        }
        break;
      }

      case 'MULTI_GENERATE': {
        const genResp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Flywheel Gen: Crie um kit estratégico de conteúdo sobre "${aiResult.topic}".
            Para Instagram, crie um CARROSSEL de 5 slides (array de strings).
            Para cada rede, inclua: [Texto/Legenda/Roteiro], [suggestion: Sugestão de Publicação (Melhor horário e hashtags)].
            
            Retorne em JSON:
            {
              "linkedin": { "text": "...", "suggestion": "..." },
              "instagram": { "slides": ["Slide 1", "..."], "suggestion": "..." },
              "twitter": { "text": "...", "suggestion": "..." },
              "tiktok": { "script": "...", "suggestion": "..." }
            }`
          }],
          response_format: { type: 'json_object' }
        });
        actionResult = JSON.parse(genResp.choices[0]?.message?.content || '{}');
        break;
      }

      case 'STATUS': {
        const [{ count: sources }, { count: insights }, { count: posts }] = await Promise.all([
          supabase.from('content_sources').select('*', { count: 'exact', head: true }),
          supabase.from('content_insights').select('*', { count: 'exact', head: true }),
          supabase.from('generated_posts').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        actionResult = { sources, insights, pending_posts: posts };
        break;
      }

      default:
        actionResult = aiResult.data || {};
    }

    return res.json({ 
      success: true, 
      action: aiResult.action, 
      response: aiResult.response, 
      next_suggestion: aiResult.next_suggestion,
      data: actionResult 
    });

  } catch (e: any) {
    console.error('Agent error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
