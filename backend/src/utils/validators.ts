// Common RADIUS attribute names for validation hints
export const COMMON_CHECK_ATTRIBUTES = [
  'Cleartext-Password',
  'Password-With-Header',
  'Auth-Type',
  'Simultaneous-Use',
  'Login-Time',
  'Expiration',
  'NAS-IP-Address',
  'NAS-Identifier',
  'Calling-Station-Id',
  'Called-Station-Id',
  'Service-Type',
  'Framed-Protocol',
  'Framed-IP-Address',
  'Framed-IP-Netmask',
  'Framed-Routing',
  'Framed-MTU',
  'Framed-Pool',
  'Fall-Through',
  'Idle-Timeout',
  'Session-Timeout',
  'Port-Limit',
];

export const COMMON_REPLY_ATTRIBUTES = [
  'Reply-Message',
  'Service-Type',
  'Framed-Protocol',
  'Framed-IP-Address',
  'Framed-IP-Netmask',
  'Framed-Routing',
  'Framed-MTU',
  'Framed-Compression',
  'Framed-Pool',
  'Framed-Route',
  'Session-Timeout',
  'Idle-Timeout',
  'Login-IP-Host',
  'Login-Service',
  'Login-TCP-Port',
  'Port-Limit',
  'Filter-Id',
  'Class',
  'Tunnel-Type',
  'Tunnel-Medium-Type',
  'Tunnel-Private-Group-Id',
];

export const VALID_OPS = [':=', '==', '!=', '>=', '<=', '>', '<', '=~', '!~', '+='];

export function isValidOp(op: string): boolean {
  return VALID_OPS.includes(op);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._@-]{1,64}$/.test(username);
}

export function isValidGroupname(groupname: string): boolean {
  return /^[a-zA-Z0-9._-]{1,64}$/.test(groupname);
}

export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_\\]/g, '\\$&');
}
