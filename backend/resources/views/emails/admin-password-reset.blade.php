<!doctype html>
<html lang="en">
  <body style="margin: 0; padding: 0; background: #f4efe4; color: #182234; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f4efe4; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #fffdf8; border: 1px solid #d8cbb5; border-radius: 16px; overflow: hidden;">
            <tr>
              <td style="background: #12203a; padding: 24px 28px; color: #f8f1e4;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #d8a63a;">
                  Music Without Borders
                </p>
                <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.25; font-weight: 700;">
                  Reset your admin password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Hello {{ $user->name }},
                </p>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
                  Use the button below to choose a new password for the Music Without Borders admin workspace.
                  The link expires in 60 minutes and can only be used once.
                </p>
                <p style="margin: 0 0 24px;">
                  <a href="{{ $resetUrl }}" style="display: inline-block; border-radius: 999px; background: #d8a63a; color: #12203a; padding: 13px 22px; font-size: 14px; font-weight: 700; text-decoration: none;">
                    Choose a new password
                  </a>
                </p>
                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #5c6678;">
                  If the button does not work, copy this link into your browser:
                </p>
                <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; word-break: break-all;">
                  <a href="{{ $resetUrl }}" style="color: #7a5310;">{{ $resetUrl }}</a>
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #5c6678;">
                  If you did not request this, you can ignore this email. Your current password will stay the same.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
