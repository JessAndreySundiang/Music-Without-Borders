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
                  Thank you for sharing your story
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Hello {{ $story->author_name }},
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  We have received your submission titled <strong>&ldquo;{{ $story->title }}&rdquo;</strong>.
                </p>
                <div style="margin: 0 0 20px; padding: 14px 18px; background: #f6f1e6; border: 1px solid #e2d6c1; border-radius: 8px;">
                  <p style="margin: 0; font-size: 13px; color: #5c6678;">Tracking Reference Code:</p>
                  <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #182234; letter-spacing: 1px;">
                    {{ $story->reference_code }}
                  </p>
                </div>
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
                  A member of our editorial team reads every submission before anything appears on the site.
                  Once your story is reviewed, we will send an update to this email address.
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5c6678;">
                  Your contact email remains private and will never be published on the site.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
