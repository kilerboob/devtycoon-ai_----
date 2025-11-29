/**
 * Project Graph Service
 * Manages visual graph projects stored in DevFS
 * Path structure: /projects/{projectId}/
 *   - meta.json - project metadata
 *   - graph.json - node graph data
 *   - code/{filename}.{ext} - generated code files
 */

import { devFsService } from './devFsService';
import { GraphNode, GraphConnection, ProgrammingLanguage } from '../types';

export interface ProjectGraph {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  nodes: GraphNode[];
  connections: GraphConnection[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  language: ProgrammingLanguage;
  createdAt: number;
  updatedAt: number;
  version: number;
}

class ProjectGraphService {
  private basePath = '/projects';
  private autosaveTimers: Map<string, number> = new Map();
  private AUTOSAVE_INTERVAL = 30000; // 30 seconds

  /**
   * Initialize projects folder structure
   */
  async init(): Promise<void> {
    try {
      const exists = await devFsService.getEntry(this.basePath);
      if (!exists) {
        await devFsService.createFolder(this.basePath);
        console.info('[ProjectGraphService] Created /projects folder');
      }
    } catch (e) {
      console.error('[ProjectGraphService:init] Failed', e);
    }
  }

  /**
   * Get project path
   */
  private getProjectPath(projectId: string): string {
    return `${this.basePath}/${projectId}`;
  }

  /**
   * Create a new project
   */
  async createProject(name: string, language: ProgrammingLanguage = 'javascript'): Promise<ProjectGraph> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectPath = this.getProjectPath(id);
    
    // Create project folder structure
    await devFsService.createFolder(projectPath);
    await devFsService.createFolder(`${projectPath}/code`);
    
    const now = Date.now();
    
    // Create metadata
    const meta: ProjectMeta = {
      id,
      name,
      language,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    await devFsService.createFile(`${projectPath}/meta.json`, JSON.stringify(meta, null, 2));
    
    // Create empty graph
    const graph: ProjectGraph = {
      id,
      name,
      language,
      nodes: [],
      connections: [],
      createdAt: now,
      updatedAt: now,
    };
    await devFsService.createFile(`${projectPath}/graph.json`, JSON.stringify(graph, null, 2));
    
    console.info('[ProjectGraphService] Created project:', name);
    return graph;
  }

  /**
   * Load a project by ID
   */
  async loadProject(projectId: string): Promise<ProjectGraph | null> {
    try {
      const graphPath = `${this.getProjectPath(projectId)}/graph.json`;
      const entry = await devFsService.getEntry(graphPath);
      
      if (!entry || entry.type !== 'file') {
        console.warn('[ProjectGraphService] Project not found:', projectId);
        return null;
      }
      
      const graph = JSON.parse((entry as any).content || '{}') as ProjectGraph;
      return graph;
    } catch (e) {
      console.error('[ProjectGraphService:loadProject] Failed', e);
      return null;
    }
  }

  /**
   * Save project graph
   */
  async saveProject(project: ProjectGraph): Promise<void> {
    try {
      const projectPath = this.getProjectPath(project.id);
      const graphPath = `${projectPath}/graph.json`;
      
      // Update timestamp
      project.updatedAt = Date.now();
      
      await devFsService.createFile(graphPath, JSON.stringify(project, null, 2));
      
      // Also update meta
      const metaPath = `${projectPath}/meta.json`;
      const metaEntry = await devFsService.getEntry(metaPath);
      if (metaEntry && metaEntry.type === 'file') {
        const meta = JSON.parse((metaEntry as any).content || '{}') as ProjectMeta;
        meta.updatedAt = Date.now();
        meta.version = (meta.version || 0) + 1;
        await devFsService.createFile(metaPath, JSON.stringify(meta, null, 2));
      }
      
      console.info('[ProjectGraphService] Saved project:', project.name);
    } catch (e) {
      console.error('[ProjectGraphService:saveProject] Failed', e);
      throw e;
    }
  }

  /**
   * Save generated code to project
   */
  async saveGeneratedCode(projectId: string, filename: string, code: string): Promise<void> {
    try {
      const codePath = `${this.getProjectPath(projectId)}/code/${filename}`;
      await devFsService.createFile(codePath, code);
      console.info('[ProjectGraphService] Saved code:', filename);
    } catch (e) {
      console.error('[ProjectGraphService:saveGeneratedCode] Failed', e);
    }
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectMeta[]> {
    try {
      const entries = await devFsService.listFolder(this.basePath);
      const projects: ProjectMeta[] = [];
      
      for (const entry of entries) {
        if (entry.type === 'folder') {
          const metaPath = `${this.basePath}/${entry.name}/meta.json`;
          const metaEntry = await devFsService.getEntry(metaPath);
          
          if (metaEntry && metaEntry.type === 'file') {
            try {
              const meta = JSON.parse((metaEntry as any).content || '{}') as ProjectMeta;
              projects.push(meta);
            } catch (parseErr) {
              console.warn('[ProjectGraphService] Failed to parse meta for:', entry.name);
            }
          }
        }
      }
      
      // Sort by updatedAt descending
      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      console.error('[ProjectGraphService:listProjects] Failed', e);
      return [];
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const projectPath = this.getProjectPath(projectId);
      await devFsService.deleteEntry(projectPath, true);
      this.stopAutosave(projectId);
      console.info('[ProjectGraphService] Deleted project:', projectId);
    } catch (e) {
      console.error('[ProjectGraphService:deleteProject] Failed', e);
      throw e;
    }
  }

  /**
   * Get file versions for a project file
   */
  async getFileVersions(projectId: string, filename: string = 'graph.json'): Promise<Array<{id: string, timestamp: number, content: string}>> {
    try {
      const filePath = `${this.getProjectPath(projectId)}/${filename}`;
      // Use the extended devFsService methods
      const versions = await (devFsService as any).getVersions(filePath);
      return versions.map((v: any) => ({ id: v.id, timestamp: v.timestamp, content: v.content }));
    } catch (e) {
      console.error('[ProjectGraphService:getFileVersions] Failed', e);
      return [];
    }
  }

  /**
   * Restore a file version
   */
  async restoreVersion(projectId: string, filename: string, versionId: string): Promise<void> {
    try {
      const filePath = `${this.getProjectPath(projectId)}/${filename}`;
      await (devFsService as any).restoreVersion(filePath, versionId);
      console.info('[ProjectGraphService] Restored version:', versionId);
    } catch (e) {
      console.error('[ProjectGraphService:restoreVersion] Failed', e);
      throw e;
    }
  }

  /**
   * Start autosave for a project
   */
  startAutosave(project: ProjectGraph, onSave: () => void): void {
    this.stopAutosave(project.id);
    
    const timerId = window.setInterval(async () => {
      try {
        await this.saveProject(project);
        onSave();
      } catch (e) {
        console.error('[ProjectGraphService] Autosave failed:', e);
      }
    }, this.AUTOSAVE_INTERVAL);
    
    this.autosaveTimers.set(project.id, timerId);
    console.info('[ProjectGraphService] Started autosave for:', project.name);
  }

  /**
   * Stop autosave for a project
   */
  stopAutosave(projectId: string): void {
    const timerId = this.autosaveTimers.get(projectId);
    if (timerId) {
      window.clearInterval(timerId);
      this.autosaveTimers.delete(projectId);
    }
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string): Promise<ProjectMeta[]> {
    const projects = await this.listProjects();
    const lowerQuery = query.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.description?.toLowerCase().includes(lowerQuery))
    );
  }
}

export const projectGraphService = new ProjectGraphService();
