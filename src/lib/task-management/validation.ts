import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Task Status Enum
export const TaskStatus = z.enum([
  'pending',
  'in-progress',
  'review',
  'done',
  'deferred',
  'cancelled',
]);

// Task Priority Enum
export const TaskPriority = z.enum(['low', 'medium', 'high', 'critical']);

// Subtask Schema
export const SubtaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  details: z.string().optional(),
  status: TaskStatus,
  dependencies: z.array(z.number().int().positive()).default([]),
  parentTaskId: z.number().int().positive(),
});

// Task Schema
export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  details: z.string().optional(),
  testStrategy: z.string().optional(),
  status: TaskStatus,
  dependencies: z.array(z.number().int().positive()).default([]),
  priority: TaskPriority,
  subtasks: z.array(SubtaskSchema).optional().default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  assignee: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// Tasks Collection Schema
export const TasksCollectionSchema = z.object({
  version: z.string().default('1.0.0'),
  metadata: z.object({
    projectName: z.string(),
    createdAt: z.string().datetime(),
    lastModified: z.string().datetime(),
    totalTasks: z.number().int().nonnegative(),
    checksum: z.string().optional(),
  }),
  tasks: z.array(TaskSchema),
});

// Configuration Schema
export const TaskMasterConfigSchema = z.object({
  models: z.object({
    main: z.object({
      provider: z.string(),
      modelId: z.string(),
      maxTokens: z.number().int().positive(),
      temperature: z.number().min(0).max(2),
    }),
    research: z.object({
      provider: z.string(),
      modelId: z.string(),
      maxTokens: z.number().int().positive(),
      temperature: z.number().min(0).max(2),
    }),
    fallback: z.object({
      provider: z.string(),
      modelId: z.string(),
      maxTokens: z.number().int().positive(),
      temperature: z.number().min(0).max(2),
    }),
  }),
  global: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
    debug: z.boolean(),
    defaultSubtasks: z.number().int().positive().max(20),
    defaultPriority: TaskPriority,
    projectName: z.string(),
    ollamaBaseUrl: z.string().url().optional(),
    userId: z.string(),
    maxTasksPerFile: z.number().int().positive().default(100),
    enableBackups: z.boolean().default(true),
    backupRetentionDays: z.number().int().positive().default(30),
    enableIntegrityChecks: z.boolean().default(true),
    enablePerformanceOptimization: z.boolean().default(true),
  }),
});

export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type TasksCollection = z.infer<typeof TasksCollectionSchema>;
export type TaskMasterConfig = z.infer<typeof TaskMasterConfigSchema>;

/**
 * Task Management Validator Class
 * Provides comprehensive validation and integrity checking for the task management system
 */
export class TaskValidator {
  private static instance: TaskValidator;
  private config: TaskMasterConfig | null = null;

  private constructor() {}

  public static getInstance(): TaskValidator {
    if (!TaskValidator.instance) {
      TaskValidator.instance = new TaskValidator();
    }
    return TaskValidator.instance;
  }

