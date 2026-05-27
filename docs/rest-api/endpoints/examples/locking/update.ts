import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.updateContent({
  token: login.data.token,
  path: '/news/my-news-item',
  locktoken: 'a95388f2-e4b3-4292-98aa-62656cbd5b9c',
  data: {
    title: 'My New News Item',
  },
});
