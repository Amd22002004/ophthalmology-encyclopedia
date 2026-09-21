const EVENT_SENDER_NAME = "Ассоциация офтальмологических клиник";

function extractEmailAddress(value: string) {
  const match = value.match(/<([^<>]+)>/);
  return (match?.[1] || value).trim();
}

export function getEventEmailHeaders(from: string, replyTo?: string | null, to?: string) {
  const address = extractEmailAddress(from);
  const replyAddress = replyTo?.trim().toLowerCase() || address;
  return {
    from: `${EVENT_SENDER_NAME} <${address}>`,
    replyTo: replyAddress,
    envelope: { from: address, ...(to ? { to } : {}) },
  };
}
