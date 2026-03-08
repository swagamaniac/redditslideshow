import { RedditResponse, MediaItem } from '../types';

export async function fetchSubredditMedia(subreddit: string, after?: string): Promise<{ items: MediaItem[], after: string | null }> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=50${after ? `&after=${after}` : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from Reddit');
    
    const data: RedditResponse = await response.json();
    
    const items: MediaItem[] = data.data.children
      .map(child => child.data)
      .filter(post => {
        // Filter for images and videos
        const isImage = post.post_hint === 'image' || post.url.match(/\.(jpg|jpeg|png|gif)$/i);
        const isVideo = post.is_video || post.post_hint === 'hosted:video' || post.post_hint === 'rich:video' || post.url.match(/\.(mp4|webm)$/i);
        return isImage || isVideo;
      })
      .map(post => {
        let type: 'image' | 'video' = 'image';
        let mediaUrl = post.url;
        let isEmbed = false;

        // Handle RedGifs
        if (post.url.includes('redgifs.com/watch/')) {
          type = 'video';
          isEmbed = true;
          const id = post.url.split('/').pop()?.split('-')[0];
          mediaUrl = `https://www.redgifs.com/ifr/${id}?autoplay=1&muted=1`;
        } 
        // Handle Reddit Videos
        else if (post.is_video && post.media?.reddit_video) {
          type = 'video';
          mediaUrl = post.media.reddit_video.fallback_url;
        } 
        // Handle other video hints
        else if (post.post_hint === 'rich:video' || post.post_hint === 'hosted:video') {
          type = 'video';
        } 
        // Handle .gifv
        else if (post.url.endsWith('.gifv')) {
          type = 'video';
          mediaUrl = post.url.replace('.gifv', '.mp4');
        }
        // Improve image loading: use preview if it's an image and preview exists
        else if (post.post_hint === 'image' && post.preview?.images?.[0]?.source?.url) {
          mediaUrl = post.preview.images[0].source.url;
        }

        return {
          id: post.id,
          title: post.title,
          author: post.author,
          subreddit: post.subreddit,
          type,
          isEmbed,
          url: mediaUrl.replace(/&amp;/g, '&'),
          thumbnail: post.thumbnail,
          permalink: `https://reddit.com${post.permalink}`
        };
      });

    return {
      items,
      after: data.data.after
    };
  } catch (error) {
    console.error(`Error fetching r/${subreddit}:`, error);
    return { items: [], after: null };
  }
}
