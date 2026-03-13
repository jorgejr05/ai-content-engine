import { supabase } from '../config/supabase';
import { groq } from '../config/groq';

export async function runContentGenerator() {
  console.log('📝 Iniciando o Content Generator...');

  // Busca os insights gerados e que ainda não viraram posts (baseado no status da tabela ou posts vinculados)
  // Como não criamos um campo 'processed' em insights, vamos pegar os top 5 recentes que não tem post gerado
  
  const { data: insights, error: insightError } = await supabase
    .from('content_insights')
    .select(`
        id,
        business_insight,
        content_sources(title, content, url)
    `)
    // Filtrar apenas insights que ainda não têm um post relacionado? 
    // Para simplificar essa engine sem queries complexas iniciais, vamos pegar os últimos limitados.
    // O ideal seria criar um campo processed no insight, mas podemos adicionar agora via query se der.
    .limit(3);

  if (insightError || !insights || insights.length === 0) {
    console.log('Nenhum insight novo disponível.');
    process.exit(0);
  }

  console.log(`Gerando posts para ${insights.length} insights...`);

  for (const insight of insights) {
      const sourceData = insight.content_sources;
      const source = Array.isArray(sourceData) ? sourceData[0] : sourceData;
      
      const prompt = `Você é um copywriter especialista em IA para pequenas e médias empresas.
Crie um post para o LinkedIn com base nesta notícia e neste insight de negócios.
O post deve focar em gerar leads para uma consultoria de IA.

News Title: ${source?.title || 'Sem título'}
Insight de negócio: ${insight.business_insight}

Estrutura EXIGIDA:
1. Hook forte (chamar atenção do empresário)
2. Explicação da tecnologia/notícia
3. Impacto real no negócio (tempo ganho, custos cortados)
4. Call to action (Exemplo: Comente "IA" para uma análise gratuita)

Responda EXCLUSIVAMENTE em formato JSON com o conteúdo final.
{
  "hook": "string",
  "body": "string",
  "cta": "string",
  "full_post": "string com o texto completo formatado"
}`;

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          });
    
          const result = JSON.parse(response.choices[0]?.message?.content || '{}');
          
          if(result.full_post) {
              await supabase.from('generated_posts').insert({
                 insight_id: insight.id,
                 platform: 'linkedin',
                 content_json: result,
                 status: 'pending' 
              });
              console.log(`✅ Post do LinkedIn gerado e salvo para o insight ID: ${insight.id}`);
          }
    } catch (e: any) {
        console.error('Erro ao gerar post:', e.message);
    }
  }

  console.log('🏁 Geração finalizada.');
  process.exit(0);
}

if (require.main === module) {
  runContentGenerator();
}
