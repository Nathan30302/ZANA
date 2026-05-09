const { randomUUID } = require('./data');

// In-memory booking store for dev when DB is down.
const bookings = [];

function generateReference() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ZNA-${dateStr}-${random}`;
}

function listBookingsForCustomer(customerId) {
  return bookings.filter((b) => b.customerId === customerId).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getBooking(id) {
  return bookings.find((b) => b.id === id) || null;
}

function createBooking(payload) {
  const booking = {
    id: randomUUID(),
    reference: generateReference(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
  };
  bookings.push(booking);
  return booking;
}

function cancelBooking(id) {
  const b = getBooking(id);
  if (!b) return null;
  b.status = 'CANCELLED';
  b.updatedAt = new Date().toISOString();
  return b;
}

module.exports = {
  bookings,
  listBookingsForCustomer,
  getBooking,
  createBooking,
  cancelBooking,
};

