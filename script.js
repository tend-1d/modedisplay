const $ = id => document.getElementById(id);

const labels = {
  send: ['Recipient name', 'Phone number', 'Send to:', 'Phone number:'],
  till: ['Business name', 'Till number', 'Paid to:', 'Till number:'],
  paybill: ['Business name', 'Paybill number', 'Paid to:', 'Paybill number:'],
  pochi: ['Pochi owner / business name', 'Phone number', 'Sent to:', 'Phone number:']
};

const savedType = localStorage.getItem('transactionType');
let type = Object.prototype.hasOwnProperty.call(labels, savedType) ? savedType : 'send';
let last = null;

function selectType(selectedType, persist = false) {
  type = selectedType;
  document.querySelectorAll('.type').forEach(button => {
    button.classList.toggle('active', button.dataset.type === type);
  });
  $('recipientLabel').textContent = labels[type][0];
  $('destinationLabel').textContent = labels[type][1];
  $('accountGroup').hidden = type !== 'paybill';
  $('account').required = type === 'paybill';

  if (persist) {
    localStorage.setItem('transactionType', type);
  }
}

document.querySelectorAll('.type').forEach(button => {
  button.addEventListener('click', () => selectType(button.dataset.type, true));
});

selectType(type);

const money = n => 'Ksh ' + Number(n).toLocaleString('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const dateFormat = date => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date);
  const value = key => parts.find(part => part.type === key)?.value || '';
  const day = Number(value('day'));
  const suffix = day % 10 === 1 && day !== 11 ? 'st'
    : day % 10 === 2 && day !== 12 ? 'nd'
      : day % 10 === 3 && day !== 13 ? 'rd'
        : 'th';
  return `${day}${suffix} ${value('month')} ${value('year')} | ${value('hour')}:${value('minute')} ${value('dayPeriod').toLowerCase()}`;
};

function showDashboard() {
  $('preview').hidden = true;
  $('dashboard').hidden = false;
  window.scrollTo(0, 0);
}

$('demoForm').addEventListener('submit', event => {
  event.preventDefault();
  const now = new Date();
  last = {
    type,
    amount: Number($('amount').value),
    recipient: $('recipient').value.trim(),
    destination: $('destination').value.trim(),
    account: $('account').value.trim(),
    fee: Number($('fee').value),
    date: now.toISOString(),
    reference: 'UK' + Math.random().toString(36).slice(2, 10).toUpperCase()
  };
  $('dateOut').textContent = dateFormat(now);
  $('amountOut').textContent = money(last.amount);
  $('feeOut').textContent = money(last.fee);
  $('referenceOut').textContent = last.reference;
  $('paidLabel').textContent = labels[type][2];
  $('recipientOut').textContent = last.recipient;
  $('destinationOut').textContent = labels[type][3] + last.destination;
  $('accountOut').hidden = type !== 'paybill';
  $('accountOut').textContent = 'Account number: ' + last.account;
  $('avatarOut').textContent = last.recipient.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  $('tipSection').hidden = type !== 'till';
  $('zidiSection').hidden = type !== 'send';
  $('reverseBtn').hidden = type !== 'send';
  $('scheduleBtn').hidden = type !== 'send' && type !== 'till';
  $('preview').classList.toggle('send-preview', type === 'send');
  $('dashboard').hidden = true;
  $('preview').hidden = false;
  window.scrollTo(0, 0);
});

$('backBtn').onclick = showDashboard;
$('doneBtn').onclick = showDashboard;
$('copyBtn').onclick = () => navigator.clipboard?.writeText(last.reference).then(
  () => alert('Demo ID copied')
).catch(() => alert(last.reference));
$('favoriteBtn').onclick = () => alert('This is a demo preview. No favourites are saved.');
$('scheduleBtn').onclick = () => alert('Scheduling is disabled in demo mode.');
$('reverseBtn').onclick = () => alert('Reverse transaction is disabled in demo mode.');
$('zidiSettingsBtn').onclick = () => alert('ZiiDi settings are disabled in demo mode.');

$('shareBtn').onclick = async () => {
  if (!last) return;
  const content = `DEMO — NOT A REAL PAYMENT
${money(last.amount)}
${last.recipient}
${dateFormat(new Date(last.date))}
${last.reference}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Demo transaction', text: content });
    } catch (error) {
    }
  } else {
    await navigator.clipboard?.writeText(content);
    alert('Demo details copied');
  }
};

$('downloadBtn').onclick = () => {
  if (!last) return;
  const text = `TRANSACTION DEMO — NOT A REAL PAYMENT

Transaction type: ${last.type}
Amount: ${money(last.amount)}
Recipient: ${last.recipient}
Destination: ${last.destination}
${last.type === 'paybill' ? 'Account: ' + last.account + '\n' : ''}Transaction cost: ${money(last.fee)}
Date: ${dateFormat(new Date(last.date))}
Demo reference: ${last.reference}

SIMULATION ONLY. NO REAL PAYMENT WAS MADE OR VERIFIED.
`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'demo-transaction-' + last.reference + '.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
