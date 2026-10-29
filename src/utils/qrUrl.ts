/**
 * Utility for resolving the correct host and URL for QR codes.
 * Ensures mobile phone cameras scanning the QR code reach the server via LAN IP (e.g. 10.212.67.29:3000)
 * rather than failing on 'localhost:3000'.
 */

export interface NetworkInfo {
  lanIp: string;
  port: number;
  defaultUrl: string;
  candidates: { ip: string; name: string }[];
}

let cachedNetworkInfo: NetworkInfo | null = null;
let networkInfoPromise: Promise<NetworkInfo | null> | null = null;

export async function fetchNetworkInfo(): Promise<NetworkInfo | null> {
  if (cachedNetworkInfo) return cachedNetworkInfo;
  if (networkInfoPromise) return networkInfoPromise;

  networkInfoPromise = fetch('/api/network-info')
    .then(res => {
      if (!res.ok) throw new Error('Network info endpoint returned non-200');
      return res.json();
    })
    .then((data: NetworkInfo) => {
      cachedNetworkInfo = data;
      return data;
    })
    .catch(err => {
      console.warn('[QR] Could not fetch LAN network info, fallback to origin:', err);
      return null;
    });

  return networkInfoPromise;
}

export function getCustomQrHost(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ff_custom_qr_host');
}

export function setCustomQrHost(host: string | null): void {
  if (typeof window === 'undefined') return;
  if (!host || host.trim() === '') {
    localStorage.removeItem('ff_custom_qr_host');
  } else {
    localStorage.setItem('ff_custom_qr_host', host.trim());
  }
}

/**
 * Returns the best origin base URL for QR codes.
 * When on localhost, substitutes LAN IP so mobile phones on the same Wi-Fi can open the site.
 */
export function getQrBaseUrl(networkInfo?: NetworkInfo | null): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';

  const custom = getCustomQrHost();
  if (custom) {
    let formatted = custom.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `http://${formatted}`;
    }
    return formatted.replace(/\/$/, '');
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  if (isLocalhost) {
    const net = networkInfo || cachedNetworkInfo;
    if (net?.defaultUrl) {
      return net.defaultUrl.replace(/\/$/, '');
    }
    if (net?.lanIp) {
      const port = net.port || window.location.port || '3000';
      return `http://${net.lanIp}:${port}`;
    }
  }

  return window.location.origin;
}

/**
 * Generates the full registration URL for a given room.
 */
export function getRoomRegistrationUrl(roomNumber: number, networkInfo?: NetworkInfo | null): string {
  const base = getQrBaseUrl(networkInfo);
  return `${base}/?register_room=${roomNumber}`;
}
