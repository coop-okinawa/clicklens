import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Detail() {
  const { id } = useParams();
  const [url, setUrl] = useState<any>(null);
  const [clicks, setClicks] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch('/api/stats');
    const data = await res.json();

    // URL 本体
    const found = data.urls.find((u: any) => u.id === id);
    setUrl(found);

    // クリック履歴
    const related = data.clicks.filter((c: any) => c.url_id === id);
    setClicks(related);
  }

  if (!url) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{url.title}</h1>
      <p>Original URL: {url.original_url}</p>

      <h2>Clicks</h2>
      <ul>
        {clicks.map(c => (
          <li key={c.id}>
            IP: {c.ip}<br />
            Country: {c.country}<br />
            Time: {c.accessed_at}
          </li>
        ))}
      </ul>
    </div>
  );
}
