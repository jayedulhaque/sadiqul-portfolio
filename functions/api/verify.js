export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { password } = await request.json();

    if (!password || password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: 'Invalid admin password.' }, 401);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message || 'Verification failed.' }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
