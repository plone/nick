import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.getFormData({
  token: login.data.token,
  block_id: '6e2235ca-b70b-4e88-bdd9-8cba9838d52c',
});
