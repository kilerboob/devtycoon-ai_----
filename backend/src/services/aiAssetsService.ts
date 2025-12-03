import { getDb } from '../db';
import axios from 'axios';

interface AIAssetRequest {
  prompt: string;
  type: 'furniture' | '3d_model' | 'texture' | 'icon';
  style?: string;
}

interface AIAssetResponse {
  asset_id: string;
  url: string;
  metadata: {
    prompt: string;
    type: string;
    generated_at: string;
  };
}

export class AIAssetsService {
  /**
   * Generate AI asset for furniture (LAYER 20)
   * In production, this would call Stable Diffusion, DALL-E, or 3D generation API
   * For now, returns placeholder asset_id
   */
  async generateAsset(request: AIAssetRequest): Promise<AIAssetResponse> {
    const asset_id = `ai_${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      // Fallback to placeholder if key missing
      return {
        asset_id,
        url: `https://placeholder.ai/assets/${asset_id}.png`,
        metadata: {
          prompt: request.prompt,
          type: request.type,
          generated_at: new Date().toISOString(),
        },
      };
    }

    // Build prompt with optional style
    const fullPrompt = request.style
      ? `${request.prompt}, style: ${request.style}`
      : request.prompt;

    try {
      // Stability AI v2beta core image generate endpoint (PNG binary response)
      const response = await axios.post(
        'https://api.stability.ai/v2beta/stable-image/generate/core',
        {
          prompt: fullPrompt,
          aspect_ratio: '1:1',
          output_format: 'png'
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const base64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;

      return {
        asset_id,
        url: dataUrl,
        metadata: {
          prompt: fullPrompt,
          type: request.type,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      console.error('[AIAssetsService] Stability API error:', err?.response?.data || err.message);
      // Graceful fallback
      return {
        asset_id,
        url: `https://placeholder.ai/assets/${asset_id}.png`,
        metadata: {
          prompt: fullPrompt,
          type: request.type,
          generated_at: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Save generated asset metadata to database
   */
  async saveAsset(asset: AIAssetResponse): Promise<void> {
    const pool = getDb();
    await pool.query(
      `INSERT INTO ai_assets (asset_id, url, prompt, type, generated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (asset_id) DO NOTHING`,
      [
        asset.asset_id,
        asset.url,
        asset.metadata.prompt,
        asset.metadata.type,
        asset.metadata.generated_at,
      ]
    );
  }

  /**
   * Get asset by ID
   */
  async getAsset(asset_id: string): Promise<AIAssetResponse | null> {
    const pool = getDb();
    const { rows } = await pool.query(
      'SELECT * FROM ai_assets WHERE asset_id = $1',
      [asset_id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      asset_id: row.asset_id,
      url: row.url,
      metadata: {
        prompt: row.prompt,
        type: row.type,
        generated_at: row.generated_at,
      },
    };
  }

  /**
   * List all assets
   */
  async listAssets(type?: string): Promise<AIAssetResponse[]> {
    const pool = getDb();
    const query = type
      ? 'SELECT * FROM ai_assets WHERE type = $1 ORDER BY generated_at DESC'
      : 'SELECT * FROM ai_assets ORDER BY generated_at DESC';
    
    const { rows } = type
      ? await pool.query(query, [type])
      : await pool.query(query);
    
    return rows.map((row) => ({
      asset_id: row.asset_id,
      url: row.url,
      metadata: {
        prompt: row.prompt,
        type: row.type,
        generated_at: row.generated_at,
      },
    }));
  }
}

export const aiAssetsService = new AIAssetsService();
