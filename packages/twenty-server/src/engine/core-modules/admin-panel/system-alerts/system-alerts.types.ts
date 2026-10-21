export type SystemAlertIssue = { key: string; label: string; detail: string };
export type SystemAlertSettings = {
  enabled: boolean;
  recipients: string[];
  testRequest?: { id: string; createdAt: string };
};
export type SystemAlertMonitorStatus = {
  checkedAt?: string;
  mailConfigured?: boolean;
  lastSentAt?: string;
  lastError?: string;
  lastTestAt?: string;
  activeIssues?: SystemAlertIssue[];
};
