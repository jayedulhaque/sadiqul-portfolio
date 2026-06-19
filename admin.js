const AUTH_KEY = 'portfolio-admin-auth';

const authGate = document.getElementById('auth-gate');
const authPassword = document.getElementById('auth-password');
const authUnlock = document.getElementById('auth-unlock');
const authError = document.getElementById('auth-error');
const adminForm = document.getElementById('admin-form');
const statsList = document.getElementById('stats-list');
const campaignsList = document.getElementById('campaigns-list');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

let portfolioData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    try {
      await loadEditor();
    } catch (error) {
      sessionStorage.removeItem(AUTH_KEY);
      authGate.classList.remove('hidden');
      showAuthError(error.message);
    }
  } else {
    authGate.classList.remove('hidden');
  }
});

authUnlock.addEventListener('click', async () => {
  hideAuthError();
  if (!authPassword.value.trim()) {
    showAuthError('Please enter your admin password.');
    return;
  }
  await unlockEditor();
});

authPassword.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    authUnlock.click();
  }
});

document.getElementById('add-stat').addEventListener('click', () => {
  statsList.appendChild(createStatRow({ value: '', label: '' }));
});

document.getElementById('add-campaign').addEventListener('click', () => {
  campaignsList.appendChild(createCampaignBlock(emptyCampaign()));
});

adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearStatus();

  const password = document.getElementById('submit-password').value.trim();
  if (!password) {
    setStatus('Enter your admin password before saving.', 'error');
    return;
  }

  const payload = collectFormData();
  if (!payload) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Publishing…';
  setStatus('Saving to GitHub…', 'info');

  try {
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, data: payload }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Save failed.');
    }

    portfolioData = payload;
    setStatus(result.message, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save & Publish';
  }
});

async function loadEditor() {
  const response = await fetch('data.json');
  if (!response.ok) {
    throw new Error('Could not load portfolio data.');
  }

  portfolioData = await response.json();
  populateForm(portfolioData);

  authGate.classList.add('hidden');
  adminForm.classList.remove('hidden');
}

async function unlockEditor() {
  const password = authPassword.value.trim();
  if (!password) {
    showAuthError('Please enter your admin password.');
    return;
  }

  hideAuthError();
  authUnlock.disabled = true;
  authUnlock.textContent = 'Verifying…';

  try {
    const verifyRes = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!verifyRes.ok) {
      throw new Error('Invalid admin password.');
    }

    await loadEditor();
    sessionStorage.setItem(AUTH_KEY, '1');
    document.getElementById('submit-password').value = password;
  } catch (error) {
    showAuthError(error.message);
  } finally {
    authUnlock.disabled = false;
    authUnlock.textContent = 'Unlock Editor';
  }
}

function populateForm(data) {
  document.getElementById('profile-name').value = data.profile.name;
  document.getElementById('profile-title').value = data.profile.title;
  document.getElementById('profile-tagline').value = data.profile.tagline;
  document.getElementById('profile-bio').value = data.profile.bio;
  document.getElementById('profile-avatar').value = data.profile.avatar;
  document.getElementById('profile-email').value = data.profile.email;
  document.getElementById('profile-phone').value = data.profile.phone || '';
  document.getElementById('profile-linkedin').value = data.profile.linkedin || '';
  document.getElementById('skills-input').value = data.skills.join('\n');

  statsList.replaceChildren();
  data.stats.forEach((stat) => {
    statsList.appendChild(createStatRow(stat));
  });

  campaignsList.replaceChildren();
  data.campaigns.forEach((campaign) => {
    campaignsList.appendChild(createCampaignBlock(campaign));
  });
}

