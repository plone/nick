import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createLock({
  token: login.data.token,
  path: '/news/my-news-item',
  data: {
    stealable: false,
    timeout: 3600,
  },
});
