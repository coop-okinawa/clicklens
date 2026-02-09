
const COUNTRIES = ['Japan', 'USA', 'Germany', 'UK', 'France', 'Canada', 'Australia', 'South Korea'];

export const generateMockIp = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

export const getCountryFromIp = (ip: string): string => {
  // Simple mapping based on the first octet as requested
  const firstOctet = parseInt(ip.split('.')[0], 10);
  return COUNTRIES[firstOctet % COUNTRIES.length];
};

export const generateShortCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
