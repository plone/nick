import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.linkintegrity({
  token: login.data.token,
  query: {
    uids: '32215c67-86de-462a-8cc0-eabcd2b39c26',
  },
});
