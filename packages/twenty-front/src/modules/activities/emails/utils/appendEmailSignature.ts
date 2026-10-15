export const appendEmailSignature = (
  body: string,
  signature: string,
  include: boolean,
) =>
  include && signature.trim()
    ? `${body}<br><div data-email-signature="true">${signature}</div>`
    : body;
