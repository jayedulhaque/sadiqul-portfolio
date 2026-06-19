document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`Failed to load data.json (${response.status})`);
    }
    const data = await response.json();
    renderProfile(data.profile);
    renderStats(data.stats);
    renderCampaigns(data.campaigns);
    renderSkills(data.skills);
    renderContact(data.profile);
  } catch (error) {
    console.error('Portfolio data load error:', error);
    showError('Unable to load portfolio data. Please serve this site via a local HTTP server.');
  }
});

function renderProfile(profile) {
  setText('profile-name', profile.name);
  setText('profile-title', profile.title);
  setText('profile-tagline', profile.tagline);
  setText('profile-bio', profile.bio);
  setText('nav-name', profile.name);

  const avatar = document.getElementById('profile-avatar');
  if (avatar) {
    avatar.src = profile.avatar;
    avatar.alt = profile.name;
  }

  document.title = `${profile.name} | Business Development Executive`;
}

function renderStats(stats) {
  const container = document.getElementById('stats-container');
  if (!container) return;

  container.replaceChildren();

  stats.forEach((stat) => {
    const block = document.createElement('div');
    block.className = 'stat-block';

    const value = document.createElement('span');
    value.className = 'stat-value';
    value.textContent = stat.value;

    const label = document.createElement('span');
    label.className = 'stat-label';
    label.textContent = stat.label;

    block.append(value, label);
    container.appendChild(block);
  });
}

function renderCampaigns(campaigns) {
  const grid = document.getElementById('campaigns-grid');
  if (!grid) return;

  grid.replaceChildren();

  campaigns.forEach((campaign) => {
    const card = document.createElement('article');
    card.className = 'campaign-card';

    const type = document.createElement('span');
    type.className = 'campaign-type';
    type.textContent = campaign.type;

    const title = document.createElement('h3');
    title.className = 'campaign-title';
    title.textContent = campaign.title;

    const metric = document.createElement('p');
    metric.className = 'campaign-metric';
    metric.textContent = campaign.metric;

    card.append(type, title, metric);
    card.appendChild(createDetail('Challenge', campaign.challenge));
    card.appendChild(createDetail('Strategy', campaign.strategy));
    card.appendChild(createDetail('Result', campaign.result));

    grid.appendChild(card);
  });
}

function createDetail(label, text) {
  const detail = document.createElement('div');
  detail.className = 'campaign-detail';

  const strong = document.createElement('strong');
  strong.textContent = label;

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  detail.append(strong, paragraph);
  return detail;
}

function renderSkills(skills) {
  const container = document.getElementById('skills-container');
  if (!container) return;

  container.replaceChildren();

  skills.forEach((skill) => {
    const pill = document.createElement('span');
    pill.className = 'skill-pill';
    pill.textContent = skill;
    container.appendChild(pill);
  });
}

function renderContact(profile) {
  const mailto = `mailto:${profile.email}`;

  setMailtoLink('nav-email', mailto, 'Email Me');
  setMailtoLink('cta-email', mailto, 'Get In Touch');
  setMailtoLink('footer-email', mailto, profile.email);

  const linkedinBtn = document.getElementById('cta-linkedin');
  if (linkedinBtn) {
    if (profile.linkedin) {
      linkedinBtn.href = profile.linkedin;
      linkedinBtn.classList.remove('hidden');
    } else {
      linkedinBtn.classList.add('hidden');
    }
  }
}

function setMailtoLink(id, href, label) {
  const el = document.getElementById(id);
  if (el) {
    el.href = href;
    el.textContent = label;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showError(message) {
  const heroText = document.getElementById('hero-text');
  if (!heroText) return;

  const error = document.createElement('p');
  error.className = 'error-message';
  error.textContent = message;
  heroText.appendChild(error);
}