function collectFormData() {
  const stats = [...statsList.querySelectorAll('.stat-row')].map((row) => ({
    value: row.querySelector('[data-field="value"]').value.trim(),
    label: row.querySelector('[data-field="label"]').value.trim(),
  }));

  const campaigns = [...campaignsList.querySelectorAll('.campaign-block')].map((block) => ({
    title: block.querySelector('[data-field="title"]').value.trim(),
    type: block.querySelector('[data-field="type"]').value.trim(),
    metric: block.querySelector('[data-field="metric"]').value.trim(),
    challenge: block.querySelector('[data-field="challenge"]').value.trim(),
    strategy: block.querySelector('[data-field="strategy"]').value.trim(),
    result: block.querySelector('[data-field="result"]').value.trim(),
  }));

  const skills = document
    .getElementById('skills-input')
    .value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (stats.some((stat) => !stat.value || !stat.label)) {
    setStatus('Every stat needs both a value and a label.', 'error');
    return null;
  }

  if (skills.length === 0) {
    setStatus('Add at least one skill.', 'error');
    return null;
  }

  if (campaigns.some((c) => !c.title || !c.type || !c.metric || !c.challenge || !c.strategy || !c.result)) {
    setStatus('Fill in all fields for every campaign.', 'error');
    return null;
  }

  return {
    profile: {
      name: document.getElementById('profile-name').value.trim(),
      title: document.getElementById('profile-title').value.trim(),
      tagline: document.getElementById('profile-tagline').value.trim(),
      bio: document.getElementById('profile-bio').value.trim(),
      avatar: document.getElementById('profile-avatar').value.trim(),
      linkedin: document.getElementById('profile-linkedin').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
    },
    stats,
    skills,
    campaigns,
  };
}

function createStatRow(stat) {
  const row = document.createElement('div');
  row.className = 'stat-row repeat-item';

  row.innerHTML = `
    <label class="field">
      <span>Value</span>
      <input type="text" data-field="value" value="${escapeAttr(stat.value)}" required>
    </label>
    <label class="field">
      <span>Label</span>
      <input type="text" data-field="label" value="${escapeAttr(stat.label)}" required>
    </label>
    <button type="button" class="btn btn-ghost btn-sm remove-btn" aria-label="Remove stat">Remove</button>
  `;

  row.querySelector('.remove-btn').addEventListener('click', () => {
    if (statsList.children.length <= 1) {
      setStatus('Keep at least one stat.', 'error');
      return;
    }
    row.remove();
    clearStatus();
  });

  return row;
}

function createCampaignBlock(campaign) {
  const block = document.createElement('div');
  block.className = 'campaign-block repeat-item';

  block.innerHTML = `
    <div class="repeat-item-header">
      <h3>Campaign</h3>
      <button type="button" class="btn btn-ghost btn-sm remove-btn">Remove</button>
    </div>
    <div class="field-grid">
      <label class="field field-full">
        <span>Title</span>
        <input type="text" data-field="title" value="${escapeAttr(campaign.title)}" required>
      </label>
      <label class="field">
        <span>Type</span>
        <input type="text" data-field="type" value="${escapeAttr(campaign.type)}" required>
      </label>
      <label class="field">
        <span>Metric</span>
        <input type="text" data-field="metric" value="${escapeAttr(campaign.metric)}" required>
      </label>
      <label class="field field-full">
        <span>Challenge</span>
        <textarea data-field="challenge" rows="3" required>${escapeHtml(campaign.challenge)}</textarea>
      </label>
      <label class="field field-full">
        <span>Strategy</span>
        <textarea data-field="strategy" rows="3" required>${escapeHtml(campaign.strategy)}</textarea>
      </label>
      <label class="field field-full">
        <span>Result</span>
        <textarea data-field="result" rows="3" required>${escapeHtml(campaign.result)}</textarea>
      </label>
    </div>
  `;

  block.querySelector('.remove-btn').addEventListener('click', () => {
    if (campaignsList.children.length <= 1) {
      setStatus('Keep at least one campaign.', 'error');
      return;
    }
    block.remove();
    clearStatus();
  });

  return block;
}

function emptyCampaign() {
  return {
    title: '',
    type: '',
    metric: '',
    challenge: '',
    strategy: '',
    result: '',
  };
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

function hideAuthError() {
  authError.classList.add('hidden');
  authError.textContent = '';
}

function setStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = `form-status form-status-${type}`;
}

function clearStatus() {
  formStatus.textContent = '';
  formStatus.className = 'form-status';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}
