import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
          "application/pdf",
        ],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
      }),
      onUploadCompleted: async () => {
        // no-op: we don't need to track completions
      },
    });
    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
