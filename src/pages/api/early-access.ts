import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, company, teamSize, currentAIUse } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = import.meta.env.AIRTABLE_API_KEY;
    if (!apiKey) {
      console.error('AIRTABLE_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const airtableResponse = await fetch('https://api.airtable.com/v0/app1Ls9AR0d1AeOo5/Table%201', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'Full Name': name,
            'Email': email,
            'Company': company || '',
            'Team Size': teamSize || '',
            'Current AI Use': currentAIUse || '',
          },
        }],
      }),
    });

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error('Airtable error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to submit form' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Early access form error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
