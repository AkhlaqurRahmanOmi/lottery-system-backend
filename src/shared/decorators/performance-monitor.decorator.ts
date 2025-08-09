import { Injectable, Logger } from '@nestjs/common';

/**
 * Decorator to monitor method performance
 * Automatically tracks execution time and memory usage
 */
export function PerformanceMonitor(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const operation = operationName || `${className}.${propertyName}`;
    const logger = new Logger(`PerformanceMonitor`);

    descriptor.value = async function (...args: any[]) {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Get trace ID from context if available
      let traceId = 'unknown';
      try {
        // Try to get trace ID from the current context
        const traceIdService = (this as any).traceIdService;
        if (traceIdService && typeof traceIdService.getTraceId === 'function') {
          traceId = traceIdService.getTraceId();
        }
      } catch (error) {
        // Ignore errors getting trace ID
      }

      try {
        const result = await method.apply(this, args);
        
        // Calculate performance metrics
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        
        const memoryDelta = {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        };

        // Log performance data
        logger.log(`Performance: ${operation}`, {
          traceId,
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: {
            rss: `${(memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`,
            heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          },
          args: args.length,
          timestamp: new Date().toISOString(),
        });

        // Log warning for slow operations
        if (duration > 1000) {
          logger.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`, {
            traceId,
            duration,
            operation,
          });
        }

        return result;
      } catch (error) {
        // Calculate performance metrics even for failed operations
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000;

        logger.error(`Performance: ${operation} (FAILED)`, {
          traceId,
          duration: `${duration.toFixed(2)}ms`,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator to monitor all methods in a class
 */
export function MonitorClass(prefix?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const className = constructor.name;
    const methodNames = Object.getOwnPropertyNames(constructor.prototype)
      .filter(name => {
        const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, name);
        return descriptor && typeof descriptor.value === 'function' && name !== 'constructor';
      });

    methodNames.forEach(methodName => {
      const originalMethod = constructor.prototype[methodName];
      const operationName = prefix ? `${prefix}.${methodName}` : `${className}.${methodName}`;
      
      constructor.prototype[methodName] = function (...args: any[]) {
        const logger = new Logger(`PerformanceMonitor`);
        const startTime = process.hrtime.bigint();
        
        try {
          const result = originalMethod.apply(this, args);
          
          // Handle both sync and async methods
          if (result && typeof result.then === 'function') {
            return result.then((value: any) => {
              const endTime = process.hrtime.bigint();
              const duration = Number(endTime - startTime) / 1_000_000;
              
              logger.log(`Performance: ${operationName}`, {
                duration: `${duration.toFixed(2)}ms`,
                async: true,
                timestamp: new Date().toISOString(),
              });
              
              return value;
            }).catch((error: any) => {
              const endTime = process.hrtime.bigint();
              const duration = Number(endTime - startTime) / 1_000_000;
              
              logger.error(`Performance: ${operationName} (FAILED)`, {
                duration: `${duration.toFixed(2)}ms`,
                error: error.message,
                async: true,
                timestamp: new Date().toISOString(),
              });
              
              throw error;
            });
          } else {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1_000_000;
            
            logger.log(`Performance: ${operationName}`, {
              duration: `${duration.toFixed(2)}ms`,
              async: false,
              timestamp: new Date().toISOString(),
            });
            
            return result;
          }
        } catch (error) {
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1_000_000;
          
          logger.error(`Performance: ${operationName} (FAILED)`, {
            duration: `${duration.toFixed(2)}ms`,
            error: error.message,
            async: false,
            timestamp: new Date().toISOString(),
          });
          
          throw error;
        }
      };
    });

    return constructor;
  };
}