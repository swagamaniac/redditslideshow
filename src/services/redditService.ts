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
    console.error(`Error fetching r/${subreddit}:`, error);
    return { items: [], after: null };
  }
}