  /**
   * Load and validate configuration
   */
  async loadConfig(configPath: string): Promise<TaskMasterConfig> {
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(configContent);

      this.config = TaskMasterConfigSchema.parse(configData);
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Configuration validation failed: ${this.formatZodError(error)}`
        );
      }
      throw new Error(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate tasks collection with comprehensive checks
   */
  async validateTasksCollection(tasksData: unknown): Promise<TasksCollection> {
    try {
      // Basic schema validation
      const validatedTasks = TasksCollectionSchema.parse(tasksData);

      // Additional integrity checks
      await this.performIntegrityChecks(validatedTasks);

      return validatedTasks;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Tasks validation failed: ${this.formatZodError(error)}`
        );
      }
      throw error;
    }
  }

  /**
   * Perform comprehensive integrity checks
   */
  private async performIntegrityChecks(
    tasksCollection: TasksCollection
  ): Promise<void> {
    const errors: string[] = [];

    // Check for duplicate task IDs
    const taskIds = new Set<number>();
    for (const task of tasksCollection.tasks) {
      if (taskIds.has(task.id)) {
        errors.push(`Duplicate task ID found: ${task.id}`);
      }
      taskIds.add(task.id);
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(tasksCollection.tasks);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    // Check for invalid dependency references
    const invalidDeps = this.findInvalidDependencies(tasksCollection.tasks);
    if (invalidDeps.length > 0) {
      errors.push(`Invalid dependency references: ${invalidDeps.join(', ')}`);
    }

    // Check subtask integrity
    const subtaskErrors = this.validateSubtaskIntegrity(tasksCollection.tasks);
    errors.push(...subtaskErrors);

    // Check metadata consistency
    if (tasksCollection.metadata.totalTasks !== tasksCollection.tasks.length) {
      errors.push(
        `Metadata totalTasks (${tasksCollection.metadata.totalTasks}) doesn't match actual tasks count (${tasksCollection.tasks.length})`
      );
    }

    // Verify checksum if provided
    if (tasksCollection.metadata.checksum) {
      const calculatedChecksum = this.calculateChecksum(tasksCollection.tasks);
      if (calculatedChecksum !== tasksCollection.metadata.checksum) {
        errors.push('Checksum verification failed - data may be corrupted');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Integrity check failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Detect circular dependencies in task graph
   */
  private detectCircularDependencies(tasks: Task[]): string[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const circularPaths: string[] = [];

    const dfs = (taskId: number, path: number[]): void => {
      if (recursionStack.has(taskId)) {
        const cycleStart = path.indexOf(taskId);
        const cycle = path.slice(cycleStart).concat(taskId);
        circularPaths.push(cycle.join(' -> '));
        return;
      }

      if (visited.has(taskId)) {
        return;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          dfs(depId, [...path, taskId]);
        }
      }

      recursionStack.delete(taskId);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        dfs(task.id, []);
      }
    }

    return circularPaths;
  }

  /**
   * Find invalid dependency references
   */
  private findInvalidDependencies(tasks: Task[]): string[] {
    const taskIds = new Set(tasks.map(task => task.id));
    const invalidDeps: string[] = [];

    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          invalidDeps.push(
            `Task ${task.id} depends on non-existent task ${depId}`
          );
        }
      }

      // Check subtask dependencies
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          for (const depId of subtask.dependencies) {
            if (!taskIds.has(depId)) {
              invalidDeps.push(
                `Subtask ${task.id}.${subtask.id} depends on non-existent task ${depId}`
              );
            }
          }
        }
      }
    }

    return invalidDeps;
  }

  /**
   * Validate subtask integrity
   */
  private validateSubtaskIntegrity(tasks: Task[]): string[] {
    const errors: string[] = [];

    for (const task of tasks) {
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskIds = new Set<number>();

        for (const subtask of task.subtasks) {
          // Check for duplicate subtask IDs within the task
          if (subtaskIds.has(subtask.id)) {
            errors.push(
              `Duplicate subtask ID ${subtask.id} in task ${task.id}`
            );
          }
          subtaskIds.add(subtask.id);

          // Check parent task ID consistency
          if (subtask.parentTaskId !== task.id) {
            errors.push(
              `Subtask ${subtask.id} has incorrect parentTaskId (${subtask.parentTaskId}, should be ${task.id})`
            );
          }
        }
      }
    }

    return errors;
  }

  /**
   * Calculate checksum for tasks data
   */
  calculateChecksum(tasks: Task[]): string {
    const tasksString = JSON.stringify(tasks, Object.keys(tasks).sort());
    return crypto.createHash('sha256').update(tasksString).digest('hex');
  }

  /**
   * Validate task status transitions
   */
  validateStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      pending: ['in-progress', 'deferred', 'cancelled'],
      'in-progress': ['review', 'done', 'pending', 'deferred', 'cancelled'],
      review: ['done', 'in-progress', 'pending'],
      done: ['review'], // Allow reopening completed tasks
      deferred: ['pending', 'cancelled'],
      cancelled: ['pending'], // Allow reactivating cancelled tasks
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Format Zod validation errors for better readability
   */
  private formatZodError(error: z.ZodError): string {
    return error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
  }

  /**
   * Validate individual task
   */
  validateTask(taskData: unknown): Task {
    return TaskSchema.parse(taskData);
  }

  /**
   * Validate individual subtask
   */
  validateSubtask(subtaskData: unknown): Subtask {
    return SubtaskSchema.parse(subtaskData);
  }

  /**
   * Check if tasks collection exceeds size limits
   */
  checkSizeLimits(tasksCollection: TasksCollection): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;

    const maxTasksPerFile = this.config?.global.maxTasksPerFile ?? 100;
    const taskCount = tasksCollection.tasks.length;

    if (taskCount > maxTasksPerFile) {
      isValid = false;
      warnings.push(
        `Task count (${taskCount}) exceeds recommended limit (${maxTasksPerFile})`
      );
      recommendations.push(
        'Consider splitting tasks into multiple files or implementing pagination'
      );
    }

    // Check JSON file size estimation
    const estimatedSize = JSON.stringify(tasksCollection).length;
    const maxSizeBytes = 1024 * 1024; // 1MB

    if (estimatedSize > maxSizeBytes) {
      isValid = false;
      warnings.push(
        `Estimated file size (${Math.round(estimatedSize / 1024)}KB) exceeds recommended limit (1MB)`
      );
      recommendations.push(
        'Consider implementing database storage or file chunking'
      );
    }

    // Check for tasks with excessive subtasks
    const tasksWithManySubtasks = tasksCollection.tasks.filter(
      task => task.subtasks && task.subtasks.length > 20
    );

    if (tasksWithManySubtasks.length > 0) {
      warnings.push(
        `${tasksWithManySubtasks.length} tasks have more than 20 subtasks`
      );
      recommendations.push(
        'Consider breaking down large tasks into smaller, more manageable tasks'
      );
    }

    return { isValid, warnings, recommendations };
  }
}

