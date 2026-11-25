const $ = id => document.getElementById(id);

const labels = {
  send: ['Recipient', 'Phone number', 'Sent to:', 'Phone number:'],
  till: ['M-PESA Till', 'Till number', 'Paid to:', 'Till number:'],
  paybill: ['M-PESA Paybill', 'Paybill number', 'Paid to:', 'Paybill number:'],
  pochi: ['Pochi recipient', 'Phone number', 'Sent to:', 'Phone number:']
};

let type = 'send';
let last = null;
let sendMode = 'mobile';
let lipaMode = 'goods';
let formScreen = 'sendScreen';

const money = amount => 'Ksh ' + Number(amount).toLocaleString('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const sendMoneyFeeBands = [
  { max: 100, fee: 0 },
  { max: 500, fee: 7 },
  { max: 1000, fee: 13 },
  { max: 1500, fee: 23 },
  { max: 2500, fee: 33 },
  { max: 3500, fee: 53 },
  { max: 5000, fee: 57 },
  { max: 7500, fee: 78 },
  { max: 10000, fee: 90 },
  { max: 15000, fee: 100 },
  { max: 20000, fee: 105 },
  { max: 250000, fee: 108 }
];

function calculateTransactionFee(transactionType, amount) {
  if (transactionType === 'paybill') return null;
  if (transactionType === 'till') return 0;
  if (transactionType !== 'send' && transactionType !== 'pochi') {
    throw new RangeError(`Unsupported transaction type: ${transactionType}`);
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > 250000) {
    throw new RangeError('Transaction amount must be between Ksh 1 and Ksh 250,000.');
  }

  const feeBand = sendMoneyFeeBands.find(band => amount <= band.max);
  if (!feeBand) throw new RangeError('No transaction fee is available for this amount.');
  return feeBand.fee;
}

const transactionFeeText = transaction => transaction.fee === null
  ? 'Varies by biller'
  : money(transaction.fee);

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

const confirmationDateFormat = date => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date);
  const value = key => parts.find(part => part.type === key)?.value || '';
  return `${value('day')}/${value('month')}/${value('year')} at ${value('hour')}:${value('minute')} ${value('dayPeriod').toUpperCase()}`;
};

function showScreen(screenId) {
  ['dashboard', 'sendScreen', 'lipaScreen', 'preview'].forEach(id => {
    $(id).hidden = id !== screenId;
  });
  $('confirmationBubble').hidden = screenId !== 'preview';
  window.scrollTo(0, 0);
}

function updateContinue(formId, buttonId) {
  $(buttonId).disabled = !$(formId).checkValidity();
}

function selectPaymentMethod(button) {
  const group = button.closest('[data-payment-group]');
  group.querySelectorAll('.payment-method').forEach(method => {
    const selected = method === button;
    method.classList.toggle('selected', selected);
    method.setAttribute('aria-pressed', String(selected));
  });
}

