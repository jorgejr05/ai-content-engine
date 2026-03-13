import fetch from 'node-fetch';
import { supabase } from '../config/supabase';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    score: number;
    subreddit: string;
    permalink: string;
  };
}

const SUBREDDITS = [
  'startups',
  'smallbusiness',
  'Entrepreneur',
  'SaaS',
  'automation',
  'artificial'
];

const KEYWORDS = ['ai', 'artificial intelligence', 'llm', 'automation', 'business', 'startups', 'agents', 'saas', 'generative', 'chatbot'];

function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  return KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export async function runSocialListener() {
  console.log('🔍 Iniciando Social Listener (Reddit)...');
  let discussionsSaved = 0;

  for (const sub of SUBREDDITS) {
    try {
      console.log(`Coletando principais discussões de r/${sub}...`);
      // Usando o endpoint .json/top do Reddit (fácil e eficiente)
      const response = await fetch(`https://www.reddit.com/r/${sub}/top.json?t=day&limit=10`);
      const data: any = await response.json();

      const posts: RedditPost[] = data.data.children;

      for (const post of posts) {
        // Filtro de Relevância + Score
        const combinedText = `${post.data.title} ${post.data.selftext}`;
        if (!isRelevant(combinedText) || post.data.score < 5) continue;

        // Verificar se já existe
        const { data: existing } = await supabase
          .from('community_discussions')
          .select('id')
          .eq('external_id', post.data.id)
          .single();

        if (!existing) {
          const { error } = await supabase.from('community_discussions').insert({
            source: 'reddit',
            title: post.data.title,
            content: post.data.selftext,
            url: `https://reddit.com${post.data.permalink}`,
            external_id: post.data.id,
            score: post.data.score,
            processed: false
          });

          if (error) {
            console.error(`Erro ao salvar post do Reddit (${post.data.id}):`, error.message);
          } else {
            discussionsSaved++;
          }
        }
      }
    } catch (error: any) {
      console.error(`Erro ao processar r/${sub}:`, error.message);
    }
  }

  console.log(`✅ Social Listener concluído! ${discussionsSaved} novas discussões salvas.`);
}

if (require.main === module) {
  runSocialListener();
}
