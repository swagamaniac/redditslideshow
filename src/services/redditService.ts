import { RedditResponse, MediaItem } from '../types';

export async function fetchSubredditMedia(source: string, after?: string): Promise<{ items: MediaItem[], after: string | null }> {
  const isUser = source.startsWith('u/');
  const name = isUser ? source.slice(2) : source;
  const redditUrl = isUser
    ? `https://www.reddit.com/user/${name}/submitted.json?limit=100${after ? `&after=${after}` : ''}`
    : `https://www.reddit.com/r/${name}/hot.json?limit=100${after ? `&after=${after}` : ''}`;
  
  // Try direct fetch first, then fallback to proxy if it fails
  const fetchWithFallback = async (useProxy = false) => {
    const url = useProxy 
      ? `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`
      : redditUrl;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return response.json();
  };

  try {
    let data: RedditResponse;
    try {
      // Attempt 1: Direct fetch (works in most modern browsers)
      data = await fetchWithFallback(false);
    } catch (e) {
      console.warn(`Direct fetch failed for ${source}, trying proxy...`, e);
      // Attempt 2: Proxy fetch (for private windows/strict privacy settings)
      data = await fetchWithFallback(true);
    }
    
    const items: MediaItem[] = data.data.children
      .map(child => child.data)
      .filter(post => {
        // Filter for images and videos
        const isImage = post.post_hint === 'image' || 
                        post.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                        post.url.includes('imgur.com') && !post.url.includes('/a/');
        
        const isVideo = post.is_video || 
                        post.post_hint === 'hosted:video' || 
                        post.post_hint === 'rich:video' || 
                        post.url.match(/\.(mp4|webm|gifv)$/i) ||
                        post.url.includes('redgifs.com') ||
                        post.url.includes('v.redd.it');
                        
        return isImage || isVideo;
      })
      .map(post => {
        let type: 'image' | 'video' = 'image';
        let mediaUrl = post.url;
        let isEmbed = false;

        // Handle RedGifs
        if (post.url.includes('redgifs.com')) {
          type = 'video';
          isEmbed = true;
          // Extract ID from various RedGifs URL formats
          // e.g., https://www.redgifs.com/watch/vibrantkindlyleech
          // or https://v3.redgifs.com/watch/vibrantkindlyleech
          const parts = post.url.split('/');
          const id = parts[parts.length - 1].split('-')[0].split('?')[0];
          mediaUrl = `https://www.redgifs.com/ifr/${id}?autoplay=1&muted=0`;
        } 
        // Handle Imgur (convert to direct link if needed)
        else if (post.url.includes('imgur.com') && !post.url.match(/\.(jpg|jpeg|png|gif|mp4)$/i)) {
          mediaUrl = `${post.url}.jpg`;
        }
        // Handle Reddit Videos
        else if (post.is_video && post.media?.reddit_video) {
          type = 'video';
          mediaUrl = post.media.reddit_video.fallback_url;
        } 
        // Handle other video hints
        else if (post.post_hint === 'rich:video' || post.post_hint === 'hosted:video') {
          type = 'video';
          // If it's a rich video but we don't have a direct mp4, we might need to use the embed
          if (post.media?.oembed?.html) {
            // This is complex, but for now we'll try to use the URL
            // Many rich videos are YouTube/Vimeo which we don't handle perfectly yet
          }
        } 
        // Handle .gifv
        else if (post.url.endsWith('.gifv')) {
          type = 'video';
          mediaUrl = post.url.replace('.gifv', '.mp4');
        }
        // Improve image loading: use preview if it's an image and preview exists
        else if (post.preview?.images?.[0]?.source?.url) {
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
    console.error(`Error fetching ${source}:`, error);
    return { items: [], after: null };
  }
}
