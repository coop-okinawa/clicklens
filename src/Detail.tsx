import React from 'react';

export const Detail: React.FC<{ url: any; clicks: any[] }> = ({ url, clicks }) => {
  if (!url) return <div>データがありません</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{url.title}</h1>
      <p>Original URL: {url.originalUrl}</p>

      <h2>クリック履歴</h2>
      <ul>
        {clicks.map(c => (
          <li key={c.id} style={{ marginBottom: 10 }}>
            <div>IP: {c.ip}</div>
            <div>Country: {c.country}</div>
            <div>Time: {c.accessedAt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