function setSendMode(mode) {
  sendMode = mode;
  type = mode === 'pochi' ? 'pochi' : 'send';
  const recipientLabel = mode === 'pochi'
    ? "Enter Pochi owner's full name"
    : "Enter recipient's full name";
  $('sendRecipientNameLabel').textContent = recipientLabel;
  $('sendRecipientName').placeholder = recipientLabel;
  document.querySelectorAll('[data-send-mode]').forEach(button => {
    const selected = button.dataset.sendMode === mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  $('sendScanButton').hidden = mode === 'pochi';
  updateContinue('sendForm', 'sendContinue');
}

function setLipaMode(mode) {
  lipaMode = mode;
  type = mode === 'goods' ? 'till' : mode;
  document.querySelectorAll('[data-lipa-mode]').forEach(button => {
    const selected = button.dataset.lipaMode === mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });

  const fields = [
    ['tillNumberGroup', 'tillNumber', mode === 'goods'],
    ['paybillNumberGroup', 'paybillNumber', mode === 'paybill'],
    ['pochiNumberGroup', 'lipaPochiNumber', mode === 'pochi'],
    ['accountNumberGroup', 'lipaAccount', mode === 'paybill']
  ];
  fields.forEach(([groupId, inputId, visible]) => {
    $(groupId).hidden = !visible;
    $(inputId).required = visible;
  });

  const recipientNameLabels = {
    goods: 'Enter business name',
    paybill: 'Enter business name',
    pochi: "Enter Pochi owner's full name"
  };
  $('lipaRecipientNameLabel').textContent = recipientNameLabels[mode];
  $('lipaRecipientName').placeholder = recipientNameLabels[mode];
  $('lipaRecipientName').autocomplete = mode === 'pochi' ? 'name' : 'organization';

  $('lipaBalance').hidden = false;
  $('lipaBalance').classList.toggle('hidden-balance', mode === 'pochi');
  const paymentGroup = document.querySelector('#lipaForm [data-payment-group]');
  paymentGroup.classList.toggle('two-methods', mode === 'pochi');
  paymentGroup.classList.toggle('three-methods', mode !== 'pochi');
  paymentGroup.querySelector('.bonga-method').hidden = mode === 'pochi';
  selectPaymentMethod(paymentGroup.querySelector('[data-method="M-PESA"]'));
  updateContinue('lipaForm', 'lipaContinue');
}

function submitTransaction(formId, source) {
  const form = $(formId);
  if (!form.reportValidity()) return;

  let destination;
  let recipientName;
  let account = '';
  let paymentMethod;

  if (source === 'send') {
    formScreen = 'sendScreen';
    type = sendMode === 'pochi' ? 'pochi' : 'send';
    recipientName = $('sendRecipientName').value.trim();
    destination = $('sendNumber').value.trim();
    paymentMethod = document.querySelector('#sendForm .payment-method.selected').dataset.method;
  } else {
    formScreen = 'lipaScreen';
    type = lipaMode === 'goods' ? 'till' : lipaMode;
    recipientName = $('lipaRecipientName').value.trim();
    destination = lipaMode === 'goods' ? $('tillNumber').value.trim()
      : lipaMode === 'paybill' ? $('paybillNumber').value.trim()
        : $('lipaPochiNumber').value.trim();
    account = lipaMode === 'paybill' ? $('lipaAccount').value.trim() : '';
    paymentMethod = document.querySelector('#lipaForm .payment-method.selected').dataset.method;
  }

  const now = new Date();
  const amount = Number(source === 'send' ? $('sendAmount').value : $('lipaAmount').value);
  last = {
    type,
    amount,
    recipient: recipientName,
    destination,
    account,
    paymentMethod,
    fee: calculateTransactionFee(type, amount),
    date: now.toISOString(),
    reference: 'UK' + Math.random().toString(36).slice(2, 10).toUpperCase()
  };

  $('dateOut').textContent = dateFormat(now);
  const action = type === 'send' || type === 'pochi' ? 'sent to' : 'paid to';
  $('confirmationMessage').textContent = `${last.reference} Confirmed. Ksh${last.amount.toFixed(2)} ${action} ${last.recipient.toUpperCase()} on ${confirmationDateFormat(now)}. New M-PESA balance is Ksh0.00. Transaction cost, ${transactionFeeText(last)}. Amount you can transact within the day is 499,600.00.`;
  $('amountOut').textContent = money(last.amount);
  $('feeOut').textContent = transactionFeeText(last);
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
  showScreen('preview');
}

document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.open === 'send') {
      formScreen = 'sendScreen';
      setSendMode('mobile');
      showScreen('sendScreen');
    } else if (button.dataset.open === 'pochi') {
      formScreen = 'sendScreen';
      setSendMode('pochi');
      showScreen('sendScreen');
    } else if (button.dataset.open === 'lipa') {
      formScreen = 'lipaScreen';
      setLipaMode('goods');
      showScreen('lipaScreen');
    } else if (button.dataset.open === 'invest') {
      alert('ZiiDi investing is not simulated. No investment will be made.');
    } else {
      alert('This feature is unavailable in the transaction demo.');
    }
  });
});

