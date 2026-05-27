import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });

const { data } = await cli.createUser({
  data: {
    email: 'nearly.headless.nick@example.com',
    fullname: 'Nearly Headless Nick',
    username: 'headlessnick',
    sendPasswordReset: true,
  },
});
