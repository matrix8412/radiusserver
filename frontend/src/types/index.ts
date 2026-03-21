export interface RadiusUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  is_enabled: boolean;
  totp_enabled: boolean;
  expire_at: string | null;
  simultaneous_use: number;
  download_limit: number;
  upload_limit: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RadiusGroup {
  id: number;
  groupname: string;
  description: string;
  priority: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NasDevice {
  id: number;
  nasname: string;
  shortname: string;
  type: string;
  ports: number | null;
  secret: string;
  server: string | null;
  community: string | null;
  description: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  roles?: string[];
}

export interface AdminRole {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  permissions?: string[];
}

export interface RadAcct {
  radacctid: number;
  acctsessionid: string;
  acctuniqueid: string;
  username: string;
  realm: string;
  nasipaddress: string;
  nasportid: string;
  nasporttype: string;
  acctstarttime: string;
  acctupdatetime: string;
  acctstoptime: string | null;
  acctinterval: number;
  acctsessiontime: number;
  acctauthentic: string;
  connectinfo_connect: string;
  acctinputoctets: number;
  acctoutputoctets: number;
  calledstationid: string;
  callingstationid: string;
  acctterminatecause: string;
  servicetype: string;
  framedprotocol: string;
  framedipaddress: string;
  framedipv6address: string;
  framedipv6prefix: string;
  framedinterfaceid: string;
  delegatedipv6prefix: string;
}

export interface RadPostAuth {
  id: number;
  username: string;
  pass: string;
  reply: string;
  authdate: string;
  nasipaddress: string;
  calledstationid: string;
  callingstationid: string;
}

export interface AuditLogEntry {
  id: number;
  admin_id: number;
  admin_username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface CertificateInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  expires?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  activeSessions: number;
  totalNas: number;
  totalGroups: number;
  authSuccessToday: number;
  authFailToday: number;
  trafficIn: number;
  trafficOut: number;
}

export interface CheckAttribute {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface ReplyAttribute {
  id: number;
  username: string;
  attribute: string;
  op: string;
  value: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; latency: number };
    freeradius: { status: string };
  };
  database: {
    totalUsers: number;
    activeSessions: number;
    totalNas: number;
  };
}
