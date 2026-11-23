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
                  Update regarding your story submission
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Hello {{ $story->author_name }},
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  Thank you for taking the time to submit your story <strong>&ldquo;{{ $story->title }}&rdquo;</strong> to Music Without Borders.
                </p>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  After reviewing your submission, our editorial team was unable to publish it at this time.
                </p>
                <div style="margin: 0 0 20px; padding: 16px; background: #f6f1e8; border-radius: 12px; border-left: 4px solid #c2410c;">
                  <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7c2d12;">
                    Reason:
                  </p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #182234;">
                    {{ $reason }}
                  </p>
                </div>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #5c6678;">
                  We appreciate your interest in our community and welcome future submissions that align with our community guidelines.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
