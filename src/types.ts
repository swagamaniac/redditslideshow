export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  thumbnail: string;
  is_video: boolean;
  media?: {
    reddit_video?: {
      fallback_url: string;
      hls_url?: string;
    };
    oembed?: {
      html?: string;
      provider_name?: string;
      thumbnail_url?: string;
    };
  };
  preview?: {
    images: Array<{
      source: {
        url: string;
      };
      variants: {
        mp4?: {
          source: {
            url: string;
          };
        };
      };
    }>;
  };
  post_hint?: string;
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after: string | null;
  };
}

export interface MediaItem {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  type: 'image' | 'video';
  isEmbed?: boolean;
  url: string;
  thumbnail: string;
  permalink: string;
}
