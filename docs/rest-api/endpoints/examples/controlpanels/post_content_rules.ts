import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createControlpanelContentRule({
  token: login.data.token,
  data: {
    title: 'Content Rule 3',
    description: 'Description for Content Rule 3',
    event: 'onAfterModify',
    cascading: false,
    enabled: false,
    stop: false,
  },
});
