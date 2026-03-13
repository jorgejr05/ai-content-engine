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

  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Mensagem não fornecida.' });

  try {
    const intentResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Você é o "Content Strategist & Growth Agent" do AI Content Studio. Sua missão é transformar sinais de mercado em conteúdo viral e estratégico.

Capacidades Avançadas:
1. SEARCH: Busca profunda em 'content_sources' e 'community_discussions'. Suporta filtros de tempo (última semana, mês).
2. RESEARCH & SUMMARIZE: Analisa notícias encontradas, resume pontos chave e identifica tendências.
3. MULTI_GENERATE: Gera pacotes de conteúdo para Instagram, LinkedIn, TikTok e Twitter/X.
4. STATUS: Visão geral da saúde do pipeline.

Persona: Humanizada, proativa, estratégica e confiante. Você não apenas responde, você sugere próximos passos.

Filtros de Tempo (Topic parsing):
- Se o usuário mencionar "da semana" ou "últimos 7 dias", defina timeframe: "week".
- Se mencionar "do mês" ou "últimos 30 dias", defina timeframe: "month".
- Default timeframe: "all".

Responda SEMPRE em JSON:
{
  "action": "SEARCH" | "RESEARCH" | "MULTI_GENERATE" | "STATUS" | "CHAT",
  "topic": "o tema principal",
  "timeframe": "week" | "month" | "all",
  "count": number (default 10),
  "response": "Sua resposta humanizada e empolgante",
  "next_suggestion": "O que o usuário deve fazer em seguida?"
}`
        },
        { role: 'user', content: message }
      ],
      response_format: { type: 'json_object' }
    });

    const aiResult = JSON.parse(intentResponse.choices[0]?.message?.content || '{}');
    let actionResult: any = {};

    switch (aiResult.action) {
      case 'SEARCH':
      case 'RESEARCH': {
        let query = supabase.from('content_sources').select('title, url, source, created_at, content_text');
        
        if (aiResult.topic) {
          query = query.ilike('title', `%${aiResult.topic}%`);
        }

        const now = new Date();
        if (aiResult.timeframe === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
          query = query.gte('created_at', weekAgo);
        } else if (aiResult.timeframe === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
          query = query.gte('created_at', monthAgo);
        }

        const { data: sources } = await query
          .order('created_at', { ascending: false })
          .limit(aiResult.count || 10);

        if (aiResult.action === 'RESEARCH' && sources && sources.length > 0) {
          const researchResp = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{
              role: 'user',
              content: `Resuma estas ${sources.length} notícias sobre "${aiResult.topic}" e extraia 3 tendências principais para PMEs:\n\n${sources.map(s => `- ${s.title}: ${s.content_text?.substring(0, 200)}`).join('\n')}`
            }]
          });
          actionResult = {
            summary: researchResp.choices[0]?.message?.content,
            sources: sources.map(s => ({ title: s.title, url: s.url, source: s.source })),
            trends: ["IA Generativa", "Conversão direta", "Personalização 1:1"] // Mock de tendências se o 8b falhar no formato
          };
        } else {
          actionResult = { sources: sources || [], total: sources?.length || 0 };
        }
        break;
      }

      case 'MULTI_GENERATE': {
        const genResp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Crie um kit estratégico de conteúdo sobre "${aiResult.topic}".
            Gere para:
            1. LinkedIn (Estratégico/Autoridade)
            2. Instagram (Visual/Engajamento)
            3. Twitter/X (Rápido/Opinativo)
            4. TikTok (Roteiro curto)
            
            Retorne em JSON:
            {
              "linkedin": { "text": "...", "hook": "..." },
              "instagram": { "caption": "...", "visual_idea": "..." },
              "twitter": { "thread": ["...", "..."] },
              "tiktok": { "script_hook": "...", "value_point": "..." }
            }`
          }],
          response_format: { type: 'json_object' }
        });

        actionResult = JSON.parse(genResp.choices[0]?.message?.content || '{}');
        
        // Registrar o insight no DB para memória do sistema
        await supabase.from('content_insights').insert({
          business_insight: `Geração multicanal sobre ${aiResult.topic}`,
          score: 9
        });
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
        actionResult = {};
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
