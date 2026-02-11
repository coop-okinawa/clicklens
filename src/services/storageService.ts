import { ShortUrl, AnalyticsStats } from '../types';

export const storageService = {
  getStats: async (): Promise<{ urls: ShortUrl[], stats: AnalyticsStats }> => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();

      const urls = data.urls.map((u: any) => ({
        id: u.id,
        originalUrl: u.original_url,
        shortCode: u.short_code,
        title: u.title,
        createdAt: u.created_at
      }));

      const clicks = data.stats.clicks || [];

      const dailyMap: Record<string, number> = {};
      const now = new Date();

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        dailyMap[d.toISOString().split('T')[0]] = 0;
      }

      clicks.forEach((c: any) => {
        const date = c.accessed_at.split('T')[0];
        if (dailyMap[date] !== undefined) dailyMap[date]++;
      });

      const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({
        date: date.substring(5),
        count
      }));

      const countryMap: Record<string, number> = {};
      clicks.forEach((c: any) => {
        countryMap[c.country] = (countryMap[c.country] || 0) + 1;
      });

      const countryStats = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const recentClicks = clicks.slice(0, 10).map((c: any) => ({
        id: c.id,
        urlId: c.url_id,
        shortCode: '',
        timestamp: c.accessed_at,
        ip: c.ip,
        country: c.country,
        userAgent: '',
        urlTitle: ''
      }));

      return {
        urls,
        stats: {
          totalClicks: clicks.length,
          uniqueUrls: urls.length,
          topCountry: countryStats[0]?.name || 'None',
          dailyClicks,
          countryStats,
          recentClicks,
          clicks
        }
      };

    } catch (e) {
      console.error('API Error:', e);
      return {
        urls: [],
        stats: {
          totalClicks: 0,
          uniqueUrls: 0,
          topCountry: 'None',
          dailyClicks: [],
          countryStats: [],
          recentClicks: [],
          clicks: []
        }
      };
    }
  },

  // -----------------------------
  // ★ 短縮URL作成（完全修正版）
  // -----------------------------
  saveUrl: async (url: ShortUrl): Promise<string> => {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalUrl: url.originalUrl,
        title: url.title
      })
    });

    const data = await res.json();

    // shortCode を受け取り、/r/ 付きの短縮URLを返す
    return `${window.location.origin}/r/${data.shortCode}`;
  },

  updateUrl: async (id: string, updates: Partial<ShortUrl>): Promise<void> => {
    await fetch(`/api/urls/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updates.title,
        original_url: updates.originalUrl
      })
    });
  },

  deleteUrl: async (id: string): Promise<void> => {
    await fetch(`/api/urls/${id}`, { method: 'DELETE' });
  }
};
