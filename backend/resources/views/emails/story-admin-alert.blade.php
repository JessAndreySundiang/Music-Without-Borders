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
                  Music Without Borders &bull; CMS Alert
                </p>
                <h1 style="margin: 10px 0 0; font-size: 24px; line-height: 1.25; font-weight: 700;">
                  New story pending review
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 28px;">
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                  A new reader story has been submitted and is waiting for review:
                </p>
                <div style="margin: 0 0 20px; padding: 16px; background: #f6f1e8; border-radius: 12px; border-left: 4px solid #d8a63a;">
                  <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700;">
                    {{ $story->title }}
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #5c6678;">
                    Submitted by {{ $story->author_name }}@if($story->author_role) ({{ $story->author_role }})@endif
                  </p>
                </div>
                <p style="margin: 0 0 24px;">
                  <a href="{{ $reviewUrl }}" style="display: inline-block; border-radius: 999px; background: #d8a63a; color: #12203a; padding: 13px 22px; font-size: 14px; font-weight: 700; text-decoration: none;">
                    Open moderation queue
                  </a>
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #5c6678;">
                  You can review, approve, or reject this submission in the admin dashboard.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
