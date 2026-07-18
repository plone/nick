import { Client } from '@plone/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.startScheduledJob({
  token: login.data.token,
  params: {
    id: 'reindex-events',
  },
});
