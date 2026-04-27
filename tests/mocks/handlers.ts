import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/news', () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'fire',
        location: 'Bruxelles',
        description: 'Appartement en feu',
        timestamp: '2026-04-27T10:00:00Z',
        latitude: 50.8503,
        longitude: 4.3517,
        url: 'https://lesoir.be/fire'
      },
      {
        id: '2',
        type: 'burglary',
        location: 'Ixelles',
        description: 'Tentative de cambriolage dans une cave',
        timestamp: '2026-04-27T11:00:00Z',
        latitude: 50.8270,
        longitude: 4.3740,
        url: 'https://lesoir.be/burglary'
      }
    ]);
  }),
];
