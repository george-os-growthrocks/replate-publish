/**
 * Client-side debug logging utility
 * Stores logs in memory for display in debug panels
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error';

interface DebugLog {
  timestamp: string;
  level: LogLevel;
  message: string;
}

let logs: DebugLog[] = [];

/**
 * Add a debug log entry
 */
export function addDebugLog(level: LogLevel, message: string): void {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const log: DebugLog = {
    timestamp,
    level,
    message
  };
  
  logs.push(log);
  
  // Also log to console with appropriate method
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[consoleMethod](`[${timestamp}] [${level}] ${message}`);
  
  // Keep only last 100 logs to prevent memory issues
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
}

/**
 * Get all debug logs
 */
export function getDebugLogs(): DebugLog[] {
  return [...logs];
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs(): void {
  logs = [];
  console.log('🗑️ Debug logs cleared');
}

/**
 * Export logs as JSON string
 */
export function exportDebugLogs(): string {
  return JSON.stringify(logs, null, 2);
}

