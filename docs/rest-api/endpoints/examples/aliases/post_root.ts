import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createAliases({
  token: login.data.token,
  data: {
    items: [
      {
        path: '/news-items',
        'redirect-to': '/news',
      },
      {
        path: '/news-posts',
        'redirect-to': '/news',
      },
      {
        path: '/event-posts',
        'redirect-to': '/events',
      },
    ],
  },
});
