import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.createUser({
  token: login.data.token,
  data: {
    email: 'nearly.headless.nick@example.com',
    fullname: 'Nearly Headless Nick',
    password: 'nearlyheadless',
    roles: ['Contributor'],
    username: 'headlessnick',
  },
});
