import { supabase } from '../config/supabase';
import { groq } from '../config/groq';

export async function runContentGenerator() {
  console.log('📝 Iniciando o Content Multiplier (Flywheel)...');

  // 1. Busca insights que ainda não foram transformados em pacotes de conteúdo
  const { data: insights, error: insightError } = await supabase
    .from('content_insights')
    .select(`
        id,
        business_insight,
        score,
        content_sources(title, content, url),
        community_discussions(title, content, url)
    `)
    .eq('processed', false)
    .gt('score', 6) // Focar apenas em insights de alta qualidade
    .limit(3);

  if (insightError || !insights || insights.length === 0) {
    console.log('Nenhum insight novo (Score > 6) disponível para multiplicação.');
    return;
  }

  console.log(`Gerando pacotes Flywheel para ${insights.length} insights...`);

  for (const insight of insights) {
    try {
      const source = insight.content_sources || insight.community_discussions;
      const title = source?.title || 'Tema em Alta';
      const rawContent = source?.content || '';

      console.log(`🚀 Criando pacote para: ${title}`);

      // PASSO 1: Gerar o Artigo Master (Blog)
      const masterPrompt = `Você é um estrategista de conteúdo para PMEs.
Com base neste insight: "${insight.business_insight}" 
E neste contexto: "${rawContent}"

Crie um ARTIGO COMPLETO (Blog) focado em autoridade e educação para empresários.
O artigo deve ser estruturado com: Título chamativo, Introdução, Problema, Solução com IA e Conclusão.

Responda em formato JSON:
{
  "title": "string",
  "content": "string (markdown permitido)",
  "summary": "uma frase curta resumindo o valor"
}`;

      const masterResp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: masterPrompt }],
        response_format: { type: 'json_object' }
      });

      const masterData = JSON.parse(masterResp.choices[0]?.message?.content || '{}');

      // Salvar o Post Master
      const { data: masterRecord, error: masterError } = await supabase.from('generated_posts').insert({
        insight_id: insight.id,
        platform: 'blog',
        platform_type: 'master_article',
        content_json: masterData,
        status: 'pending'
      }).select().single();

      if (masterError || !masterRecord) throw masterError;

      const masterId = masterRecord.id;

      // PASSO 2: Derivação (Flywheel) - LinkedIn & Instagram
      const flywheelPrompt = `Com base no artigo abaixo, gere 3 peças de conteúdo curtas:
1. Post LinkedIn (Hook + Storytelling + Call To Action)
2. Script de Carrossel Instagram (Texto para 6 slides)
3. Script de Vídeo Curto/Reels (Roteiro de 30-40 segundos)

Artigo Master: ${masterData.content}

Responda EXCLUSIVAMENTE em formato JSON:
{
  "linkedin": { "text": "..." },
  "instagram_carousel": { "slides": ["...", "...", "..."] },
  "video_script": { "script": "..." }
}`;

      const flywheelResp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: flywheelPrompt }],
        response_format: { type: 'json_object' }
      });

      const flywheelData = JSON.parse(flywheelResp.choices[0]?.message?.content || '{}');

      // Salvar os conteúdos derivados vinculados ao master
      const updates = [
        { insight_id: insight.id, master_post_id: masterId, platform: 'linkedin', platform_type: 'derived', content_json: flywheelData.linkedin, status: 'pending' },
        { insight_id: insight.id, master_post_id: masterId, platform: 'instagram', platform_type: 'carousel', content_json: flywheelData.instagram_carousel, status: 'pending' },
        { insight_id: insight.id, master_post_id: masterId, platform: 'video', platform_type: 'script', content_json: flywheelData.video_script, status: 'pending' }
      ];

      await supabase.from('generated_posts').insert(updates);

      // Marcar insight como processado
      await supabase.from('content_insights').update({ processed: true }).eq('id', insight.id);

      console.log(`✅ Pacote Flywheel criado com sucesso: ${title}`);

    } catch (e: any) {
      console.error(`Erro no Flywheel para o insight ${insight.id}:`, e.message);
    }
  }

  console.log('🏁 Geração Flywheel finalizada.');
}

if (require.main === module) {
  runContentGenerator();
}
