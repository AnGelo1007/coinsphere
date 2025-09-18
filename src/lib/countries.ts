
export interface Country {
  name: string;
  states: { name: string }[];
}

export const countries: Country[] = [
  // Asia
  {
    name: 'China',
    states: [
      { name: 'Beijing' },
      { name: 'Shanghai' },
      { name: 'Guangdong' },
      { name: 'Zhejiang' },
    ],
  },
  {
    name: 'Hong Kong',
    states: [{ name: 'Hong Kong Island' }, { name: 'Kowloon' }, { name: 'New Territories' }],
  },
  {
    name: 'India',
    states: [
      { name: 'Delhi' },
      { name: 'Maharashtra' },
      { name: 'Karnataka' },
      { name: 'Tamil Nadu' },
    ],
  },
  {
    name: 'Indonesia',
    states: [
      { name: 'Jakarta' },
      { name: 'Bali' },
      { name: 'West Java' },
      { name: 'East Java' },
    ],
  },
  {
    name: 'Israel',
    states: [
        { name: 'Tel Aviv District' },
        { name: 'Jerusalem District' },
        { name: 'Haifa District' },
    ],
  },
  {
    name: 'Japan',
    states: [
      { name: 'Tokyo' },
      { name: 'Osaka' },
      { name: 'Hokkaido' },
      { name: 'Kyoto' },
    ],
  },
  {
    name: 'Malaysia',
    states: [
      { name: 'Kuala Lumpur' },
      { name: 'Selangor' },
      { name: 'Penang' },
      { name: 'Johor' },
    ],
  },
  {
    name: 'Philippines',
    states: [
      { name: 'Metro Manila' },
      { name: 'Calabarzon' },
      { name: 'Central Luzon' },
      { name: 'Cebu' },
    ],
  },
  {
    name: 'Saudi Arabia',
    states: [
        { name: 'Riyadh Province' },
        { name: 'Makkah Province' },
        { name: 'Eastern Province' },
    ],
  },
  {
    name: 'South Korea',
    states: [
      { name: 'Seoul' },
      { name: 'Busan' },
      { name: 'Incheon' },
      { name: 'Gyeonggi' },
    ],
  },
  {
    name: 'Singapore',
    states: [{ name: 'Singapore' }],
  },
  {
    name: 'Thailand',
    states: [
      { name: 'Bangkok' },
      { name: 'Phuket' },
      { name: 'Chiang Mai' },
      { name: 'Chon Buri' },
    ],
  },
  {
    name: 'Turkey',
    states: [
        { name: 'Istanbul' },
        { name: 'Ankara' },
        { name: 'Izmir' },
    ],
  },
  {
    name: 'United Arab Emirates',
    states: [
        { name: 'Abu Dhabi' },
        { name: 'Dubai' },
        { name: 'Sharjah' },
    ],
  },
  {
    name: 'Vietnam',
    states: [
      { name: 'Hanoi' },
      { name: 'Ho Chi Minh City' },
      { name: 'Da Nang' },
      { name: 'Quang Ninh' },
    ],
  },
  // Europe
  {
    name: 'Austria',
    states: [
      { name: 'Vienna' },
      { name: 'Styria' },
      { name: 'Upper Austria' },
      { name: 'Tyrol' },
    ],
  },
  {
    name: 'Belgium',
    states: [
      { name: 'Brussels' },
      { name: 'Flanders' },
      { name: 'Wallonia' },
    ],
  },
  {
    name: 'Czech Republic',
    states: [
        { name: 'Prague' },
        { name: 'South Moravian Region' },
        { name: 'Central Bohemian Region' },
    ],
  },
  {
    name: 'Denmark',
    states: [
        { name: 'Capital Region of Denmark' },
        { name: 'Central Denmark Region' },
        { name: 'Region of Southern Denmark' },
    ],
  },
  {
    name: 'Finland',
    states: [
        { name: 'Uusimaa' },
        { name: 'Pirkanmaa' },
        { name: 'Southwest Finland' },
    ],
  },
  {
    name: 'France',
    states: [
      { name: 'Île-de-France' },
      { name: 'Provence-Alpes-Côte d\'Azur' },
      { name: 'Auvergne-Rhône-Alpes' },
    ],
  },
  {
    name: 'Germany',
    states: [
      { name: 'Berlin' },
      { name: 'Bavaria' },
      { name: 'North Rhine-Westphalia' },
      { name: 'Baden-Württemberg' },
    ],
  },
  {
    name: 'Greece',
    states: [
        { name: 'Attica' },
        { name: 'Crete' },
        { name: 'Central Macedonia' },
    ],
  },
  {
    name: 'Ireland',
    states: [
        { name: 'Leinster' },
        { name: 'Munster' },
        { name: 'Connacht' },
        { name: 'Ulster' },
    ],
  },
  {
    name: 'Italy',
    states: [
      { name: 'Lazio' },
      { name: 'Lombardy' },
      { name: 'Tuscany' },
      { name: 'Veneto' },
    ],
  },
  {
    name: 'Netherlands',
    states: [
      { name: 'North Holland' },
      { name: 'South Holland' },
      { name: 'Utrecht' },
      { name: 'North Brabant' },
    ],
  },
  {
    name: 'Norway',
    states: [
        { name: 'Oslo' },
        { name: 'Viken' },
        { name: 'Vestland' },
    ],
  },
  {
    name: 'Poland',
    states: [
        { name: 'Masovian Voivodeship' },
        { name: 'Lesser Poland Voivodeship' },
        { name: 'Silesian Voivodeship' },
    ],
  },
  {
    name: 'Portugal',
    states: [
      { name: 'Lisbon' },
      { name: 'Porto' },
      { name: 'Faro' },
      { name: 'Madeira' },
    ],
  },
  {
    name: 'Spain',
    states: [
      { name: 'Madrid' },
      { name: 'Catalonia' },
      { name: 'Andalusia' },
      { name: 'Valencian Community' },
    ],
  },
  {
    name: 'Sweden',
    states: [
      { name: 'Stockholm' },
      { name: 'Västra Götaland' },
      { name: 'Skåne' },
    ],
  },
  {
    name: 'Switzerland',
    states: [
      { name: 'Zürich' },
      { name: 'Geneva' },
      { name: 'Bern' },
      { name: 'Vaud' },
    ],
  },
  {
    name: 'United Kingdom',
    states: [
      { name: 'England' },
      { name: 'Scotland' },
      { name: 'Wales' },
      { name: 'Northern Ireland' },
    ],
  },
].sort((a, b) => a.name.localeCompare(b.name));
