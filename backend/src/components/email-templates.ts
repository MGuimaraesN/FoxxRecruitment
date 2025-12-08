// --- Theme Constants (Dark Mode to match Decola Vagas) ---
// Baseado no tailwind config do site: 
// brand.dark: #0f172a (Slate 900)
// brand.sidebar: #020617 (Slate 950) - Usado no Header
// brand.card: #1e293b (Slate 800)
// brand.blue: #2563eb (Blue 600)
const THEME = {
  bg: '#0f172a',       // Slate 900 (Fundo geral)
  card: '#1e293b',     // Slate 800 (Cartão do email)
  text: '#f8fafc',     // Slate 50 (Texto principal)
  textMuted: '#94a3b8',// Slate 400 (Texto secundário)
  border: '#334155',   // Slate 700 (Bordas)
  accent: '#2563eb',   // Blue 600 (Botões/Destaques)
  headerBg: '#020617', // Slate 950 (Cabeçalho igual ao do site)
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGO_URL = `${APP_URL}/decola-vagas-logo.png`;

// Helper for consistent inline text styling
const textStyle = (size: string, color: string, weight: string = '400', align: string = 'left', lineHeight: string = '1.6') => 
  `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: ${size}; font-weight: ${weight}; color: ${color}; text-align: ${align}; line-height: ${lineHeight}; margin: 0;`;

// --- Layout ---
const getEmailLayout = (title: string, content: string): string => {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <title>${title}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: ${THEME.bg}; color: ${THEME.text}; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    a:hover { text-decoration: none; opacity: 0.9; }
    
    /* Buttons */
    .btn-primary { background-color: ${THEME.accent}; color: #ffffff !important; border-radius: 6px; padding: 12px 24px; display: inline-block; font-weight: 600; text-decoration: none; }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .content-padding { padding: 24px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .header-padding { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${THEME.bg};">
  <center>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${THEME.bg}" role="presentation">
      <tr>
        <td align="center" valign="top" style="padding: 40px 10px;">
          <!-- Wrapper for max-width -->
          <!--[if (gte mso 9)|(IE)]>
          <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
          <![endif]-->
          <table class="container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: ${THEME.card}; border-radius: 12px; overflow: hidden; border: 1px solid ${THEME.border}; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);" bgcolor="${THEME.card}">
            
            <!-- Brand Header -->
            <tr>
              <td align="center" class="header-padding" style="background-color: ${THEME.headerBg}; padding: 32px 40px; border-bottom: 1px solid ${THEME.border};" bgcolor="${THEME.headerBg}">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                  <tr>
                    <!-- Logo Icon -->
                    <td align="center" valign="middle" style="padding-right: 12px;">
                        <a href="${APP_URL}" target="_blank" style="text-decoration: none; display: block;">
                          <img src="${LOGO_URL}" alt="Logo" width="32" height="32" style="display: block; width: 32px; height: 32px; border: 0; border-radius: 6px;" />
                        </a>
                    </td>
                    <!-- Logo Text -->
                    <td align="left" valign="middle" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 32px;">
                        <a href="${APP_URL}" target="_blank" style="text-decoration: none; color: #ffffff;">Decola Vagas</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td class="content-padding" style="padding: 48px 40px;">
                 <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                   ${content}
                 </table>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 40px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="border-top: 1px solid ${THEME.border}; font-size: 1px; line-height: 1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 32px 40px;">
                <p style="${textStyle('13px', THEME.textMuted, '400', 'center')} margin-bottom: 16px;">
                  &copy; 2025 Decola Vagas. Todos os direitos reservados.
                </p>
                <p style="${textStyle('12px', THEME.textMuted, '400', 'center')}">
                  <a href="#" style="color: ${THEME.accent}; text-decoration: none;">Política de Privacidade</a>
                  &nbsp;&nbsp;<span style="color: ${THEME.border};">|</span>&nbsp;&nbsp;
                  <a href="#" style="color: ${THEME.accent}; text-decoration: none;">Central de Ajuda</a>
                </p>
              </td>
            </tr>

          </table>
          <!--[if (gte mso 9)|(IE)]>
              </td>
            </tr>
          </table>
          <![endif]-->

        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
};

// --- Content Generators ---

export const getResetPasswordTemplate = (resetLink: string, userEmail: string): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;"><span style="font-size: 48px;">🔐</span></td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Redefinir Senha</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 32px;">Recebemos uma solicitação para a conta <strong style="color: ${THEME.text};">${userEmail}</strong>.</td></tr>
    
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="${THEME.accent}">
                    <a href="${resetLink}" target="_blank" style="font-family: sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 32px; border-radius: 6px; border: 1px solid ${THEME.accent};">
                        Criar Nova Senha
                    </a>
                </td>
            </tr>
        </table>
      </td>
    </tr>

    <tr><td style="${textStyle('14px', THEME.textMuted, '400', 'center')}">Se você não solicitou isso, pode ignorar este email. O link expira em 1 hora.</td></tr>
  `;
  return getEmailLayout("Redefinição de Senha", content);
};

export const getWelcomeTemplate = (userName: string, profileLink: string): string => {
  const content = `
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Bem-vindo a bordo! 🚀</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 32px;">Olá, <strong style="color: ${THEME.text};">${userName}</strong>. Estamos muito felizes em ter você conosco no Decola Vagas.</td></tr>
    
    <tr>
        <td style="background-color: ${THEME.headerBg}; padding: 24px; border-radius: 8px; border: 1px solid ${THEME.border};" bgcolor="${THEME.headerBg}">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                    <td valign="top" style="padding-bottom: 16px; padding-right: 12px; width: 24px;">
                        <span style="font-size: 18px;">🎯</span>
                    </td>
                    <td valign="top" style="padding-bottom: 16px;">
                        <p style="${textStyle('15px', THEME.text, '400')}"><strong style="color: #ffffff;">Encontre Vagas:</strong> Estágios e Iniciação Científica selecionados para você.</p>
                    </td>
                </tr>
                <tr>
                    <td valign="top" style="padding-right: 12px; width: 24px;">
                        <span style="font-size: 18px;">🎓</span>
                    </td>
                    <td valign="top">
                        <p style="${textStyle('15px', THEME.text, '400')}"><strong style="color: #ffffff;">Conexão Direta:</strong> Integrado com sua instituição de ensino.</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    
    <tr><td align="center" style="padding-top: 32px;">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="${THEME.accent}">
                    <a href="${profileLink}" target="_blank" style="font-family: sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 32px; border-radius: 6px; border: 1px solid ${THEME.accent};">
                        Completar meu Perfil
                    </a>
                </td>
            </tr>
        </table>
    </td></tr>
  `;
  return getEmailLayout("Bem-vindo ao Decola Vagas", content);
};

export const getNewJobTemplate = (jobTitle: string, institutionName: string): string => {
  const content = `
    <tr><td style="${textStyle('12px', '#60a5fa', '600', 'center')} text-transform: uppercase; letter-spacing: 1px; padding-bottom: 16px;">Nova Oportunidade</td></tr>
    <tr><td style="${textStyle('26px', THEME.text, '700', 'center')} padding-bottom: 8px;">${jobTitle}</td></tr>
    <tr><td style="${textStyle('18px', THEME.textMuted, '400', 'center')} padding-bottom: 32px;">em <span style="color: ${THEME.text};">${institutionName}</span></td></tr>
    
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: ${THEME.bg}; border-radius: 8px; border: 1px solid ${THEME.border};" bgcolor="${THEME.bg}">
            <tr>
                <td style="padding: 16px 32px; text-align: center; border-right: 1px solid ${THEME.border};">
                    <span style="display: block; font-size: 11px; color: ${THEME.textMuted}; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Modelo</span>
                    <span style="font-size: 15px; font-weight: 600; color: ${THEME.text};">Híbrido</span>
                </td>
                <td style="padding: 16px 32px; text-align: center;">
                    <span style="display: block; font-size: 11px; color: ${THEME.textMuted}; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Tipo</span>
                    <span style="font-size: 15px; font-weight: 600; color: ${THEME.text};">Estágio</span>
                </td>
            </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td align="center">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="${THEME.text}">
                    <a href="#" target="_blank" style="font-family: sans-serif; font-size: 16px; font-weight: 600; color: ${THEME.bg}; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 6px; border: 1px solid ${THEME.text};">
                        Ver Detalhes da Vaga
                    </a>
                </td>
            </tr>
        </table>
      </td>
    </tr>
  `;
  return getEmailLayout("Nova Vaga Disponível", content);
};

export const getJobModifiedTemplate = (jobTitle: string): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;"><span style="font-size: 48px;">📝</span></td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Vaga Atualizada</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 24px;">A vaga <strong style="color: ${THEME.text};">${jobTitle}</strong> que você salvou sofreu alterações importantes.</td></tr>
    
    <tr>
      <td align="center">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="${THEME.accent}">
                    <a href="#" target="_blank" style="font-family: sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 6px; border: 1px solid ${THEME.accent};">
                        Conferir Mudanças
                    </a>
                </td>
            </tr>
        </table>
      </td>
    </tr>
  `;
  return getEmailLayout("Atualização de Vaga", content);
};

export const getJobUnavailableTemplate = (jobTitle: string): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;"><span style="font-size: 48px;">🔒</span></td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Vaga Encerrada</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 24px;">Informamos que a vaga <strong style="color: ${THEME.text};">${jobTitle}</strong> foi encerrada ou preenchida.</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 32px;">Continue buscando novas oportunidades.</td></tr>
    
    <tr><td align="center">
        <a href="#" style="${textStyle('15px', THEME.accent, '600', 'center')} text-decoration: none;">Ver outras vagas similares &rarr;</a>
    </td></tr>
  `;
  return getEmailLayout("Vaga Indisponível", content);
};

export const getSecurityAlertTemplate = (): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;">
        <span style="font-size: 48px;">⚠️</span>
    </td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Alerta de Segurança</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 24px;">Sua senha foi alterada recentemente.</td></tr>
    <tr><td style="${textStyle('15px', THEME.textMuted, '400', 'center')} padding-bottom: 8px;">Se não foi você que realizou esta alteração, entre em contato conosco imediatamente.</td></tr>
  `;
  return getEmailLayout("Alerta de Segurança", content);
};

