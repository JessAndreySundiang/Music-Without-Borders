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
                  Your story has been published!
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Hello {{ $story->author_name }},
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Great news! Your story <strong>&ldquo;{{ $story->title }}&rdquo;</strong> has been reviewed and approved by our team.
                </p>
                <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
                  It is now live on the Music Without Borders community stories page.
                </p>
                <p style="margin: 0 0 24px;">
                  <a href="{{ $publicUrl }}" style="display: inline-block; border-radius: 999px; background: #d8a63a; color: #12203a; padding: 13px 22px; font-size: 14px; font-weight: 700; text-decoration: none;">
                    Read your story online
                  </a>
                </p>
                <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.6; color: #5c6678;">
                  Direct link:
                </p>
                <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.6; word-break: break-all;">
                  <a href="{{ $publicUrl }}" style="color: #7a5310;">{{ $publicUrl }}</a>
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5c6678;">
                  Thank you for contributing your voice to our musical community!
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