document.querySelectorAll('[data-home]').forEach(button => {
  button.addEventListener('click', () => showScreen('dashboard'));
});

document.querySelectorAll('[data-send-mode]').forEach(button => {
  button.addEventListener('click', () => setSendMode(button.dataset.sendMode));
});

document.querySelectorAll('[data-lipa-mode]').forEach(button => {
  button.addEventListener('click', () => setLipaMode(button.dataset.lipaMode));
});

document.querySelectorAll('[data-payment-group] .payment-method').forEach(button => {
  button.addEventListener('click', () => selectPaymentMethod(button));
});

['sendRecipientName', 'sendNumber', 'sendAmount'].forEach(id => {
  $(id).addEventListener('input', () => updateContinue('sendForm', 'sendContinue'));
});

['lipaRecipientName', 'tillNumber', 'paybillNumber', 'lipaPochiNumber', 'lipaAccount', 'lipaAmount'].forEach(id => {
  $(id).addEventListener('input', () => updateContinue('lipaForm', 'lipaContinue'));
});

$('sendForm').addEventListener('submit', event => {
  event.preventDefault();
  submitTransaction('sendForm', 'send');
});

$('lipaForm').addEventListener('submit', event => {
  event.preventDefault();
  submitTransaction('lipaForm', 'lipa');
});

$('backBtn').addEventListener('click', () => showScreen(formScreen));
$('doneBtn').addEventListener('click', () => showScreen('dashboard'));

$('balanceToggle').addEventListener('click', () => {
  const isRevealed = $('balanceToggle').getAttribute('aria-pressed') !== 'true';
  const label = isRevealed ? 'Hide M-PESA balance' : 'Show M-PESA balance';
  $('balanceValue').textContent = isRevealed ? 'Ksh 193.03' : 'Ksh *****';
  $('balanceValue').closest('.mpesa-balance').classList.toggle('balance-revealed', isRevealed);
  if (isRevealed) {
    $('availableFuliza').removeAttribute('hidden');
    $('balanceEyeOpen').setAttribute('hidden', '');
    $('balanceEyeClosed').removeAttribute('hidden');
  } else {
    $('availableFuliza').setAttribute('hidden', '');
    $('balanceEyeOpen').removeAttribute('hidden');
    $('balanceEyeClosed').setAttribute('hidden', '');
  }
  $('balanceToggle').setAttribute('aria-label', label);
  $('balanceToggle').setAttribute('title', label);
  $('balanceToggle').setAttribute('aria-pressed', String(isRevealed));
});

$('copyBtn').addEventListener('click', async () => {
  if (!last) return;
  try {
    await navigator.clipboard.writeText(last.reference);
    alert('Demo ID copied');
  } catch {
    alert(last.reference);
  }
});

$('favoriteBtn').addEventListener('click', () => alert('This is a demo preview. No favourites are saved.'));
$('tipBtn').addEventListener('click', () => alert('Adding a tip is not simulated. No money will be charged.'));
$('scheduleBtn').addEventListener('click', () => alert('Scheduling is disabled in demo mode.'));
$('reverseBtn').addEventListener('click', () => alert('Reverse transaction is disabled in demo mode.'));
$('zidiSettingsBtn').addEventListener('click', () => alert('ZiiDi settings are disabled in demo mode.'));

$('shareBtn').addEventListener('click', async () => {
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
      if (error.name !== 'AbortError') alert('Unable to share demo details.');
    }
  } else {
    try {
      await navigator.clipboard.writeText(content);
      alert('Demo details copied');
    } catch {
      alert(content);
    }
  }
});

