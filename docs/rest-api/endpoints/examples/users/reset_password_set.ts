import { Client } from '@robgietema/nick';

const cli = Client.initialize({ apiPath: 'http://localhost:8080' });

const { data } = await cli.resetPassword({
  params: {
    email: 'headlessnick',
  },
  data: {
    reset_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoZWFkbGVzc25pY2siLCJmdWxsbmFtZSI6Ik5lYXJseSBIZWFkbGVzcyBOaWNrIiwiaWF0IjoxNjQ5Njk4MTUxfQ.K-NLonuCLqcv_hzq4d_vqEVGPLClwpry_HVYRSkJIf4',
    new_password: 'headless',
  },
});
