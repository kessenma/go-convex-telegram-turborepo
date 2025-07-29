import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const perPage = searchParams.get('per_page') || '10';
  const sha = searchParams.get('sha');

  try {
    let url = `https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits`;
    
    if (sha) {
      // Fetch specific commit details
      url = `https://api.github.com/repos/kessenma/go-convex-telegram-turborepo/commits/${sha}`;
    } else {
      // Fetch commits list
      url += `?per_page=${perPage}`;
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'rag-bot-changelog',
    };

    // Add GitHub token if available for higher rate limits
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}