
import { ShortUrl, ClickRecord, AnalyticsStats } from '../types';

const URLS_KEY = 'clicklens_urls_v2';
const CLICKS_KEY = 'clicklens_clicks_v2';

export const storageService = {
  getUrls: (): ShortUrl[] => {
    const data = localStorage.getItem(URLS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUrl: (url: ShortUrl): void => {
    const urls = storageService.getUrls();
    urls.unshift(url);
    localStorage.setItem(URLS_KEY, JSON.stringify(urls));
  },

  updateUrl: (id: string, updates: Partial<ShortUrl>): void => {
    const urls = storageService.getUrls();
    const updated = urls.map(u => u.id === id ? { ...u, ...updates } : u);
    localStorage.setItem(URLS_KEY, JSON.stringify(updated));
  },

  deleteUrl: (id: string): void => {
    const urls = storageService.getUrls();
    const filteredUrls = urls.filter(u => u.id !== id);
    localStorage.setItem(URLS_KEY, JSON.stringify(filteredUrls));
    
    // 関連するクリック記録も削除
    const clicks = storageService.getClicks();
    const filteredClicks = clicks.filter(c => c.urlId !== id);
    localStorage.setItem(CLICKS_KEY, JSON.stringify(filteredClicks));
  },

  getClicks: (): ClickRecord[] => {
    const data = localStorage.getItem(CLICKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  recordClick: (click: ClickRecord): void => {
    const clicks = storageService.getClicks();
    clicks.push(click);
    localStorage.setItem(CLICKS_KEY, JSON.stringify(clicks));
  },

  getStats: (): AnalyticsStats => {
    const urls = storageService.getUrls();
    const clicks = storageService.getClicks();
    
    // 日別クリック数 (直近7日間)
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }

    clicks.forEach(c => {
      const date = c.timestamp.split('T')[0];
      if (dailyMap[date] !== undefined) {
        dailyMap[date]++;
      }
    });

    const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({ 
      date: date.substring(5), // MM-DD
      count 
    }));

    // 国別統計
    const countryMap: Record<string, number> = {};
    clicks.forEach(c => {
      countryMap[c.country] = (countryMap[c.country] || 0) + 1;
    });

    const countryStats = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 最新アクティビティ (URLタイトル付き)
    const recentClicks = [...clicks]
      .reverse()
      .slice(0, 10)
      .map(c => {
        const url = urls.find(u => u.id === c.urlId);
        return { ...c, urlTitle: url ? url.title : 'Deleted URL' };
      });

    return {
      totalClicks: clicks.length,
      uniqueUrls: urls.length,
      topCountry: countryStats[0]?.name || 'None',
      dailyClicks,
      countryStats,
      recentClicks,
    };
  }
};
