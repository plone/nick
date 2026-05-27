import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });
const login = await cli.login({
  data: { login: 'admin', password: 'admin' },
});

const { data } = await cli.userEmailNotification({
  token: login.data.token,
  user: 'admin',
  data: {
    name: 'John Doe',
    from: 'john@doe.com',
    subject: 'Hello!',
    message: 'Just want to say hi.',
  },
});
