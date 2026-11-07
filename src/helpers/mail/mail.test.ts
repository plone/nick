/**
 * Mail helper tests.
 * @module helpers/mail/mail.test
 */

// External imports
import nodemailer from 'nodemailer';
import { describe, it, vi, beforeEach, expect } from 'vitest';

// Internal imports
import * as mail from './mail';

vi.mock('../../log/log', () => ({
  log: {
    info: vi.fn(),
  },
}));

import { Controlpanel } from '../../models/controlpanel/controlpanel';

describe('Mail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should send mail with config settings', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: false,
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        user: 'user@example.com',
        pass: 'password',
      },
    } as any);

    const sendMailSpy = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailSpy,
    } as any);

    await mail.sendMail(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
      },
      {} as any,
    );

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(sendMailSpy).toHaveBeenCalled();
  });

  it('should use ethereal test account in debug mode', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: true,
      },
    } as any);

    const sendMailSpy = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailSpy,
    } as any);
    vi.spyOn(nodemailer, 'createTestAccount').mockResolvedValue({
      user: 'test@ethereal.email',
      pass: 'testpass',
    } as any);

    await mail.sendMail(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
      },
      {} as any,
    );

    expect(nodemailer.createTestAccount).toHaveBeenCalled();
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(sendMailSpy).toHaveBeenCalled();
  });

  it('should log preview url when debug is enabled', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: true,
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        user: 'user@example.com',
        pass: 'password',
      },
    } as any);

    const info = { messageId: 'test-id' };
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: vi.fn().mockResolvedValue(info),
    } as any);
    vi.spyOn(nodemailer, 'getTestMessageUrl').mockReturnValue(
      'http://example.com/preview',
    );

    await mail.sendMail(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
      },
      {} as any,
    );

    expect(nodemailer.getTestMessageUrl).toHaveBeenCalledWith(info);
  });
});

describe('Mail with Microsoft 365', () => {
  const settings = (secret: string) =>
    ({
      data: {
        debug: false,
        transport: 'microsoft365',
        email_from_address: 'site@example.com',
        oauth_client_id: 'client-id',
        oauth_tenant_id: 'tenant-id',
        oauth_client_secret: secret,
      },
    }) as any;

  const message = {
    from: 'site@example.com',
    to: 'recipient@example.com',
    bcc: 'hidden@example.com',
    subject: 'Test',
    text: 'Hello',
  };

  const tokenResponse = (expires_in = 3600) => ({
    ok: true,
    status: 200,
    json: async () => ({ access_token: 'the-token', expires_in }),
  });

  const sentResponse = { ok: true, status: 202, json: async () => ({}) };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should send the mime message through Graph with a client credentials token', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue(settings('secret-1'));
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(sentResponse);
    vi.stubGlobal('fetch', fetchSpy);

    await mail.sendMail(message, {} as any);

    // Token request
    const [tokenUrl, tokenInit] = fetchSpy.mock.calls[0];
    expect(tokenUrl).toBe(
      'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token',
    );
    const form = new URLSearchParams(tokenInit.body);
    expect(form.get('grant_type')).toBe('client_credentials');
    expect(form.get('client_id')).toBe('client-id');
    expect(form.get('client_secret')).toBe('secret-1');
    expect(form.get('scope')).toBe('https://graph.microsoft.com/.default');

    // Send request
    const [sendUrl, sendInit] = fetchSpy.mock.calls[1];
    expect(sendUrl).toBe(
      'https://graph.microsoft.com/v1.0/users/site%40example.com/sendMail',
    );
    expect(sendInit.headers.Authorization).toBe('Bearer the-token');
    expect(sendInit.headers['Content-Type']).toBe('text/plain');
    const mime = Buffer.from(sendInit.body, 'base64').toString();
    expect(mime).toContain('Subject: Test');
    expect(mime).toContain('To: recipient@example.com');
    expect(mime).toContain('Bcc: hidden@example.com');
  });

  it('should reuse the token while it is valid', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue(settings('secret-2'));
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValue(sentResponse);
    vi.stubGlobal('fetch', fetchSpy);

    await mail.sendMail(message, {} as any);
    await mail.sendMail(message, {} as any);

    // One token request, two sends
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(fetchSpy.mock.calls[2][0]).toContain('/sendMail');
  });

  it('should fetch a new token when it is about to expire', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue(settings('secret-3'));
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse(30))
      .mockResolvedValueOnce(sentResponse)
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(sentResponse);
    vi.stubGlobal('fetch', fetchSpy);

    await mail.sendMail(message, {} as any);
    await mail.sendMail(message, {} as any);

    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('should throw when the authentication fails', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue(settings('secret-4'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: 'invalid_client',
          error_description: 'Invalid client secret provided.',
        }),
      }),
    );

    await expect(mail.sendMail(message, {} as any)).rejects.toThrow(
      'Microsoft 365 authentication failed (401): Invalid client secret provided.',
    );
  });

  it('should throw when Graph refuses the mail', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue(settings('secret-5'));
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: async () => ({ error: { message: 'Access is denied.' } }),
        }),
    );

    await expect(mail.sendMail(message, {} as any)).rejects.toThrow(
      'Microsoft 365 could not send the mail (403): Access is denied.',
    );
  });

  it('should throw when the application details are missing', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: false,
        transport: 'microsoft365',
        email_from_address: 'site@example.com',
      },
    } as any);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(mail.sendMail(message, {} as any)).rejects.toThrow(
      'tenant ID and client secret',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should throw when the site From address is missing', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: { debug: false, transport: 'microsoft365' },
    } as any);

    await expect(mail.sendMail(message, {} as any)).rejects.toThrow(
      'site From address',
    );
  });

  it('should use the SMTP server when the transport is smtp', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: false,
        transport: 'smtp',
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        user: 'user@example.com',
        pass: 'password',
      },
    } as any);
    const sendMailSpy = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailSpy,
    } as any);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await mail.sendMail(message, {} as any);

    expect(sendMailSpy).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
