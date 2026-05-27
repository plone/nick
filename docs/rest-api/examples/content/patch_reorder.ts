import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = cli.orderContent({
  token: login.data.token,
  path: '/news',
  data: {
    obj_id: 'my-news-item',
    delta: 'top',
  },
});
