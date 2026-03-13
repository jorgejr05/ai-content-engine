import { supabase } from '../config/supabase';
import { groq } from '../config/groq';

export async function runCurator() {
  console.log('🤖 Iniciando o Content Curator (Agente IA)...');

  // Busca notícias não processadas
  const { data: sources, error } = await supabase
    .from('content_sources')
    .select('*')
    .eq('processed', false)
    .limit(10); // Processar 10 por vez para não estourar rate limit rápido

  if (error || !sources || sources.length === 0) {
    console.log('Nenhuma notícia nova para curadoria.');
    process.exit(0);
  }

  console.log(`Analisando ${sources.length} notícias...`);

  for (const source of sources) {
    try {
      const prompt = `Analise esta notícia de tecnologia:
Título: ${source.title}
Conteúdo: ${source.content}

Classifique o potencial desta notícia para ser transformada em conteúdo de alto valor (como automação, ganhos de eficiência, ou ferramentas) para pequenas e médias empresas.
Dê uma nota de 0 a 10. Se a nota for maior que 7, escreva também um "insight de negócios" prático.
Responda exclusivamente no formato JSON:
{
  "score": number, // int de 0 a 10
  "business_insight": "string ou null" // null se score <= 7
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      if (result.score > 7 && result.business_insight) {
        // Salva o insight
        await supabase.from('content_insights').insert({
          source_id: source.id,
          business_insight: result.business_insight,
          score: result.score
        });
        console.log(`✅ Aprovada: '${source.title.substring(0, 30)}...' (Score: ${result.score}) -> Insight salvo.`);
      } else {
         console.log(`❌ Descartada: '${source.title.substring(0, 30)}...' (Score: ${result.score || 0})`);
      }

      // Marca a notícia como processada
      await supabase.from('content_sources').update({ processed: true }).eq('id', source.id);

    } catch (e: any) {
      console.error(`Erro ao analisar a notícia ID ${source.id}:`, e.message);
    }
  }
  console.log('🏁 Curadoria finalizada.');
  process.exit(0);
}

if (require.main === module) {
  runCurator();
}
