app.get('/api/stats', async (req, res) => {
  try {
    const { data: urls } = await supabase.from('urls').select('*').order('created_at', { ascending: false });
    const { data: clicks } = await supabase
      .from('clicks')
      .select('*, urls(id, title, short_code, original_url)')
      .order('accessed_at', { ascending: false });

    // 日別集計
    const dailyMap = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }
    clicks.forEach(c => {
      const date = c.accessed_at.split('T')[0];
      if (dailyMap[date] !== undefined) dailyMap[date]++;
    });
    const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({
      date: date.substring(5),
      count
    }));

    // 国別
    const countryMap = {};
    clicks.forEach(c => {
      const country = c.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const countryStats = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 最新クリック10件
    const recentClicks = [...clicks]
      .sort((a, b) => new Date(b.accessed_at) - new Date(a.accessed_at))
      .slice(0, 10);

    // ここが最重要
    res.json({
      urls,
      stats: {
        totalClicks: clicks.length,
        uniqueUrls: urls.length,
        dailyClicks,
        countryStats,
        recentClicks,
        clicks
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});
