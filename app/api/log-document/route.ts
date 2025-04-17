import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    const { content } = body;
    
    // Log the document content to the server console
    console.log('Document content received:', content);
    
    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging document content:', error);
    return NextResponse.json({ success: false, error: 'Failed to log document content' }, { status: 500 });
  }
}
