// Shared HTML email layout — deep forest green background, cream text, gold accent, serif font.

export function renderEmailLayout(opts: {
  heading: string;
  bodyHtml: string;
}): string {
  const { heading, bodyHtml } = opts;
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:0; background-color:#13261d; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#13261d; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color:#1e3d2f; color:#f5f0e8;">
            <tr>
              <td style="padding: 28px 32px 0 32px;">
                <div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color:#c4a35a;">Walker Slater</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 32px 24px 32px; border-bottom: 1px solid #2f5240;">
                <h1 style="margin:0; font-size: 20px; font-weight: normal; color:#f5f0e8;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; font-size: 14px; line-height: 1.7; color:#f5f0e8;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px 28px 32px; border-top: 1px solid #2f5240; font-size: 11px; color:#a9c2b3;">
                Walker Slater &middot; 38 Great Queen Street, London WC2B 5AA
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export function field(label: string, value: string): string {
  return `<div style="margin-bottom: 10px;"><span style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color:#c4a35a;">${label}:</span> ${value}</div>`;
}

export function paragraph(text: string): string {
  return `<p style="margin: 0 0 14px 0;">${text}</p>`;
}
