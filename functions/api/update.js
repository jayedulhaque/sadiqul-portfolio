const DEFAULT_REPO = 'jayedulhaque/sadiqul-portfolio';
const DEFAULT_BRANCH = 'main';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { password, data } = body;

    if (!password || password !== env.ADMIN_PASSWORD) {
      return json({ error: 'Invalid admin password.' }, 401);
    }

    const validationError = validatePortfolioData(data);
    if (validationError) {
      return json({ error: validationError }, 400);
    }

    const token = env.GITHUB_TOKEN;
    if (!token) {
      return json({ error: 'GITHUB_TOKEN is not configured on the server.' }, 500);
    }

    const repo = env.GITHUB_REPO || DEFAULT_REPO;
    const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const filePath = 'data.json';

    const getUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
    const getRes = await fetch(getUrl, {
      headers: githubHeaders(token),
    });

    if (!getRes.ok) {
      const detail = await getRes.text();
      return json({ error: 'Could not read data.json from GitHub.', detail }, 502);
    }

    const fileMeta = await getRes.json();
    const content = `${JSON.stringify(data, null, 2)}\n`;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        ...githubHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update portfolio via admin panel',
        content: toBase64(content),
        sha: fileMeta.sha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const detail = await putRes.text();
      return json({ error: 'Failed to commit changes to GitHub.', detail }, 502);
    }

    const result = await putRes.json();

    return json({
      ok: true,
      message: 'Portfolio updated. Your site will refresh in 1–2 minutes after Cloudflare redeploys.',
      commit: result.commit?.html_url || null,
    });
  } catch (error) {
    return json({ error: error.message || 'Unexpected server error.' }, 500);
  }
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sadiqul-portfolio-admin',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function validatePortfolioData(data) {
  if (!data || typeof data !== 'object') {
    return 'Portfolio data must be a JSON object.';
  }

  const { profile, stats, skills, campaigns } = data;

  if (!profile || typeof profile !== 'object') {
    return 'Profile section is required.';
  }

  const profileFields = ['name', 'title', 'tagline', 'bio', 'avatar', 'email'];
  for (const field of profileFields) {
    if (typeof profile[field] !== 'string' || !profile[field].trim()) {
      return `Profile "${field}" is required.`;
    }
  }

  if (typeof profile.linkedin !== 'string') {
    return 'Profile "linkedin" must be a string (use empty string if none).';
  }

  if (!Array.isArray(stats) || stats.length === 0) {
    return 'At least one stat is required.';
  }

  for (const stat of stats) {
    if (!stat?.value?.trim() || !stat?.label?.trim()) {
      return 'Each stat needs both a value and a label.';
    }
  }

  if (!Array.isArray(skills) || skills.length === 0) {
    return 'At least one skill is required.';
  }

  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return 'At least one campaign is required.';
  }

  const campaignFields = ['title', 'type', 'metric', 'challenge', 'strategy', 'result'];
  for (const campaign of campaigns) {
    for (const field of campaignFields) {
      if (typeof campaign[field] !== 'string' || !campaign[field].trim()) {
        return 'Each campaign must include title, type, metric, challenge, strategy, and result.';
      }
    }
  }

  return null;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
