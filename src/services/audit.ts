// SIM-TIRTA LESTARI Audit Logger
// Kalurahan Ngawu, Kapanewon Playen, Kabupaten Gunungkidul

import { AuditLogEntry } from '../types';
import { AppStorage } from './storage';

export class AuditLogger {
  public static log(entry: Omit<AuditLogEntry, 'log_id' | 'timestamp'>): void {
    try {
      const logs = AppStorage.getAuditLogs();
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newEntry: AuditLogEntry = {
        log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: nowStr,
        ...entry,
      };

      // Append immutable log
      logs.unshift(newEntry);
      AppStorage.setAuditLogs(logs);
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }
}
