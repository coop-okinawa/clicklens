
export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  createdAt: string;
}

export interface ClickRecord {
  id: string;
  urlId: string;
  shortCode: string;
  timestamp: string;
  ip: string;
  country: string;
  userAgent: string;
}

export interface AnalyticsStats {
  totalClicks: number;
  uniqueUrls: number;
  topCountry: string;
  dailyClicks: { date: string; count: number }[];
  countryStats: { name: string; value: number }[];
  recentClicks: (ClickRecord & { urlTitle: string })[];
}
