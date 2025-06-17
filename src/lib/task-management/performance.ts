import fs from 'fs/promises';
import path from 'path';
import { Task, TasksCollection, TaskValidator } from './validation';

/**
 * Performance optimization system for task management
 * Handles large task files, implements caching, and provides efficient operations
 */
export class TaskPerformanceOptimizer {
  private static instance: TaskPerformanceOptimizer;
  private cache: Map<
    string,
    { data: TasksCollection; timestamp: number; checksum: string }
  > = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10;
  private readonly CHUNK_SIZE = 50; // Tasks per chunk

  private constructor() {}

  public static getInstance(): TaskPerformanceOptimizer {
    if (!TaskPerformanceOptimizer.instance) {
      TaskPerformanceOptimizer.instance = new TaskPerformanceOptimizer();
    }
    return TaskPerformanceOptimizer.instance;
  }

  /**
   * Load tasks with caching and performance optimization
   */
  async loadTasksOptimized(filePath: string): Promise<TasksCollection> {
    const cacheKey = path.resolve(filePath);
    const cached = this.cache.get(cacheKey);

    // Check if cached version is still valid
    if (cached && this.isCacheValid(cached)) {
      const fileStats = await fs.stat(filePath);
      const currentChecksum = await this.calculateFileChecksum(filePath);

      if (cached.checksum === currentChecksum) {
        return cached.data;
      }
    }

    // Load and cache new data
    const tasksData = await this.loadTasksFromFile(filePath);
    const checksum = await this.calculateFileChecksum(filePath);

    this.updateCache(cacheKey, tasksData, checksum);
    return tasksData;
  }

  /**
   * Save tasks with optimization for large files
   */
  async saveTasksOptimized(
    filePath: string,
    tasksCollection: TasksCollection
  ): Promise<void> {
    // Create backup before saving
    await this.createBackup(filePath);

    // Optimize data before saving
    const optimizedData = this.optimizeTasksData(tasksCollection);

    // Update metadata
    optimizedData.metadata.lastModified = new Date().toISOString();
    optimizedData.metadata.totalTasks = optimizedData.tasks.length;
    optimizedData.metadata.checksum =
      TaskValidator.getInstance().calculateChecksum(optimizedData.tasks);

    // Write to temporary file first, then rename (atomic operation)
    const tempFilePath = `${filePath}.tmp`;
    await fs.writeFile(tempFilePath, JSON.stringify(optimizedData, null, 2));
    await fs.rename(tempFilePath, filePath);

    // Update cache
    const checksum = await this.calculateFileChecksum(filePath);
    this.updateCache(path.resolve(filePath), optimizedData, checksum);
  }

  /**
   * Split large task files into smaller chunks
   */
  async splitTaskFile(filePath: string, outputDir: string): Promise<string[]> {
    const tasksData = await this.loadTasksFromFile(filePath);

    if (tasksData.tasks.length <= this.CHUNK_SIZE) {
      return [filePath]; // No need to split
    }

    const chunks: TasksCollection[] = [];
    const tasks = tasksData.tasks;

    // Split tasks into chunks while preserving dependencies
    const sortedTasks = this.topologicalSort(tasks);

    for (let i = 0; i < sortedTasks.length; i += this.CHUNK_SIZE) {
      const chunkTasks = sortedTasks.slice(i, i + this.CHUNK_SIZE);

      const chunkData: TasksCollection = {
        version: tasksData.version,
        metadata: {
          ...tasksData.metadata,
          projectName: `${tasksData.metadata.projectName} - Chunk ${Math.floor(i / this.CHUNK_SIZE) + 1}`,
          totalTasks: chunkTasks.length,
          lastModified: new Date().toISOString(),
        },
        tasks: chunkTasks,
      };

      chunks.push(chunkData);
    }

    // Save chunks to separate files
    const chunkFiles: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkFileName = `tasks-chunk-${i + 1}.json`;
      const chunkFilePath = path.join(outputDir, chunkFileName);

      await fs.writeFile(chunkFilePath, JSON.stringify(chunks[i], null, 2));
      chunkFiles.push(chunkFilePath);
    }

