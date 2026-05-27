import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createControlpanelType({
  token: login.data.token,
  data: {
    title: 'My Type',
    description: 'Type Description',
  },
});
