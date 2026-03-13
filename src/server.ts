import express, { Request, Response } from 'express';
import cors from 'cors';
import { publishPost } from './workers/publisher';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/api/publish', async (req: Request, res: Response) => {
    const { postId } = req.body;

    if (!postId) {
        res.status(400).json({ success: false, error: 'postId não fornecido' });
        return;
    }

    // Chama o worker conectando na Buffer API
    const result = await publishPost(postId);

    if (result?.success) {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API backend rodando na porta ${PORT}`);
    console.log(`Endpoint de publicação: POST http://localhost:${PORT}/api/publish`);
});
