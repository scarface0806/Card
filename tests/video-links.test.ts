import { describe, expect, it } from 'vitest';

import {
  extractYouTubeId,
  normalizeVideoLinks,
  parseVideoLinksFromFormData,
  youTubeThumbnail,
  youTubeWatchUrl,
} from '@/lib/video-links';

const VIDEO_ID = 'dQw4w9WgXcQ';

describe('extractYouTubeId', () => {
  it('reads the id out of every link shape an admin is likely to paste', () => {
    const urls = [
      `https://www.youtube.com/watch?v=${VIDEO_ID}`,
      `http://youtube.com/watch?v=${VIDEO_ID}`,
      `https://m.youtube.com/watch?v=${VIDEO_ID}`,
      `youtube.com/watch?v=${VIDEO_ID}`,
      `https://youtu.be/${VIDEO_ID}`,
      `https://www.youtube.com/embed/${VIDEO_ID}`,
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
      `https://www.youtube.com/shorts/${VIDEO_ID}`,
      `https://www.youtube.com/live/${VIDEO_ID}`,
      `https://www.youtube.com/v/${VIDEO_ID}`,
      VIDEO_ID,
    ];

    for (const url of urls) {
      expect(extractYouTubeId(url), url).toBe(VIDEO_ID);
    }
  });

  it('keeps the id when the watch link carries extra query params', () => {
    expect(extractYouTubeId(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s&list=PL123`)).toBe(VIDEO_ID);
  });

  it('ignores whitespace around a pasted link', () => {
    expect(extractYouTubeId(`  https://youtu.be/${VIDEO_ID}  `)).toBe(VIDEO_ID);
  });

  it('returns null for anything that is not a resolvable YouTube video', () => {
    const rejected = [
      null,
      undefined,
      '',
      '   ',
      'not a url',
      'https://vimeo.com/123456789',
      'https://www.youtube.com/@somechannel',
      'https://www.youtube.com/watch?v=tooshort',
      `https://notyoutube.com/watch?v=${VIDEO_ID}`,
    ];

    for (const value of rejected) {
      expect(extractYouTubeId(value), String(value)).toBeNull();
    }
  });
});

describe('youTubeThumbnail / youTubeWatchUrl', () => {
  it('builds the hqdefault thumbnail, which exists for every video', () => {
    expect(youTubeThumbnail(VIDEO_ID)).toBe(`https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`);
  });

  it('builds a canonical watch url', () => {
    expect(youTubeWatchUrl(VIDEO_ID)).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
  });
});

describe('parseVideoLinksFromFormData', () => {
  it('keeps only the slots that carry a url, and their slot numbers', () => {
    const formData = new FormData();
    formData.append('videoUrl1', `  https://youtu.be/${VIDEO_ID}  `);
    formData.append('videoTitle1', '  Launch film  ');
    formData.append('videoUrl2', '   ');
    formData.append('videoTitle2', 'Ignored');
    formData.append('videoUrl3', 'https://www.youtube.com/watch?v=abcdefghijk');
    formData.append('videoTitle3', '');

    expect(parseVideoLinksFromFormData(formData)).toEqual([
      { slot: 1, url: `https://youtu.be/${VIDEO_ID}`, title: 'Launch film' },
      { slot: 3, url: 'https://www.youtube.com/watch?v=abcdefghijk', title: null },
    ]);
  });

  it('returns an empty list when no slot was filled', () => {
    expect(parseVideoLinksFromFormData(new FormData())).toEqual([]);
  });
});

describe('normalizeVideoLinks', () => {
  it('sorts by slot and drops entries with no url', () => {
    const result = normalizeVideoLinks([
      { slot: 3, url: 'https://youtu.be/ccccccccccc', title: 'Third' },
      { slot: 1, url: ' https://youtu.be/aaaaaaaaaaa ', title: '  First  ' },
      { slot: 2, url: '   ' },
    ]);

    expect(result).toEqual([
      { slot: 1, url: 'https://youtu.be/aaaaaaaaaaa', title: 'First' },
      { slot: 3, url: 'https://youtu.be/ccccccccccc', title: 'Third' },
    ]);
  });

  it('falls back to the array position when a stored slot is missing or out of range', () => {
    const result = normalizeVideoLinks([
      { url: 'https://youtu.be/aaaaaaaaaaa' },
      { slot: 99, url: 'https://youtu.be/bbbbbbbbbbb' },
    ]);

    expect(result.map((item) => item.slot)).toEqual([1, 2]);
  });

  it('never returns more than the three slots the card renders', () => {
    const result = normalizeVideoLinks(
      Array.from({ length: 6 }, (_, idx) => ({ slot: idx + 1, url: `https://youtu.be/${'a'.repeat(11)}` }))
    );

    expect(result).toHaveLength(3);
  });

  it('treats a customer saved before the field existed as having no videos', () => {
    for (const value of [undefined, null, 'nope', 42, {}]) {
      expect(normalizeVideoLinks(value)).toEqual([]);
    }
  });
});
