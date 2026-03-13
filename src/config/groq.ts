import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey || apiKey === 'your_groq_api_key_here') {
  console.warn('⚠️ GROQ_API_KEY is missing or invalid in .env file.');
}

export const groq = new Groq({
  apiKey: apiKey,
});
