// Two-step booking using sessionStorage drafts and REST calls.
function showBookingStepOne(id) {
  const event = findEvent(id);
  if (!event || currentUser.role !== 'student') return;
  if (!isBookable(event) || availableSeats(event) < 1) { showToast('This event is not accepting bookings.', true); return; }
  const saved = getSession('bookingDraft:' + currentUser.email, {});
  bookingData = saved.eventId === event.id ? saved : { eventId: event.id, quantity: 1 };
  window.scrollTo(0, 0);
  app.innerHTML = `
    <div class="booking-layout"><section class="form-card"><div class="steps"><span class="active">01 / Your passes</span><span>02 / Review & confirm</span></div><p class="eyebrow">LET'S MAKE IT A PLAN</p><h1 class="section-title">Who's coming?</h1>
    <form id="bookingOne"><div class="form-grid">
      <label>Full name<input id="bookName" required maxlength="80" value="${escapeText(bookingData.name || currentUser.name)}"></label>
      <label>Account email<input type="email" readonly value="${escapeText(currentUser.email)}"></label>
      <label>Phone number<input id="bookPhone" type="tel" required maxlength="10" placeholder="10 digits" value="${escapeText(bookingData.phone || '')}"></label>
      <label>Student ID<input id="bookStudentId" required minlength="5" maxlength="40" value="${escapeText(bookingData.studentId || '')}"></label>
      <label>Department<input id="bookDepartment" required maxlength="80" value="${escapeText(bookingData.department || currentUser.department)}"></label>
      <label>Year<select id="bookYear" required><option value="">Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>
      <label>Number of passes<select id="bookQuantity">${[1,2,3,4].filter(quantity => quantity <= availableSeats(event)).map(quantity => '<option value="' + quantity + '">' + quantity + (quantity === 1 ? ' pass' : ' passes') + '</option>').join('')}</select></label>
    </div><p class="upload-note">General admission. All guests enter together with the booking holder and a valid campus ID.</p><p class="error" id="bookingError" role="alert"></p><button class="primary-button" type="submit">Review booking →</button><button class="secondary-button" type="button" data-details="${event.id}">Back</button></form></section>
    <aside class="order-summary"><p class="eyebrow">YOUR NEXT EXPERIENCE</p><h2>${escapeText(event.title)}</h2><p>${formatDate(event.date)} · ${event.time}</p><p>${escapeText(event.venue)}</p><hr><p>${event.price === 0 ? 'Free entry' : money(event.price) + ' per pass'}</p><p>${availableSeats(event)} passes remaining</p><small>No seat numbers. No real payments. Just your next campus plan.</small></aside></div>`;
  document.getElementById('bookYear').value = bookingData.year || '';
  document.getElementById('bookQuantity').value = Math.min(bookingData.quantity || 1, availableSeats(event), 4);
  function draft() {
    bookingData = { eventId: event.id, name: document.getElementById('bookName').value.trim(), phone: document.getElementById('bookPhone').value.trim(), studentId: document.getElementById('bookStudentId').value.trim(), department: document.getElementById('bookDepartment').value.trim(), year: document.getElementById('bookYear').value, quantity: Number(document.getElementById('bookQuantity').value) };
    saveSession('bookingDraft:' + currentUser.email, bookingData);
  }
  document.getElementById('bookingOne').addEventListener('input', draft);
  document.getElementById('bookingOne').addEventListener('submit', async function (click) {
    click.preventDefault(); draft();
    if (!validPhone(bookingData.phone)) { document.getElementById('bookingError').textContent = 'Enter a 10-digit phone number.'; return; }
    await showPayment(event);
  });
}
async function showPayment(event) {
  let pricing;
  try { pricing = await api('/quote', 'POST', bookingData); } catch (error) { showToast(error.message, true); return; }
  window.scrollTo(0, 0);
  app.innerHTML = `<section class="form-card checkout-card"><div class="steps"><span>01 / Your passes</span><span class="active">02 / Review & confirm</span></div><p class="eyebrow">ONE LAST LOOK</p><h1 class="section-title">Good plans, confirmed.</h1><h2>${escapeText(event.title)}</h2><p>${formatDate(event.date)} · ${event.time} · ${escapeText(event.venue)}</p><p>${bookingData.quantity} general admission ${bookingData.quantity === 1 ? 'pass' : 'passes'} · ${escapeText(bookingData.name)}</p><div class="offer-input"><label>Offer code<input id="couponCode" placeholder="Try CAMPUS10" maxlength="30"></label><button id="applyCoupon" class="secondary-button">Apply offer</button></div><p id="couponMessage" role="status"></p><div id="priceSummary"></div><label class="check-label"><input type="checkbox" id="acceptTerms"> I understand this is a demo booking. Guests enter together; cancellation is available before the event starts and before check-in.</label><p class="error" id="checkoutError" role="alert"></p><div class="button-row"><button class="secondary-button" data-book-back="${event.id}">Back</button><button class="primary-button" id="confirmBooking">Confirm demo booking</button></div><p class="upload-note">No money is charged. No payment details are collected.</p></section>`;
  function renderPricing() {
    document.getElementById('priceSummary').innerHTML = `<div class="price-line"><span>${pricing.quantity} × ${money(pricing.unitPrice)}</span><b>${money(pricing.subtotal)}</b></div><div class="price-line"><span>Offer savings</span><b>− ${money(pricing.discount)}</b></div><div class="price-line total"><span>Demo total</span><b>${money(pricing.total)}</b></div>`;
  }
  renderPricing();
  document.getElementById('applyCoupon').addEventListener('click', async function (click) {
    const confirm = document.getElementById('confirmBooking'); confirm.disabled = true; click.target.disabled = true;
    try {
      pricing = await api('/quote', 'POST', { ...bookingData, coupon: document.getElementById('couponCode').value.trim() });
      document.getElementById('couponMessage').textContent = pricing.coupon ? 'CAMPUS10 applied. You saved ' + money(pricing.discount) + '.' : 'Offer removed.';
      renderPricing();
    } catch (error) { document.getElementById('couponMessage').textContent = error.message + ' Your previous total is unchanged.'; }
    click.target.disabled = false; confirm.disabled = false;
  });
  document.getElementById('confirmBooking').addEventListener('click', async function (click) {
    const error = document.getElementById('checkoutError');
    if (!document.getElementById('acceptTerms').checked) { error.textContent = 'Please acknowledge the booking policy.'; return; }
    click.target.disabled = true;
    try {
      const ticket = await api('/tickets', 'POST', { ...bookingData, coupon: pricing.coupon, expectedTotal: pricing.total });
      removeSession('bookingDraft:' + currentUser.email); bookingData = {};
      await refreshData(); showTicket(ticket, true); showToast('You are on the list!');
    } catch (failure) { error.textContent = failure.message; click.target.disabled = false; }
  });
}
