import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createContent({
  token: login.data.token,
  path: '/nl',
  data: {
    '@type': 'Page',
    id: 'evenementen',
    language: 'nl',
    title: 'Evenementen',
    translation_of: '495efb73-cbdd-4bef-935a-a56f70a20854',
  },
});
