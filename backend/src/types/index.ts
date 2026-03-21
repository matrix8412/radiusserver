// ============================================================
// RadiusServer – Shared TypeScript Types
// ============================================================

export interface RadiusUser {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  enabled: boolean;
  totp_enabled: boolean;
  totp_verified: boolean;
  force_password_reset: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadCheck {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadReply {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadGroupCheck {
  id: number;
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadGroupReply {
  id: number;
  groupname: string;
  attribute: string;
  op: string;
  value: string;
}

export interface RadUserGroup {
  id: number;
  username: string;
  groupname: string;
  priority: number;
}

export interface RadiusGroup {
  id: number;
  groupname: string;
  description: string | null;
  created_at: string;
}

export interface NasDevice {
  id: number;
  nasname: string;
  shortname: string | null;
  type: string;
  ports: number | null;
  secret: string;
  server: string | null;
  community: string | null;
  description: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  display_name: string | null;
  email: string | null;
  enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface AdminPermission {
  id: number;
  name: string;
  description: string | null;
  category: string;
}

export interface AuditLogEntry {
  id: number;
  admin_id: number | null;
  admin_username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string | null;
  description: string | null;
  category: string;
  updated_at: string;
  updated_by: number | null;
}

export interface CertificateMetadata {
  id: number;
  name: string;
  cert_type: string;
  subject: string | null;
  issuer: string | null;
  serial_number: string | null;
  not_before: string | null;
  not_after: string | null;
  fingerprint: string | null;
  file_path: string | null;
  created_at: string;
  notes: string | null;
}

export interface RadAcct {
  radacctid: number;
  acctsessionid: string;
  acctuniqueid: string;
  username: string;
  realm: string;
  nasipaddress: string;
  nasportid: string | null;
  nasporttype: string | null;
  acctstarttime: string | null;
  acctupdatetime: string | null;
  acctstoptime: string | null;
  acctsessiontime: number | null;
  acctinputoctets: number | null;
  acctoutputoctets: number | null;
  calledstationid: string;
  callingstationid: string;
  acctterminatecause: string;
  framedipaddress: string;
}

export interface RadPostAuth {
  id: number;
  username: string;
  pass: string;
  reply: string;
  authdate: string;
  class: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  adminId: number;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalNas: number;
  activeSessions: number;
  authToday: number;
  authFailedToday: number;
  recentAuth: RadPostAuth[];
  recentAcct: RadAcct[];
}