export const getSavedJobReminderTemplate = (jobTitle: string): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;"><span style="font-size: 48px;">⏰</span></td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Lembrete de Vaga Salva</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 24px;">Você ainda tem interesse na vaga <strong style="color: ${THEME.text};">${jobTitle}</strong>?</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 32px;">Ela continua aberta e aguardando sua candidatura!</td></tr>
    
    <tr>
      <td align="center">
        <table border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
                <td align="center" style="border-radius: 6px;" bgcolor="${THEME.accent}">
                    <a href="#" target="_blank" style="font-family: sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 6px; border: 1px solid ${THEME.accent};">
                        Candidatar-se Agora
                    </a>
                </td>
            </tr>
        </table>
      </td>
    </tr>
  `;
  return getEmailLayout("Lembrete de Vaga", content);
};

export const getApplicationFeedbackTemplate = (jobTitle: string): string => {
  const content = `
    <tr><td align="center" style="padding-bottom: 24px;">
        <span style="font-size: 48px;">✅</span>
    </td></tr>
    <tr><td style="${textStyle('24px', THEME.text, '700', 'center')} padding-bottom: 16px;">Aplicação Recebida</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 24px;">Sua candidatura para a vaga <strong style="color: ${THEME.text};">${jobTitle}</strong> foi enviada com sucesso.</td></tr>
    <tr><td style="${textStyle('16px', THEME.textMuted, '400', 'center')} padding-bottom: 16px;">Boa sorte! O recrutador entrará em contato se seu perfil for selecionado.</td></tr>
  `;
  return getEmailLayout("Confirmação de Aplicação", content);
};