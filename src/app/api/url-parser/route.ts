import axios, { type AxiosResponse } from "axios";
import { errorResponse, successResponse } from "@/utils/api-response";

interface RedditPostResponse {
  title: string;
  description: string;
}

interface RedditApiResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: {
        title?: string;
        selftext?: string;
      };
    }>;
  };
}

export async function GET(request: Request) {
  try {
    // Get URL from query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url || typeof url !== "string") {
      return errorResponse("URL query parameter is required", undefined, 400);
    }

    // Validate that it's a Reddit URL
    const redditUrlPattern =
      /^https?:\/\/(www\.)?reddit\.com\/r\/[^/]+\/comments\/[^/]+/i;
    if (!redditUrlPattern.test(url)) {
      return errorResponse(
        "URL must be a valid Reddit post URL (e.g., https://www.reddit.com/r/.../comments/...)",
        undefined,
        400
      );
    }

    // Remove trailing "/" if present and append .json
    const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    const jsonUrl = `${cleanUrl}.json`;

    // Fetch the Reddit JSON data using axios
    let response: AxiosResponse<RedditApiResponse[]>;
    try {
      response = await axios.get<RedditApiResponse[]>(jsonUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError)) {
        return errorResponse(
          `Failed to fetch Reddit post: ${axiosError.response?.status} ${axiosError.response?.statusText || axiosError.message}`,
          undefined,
          axiosError.response?.status || 500
        );
      }
      return errorResponse(
        "Failed to fetch Reddit post data",
        axiosError instanceof Error ? axiosError.message : String(axiosError),
        500
      );
    }

    const redditData = response.data;

    // Validate the response structure
    if (!Array.isArray(redditData) || redditData.length === 0) {
      return errorResponse(
        "Invalid Reddit API response format",
        undefined,
        500
      );
    }

    const postListing = redditData[0];
    if (
      !postListing?.data?.children ||
      !Array.isArray(postListing.data.children) ||
      postListing.data.children.length === 0
    ) {
      return errorResponse(
        "Reddit post data not found in response",
        undefined,
        404
      );
    }

    const postData = postListing.data.children[0]?.data;
    if (!postData) {
      return errorResponse("Post data not found", undefined, 404);
    }

    const title = postData.title || "";
    const description = postData.selftext || "";

    if (!title) {
      return errorResponse("Post title not found", undefined, 404);
    }

    const result: RedditPostResponse = {
      title,
      description,
    };

    return successResponse(result, "Reddit post parsed successfully");
  } catch (error) {
    console.error("URL parser API error:", error);
    return errorResponse(
      "An error occurred while parsing the Reddit URL",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
}
