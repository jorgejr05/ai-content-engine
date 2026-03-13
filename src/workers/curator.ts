import { supabase } from '../config/supabase';
import { groq } from '../config/groq';

export async function runCurator() {
  console.log('🤖 Iniciando o Content Curator (Agente IA)...');

  // 1. Processar Notícias (RSS)
  const { data: sources } = await supabase
    .from('content_sources')
    .select('*')
    .eq('processed', false)
    .limit(10);

  if (sources && sources.length > 0) {
    console.log(`Analisando ${sources.length} notícias RSS...`);
    for (const source of sources) {
       await analyzeContent(source, 'rss');
    }
  }

  // 2. Processar Discussões de Comunidade (Reddit/HN)
  const { data: discussions } = await supabase
    .from('community_discussions')
    .select('*')
    .eq('processed', false)
    .limit(10);

  if (discussions && discussions.length > 0) {
    console.log(`Analisando ${discussions.length} discussões de comunidade...`);
    for (const discussion of discussions) {
       await analyzeContent(discussion, 'community');
    }
  }

  console.log('🏁 Curadoria finalizada.');
}

async function analyzeContent(item: any, type: 'rss' | 'community') {
    try {
      const title = item.title;
      const content = item.content || '';
      
      const prompt = `Analise este conteúdo de ${type === 'rss' ? 'notícia' : 'discussão de comunidade'}:
Título: ${title}
Conteúdo: ${content}

Classifique o potencial deste conteúdo para ser transformado em conteúdo de alto valor (como automação, ganhos de eficiência, ou ferramentas) para pequenas e médias empresas.
Dê uma nota de 0 a 10. Se a nota for maior que 7, escreva também um "insight de negócios" prático e estratégico.

Responda exclusivamente no formato JSON:
{
  "score": number,
  "business_insight": "string ou null"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.score > 7 && result.business_insight) {
        const insertData: any = {
          business_insight: result.business_insight,
          score: result.score
        };

        if (type === 'rss') insertData.source_id = item.id;
        else insertData.discussion_id = item.id;

        await supabase.from('content_insights').insert(insertData);
        console.log(`✅ Aprovado [${type}]: '${title.substring(0, 30)}...' (Score: ${result.score})`);
      } else {
         console.log(`❌ Descartado [${type}]: '${title.substring(0, 30)}...' (Score: ${result.score || 0})`);
      }

      // Marca como processado
      const table = type === 'rss' ? 'content_sources' : 'community_discussions';
      await supabase.from(table).update({ processed: true }).eq('id', item.id);

    } catch (e: any) {
      console.error(`Erro ao analisar ${type} ID ${item.id}:`, e.message);
    }
}

if (require.main === module) {
  runCurator();
}
