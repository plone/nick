import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.abortJob({
  token: login.data.token,
  params: {
    id: 'a2fe7e07-d54b-435b-9cb0-e12f1f80a589',
  },
});
