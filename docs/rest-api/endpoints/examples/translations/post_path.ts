import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.linkTranslation({
  token: login.data.token,
  path: '/en/events',
  data: {
    id: '/nl/evenementen',
  },
});
