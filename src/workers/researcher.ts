import { supabase } from '../config/supabase';
import { groq } from '../config/groq';
import fetch from 'node-fetch';

/**
 * Este worker investiga temas de tendência ativamente.
 * Requer uma Search API (ex: Tavily ou Serper) para funcionar plenamente.
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function runResearcher() {
  console.log('🔍 Iniciando o Autonomous Researcher...');

  // 1. Definir temas para pesquisar (Pode vir de uma tabela ou IA)
  const queries = [
    'principais dores de PMEs com inteligência artificial 2026',
    'novas ferramentas de automação de vendas com agentes de IA',
    'tendências de marketing de conteúdo para pequenos negócios 2026'
  ];

  for (const query of queries) {
    try {
      console.log(`Investigando: "${query}"...`);

      let findings = "";

      if (TAVILY_API_KEY) {
        // Busca real via Tavily (API otimizada para LLMs)
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: 'advanced',
            max_results: 5
          })
        });
        const data: any = await response.json();
        findings = JSON.stringify(data.results);
      } else {
        console.warn('⚠️ TAVILY_API_KEY não encontrada. Usando modo simulação.');
        findings = "Simulação: O pesquisador encontrou que agentes de IA para suporte via WhatsApp são a maior tendência para 2026 em PMEs.";
      }

      // 2. Usar a Groq para extrair insights da pesquisa
      const analysisPrompt = `Você é um Analista de Tendências sênior.
Com base nos seguintes resultados de pesquisa sobre: "${query}"

Resultados: ${findings}

Identifique a TENDÊNCIA MAIS QUENTE e um INSIGHT DE NEGÓCIO para PMEs.
Dê um score de 0 a 10 para o potencial de viralização deste tema.

Responda em JSON:
{
  "trend_title": "string",
  "business_insight": "string",
  "viral_score": number,
  "raw_context": "resumo dos achados"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: analysisPrompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.viral_score > 7) {
        // Criar o tópico de pesquisa e o insight vinculado
        const { data: topic } = await supabase.from('research_topics').insert({
          query: query,
          status: 'completed',
          findings: result
        }).select().single();

        if (topic) {
          await supabase.from('content_insights').insert({
            research_topic_id: topic.id,
            business_insight: result.business_insight,
            score: result.viral_score
          });
          console.log(`✅ Nova Tendência Detectada: ${result.trend_title} (Score: ${result.viral_score})`);
        }
      }

    } catch (e: any) {
      console.error(`Erro na pesquisa: ${e.message}`);
    }
  }

  console.log('🏁 Pesquisa finalizada.');
}

if (require.main === module) {
  runResearcher();
}
