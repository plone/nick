import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.deleteComment({
  token: login.data.token,
  params: {
    id: '3d61035e-1fd3-435a-85a8-c44863f3a2dd',
  },
});