$('downloadBtn').addEventListener('click', () => {
  if (!last) return;
  const text = `TRANSACTION DEMO — NOT A REAL PAYMENT

Transaction type: ${last.type}
Amount: ${money(last.amount)}
Recipient: ${last.recipient}
Destination: ${last.destination}
${last.type === 'paybill' ? 'Account: ' + last.account + '\n' : ''}Payment method: ${last.paymentMethod}
Transaction cost: ${transactionFeeText(last)}
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
});

document.querySelectorAll('[data-demo-action]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.demoAction === 'view-all') {
      document.querySelector('.quick-grid').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const messages = {
      profile: 'Profile editing is not available in this demo.',
      notifications: 'There are no live account notifications in this demo.',
      search: 'Search is not available in this demo. Use the Send Money and Lipa na M-PESA shortcuts.',
      statements: 'Statements are not available because this demo has no real account history.',
      'view-all': 'The available payment shortcuts are shown on this home screen.',
      withdraw: 'Withdraw Money is not simulated. No cash withdrawal will be made.',
      bundles: 'Bundle purchases are not simulated. No bundles will be purchased.',
      airtime: 'Airtime top-up is not simulated. No airtime will be purchased.',
      tunukiwa: 'Tunukiwa bundles are not simulated. No bundles will be purchased.',
      internet: 'Home Internet payments are not simulated.',
      frequents: 'Favourites and frequent recipients are not saved in this demo.',
      deals: 'Deals and scan-to-pay are not available in this demo.',
      'view-favourites': 'Saved favourites are not available in this demo.',
      'add-favourite': 'Favourites cannot be saved in this demo. Enter the recipient name and number to create a one-time preview.',
      contacts: 'Contact lookup is unavailable here. Enter the recipient name and phone number manually.',
      scan: 'Camera scanning is unavailable here. Enter the number manually.',
      'send-many': 'Send to Many is not simulated. Use Send Money for a single recipient.',
      'request-money': 'Request Money is not simulated.'
    };
    alert(messages[button.dataset.demoAction] || 'This action is unavailable in the transaction demo.');
  });
});

document.querySelectorAll('form').forEach(form => form.addEventListener('input', () => {
  if (form.id === 'sendForm') updateContinue('sendForm', 'sendContinue');
  if (form.id === 'lipaForm') updateContinue('lipaForm', 'lipaContinue');
}));

setSendMode('mobile');
setLipaMode('goods');
updateContinue('sendForm', 'sendContinue');
updateContinue('lipaForm', 'lipaContinue');
showScreen('dashboard');

const firstNameStorageKey = 'mpesa-transaction-demo.firstName';
const welcomeDialog = $('welcomeDialog');
const firstNameInput = $('firstNameInput');
const welcomeError = $('welcomeError');
let savedFirstName = '';

function getGreetingForHour(hour) {
  if (hour < 5 || hour >= 21) return 'Good night,';
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function updateGreetingPeriod() {
  $('greetingPeriod').textContent = getGreetingForHour(new Date().getHours());
}

function updateVisitorIdentity(firstName) {
  $('greetingName').textContent = firstName;
  $('profileInitials').textContent = firstName.charAt(0).toLocaleUpperCase() + 'N';
  document.querySelector('.home-avatar').setAttribute('aria-label', 'Profile for ' + firstName);
}

updateGreetingPeriod();
setInterval(updateGreetingPeriod, 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateGreetingPeriod();
});

try {
  savedFirstName = localStorage.getItem(firstNameStorageKey)?.trim() || '';
} catch (error) {
  console.error('Unable to read the saved first name.', error);
  welcomeError.textContent = 'Your saved name could not be read. Enter your first name to continue.';
}

if (savedFirstName) {
  updateVisitorIdentity(savedFirstName);
} else {
  welcomeDialog.showModal();
  firstNameInput.focus();
}

welcomeDialog.addEventListener('cancel', event => event.preventDefault());

$('welcomeForm').addEventListener('submit', event => {
  event.preventDefault();
  const firstName = firstNameInput.value.trim();
  if (!firstName) {
    firstNameInput.value = '';
    firstNameInput.reportValidity();
    return;
  }

  try {
    localStorage.setItem(firstNameStorageKey, firstName);
  } catch (error) {
    console.error('Unable to save the first name.', error);
    welcomeError.textContent = 'Unable to save your name. Check browser storage and try again.';
    return;
  }

  updateVisitorIdentity(firstName);
  welcomeDialog.close();
});