/**
 * Utility functions for task management
 */
export class TaskUtils {
  /**
   * Generate a new task ID that doesn't conflict with existing tasks
   */
  static generateNewTaskId(existingTasks: Task[]): number {
    const existingIds = new Set(existingTasks.map(task => task.id));
    let newId = 1;

    while (existingIds.has(newId)) {
      newId++;
    }

    return newId;
  }

  /**
   * Generate a new subtask ID within a task
   */
  static generateNewSubtaskId(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) {
      return 1;
    }

    const existingIds = new Set(task.subtasks.map(subtask => subtask.id));
    let newId = 1;

    while (existingIds.has(newId)) {
      newId++;
    }

    return newId;
  }

  /**
   * Get tasks that are ready to be worked on (no pending dependencies)
   */
  static getReadyTasks(tasks: Task[]): Task[] {
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    return tasks.filter(task => {
      if (task.status !== 'pending') {
        return false;
      }

      // Check if all dependencies are completed
      return task.dependencies.every(depId => {
        const depTask = taskMap.get(depId);
        return depTask?.status === 'done';
      });
    });
  }

  /**
   * Calculate task completion percentage
   */
  static calculateCompletionPercentage(tasks: Task[]): number {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  /**
   * Get task statistics
   */
  static getTaskStatistics(tasks: Task[]): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    completionPercentage: number;
    averageSubtasks: number;
  } {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalSubtasks = 0;

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      totalSubtasks += task.subtasks?.length || 0;
    }

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      completionPercentage: this.calculateCompletionPercentage(tasks),
      averageSubtasks:
        tasks.length > 0
          ? Math.round((totalSubtasks / tasks.length) * 10) / 10
          : 0,
    };
  }
}
