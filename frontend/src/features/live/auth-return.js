export function safeReturnPath(value, fallback = '/team') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value) && !/^\/(?:login|signup)(?:[/?#]|$)/i.test(value) ? value : fallback;
}
