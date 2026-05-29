import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createScheduledJob({
  token: login.data.token,
  data: {
    id: 'reindex-pages',
    title: 'Reindex Pages',
    description: 'Reindex all pages',
    action: 'reindex',
    params: {
      type: 'Page',
    },
    schedule: '0 0 * * *',
  },
});
