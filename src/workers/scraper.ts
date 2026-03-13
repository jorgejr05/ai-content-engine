import Parser from 'rss-parser';
import { supabase } from '../config/supabase';

const parser = new Parser();

// Matriz de Feeds Expandida (30+ fontes de alto valor)
const FEEDS = [
  // Portais de Notícias & Tech
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
  
  // Labs de IA & Big Tech
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss.xml' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/rss/' },
  { name: 'NVIDIA Dev Blog', url: 'https://developer.nvidia.com/blog/feed/' },
  { name: 'Stability AI', url: 'https://stability.ai/blog/rss' },
  { name: 'Cohere Blog', url: 'https://cohere.com/blog/rss.xml' },

  // Engenharia & Lab Pesquisa
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'LangChain Blog', url: 'https://blog.langchain.dev/rss/' },
  { name: 'BAIR Blog', url: 'https://bair.berkeley.edu/blog/feed.xml' },
  { name: 'DeepLearning.ai', url: 'https://www.deeplearning.ai/the-batch/feed/' },
  { name: 'Replicate Blog', url: 'https://replicate.com/blog/rss.xml' },

  // VCs & Startups (Tendências de Negócio)
  { name: 'Y Combinator', url: 'https://www.ycombinator.com/blog/rss.xml' },
  { name: 'Andreessen Horowitz', url: 'https://a16z.com/feed/' },
  { name: 'Sequoia Capital', url: 'https://www.sequoiacap.com/feed/' },
  { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/' },

  // Brasil (Conteúdo Local)
  { name: 'StartSe', url: 'https://www.startse.com/feed/' },
  { name: 'Tecnoblog', url: 'https://tecnoblog.net/feed/' },
  { name: 'Canaltech', url: 'https://canaltech.com.br/rss/' }
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
