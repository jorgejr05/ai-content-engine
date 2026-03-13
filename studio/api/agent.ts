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
          content: `Você é o agente de IA do AI Content Studio. Interprete comandos do usuário.

Capacidades:
1. SEARCH - Pesquisar notícias sobre um tema nos feeds cadastrados
2. ANALYZE - Analisar um tema e gerar insights de negócios
3. GENERATE - Gerar conteúdo (posts) a partir de um tema
4. STATUS - Mostrar estatísticas do sistema
5. CHAT - Responder perguntas gerais

Responda SEMPRE em JSON:
{
  "action": "SEARCH" | "ANALYZE" | "GENERATE" | "STATUS" | "CHAT",
  "topic": "tema extraído (se aplicável)",
  "response": "resposta conversacional",
  "details": {}
}`
        },
        { role: 'user', content: message }
      ],
      response_format: { type: 'json_object' }
    });

    const aiResult = JSON.parse(intentResponse.choices[0]?.message?.content || '{}');
    let actionResult: any = {};

    switch (aiResult.action) {
      case 'SEARCH': {
        const { data: sources } = await supabase
          .from('content_sources')
          .select('title, url, source, created_at')
          .ilike('title', `%${aiResult.topic}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: discussions } = await supabase
          .from('community_discussions')
          .select('title, url, source, created_at')
          .ilike('title', `%${aiResult.topic}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        actionResult = {
          sources: sources || [],
          discussions: discussions || [],
          total: (sources?.length || 0) + (discussions?.length || 0)
        };
        break;
      }

      case 'ANALYZE': {
        const analysisResp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Analise "${aiResult.topic}" para oportunidades de conteúdo para PMEs.
Responda em JSON:
{
  "insight": "string",
  "content_angles": ["ângulo 1", "ângulo 2", "ângulo 3"],
  "target_audience": "string",
  "viral_potential": number (0-10)
}`
          }],
          response_format: { type: 'json_object' }
        });

        actionResult = JSON.parse(analysisResp.choices[0]?.message?.content || '{}');

        if (actionResult.insight) {
          await supabase.from('content_insights').insert({
            business_insight: actionResult.insight,
            score: actionResult.viral_potential || 8
          });
        }
        break;
      }

      case 'GENERATE': {
        const genResp = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{
            role: 'user',
            content: `Crie um post LinkedIn sobre "${aiResult.topic}" para consultoria de IA para PMEs.
Responda em JSON:
{
  "hook": "string",
  "body": "string",
  "cta": "string",
  "full_post": "string completo"
}`
          }],
          response_format: { type: 'json_object' }
        });

        const postData = JSON.parse(genResp.choices[0]?.message?.content || '{}');

        if (postData.full_post) {
          await supabase.from('generated_posts').insert({
            platform: 'linkedin',
            platform_type: 'agent_generated',
            content_json: postData,
            status: 'pending'
          });
          actionResult = { post_created: true, preview: postData.hook };
        }
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

    return res.json({ success: true, action: aiResult.action, response: aiResult.response, data: actionResult });

  } catch (e: any) {
    console.error('Agent error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
