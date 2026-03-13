import Parser from 'rss-parser';
import { supabase } from '../config/supabase';

const parser = new Parser();

// Lista de Feeds RSS para monitorar
const FEEDS = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml' }
];

export async function runScraper() {
  console.log('🚀 Iniciando o Trend Hunter (Scraper)...');
  let itemsSaved = 0;

  for (const feed of FEEDS) {
    try {
      console.log(`Buscando notícias de: ${feed.name}`);
      const feedData = await parser.parseURL(feed.url);

      for (const item of feedData.items) {
        // Verificar se já existe no banco (pela URL)
        const { data: existing } = await supabase
          .from('content_sources')
          .select('id')
          .eq('url', item.link)
          .single();

        if (!existing) {
          // Salva nova notícia
          const { error } = await supabase.from('content_sources').insert({
            title: item.title || 'Sem título',
            content: item.contentSnippet || item.content || '',
            source: feed.name,
            url: item.link || '',
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            processed: false,
          });

          if (error) {
            console.error(`Erro ao salvar notícia de ${feed.name}:`, error.message);
          } else {
            itemsSaved++;
          }
        }
      }
    } catch (error: any) {
      console.error(`Erro ao processar o feed ${feed.name}:`, error.message);
    }
  }

  console.log(`✅ Concluído! ${itemsSaved} novas notícias salvas.`);
}

// Permitir execução direta pelo terminal
if (require.main === module) {
  runScraper();
}
