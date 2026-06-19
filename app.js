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
    renderSeo(data.profile, data.skills);
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

const SITE_URL = 'https://sadiqul.pages.dev';

function renderSeo(profile, skills) {
  const pageTitle = `${profile.name} | Business Development Executive`;
  const description = `${profile.name} — ${profile.title}. ${profile.tagline}`;
  const imageUrl = profile.avatar.startsWith('http')
    ? profile.avatar
    : `${SITE_URL}/${profile.avatar.replace(/^\//, '')}`;

  document.title = pageTitle;
  setMetaContent('description', description);
  setMetaContent('og:title', pageTitle, 'property');
  setMetaContent('og:description', description, 'property');
  setMetaContent('og:url', `${SITE_URL}/`, 'property');
  setMetaContent('og:image', imageUrl, 'property');
  setMetaContent('twitter:title', pageTitle);
  setMetaContent('twitter:description', description);
  setMetaContent('twitter:image', imageUrl);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.bio,
    url: SITE_URL,
    image: imageUrl,
    email: profile.email,
    knowsAbout: skills,
    sameAs: profile.linkedin ? [profile.linkedin] : [],
  };

  if (profile.phone) {
    jsonLd.telephone = profile.phone;
  }

  let script = document.getElementById('portfolio-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'portfolio-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(jsonLd);
}

function setMetaContent(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
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

  setPhoneLink('cta-phone', profile.phone, 'Call');
  setPhoneLink('footer-phone', profile.phone, profile.phone);

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

function setPhoneLink(id, phone, label) {
  const el = document.getElementById(id);
  if (!el) return;

  if (phone) {
    el.href = `tel:${formatPhoneHref(phone)}`;
    el.textContent = label;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function formatPhoneHref(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+880${digits.slice(1)}`;
  return `+880${digits}`;
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
