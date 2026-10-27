// Responsibility: business rules for an incoming item. No I/O here.

const STATUSES = ['lost', 'found'];
const LIMITS = { title: 100, category: 50, location: 100, contactName: 60, description: 500 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bad(error, status = 400) { return { error, status }; }

function validateItem(data) {
  const clean = {};

  // required text fields
  for (const field of ['title', 'category', 'location', 'contactName']) {
    const v = data[field];
    if (typeof v !== 'string' || v.trim() === '') return bad(`${field} is required`);
    if (v.trim().length > LIMITS[field]) {
      return bad(`${field} must be at most ${LIMITS[field]} characters`);
    }
    clean[field] = v.trim();
  }

  // status
  if (!STATUSES.includes(data.status)) return bad('status must be "lost" or "found"');
  clean.status = data.status;

  // optional description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') return bad('description must be text');
    if (data.description.trim().length > LIMITS.description) {
      return bad(`description must be at most ${LIMITS.description} characters`);
    }
    clean.description = data.description.trim();
  }

  // optional attachment reference (ID returned by POST /api/attachments)
  if (data.attachmentId !== undefined && data.attachmentId !== null) {
    if (typeof data.attachmentId !== 'string' || !UUID_RE.test(data.attachmentId)) {
      return bad('attachmentId must be a valid attachment ID');
    }
    clean.attachmentId = data.attachmentId;
  }

  return { value: clean };
}

function validateStatusFilter(status) {
  if (status === null || status === undefined || status === '') return { value: null };
  if (!STATUSES.includes(status)) return bad('status filter must be "lost" or "found"');
  return { value: status };
}

module.exports = { validateItem, validateStatusFilter, STATUSES, LIMITS, UUID_RE };
