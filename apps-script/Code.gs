const SAFE_SCHOOL_RECIPIENT = 'sherbimipsikosocialkonstandink@gmail.com';
const RECEIPT_PREFIX = 'receipt:';
const DAY_MS = 24 * 60 * 60 * 1000;

function authorizeSafeSchool() {
  MailApp.getRemainingDailyQuota();
}

function doPost(event) {
  const data = event?.postData?.contents;
  if (!data || data.length > 32_768) return result('failed');

  let submission;
  try {
    submission = JSON.parse(data);
  } catch {
    return result('failed');
  }
  const properties = PropertiesService.getScriptProperties();
  const key = properties.getProperty('APPS_SCRIPT_RELAY_KEY');
  if (!key || submission?.key !== key) return result('unavailable');

  const { id, message } = submission;
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)
      || typeof message !== 'string' || !message.trim() || message.length > 6_000) return result('failed');

  const receiptKey = RECEIPT_PREFIX + id;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(2_000)) return result('pending');
  try {
    const now = Date.now();
    pruneReceipts(properties, now);

    const prior = properties.getProperty(receiptKey);
    if (prior) return result(prior.startsWith('sent:') ? 'sent' : 'pending');
    if (MailApp.getRemainingDailyQuota() < 1) return result('limited');

    properties.setProperty(receiptKey, `pending:${now}`);
    try {
      MailApp.sendEmail({
        to: SAFE_SCHOOL_RECIPIENT,
        subject: `Raportim për SafeSchool [${id.slice(0, 8)}]`,
        body: message,
        name: 'SafeSchool',
      });
    } catch {
      properties.deleteProperty(receiptKey);
      return result('failed');
    }
    properties.setProperty(receiptKey, `sent:${now}`);
    return result('sent');
  } catch {
    return result('pending');
  } finally {
    lock.releaseLock();
  }
}

function pruneReceipts(properties, now) {
  if (now - Number(properties.getProperty('receiptCleanup')) < DAY_MS) return;
  for (const [key, value] of Object.entries(properties.getProperties())) {
    if (key.startsWith(RECEIPT_PREFIX) && now - Number(value.split(':')[1]) > 2 * DAY_MS) {
      properties.deleteProperty(key);
    }
  }
  properties.setProperty('receiptCleanup', String(now));
}

function result(status) {
  return ContentService.createTextOutput(JSON.stringify({ status })).setMimeType(ContentService.MimeType.JSON);
}