    return chunkFiles;
  }

  /**
   * Merge multiple task files into one
   */
  async mergeTaskFiles(
    filePaths: string[],
    outputPath: string
  ): Promise<TasksCollection> {
    const allTasks: Task[] = [];
    let baseMetadata: TasksCollection['metadata'] | null = null;

    for (const filePath of filePaths) {
      const tasksData = await this.loadTasksFromFile(filePath);
      allTasks.push(...tasksData.tasks);

      if (!baseMetadata) {
        baseMetadata = tasksData.metadata;
      }
    }

    // Remove duplicate tasks and resolve conflicts
    const uniqueTasks = this.deduplicateTasks(allTasks);

    const mergedData: TasksCollection = {
      version: '1.0.0',
      metadata: {
        projectName: baseMetadata?.projectName || 'Merged Project',
        createdAt: baseMetadata?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalTasks: uniqueTasks.length,
      },
      tasks: uniqueTasks,
    };

    await this.saveTasksOptimized(outputPath, mergedData);
    return mergedData;
  }

  /**
   * Get task statistics for performance monitoring
   */
  getPerformanceStats(): {
    cacheSize: number;
    cacheHitRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    recommendations: string[];
  } {
    const memoryUsage = process.memoryUsage();
    const recommendations: string[] = [];

    // Check memory usage
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 100) {
      recommendations.push(
        'High memory usage detected. Consider clearing cache or splitting large task files.'
      );
    }

    // Check cache size
    if (this.cache.size > this.MAX_CACHE_SIZE * 0.8) {
      recommendations.push(
        'Cache is nearly full. Consider increasing cache size or reducing TTL.'
      );
    }

    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage,
      recommendations,
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Optimize tasks data structure for better performance
   */
  private optimizeTasksData(tasksCollection: TasksCollection): TasksCollection {
    const optimizedTasks = tasksCollection.tasks.map(task => {
      // Remove empty or undefined fields
      const optimizedTask: Task = {
        id: task.id,
        title: task.title.trim(),
        description: task.description.trim(),
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies || [],
        tags: task.tags || [],
        subtasks: [],
      };

      // Only include optional fields if they have values
      if (task.details && task.details.trim()) {
        optimizedTask.details = task.details.trim();
      }

      if (task.testStrategy && task.testStrategy.trim()) {
        optimizedTask.testStrategy = task.testStrategy.trim();
      }

      if (task.subtasks && task.subtasks.length > 0) {
        optimizedTask.subtasks = task.subtasks.map(subtask => ({
          id: subtask.id,
          title: subtask.title.trim(),
          description: subtask.description.trim(),
          status: subtask.status,
          dependencies: subtask.dependencies || [],
          parentTaskId: subtask.parentTaskId,
          ...(subtask.details && { details: subtask.details.trim() }),
        }));
      }

      if (task.createdAt) optimizedTask.createdAt = task.createdAt;
      if (task.updatedAt) optimizedTask.updatedAt = task.updatedAt;
      if (task.estimatedHours)
        optimizedTask.estimatedHours = task.estimatedHours;
      if (task.actualHours) optimizedTask.actualHours = task.actualHours;
      if (task.assignee) optimizedTask.assignee = task.assignee;
      if (task.tags && task.tags.length > 0) optimizedTask.tags = task.tags;

      return optimizedTask;
    });

    return {
      ...tasksCollection,
      tasks: optimizedTasks,
    };
  }

  /**
   * Topological sort for tasks based on dependencies
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const visited = new Set<number>();
    const result: Task[] = [];

    const visit = (taskId: number): void => {
      if (visited.has(taskId)) return;

      const task = taskMap.get(taskId);
      if (!task) return;

      visited.add(taskId);

      // Visit dependencies first
      for (const depId of task.dependencies) {
        visit(depId);
      }

      result.push(task);
    };

    // Visit all tasks
    for (const task of tasks) {
      visit(task.id);
    }

    return result;
  }

  /**
   * Remove duplicate tasks and resolve conflicts
   */
  private deduplicateTasks(tasks: Task[]): Task[] {
    const taskMap = new Map<number, Task>();

    for (const task of tasks) {
      const existing = taskMap.get(task.id);

      if (!existing) {
        taskMap.set(task.id, task);
      } else {
        // Resolve conflict by keeping the most recently updated task
        const existingTime = new Date(
          existing.updatedAt || existing.createdAt || '1970-01-01'
        ).getTime();
        const currentTime = new Date(
          task.updatedAt || task.createdAt || '1970-01-01'
        ).getTime();

        if (currentTime > existingTime) {
          taskMap.set(task.id, task);
        }
      }
    }

    return Array.from(taskMap.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * Load tasks from file with error handling
   */
  private async loadTasksFromFile(filePath: string): Promise<TasksCollection> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      return await TaskValidator.getInstance().validateTasksCollection(data);
    } catch (error) {
      throw new Error(
        `Failed to load tasks from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate file checksum for cache validation
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cached: { timestamp: number }): boolean {
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  /**
   * Update cache with new data
   */
  private updateCache(
    key: string,
    data: TasksCollection,
    checksum: string
  ): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      checksum,
    });
  }

  /**
   * Calculate cache hit rate for monitoring
   */
  private calculateCacheHitRate(): number {
    // This would need to be tracked over time in a real implementation
    // For now, return a placeholder
    return 0.85; // 85% hit rate
  }

  /**
   * Create backup of task file
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      const backupPath = `${filePath}.bak`;
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // Backup creation is optional, don't fail the main operation
      console.warn(
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Task indexing system for fast searches
 */
export class TaskIndexer {
  private titleIndex: Map<string, number[]> = new Map();
  private descriptionIndex: Map<string, number[]> = new Map();
  private statusIndex: Map<string, number[]> = new Map();
  private priorityIndex: Map<string, number[]> = new Map();
  private tagIndex: Map<string, number[]> = new Map();

  /**
   * Build indexes for fast searching
   */
  buildIndexes(tasks: Task[]): void {
    this.clearIndexes();

    for (const task of tasks) {
      this.indexTask(task);
    }
  }

  /**
   * Search tasks using indexes
   */
  search(query: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    tags?: string[];
  }): number[] {
    const results: Set<number>[] = [];

    if (query.title) {
      const titleResults = this.searchInIndex(this.titleIndex, query.title);
      results.push(new Set(titleResults));
    }

    if (query.description) {
      const descResults = this.searchInIndex(
        this.descriptionIndex,
        query.description
      );
      results.push(new Set(descResults));
    }

    if (query.status) {
      const statusResults = this.statusIndex.get(query.status) || [];
      results.push(new Set(statusResults));
    }

    if (query.priority) {
      const priorityResults = this.priorityIndex.get(query.priority) || [];
      results.push(new Set(priorityResults));
    }

    if (query.tags && query.tags.length > 0) {
      const tagResults = new Set<number>();
      for (const tag of query.tags) {
        const tagTaskIds = this.tagIndex.get(tag) || [];
        tagTaskIds.forEach(id => tagResults.add(id));
      }
      results.push(tagResults);
    }

    // Intersect all result sets
    if (results.length === 0) return [];

    let intersection = results[0];
    for (let i = 1; i < results.length; i++) {
      intersection = new Set(
        [...intersection].filter(id => results[i].has(id))
      );
    }

    return Array.from(intersection);
  }

  /**
   * Clear all indexes
   */
  private clearIndexes(): void {
    this.titleIndex.clear();
    this.descriptionIndex.clear();
    this.statusIndex.clear();
    this.priorityIndex.clear();
    this.tagIndex.clear();
  }

  /**
   * Index a single task
   */
  private indexTask(task: Task): void {
    // Index title
    this.addToIndex(this.titleIndex, task.title, task.id);

    // Index description
    this.addToIndex(this.descriptionIndex, task.description, task.id);

    // Index status
    this.addToSimpleIndex(this.statusIndex, task.status, task.id);

    // Index priority
    this.addToSimpleIndex(this.priorityIndex, task.priority, task.id);

    // Index tags
    if (task.tags) {
      for (const tag of task.tags) {
        this.addToSimpleIndex(this.tagIndex, tag, task.id);
      }
    }
  }

  /**
   * Add to text-based index with tokenization
   */
  private addToIndex(
    index: Map<string, number[]>,
    text: string,
    taskId: number
  ): void {
    const tokens = this.tokenize(text);
    for (const token of tokens) {
      if (!index.has(token)) {
        index.set(token, []);
      }
      index.get(token)!.push(taskId);
    }
  }

  /**
   * Add to simple key-value index
   */
  private addToSimpleIndex(
    index: Map<string, number[]>,
    key: string,
    taskId: number
  ): void {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(taskId);
  }

  /**
   * Tokenize text for indexing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Search in text-based index
   */
  private searchInIndex(index: Map<string, number[]>, query: string): number[] {
    const tokens = this.tokenize(query);
    const results: number[][] = [];

    for (const token of tokens) {
      const tokenResults = index.get(token) || [];
      results.push(tokenResults);
    }

    if (results.length === 0) return [];

    // Find intersection of all token results
    let intersection = results[0];
    for (let i = 1; i < results.length; i++) {
      intersection = intersection.filter(id => results[i].includes(id));
    }

    return intersection;
  }
}
