import nodemailer from 'nodemailer';
import {
  getResetPasswordTemplate,
  getWelcomeTemplate,
  getNewJobTemplate,
  getJobModifiedTemplate,
  getJobUnavailableTemplate,
  getSecurityAlertTemplate,
  getSavedJobReminderTemplate,
  getApplicationFeedbackTemplate,
} from '../components/email-templates.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

const sendEmail = async (to: string | string[], subject: string, html: string) => {
  const mailOptions = {
    from: `"Decola Vagas" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(',') : to, // Handles multiple recipients
    subject: subject,
    html: html,
  };

  try {
    // await transporter.verify(); // Optional: verify connection
    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado para ${to}:`, info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const htmlContent = getResetPasswordTemplate(resetLink, to);
  return sendEmail(to, 'Redefinição de Senha - Decola Vagas', htmlContent);
};

export const sendWelcomeEmail = async (to: string, userName: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const profileLink = `${baseUrl}/dashboard/profile`;
  const htmlContent = getWelcomeTemplate(userName, profileLink);
  return sendEmail(to, 'Bem-vindo ao Decola Vagas!', htmlContent);
};

export const sendNewJobNotification = async (recipients: string[], jobTitle: string, institutionName: string) => {
  // Use BCC for mass emails or loop. For simplicity and privacy, loop or individual sends are better if personalized,
  // but if content is same, BCC is efficient. However, `to` field reveals all.
  // Better practice: Loop and send individually or use BCC.
  // Given requirements: "lidar com múltiplos destinatários de forma eficiente (loop ou BCC)"

  // Implementation using BCC to avoid leaking emails if many recipients
  if (recipients.length === 0) return;

  const htmlContent = getNewJobTemplate(jobTitle, institutionName);

  const mailOptions = {
    from: `"Decola Vagas" <${process.env.GMAIL_USER}>`,
    bcc: recipients, // Use BCC
    subject: `Nova Vaga: ${jobTitle}`,
    html: htmlContent,
  };

  try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Notificação de nova vaga enviada (BCC):', info.messageId);
      return { success: true, id: info.messageId };
  } catch (error) {
      console.error('Erro ao enviar notificação de nova vaga:', error);
      return { success: false, error };
  }
};

export const sendJobModifiedNotification = async (to: string, jobTitle: string) => {
  const htmlContent = getJobModifiedTemplate(jobTitle);
  return sendEmail(to, `Vaga Atualizada: ${jobTitle}`, htmlContent);
};

export const sendJobUnavailableNotification = async (to: string, jobTitle: string) => {
  const htmlContent = getJobUnavailableTemplate(jobTitle);
  return sendEmail(to, `Vaga Encerrada: ${jobTitle}`, htmlContent);
};

export const sendSecurityAlert = async (to: string) => {
  const htmlContent = getSecurityAlertTemplate();
  return sendEmail(to, 'Alerta de Segurança - Senha Alterada', htmlContent);
};

export const sendSavedJobReminder = async (to: string, jobTitle: string) => {
  const htmlContent = getSavedJobReminderTemplate(jobTitle);
  return sendEmail(to, `Lembrete: Vaga ${jobTitle}`, htmlContent);
};

export const sendApplicationFeedback = async (to: string, jobTitle: string) => {
  const htmlContent = getApplicationFeedbackTemplate(jobTitle);
  return sendEmail(to, `Aplicação Recebida: ${jobTitle}`, htmlContent);
};
