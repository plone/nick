import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createGroup({
  token: login.data.token,
  data: {
    groupname: 'nicks',
    title: 'Nicks',
    description: 'Nearly Headless Nicks',
    email: 'nearly.headless.nicks@example.com',
    roles: ['Contributor'],
  },
});
