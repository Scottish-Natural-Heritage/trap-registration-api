/**
 * The ID of the Notify template to be used when a valid licence reminder email is sent.
 */
const RETURN_REMINDER_NOTIFY_TEMPLATE_ID = '18e9ce0c-ea52-4c70-a5ef-01ef16590d8c';

/**
 * The ID of the Notify template to be used when a valid licence with no returns from
 * the previous year reminder email is sent.
 */
const PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID = '5223cf17-75e1-4ee6-b0b1-93fd4d4da8df';

/**
 * The ID of the Notify template to be used when a valid licence with no returns ever
 * reminder email is sent.
 */
const NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID = '9318c092-aaea-4df2-ad04-e909cce8a683';

/**
 * The ID of the Notify template to be used when the recently expired licence with no
 * returns reminder email is sent.
 */
const EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID = '7f80c081-bf2b-4f23-a7db-6ac581888b44';

/**
 * The ID of the `licensing@nature.scot` reply-to email address.
 */
const LICENSING_REPLY_TO_NOTIFY_EMAIL_ID = '4b49467e-2a35-4713-9d92-809c55bf1cdd';

/**
 * The ID of the notify template used when applying for a Trap registration or a Renewal.
 * Will be active in Nov 2024.
 */

const TRAP_REGISTRATION_CONFIRMATION_NOTIFY_TEMPLATE_ID = '247825a7-cb7b-4da0-9da5-92b421beab28';

/**
 * The ID of the notify template used to remind the trap registration holder of the trap expiry due in two weeks.
 * Will be active in Nov 2024.
 */

const TWO_WEEK_EXPIRY_RENEWAL_REMINDER_NOTIFY_TEMPLATE_ID = '9ee505d4-688f-4e2e-bac3-63a5963cd730';

/**
 * The ID of the Notify template to be used when the recently expired licence with no
 * renewals reminder email is sent.
 */
const EXPIRED_RECENTLY_NO_RENEWALS_NOTIFY_TEMPLATE_ID = '7ae27d94-2048-4a39-8617-b252e503205f';

export {
  RETURN_REMINDER_NOTIFY_TEMPLATE_ID,
  PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID,
  NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID,
  LICENSING_REPLY_TO_NOTIFY_EMAIL_ID,
  TRAP_REGISTRATION_CONFIRMATION_NOTIFY_TEMPLATE_ID,
  TWO_WEEK_EXPIRY_RENEWAL_REMINDER_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RENEWALS_NOTIFY_TEMPLATE_ID
};
