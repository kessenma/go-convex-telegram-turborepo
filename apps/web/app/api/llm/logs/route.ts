import { NextResponse } from "next/server";

export async function GET() {
  const llmUrl = process.env.VECTOR_CONVERT_LLM_URL || process.env.VECTOR_CONVERT_LLM_INTERNAL_URL || 'http://vector-convert-llm:8081';
  const logsUrl = `${llmUrl}/logs`;
  try {
    const res = await fetch(logsUrl, { method: "GET" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ logs: [], error: "Failed to fetch logs" }, { status: 500 });
  }
}
