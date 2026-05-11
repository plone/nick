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

  it('should log preview url when mailDebug is enabled', async () => {
    vi.spyOn(Controlpanel, 'fetchById').mockResolvedValue({
      data: {
        debug: false,
        mailDebug: true,
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
