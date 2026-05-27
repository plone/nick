import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.deleteContentRule({
  token: login.data.token,
  path: '/events',
  data: {
    rule_ids: ['rule-1'],
  },
});
