interface MemoryLeakData {
  timers?: Set<any>;
  listeners?: Set<any>;
  memoryUsage?: number;
  mountCount?: number;
  unmountCount?: number;
  lastActivity?: number;
}

interface ComponentStats {
  [componentName: string]: MemoryLeakData;
}

class MemoryLeakDetector {
  private data: MemoryLeakData = {
    timers: new Set(),
    listeners: new Set(),
    memoryUsage: 0,
    mountCount: 0,
    unmountCount: 0,
    lastActivity: Date.now(),
  };

  private componentStats: ComponentStats = {};

  getLeakData(): MemoryLeakData {
    return this.data;
  }

  getComponentStats(): ComponentStats {
    return this.componentStats;
  }

  trackComponent(componentName: string): void {
    if (!this.componentStats[componentName]) {
      this.componentStats[componentName] = {
        timers: new Set(),
        listeners: new Set(),
        memoryUsage: 0,
        mountCount: 0,
        unmountCount: 0,
        lastActivity: Date.now(),
      };
    }
  }

  trackTimer(timer: any, componentName?: string): void {
    this.data.timers?.add(timer);
    if (componentName && this.componentStats[componentName]) {
      this.componentStats[componentName].timers?.add(timer);
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }

  untrackTimer(timer: any, componentName?: string): void {
    this.data.timers?.delete(timer);
    if (componentName && this.componentStats[componentName]) {
      this.componentStats[componentName].timers?.delete(timer);
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }

  trackListener(listener: any, componentName?: string): void {
    this.data.listeners?.add(listener);
    if (componentName && this.componentStats[componentName]) {
      this.componentStats[componentName].listeners?.add(listener);
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }

  untrackListener(listener: any, componentName?: string): void {
    this.data.listeners?.delete(listener);
    if (componentName && this.componentStats[componentName]) {
      this.componentStats[componentName].listeners?.delete(listener);
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }

  updateMemoryUsage(componentName?: string): void {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in (window.performance as any)
    ) {
      const memoryUsage = (window.performance as any).memory.usedJSHeapSize;
      this.data.memoryUsage = memoryUsage;

      if (componentName && this.componentStats[componentName]) {
        this.componentStats[componentName].memoryUsage = memoryUsage;
        this.componentStats[componentName].lastActivity = Date.now();
      }
    }
  }

  incrementMountCount(componentName?: string): void {
    this.data.mountCount = (this.data.mountCount || 0) + 1;
    if (componentName) {
      this.trackComponent(componentName);
      this.componentStats[componentName].mountCount =
        (this.componentStats[componentName].mountCount || 0) + 1;
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }

  incrementUnmountCount(componentName?: string): void {
    this.data.unmountCount = (this.data.unmountCount || 0) + 1;
    if (componentName && this.componentStats[componentName]) {
      this.componentStats[componentName].unmountCount =
        (this.componentStats[componentName].unmountCount || 0) + 1;
      this.componentStats[componentName].lastActivity = Date.now();
    }
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();
