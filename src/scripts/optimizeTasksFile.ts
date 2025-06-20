import { TaskPerformanceOptimizer } from '@/components/ui/card';
import { ConfigManager } from '../lib/task-management/config';

#!/usr/bin/env node

  TaskValidator,
  TasksCollection,
} from '../lib/task-management/validation';

/**
 * Task File Optimization Script
 * Addresses critical issues with large tasks.json files and performance problems
 */

interface OptimizationOptions {
  inputFile: string;
  outputDir: string;
  maxTasksPerFile: number;
  enableBackup: boolean;
  enableValidation: boolean;
  enableCompression: boolean;
  splitLargeTasks: boolean;
  removeCompletedTasks: boolean;
  archiveOldTasks: boolean;
  dryRun: boolean;
}

class TaskFileOptimizer {
  private validator: TaskValidator;
  private optimizer: TaskPerformanceOptimizer;
  private configManager: ConfigManager;
  private options: OptimizationOptions;

  constructor(options: OptimizationOptions) {
    this.validator = TaskValidator.getInstance();
    this.optimizer = TaskPerformanceOptimizer.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.options = options;
  }

  /**
   * Main optimization process
   */
  async optimize(): Promise<void> {
    console.log('🚀 Starting Task File Optimization...');
    console.log(`📁 Input file: ${this.options.inputFile}`);
    console.log(`📂 Output directory: ${this.options.outputDir}`);

    try {
      // Step 1: Load and validate current tasks
      console.log('\n📋 Step 1: Loading and validating tasks...');
      const tasksData = await this.loadAndValidateTasks();

      // Step 2: Analyze current state
      console.log('\n📊 Step 2: Analyzing current state...');
      const analysis = await this.analyzeTasksFile(tasksData);
      this.printAnalysis(analysis);

      // Step 3: Create backup if enabled
      if (this.options.enableBackup && !this.options.dryRun) {
        console.log('\n💾 Step 3: Creating backup...');
        await this.createBackup();
      }

      // Step 4: Optimize tasks data
      console.log('\n⚡ Step 4: Optimizing tasks data...');
      const optimizedData = await this.optimizeTasksData(tasksData);

      // Step 5: Split large files if needed
      if (
        this.options.splitLargeTasks &&
        optimizedData.tasks.length > this.options.maxTasksPerFile
      ) {
        console.log('\n✂️ Step 5: Splitting large task file...');
        await this.splitTaskFile(optimizedData);
      } else {
        console.log('\n💾 Step 5: Saving optimized file...');
        await this.saveOptimizedFile(optimizedData);
      }

      // Step 6: Archive completed tasks if enabled
      if (this.options.archiveOldTasks) {
        console.log('\n📦 Step 6: Archiving completed tasks...');
        await this.archiveCompletedTasks(optimizedData);
      }

      // Step 7: Generate optimization report
      console.log('\n📈 Step 7: Generating optimization report...');
      await this.generateOptimizationReport(tasksData, optimizedData);

      console.log('\n✅ Task file optimization completed successfully!');
    } catch (error) {
      console.error(
        '\n❌ Optimization failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  }

  /**
   * Load and validate tasks from file
   */
  private async loadAndValidateTasks(): Promise<TasksCollection> {
    try {
      const content = await fs.readFile(this.options.inputFile, 'utf-8');
      const data = JSON.parse(content);

      if (this.options.enableValidation) {
        return await this.validator.validateTasksCollection(data);
      }

      return data as TasksCollection;
    } catch (error) {
      throw new Error(
        `Failed to load tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze tasks file for optimization opportunities
   */
  private async analyzeTasksFile(tasksData: TasksCollection): Promise<{
    totalTasks: number;
    fileSize: number;
    completedTasks: number;
    pendingTasks: number;
    tasksWithManySubtasks: number;
    duplicateTasks: number;
    orphanedSubtasks: number;
    circularDependencies: string[];
    recommendations: string[];
  }> {
    const fileStats = await fs.stat(this.options.inputFile);
    const fileSize = fileStats.size;

    const completedTasks = tasksData.tasks.filter(
      task => task.status === 'done'
    ).length;
    const pendingTasks = tasksData.tasks.filter(
      task => task.status === 'pending'
    ).length;
    const tasksWithManySubtasks = tasksData.tasks.filter(
      task => task.subtasks && task.subtasks.length > 20
    ).length;

    // Check for duplicates
    const taskIds = new Set<number>();
    let duplicateTasks = 0;
    for (const task of tasksData.tasks) {
      if (taskIds.has(task.id)) {
        duplicateTasks++;
      }
      taskIds.add(task.id);
    }

    // Check for orphaned subtasks
    let orphanedSubtasks = 0;
    for (const task of tasksData.tasks) {
      if (task.subtasks) {
        for (const subtask of task.subtasks) {
          if (subtask.parentTaskId !== task.id) {
            orphanedSubtasks++;
          }
        }
      }
    }

    // Check for circular dependencies
    const circularDependencies = this.detectCircularDependencies(
      tasksData.tasks
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (fileSize > 1024 * 1024) {
      // 1MB
      recommendations.push(
        'File size is very large (>1MB). Consider splitting into multiple files.'
      );
    }

    if (completedTasks > tasksData.tasks.length * 0.5) {
      recommendations.push(
        'Many tasks are completed. Consider archiving them to reduce file size.'
      );
    }

    if (tasksWithManySubtasks > 0) {
      recommendations.push(
        `${tasksWithManySubtasks} tasks have >20 subtasks. Consider breaking them down.`
      );
    }

    if (duplicateTasks > 0) {
      recommendations.push(
        `${duplicateTasks} duplicate task IDs found. These need to be resolved.`
      );
    }

    if (orphanedSubtasks > 0) {
      recommendations.push(
        `${orphanedSubtasks} orphaned subtasks found. These need to be fixed.`
      );
    }

    if (circularDependencies.length > 0) {
      recommendations.push(
        `${circularDependencies.length} circular dependencies detected.`
      );
    }

    return {
      totalTasks: tasksData.tasks.length,
      fileSize,
      completedTasks,
      pendingTasks,
      tasksWithManySubtasks,
      duplicateTasks,
      orphanedSubtasks,
      circularDependencies,
      recommendations,
    };
  }

  /**
   * Print analysis results
   */
  private printAnalysis(analysis: any): void {
    console.log(`📊 Total tasks: ${analysis.totalTasks}`);
    console.log(`📁 File size: ${Math.round(analysis.fileSize / 1024)}KB`);
    console.log(`✅ Completed tasks: ${analysis.completedTasks}`);
    console.log(`⏳ Pending tasks: ${analysis.pendingTasks}`);
    console.log(
      `🔢 Tasks with many subtasks: ${analysis.tasksWithManySubtasks}`
    );
    console.log(`🔄 Duplicate tasks: ${analysis.duplicateTasks}`);
    console.log(`👻 Orphaned subtasks: ${analysis.orphanedSubtasks}`);
    console.log(
      `🔄 Circular dependencies: ${analysis.circularDependencies.length}`
    );

    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Create backup of original file
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.options.inputFile}.backup-${timestamp}`;

    await fs.copyFile(this.options.inputFile, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
  }

  /**
   * Optimize tasks data structure
   */
  private async optimizeTasksData(
    tasksData: TasksCollection
  ): Promise<TasksCollection> {
    let optimizedData = { ...tasksData };

    // Remove completed tasks if option is enabled
    if (this.options.removeCompletedTasks) {
      optimizedData.tasks = optimizedData.tasks.filter(
        task => task.status !== 'done'
      );
      console.log(
        `🗑️ Removed ${tasksData.tasks.length - optimizedData.tasks.length} completed tasks`
      );
    }

    // Fix duplicate task IDs
    optimizedData = this.fixDuplicateTaskIds(optimizedData);

    // Fix orphaned subtasks
    optimizedData = this.fixOrphanedSubtasks(optimizedData);

    // Optimize data structure
    optimizedData = this.compressTaskData(optimizedData);

    // Update metadata
    optimizedData.metadata.lastModified = new Date().toISOString();
    optimizedData.metadata.totalTasks = optimizedData.tasks.length;
    optimizedData.metadata.checksum = this.validator.calculateChecksum(
      optimizedData.tasks
    );

    return optimizedData;
  }

  /**
   * Fix duplicate task IDs
   */
  private fixDuplicateTaskIds(tasksData: TasksCollection): TasksCollection {
    const seenIds = new Set<number>();
    const fixedTasks = [];
    let nextId = Math.max(...tasksData.tasks.map(t => t.id)) + 1;

    for (const task of tasksData.tasks) {
      if (seenIds.has(task.id)) {
        console.log(`🔧 Fixed duplicate task ID ${task.id} -> ${nextId}`);
        task.id = nextId++;
      }
      seenIds.add(task.id);
      fixedTasks.push(task);
    }

    return { ...tasksData, tasks: fixedTasks };
  }

  /**
   * Fix orphaned subtasks
   */
  private fixOrphanedSubtasks(tasksData: TasksCollection): TasksCollection {
    const fixedTasks = tasksData.tasks.map(task => {
      if (task.subtasks) {
        const fixedSubtasks = task.subtasks.map(subtask => ({
          ...subtask,
          parentTaskId: task.id,
        }));

        return { ...task, subtasks: fixedSubtasks };
      }
      return task;
    });

    return { ...tasksData, tasks: fixedTasks };
  }

  /**
   * Compress task data by removing empty fields
   */
  private compressTaskData(tasksData: TasksCollection): TasksCollection {
    const compressedTasks = tasksData.tasks.map(task => {
      const compressed: any = {
        id: task.id,
        title: task.title.trim(),
        description: task.description.trim(),
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies || [],
      };

      // Only include optional fields if they have values
      if (task.details && task.details.trim()) {
        compressed.details = task.details.trim();
      }

      if (task.testStrategy && task.testStrategy.trim()) {
        compressed.testStrategy = task.testStrategy.trim();
      }

      if (task.subtasks && task.subtasks.length > 0) {
        compressed.subtasks = task.subtasks.map(subtask => {
          const compressedSubtask: any = {
            id: subtask.id,
            title: subtask.title.trim(),
            description: subtask.description.trim(),
            status: subtask.status,
            dependencies: subtask.dependencies || [],
            parentTaskId: subtask.parentTaskId,
          };

          if (subtask.details && subtask.details.trim()) {
            compressedSubtask.details = subtask.details.trim();
          }

          return compressedSubtask;
        });
      }

      if (task.createdAt) compressed.createdAt = task.createdAt;
      if (task.updatedAt) compressed.updatedAt = task.updatedAt;
      if (task.estimatedHours) compressed.estimatedHours = task.estimatedHours;
      if (task.actualHours) compressed.actualHours = task.actualHours;
      if (task.assignee) compressed.assignee = task.assignee;
      if (task.tags && task.tags.length > 0) compressed.tags = task.tags;

      return compressed;
    });

    return { ...tasksData, tasks: compressedTasks };
  }

  /**
   * Split large task file into smaller chunks
   */
  private async splitTaskFile(tasksData: TasksCollection): Promise<void> {
    if (this.options.dryRun) {
      console.log(
        `🔍 DRY RUN: Would split ${tasksData.tasks.length} tasks into chunks of ${this.options.maxTasksPerFile}`
      );
      return;
    }

    const chunkFiles = await this.optimizer.splitTaskFile(
      this.options.inputFile,
      this.options.outputDir
    );

    console.log(`✅ Split into ${chunkFiles.length} files:`);
    chunkFiles.forEach(file => console.log(`   📄 ${file}`));
  }

  /**
   * Save optimized file
   */
  private async saveOptimizedFile(tasksData: TasksCollection): Promise<void> {
    if (this.options.dryRun) {
      console.log('🔍 DRY RUN: Would save optimized file');
      return;
    }

    const outputPath = path.join(
      this.options.outputDir,
      'tasks-optimized.json'
    );
    await this.optimizer.saveTasksOptimized(outputPath, tasksData);
    console.log(`✅ Optimized file saved: ${outputPath}`);
  }

  /**
   * Archive completed tasks
   */
  private async archiveCompletedTasks(
    tasksData: TasksCollection
  ): Promise<void> {
    const completedTasks = tasksData.tasks.filter(
      task => task.status === 'done'
    );

    if (completedTasks.length === 0) {
      console.log('📦 No completed tasks to archive');
      return;
    }

    if (this.options.dryRun) {
      console.log(
        `🔍 DRY RUN: Would archive ${completedTasks.length} completed tasks`
      );
      return;
    }

    const archiveData: TasksCollection = {
      version: tasksData.version,
      metadata: {
        ...tasksData.metadata,
        projectName: `${tasksData.metadata.projectName} - Archive`,
        totalTasks: completedTasks.length,
        lastModified: new Date().toISOString(),
      },
      tasks: completedTasks,
    };

    const archivePath = path.join(this.options.outputDir, 'tasks-archive.json');
    await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
    console.log(
      `✅ Archived ${completedTasks.length} completed tasks to: ${archivePath}`
    );
  }

  /**
   * Generate optimization report
   */
  private async generateOptimizationReport(
    originalData: TasksCollection,
    optimizedData: TasksCollection
  ): Promise<void> {
    const originalSize = JSON.stringify(originalData).length;
    const optimizedSize = JSON.stringify(optimizedData).length;
    const sizeSavings = originalSize - optimizedSize;
    const percentSavings = Math.round((sizeSavings / originalSize) * 100);

    const report = {
      timestamp: new Date().toISOString(),
      optimization: {
        originalTasks: originalData.tasks.length,
        optimizedTasks: optimizedData.tasks.length,
        tasksRemoved: originalData.tasks.length - optimizedData.tasks.length,
        originalSize: Math.round(originalSize / 1024),
        optimizedSize: Math.round(optimizedSize / 1024),
        sizeSavings: Math.round(sizeSavings / 1024),
        percentSavings,
      },
      options: this.options,
      recommendations: [
        'Consider running optimization regularly to maintain performance',
        'Monitor task file size and split when it exceeds 1MB',
        'Archive completed tasks periodically',
        'Use task validation to prevent data corruption',
      ],
    };

    if (!this.options.dryRun) {
      const reportPath = path.join(
        this.options.outputDir,
        'optimization-report.json'
      );
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Optimization report saved: ${reportPath}`);
    }

    console.log('\n📈 Optimization Summary:');
    console.log(
      `   📋 Tasks: ${report.optimization.originalTasks} → ${report.optimization.optimizedTasks}`
    );
    console.log(
      `   📁 Size: ${report.optimization.originalSize}KB → ${report.optimization.optimizedSize}KB`
    );
    console.log(
      `   💾 Savings: ${report.optimization.sizeSavings}KB (${report.optimization.percentSavings}%)`
    );
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(tasks: any[]): string[] {
    // Implementation similar to the one in validation.ts
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

      if (visited.has(taskId)) return;

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskMap.get(taskId);
      if (task && task.dependencies) {
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
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  // Default options
  const options: OptimizationOptions = {
    inputFile: 'tasks/tasks.json',
    outputDir: 'tasks/optimized',
    maxTasksPerFile: 50,
    enableBackup: true,
    enableValidation: true,
    enableCompression: true,
    splitLargeTasks: true,
    removeCompletedTasks: false,
    archiveOldTasks: true,
    dryRun: false,
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        options.inputFile = args[++i];
        break;
      case '--output':
        options.outputDir = args[++i];
        break;
      case '--max-tasks':
        options.maxTasksPerFile = parseInt(args[++i]);
        break;
      case '--no-backup':
        options.enableBackup = false;
        break;
      case '--no-validation':
        options.enableValidation = false;
        break;
      case '--remove-completed':
        options.removeCompletedTasks = true;
        break;
      case '--no-archive':
        options.archiveOldTasks = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
        console.log(`
Task File Optimizer

Usage: node optimizeTasksFile.ts [options]

Options:
  --input <file>        Input tasks file (default: tasks/tasks.json)
  --output <dir>        Output directory (default: tasks/optimized)
  --max-tasks <num>     Maximum tasks per file (default: 50)
  --no-backup          Skip creating backup
  --no-validation      Skip validation
  --remove-completed   Remove completed tasks
  --no-archive         Skip archiving completed tasks
  --dry-run            Show what would be done without making changes
  --help               Show this help message
        `);
        process.exit(0);
    }
  }

  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true });

  // Run optimization
  const optimizer = new TaskFileOptimizer(options);
  await optimizer.optimize();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { TaskFileOptimizer };
export type { OptimizationOptions };
