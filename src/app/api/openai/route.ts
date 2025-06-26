import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const reply = chatResponse.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('OpenAI error:', err);
    return NextResponse.json({ error: 'Failed to call OpenAI' }, { status: 500 });
  }
}
