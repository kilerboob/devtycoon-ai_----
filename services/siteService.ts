/**
 * Site Service
 * Manages websites stored in DevFS
 * Path structure: /sites/{siteName}/
 *   - index.html - main page
 *   - style.css - optional stylesheet
 *   - script.js - optional JavaScript
 */

import { devFsService } from './devFsService';
import { DevFile, DevFolder } from '../types';

export interface SiteMeta {
  name: string;
  title?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SiteContent {
  html: string;
  css?: string;
  js?: string;
}

class SiteService {
  private basePath = '/sites';

  /**
   * Initialize sites folder structure
   */
  async init(): Promise<void> {
    try {
      const exists = await devFsService.getEntry(this.basePath);
      if (!exists) {
        await devFsService.createFolder(this.basePath);
        console.info('[SiteService] Created /sites folder');
        
        // Create a demo site
        await this.createSite('demo', {
          html: `<!DOCTYPE html>
<html>
<head>
  <title>Demo Site</title>
  <style>
    body { font-family: system-ui; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; }
    .card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>🌐 Welcome to DevOS Web</h1>
  <p>This is a demo site hosted on DevFS!</p>
  <div class="card">
    <h3>📁 Your Site Structure</h3>
    <code>/sites/demo/index.html</code>
  </div>
</body>
</html>`,
        });
      }
    } catch (e) {
      console.error('[SiteService:init] Failed', e);
    }
  }

  /**
   * Get site path
   */
  private getSitePath(siteName: string): string {
    return `${this.basePath}/${siteName}`;
  }

  /**
   * Create a new site
   */
  async createSite(name: string, content: SiteContent): Promise<void> {
    const sitePath = this.getSitePath(name);
    
    // Create site folder
    await devFsService.createFolder(sitePath);
    
    // Create index.html
    await devFsService.createFile(`${sitePath}/index.html`, content.html);
    
    // Create optional files
    if (content.css) {
      await devFsService.createFile(`${sitePath}/style.css`, content.css);
    }
    if (content.js) {
      await devFsService.createFile(`${sitePath}/script.js`, content.js);
    }
    
    console.info('[SiteService] Created site:', name);
  }

  /**
   * Load a site's content
   */
  async loadSite(siteName: string): Promise<SiteContent | null> {
    try {
      const sitePath = this.getSitePath(siteName);
      
      // Load index.html
      const htmlEntry = await devFsService.getEntry(`${sitePath}/index.html`);
      if (!htmlEntry || htmlEntry.type !== 'file') {
        return null;
      }
      
      const content: SiteContent = {
        html: (htmlEntry as DevFile).content || '',
      };
      
      // Try to load CSS
      try {
        const cssEntry = await devFsService.getEntry(`${sitePath}/style.css`);
        if (cssEntry && cssEntry.type === 'file') {
          content.css = (cssEntry as DevFile).content || '';
        }
      } catch {}
      
      // Try to load JS
      try {
        const jsEntry = await devFsService.getEntry(`${sitePath}/script.js`);
        if (jsEntry && jsEntry.type === 'file') {
          content.js = (jsEntry as DevFile).content || '';
        }
      } catch {}
      
      return content;
    } catch (e) {
      console.error('[SiteService:loadSite] Failed', e);
      return null;
    }
  }

  /**
   * List all sites
   */
  async listSites(): Promise<SiteMeta[]> {
    try {
      const entries = await devFsService.listFolder(this.basePath);
      const sites: SiteMeta[] = [];
      
      for (const entry of entries) {
        if (entry.type === 'folder') {
          sites.push({
            name: entry.name,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          });
        }
      }
      
      return sites.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error('[SiteService:listSites] Failed', e);
      return [];
    }
  }

  /**
   * Delete a site
   */
  async deleteSite(siteName: string): Promise<void> {
    try {
      const sitePath = this.getSitePath(siteName);
      await devFsService.deleteEntry(sitePath, true);
      console.info('[SiteService] Deleted site:', siteName);
    } catch (e) {
      console.error('[SiteService:deleteSite] Failed', e);
      throw e;
    }
  }

  /**
   * Update site HTML
   */
  async updateSiteHtml(siteName: string, html: string): Promise<void> {
    const sitePath = this.getSitePath(siteName);
    await devFsService.createFile(`${sitePath}/index.html`, html);
  }

  /**
   * Render site content with inline CSS
   */
  renderSiteWithStyles(content: SiteContent): string {
    let html = content.html;
    
    // Inject CSS if present
    if (content.css) {
      html = html.replace('</head>', `<style>${content.css}</style></head>`);
    }
    
    // Note: JS is NOT executed for security reasons
    // It's displayed as a comment
    if (content.js) {
      html = html.replace('</body>', `<!-- Script disabled for security: ${content.js.length} bytes --></body>`);
    }
    
    return html;
  }
}

export const siteService = new SiteService();
