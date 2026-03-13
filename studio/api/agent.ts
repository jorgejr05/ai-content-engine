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
    // Ações Diretas
    if (action === 'SAVE_TO_CENTRAL') {
      const { platforms = [], platform, content } = details || {};
      
      // Suporte para salvar KIT completo (Bulk Save)
      if (platforms.length > 0) {
        const { error } = await supabase.from('generated_posts').insert(
          platforms.map((p: any) => ({
            platform: p.id,
            content_json: p.content,
            status: 'pending'
          }))
        );
        return res.json({ success: !error });
      }

      // Suporte para salvamento individual
      const { error } = await supabase.from('generated_posts').insert({
        platform,
        content_json: content,
        status: 'pending'
      });
      return res.json({ success: !error });
    }

    if (action === 'AI_EDIT') {
      const { currentContent, instruction } = details || {};
      const editResp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Atue como Editor-Chefe. Refine o conteúdo JSON abaixo seguindo esta instrução: "${instruction}".
          Mantenha estritamente o mesmo formato de dados (mesmas chaves do JSON).
          
          Conteúdo Atual: ${JSON.stringify(currentContent)}
          
          Retorne APENAS o JSON do novo conteúdo.`
        }],
        response_format: { type: 'json_object' }
      });
      return res.json({ success: true, newContent: JSON.parse(editResp.choices[0]?.message?.content || '{}') });
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

    // 1. Contexto de Aprendizado
    const { data: learning } = await supabase
      .from('ai_feedback')
      .select('content_topic')
      .eq('is_positive', true)
      .limit(5);

    const learnPrompt = learning?.length 
      ? `Estilo preferido do usuário: ${learning.map(l => l.content_topic).join(', ')}.` 
      : '';

    // 2. Classificação de Intenção (Pipeline Vision)
    const intentResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Você é o "Editor-Chefe" do ecossistema AI Content Studio.
Sua missão: Orquestrar o Pipeline Editorial (Busca -> Análise -> Viral Score -> Geração).

Capacidades:
- SEARCH: Busca rasa por notícias.
- RESEARCH: Fluxo Editorial Automático (Análise profunda, Impacto de Negócio, Ideias de Conteúdo e Viral Score).
- MULTI_GENERATE: Geração multicanal com Strategy Layer (Autoridade, Viral, Leads, Educativo).
- STATUS: Saúde do sistema de coleta.

Diretriz: Seja estratégico e analítico. ${learnPrompt}

Responda em JSON:
{
  "action": "SEARCH" | "RESEARCH" | "MULTI_GENERATE" | "STATUS" | "CHAT",
  "topic": "nicho/tema",
  "strategy": "Autoridade" | "Viral" | "Leads" | "Educativo",
  "response": "texto humanizado",
  "next_suggestion": "dica proativa"
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
        let query = supabase.from('content_sources').select('id, title, url, source, content_text');
        if (aiResult.topic) query = query.ilike('title', `%${aiResult.topic}%`);

        const { data: sources } = await query.order('created_at', { ascending: false }).limit(6);

        if (aiResult.action === 'RESEARCH' && sources && sources.length > 0) {
          const researchResp = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: `Atue como Editor-Chefe. Para cada notícia abaixo, gere um relatório estruturado em JSON com:
              - title: Título da notícia
              - summary: Resumo executivo (2 frases)
              - impact: Impacto real para o negócio do usuário (PMEs/Ecommerce)
              - content_ideas: 3 ideias rápidas de posts
              - viral_score: Uma nota de 0 a 10 para o potencial de engajamento.

              Notícias:
              ${sources.map(s => `- ${s.title}: ${s.content_text?.substring(0, 400)}`).join('\n')}
              
              Retorne apenas o JSON: { "reports": [...] }`
            }],
            response_format: { type: 'json_object' }
          });
          actionResult = JSON.parse(researchResp.choices[0]?.message?.content || '{ "reports": [] }');
        } else {
          actionResult = { sources: sources || [] };
        }
        break;
      }

      case 'MULTI_GENERATE': {
        const strategy = aiResult.strategy || 'Autoridade';
        const genResp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Flywheel Gen Total (Estratégia: ${strategy}): Crie um kit de conteúdo COMPLETO sobre "${aiResult.topic}".
            
            Obrigatório gerar para as 4 redes abaixo:
            1. LinkedIn: Texto analítico de alta autoridade.
            2. Instagram: Carrossel estratégico com 5 a 7 slides impactantes.
            3. TikTok: Roteiro com gancho (hook), desenvolvimento e CTA.
            4. Twitter/X: Thread ou post direto engajador.
            
            Cada rede deve ter:
            - Content (slides array ou text string)
            - Suggestion (melhor horário, hashtags e por que postar lá).
            
            Retorne em JSON estruturado:
            {
              "linkedin": { "text": "...", "suggestion": "..." },
              "instagram": { "slides": ["...", "..."], "suggestion": "..." },
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
        const [{ count: sources }, { count: insights }] = await Promise.all([
          supabase.from('content_sources').select('*', { count: 'exact', head: true }),
          supabase.from('content_insights').select('*', { count: 'exact', head: true })
        ]);
        actionResult = { sources, insights };
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
    console.error('Editor error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
