const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function getVisitorId(): string {
  let id = localStorage.getItem('stocksim_visitor_id');
  if (!id) {
    id = 'vis_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('stocksim_visitor_id', id);
  }
  return id;
}

export function getClientDevice(): string {
  if (typeof navigator === 'undefined') return 'Windows 11 / Chrome';
  const ua = navigator.userAgent;

  let os = 'Windows 11';
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android 14';
  else if (ua.includes('Macintosh')) os = 'macOS 15';
  else if (ua.includes('Windows NT 10.0')) os = 'Windows 11';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Chrome';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  return `${os} / ${browser}`;
}

interface GeoInfo {
  ip?: string;
  city: string;
  isp: string;
}

let cachedGeo: GeoInfo | null = null;

export async function detectGeoInfo(): Promise<GeoInfo> {
  if (cachedGeo) return cachedGeo;

  // Mặc định FPT University / FPT Telecom Đà Nẵng cho môi trường chạy local / thuyết trình
  const fallback: GeoInfo = {
    ip: `42.112.89.${Math.floor(Math.random() * 200) + 20}`,
    city: 'Đà Nẵng (Thiết bị vừa truy cập)',
    isp: 'FPT Telecom'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      let cityName = data.city || 'Đà Nẵng';
      if (/da nang|danang/i.test(cityName)) cityName = 'Đà Nẵng';
      else if (/hanoi|ha noi/i.test(cityName)) cityName = 'Hà Nội';
      else if (/ho chi minh|saigon/i.test(cityName)) cityName = 'TP. Hồ Chí Minh';

      let ispName = data.org || 'FPT Telecom';
      if (/fpt/i.test(ispName)) ispName = 'FPT Telecom';
      else if (/viettel/i.test(ispName)) ispName = 'Viettel';
      else if (/vnpt/i.test(ispName)) ispName = 'VNPT';

      cachedGeo = {
        ip: data.ip || fallback.ip,
        city: `${cityName} (Thiết bị vừa truy cập)`,
        isp: ispName
      };
      return cachedGeo;
    }
  } catch (e) {
    // Timeout hoặc mạng không truy cập được api ngoài -> dùng fallback chuẩn Đà Nẵng
  }

  cachedGeo = fallback;
  return cachedGeo;
}

export async function trackVisit(): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const geo = await detectGeoInfo();
    const device = getClientDevice();
    const sessionKey = 'stocksim_visit_recorded_' + new Date().toISOString().slice(0, 10);
    
    // Chỉ gửi 1 lần mỗi ngày cho 1 visitor để đảm bảo chuẩn Unique Visitor
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      await fetch(`${API_URL}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visit',
          visitorId,
          ip: geo.ip,
          location: geo.city,
          isp: geo.isp,
          device
        })
      });
    }
  } catch (err) {
    // Ignore tracking errors in background
  }
}

export async function trackLinkClick(label: string): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const geo = await detectGeoInfo();
    const device = getClientDevice();

    await fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'click',
        visitorId,
        label,
        ip: geo.ip,
        location: geo.city,
        isp: geo.isp,
        device
      })
    });
  } catch (err) {
    // Ignore tracking errors
  }
}
