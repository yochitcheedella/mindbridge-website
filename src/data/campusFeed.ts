import { canPostCampusUpdates } from '../utils/auth';

export interface Comment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string; // e.g. 'Senior Wellness Counsellor · VIT'
  authorAvatar: string;
  institution?: string;
  counselorId?: number;
  imageUrl?: string;
  images?: string[]; // Multiple carousel slides
  caption: string;
  likes: number;
  likedByCurrentUser: boolean;
  comments: Comment[];
  timestamp: string;
}

const STORAGE_KEY = 'mindbridge_campus_feed_counselors_v2';

export const COUNSELOR_FEED_POSTS: FeedPost[] = [
  {
    id: 'post-c1',
    counselorId: 1,
    authorName: 'Ram Prudhvi Teja',
    authorRole: 'Senior Wellness Counsellor · VIT',
    authorAvatar: '/counselors/ram_prudhvi_teja_head.jpg',
    institution: 'Vishnu Institute of Technology',
    images: [
      '/counselors/raw/page_7_img_0_589x719.jpeg',
      '/counselors/raw/page_7_img_1_667x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_7_img_0_589x719.jpeg',
    caption: 'Hello there, I am Ram Prudhvi Teja, Senior Wellness Counsellor at VIT (Vishnu Institute of Technology) 🌸\n\n✨ Slide left to see ways I can support you, what I wish every student knew, and how we can work together! Supporting Minds. Encouraging Growth. Inspiring Wellness. ♡',
    likes: 184,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-1-1',
        authorName: 'Sanjay Kumar (CSE 3rd Yr)',
        text: 'Sir\'s session on exam anxiety really helped me gain clarity before midterms! Highly recommended 🙌',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'c-1-2',
        authorName: 'Ananya Roy (IT)',
        text: 'The best part is how safe and non-judgmental the conversation felt. Thank you sir! 🤍',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'post-c2',
    counselorId: 2,
    authorName: 'Devika Babu',
    authorRole: 'Wellness Counsellor · VWU',
    authorAvatar: '/counselors/devika_babu_head.jpg',
    institution: 'Vishnu Women\'s University',
    images: [
      '/counselors/raw/page_6_img_0_613x719.jpeg',
      '/counselors/raw/page_6_img_1_665x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_6_img_0_613x719.jpeg',
    caption: 'Hey there, I\'m Devika Babu, Wellness Counsellor at Vishnu Women\'s University 🌻\n\nCreating a space where you can be yourself and talk about the things that really matter to you. Progress is more important than perfection. Slide left for my focus areas and fun facts! ♡',
    likes: 156,
    likedByCurrentUser: true,
    comments: [
      {
        id: 'c-2-1',
        authorName: 'Harika Reddy (ECE)',
        text: 'Ma\'am made me feel so understood. The stress management tools actually work! 💛',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'post-c3',
    counselorId: 3,
    authorName: 'Angel Benny',
    authorRole: 'Wellness Counselor · VDC',
    authorAvatar: '/counselors/angel_benny_head.jpg',
    institution: 'Vishnu Dental College',
    images: [
      '/counselors/raw/page_4_img_0_639x719.jpeg',
      '/counselors/raw/page_4_img_1_685x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_4_img_0_639x719.jpeg',
    caption: 'Hi there, meet Angel Benny, Wellness Counselor at VDC (Vishnu Dental College) 💙\n\nMaking space for the overthinking, the chaos and the "I\'m fine" that definitely isn\'t fine. Making space for all of it and maybe even make sense of it together. Slide to see what I hope every student knows! ♡',
    likes: 198,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-3-1',
        authorName: 'Rohit Verma (BDS)',
        text: '"Your notes app, chatGPT and google have tried... now try us" — so true haha! Great session ma\'am! 🌟',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: 'post-c4',
    counselorId: 4,
    authorName: 'Akshitha Selvaraj',
    authorRole: 'Wellness Counsellor · SVCP',
    authorAvatar: '/counselors/akshitha_selvaraj_head.jpg',
    institution: 'Shri Vishnu College of Pharmacy',
    images: [
      '/counselors/raw/page_5_img_0_585x719.jpeg',
      '/counselors/raw/page_5_img_1_573x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_5_img_0_585x719.jpeg',
    caption: 'Let me introduce myself ♡ Akshitha Selvaraj, Wellness Counsellor at Sri Vishnu College of Pharmacy 🌸\n\nEvery conversation is a step toward healing, growth, and self-discovery. Slide to check out my areas of focus and student guide! ♡',
    likes: 142,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-4-1',
        authorName: 'Pooja Sri (Pharm.D)',
        text: 'Seeking help felt daunting at first, but ma\'am was so welcoming and gentle. Thank you! 🌷',
        timestamp: new Date(Date.now() - 3600000 * 16).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'post-c5',
    counselorId: 5,
    authorName: 'Gadi Navya Sri',
    authorRole: 'Wellness Counsellor · BVRC',
    authorAvatar: '/counselors/navya_sri_head.jpg',
    institution: 'B.V. Raju College',
    images: [
      '/counselors/raw/page_2_img_0_582x719.jpeg',
      '/counselors/raw/page_2_img_1_634x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_2_img_0_582x719.jpeg',
    caption: 'Glad you\'re here, let\'s connect! 🌻 Gadi Navya Sri, Wellness Counsellor at B.V. Raju College.\n\nI believe in slow and gradual change rather than quick fixes. Working at your pace, finding small, practical ways to move forward. Slide left to learn more! ♡',
    likes: 167,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-5-1',
        authorName: 'Karthik Raja (B.Sc)',
        text: 'The best advice on time management and overcoming procrastination. Truly grateful! 👏',
        timestamp: new Date(Date.now() - 3600000 * 22).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString()
  },
  {
    id: 'post-c6',
    counselorId: 6,
    authorName: 'Sahithi Challa',
    authorRole: 'Wellness Counsellor · Vishnu School',
    authorAvatar: '/counselors/sahithi_challa_head.jpg',
    institution: 'Vishnu School',
    images: [
      '/counselors/raw/page_1_img_0_597x719.jpeg',
      '/counselors/raw/page_1_img_1_605x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_1_img_0_597x719.jpeg',
    caption: 'Hi, I\'m Sahithi Challa, Wellness Counsellor & Forensic Psychologist at Vishnu School! 💜\n\nA decision doesn\'t define you. Your commitment to it does. Helping you untangle your thoughts with empathy, curiosity, and practical tools that actually work. Slide to view my profile cards! ♡',
    likes: 215,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-6-1',
        authorName: 'Meghana (Class XII)',
        text: 'Ma\'am is super empathetic and easy to talk to. Books & biryani comfort combo is iconic! 📚✨',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: 'post-c7',
    counselorId: 7,
    authorName: 'Bantu Anumitha',
    authorRole: 'Wellness Counsellor · SBSP',
    authorAvatar: '/counselors/bantu_anumitha_head.jpg',
    institution: 'Smt. B. Seetha Polytechnic College',
    images: [
      '/counselors/raw/page_3_img_0_593x719.jpeg',
      '/counselors/raw/page_3_img_1_719x719.jpeg'
    ],
    imageUrl: '/counselors/raw/page_3_img_0_593x719.jpeg',
    caption: 'It\'s nice to meet you! ♡ Bantu Anumitha, Wellness Counsellor at Smt. B. Seetha Polytechnic College 🌷\n\nHealing isn\'t changing who you are; it\'s uncovering who you\'ve always been. You don\'t have to be perfect to be worthy. Slide to explore my support areas! ♡',
    likes: 129,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c-7-1',
        authorName: 'Divya S. (Polytechnic)',
        text: 'Taking the first step felt scary, but ma\'am made it so comfortable and meaningful. 💖',
        timestamp: new Date(Date.now() - 3600000 * 38).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 44).toISOString()
  },
  {
    id: 'post-vwc-main',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Institutional Charter',
    authorAvatar: '/vishnu_wellness_logo.png',
    institution: 'Sri Vishnu Educational Society',
    images: [
      '/counselors/raw/page_8_img_0_719x719.jpeg',
      '/counselors/raw/page_9_img_0_773x794.jpeg'
    ],
    imageUrl: '/counselors/raw/page_8_img_0_719x719.jpeg',
    caption: '🌟 VISHNU WELLNESS CENTRE — SRI VISHNU EDUCATIONAL SOCIETY (Est. 2017)\n\n"Empowering Minds. Inspiring Lives."\n\nSlide to view our official Vision & Mission charter and our 5 core pillars of care: Compassion, Confidentiality, Empathy, Integrity & Well-Being. 7 dedicated wellness counsellors working round the clock across all SVES campuses. Here for you, always. ♡',
    likes: 312,
    likedByCurrentUser: true,
    comments: [
      {
        id: 'c-vwc-1',
        authorName: 'SVES Student Union',
        text: 'Proud to have such an incredible mental health support system on campus! 🏛️💙',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 52).toISOString()
  }
];

export const getCampusFeed = (): FeedPost[] => {
  if (typeof window === 'undefined') return COUNSELOR_FEED_POSTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse campus feed from localStorage', e);
    }
  }
  // Initialize storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(COUNSELOR_FEED_POSTS));
  return COUNSELOR_FEED_POSTS;
};

export const saveCampusFeed = (posts: FeedPost[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  window.dispatchEvent(new CustomEvent('mindbridge_campus_feed_sync', { detail: posts }));
};

export const toggleLike = (postId: string): FeedPost[] => {
  const currentPosts = getCampusFeed();
  const updated = currentPosts.map((post) => {
    if (post.id === postId) {
      const willBeLiked = !post.likedByCurrentUser;
      return {
        ...post,
        likedByCurrentUser: willBeLiked,
        likes: willBeLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
      };
    }
    return post;
  });
  saveCampusFeed(updated);
  return updated;
};

export const addComment = (postId: string, authorName: string, text: string): FeedPost[] => {
  const trimmed = text.trim();
  if (!trimmed) return getCampusFeed();

  const currentPosts = getCampusFeed();
  const newComment: Comment = {
    id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    authorName: authorName.trim() || 'Student',
    text: trimmed,
    timestamp: new Date().toISOString(),
  };

  const updated = currentPosts.map((post) => {
    if (post.id === postId) {
      return {
        ...post,
        comments: [...post.comments, newComment],
      };
    }
    return post;
  });

  saveCampusFeed(updated);
  return updated;
};

export const createPost = (
  post: Omit<FeedPost, 'id' | 'likes' | 'likedByCurrentUser' | 'comments' | 'timestamp'>
): { success: boolean; post?: FeedPost; error?: string } => {
  if (!canPostCampusUpdates()) {
    console.warn('Unauthorized post attempt: only Admin and Ram Sir can publish campus posts.');
    return {
      success: false,
      error: 'Permission Denied: Only Vishnu Wellness Centre Administrators and Senior Counsellor Ram Prudhvi Teja (Ram Sir) are authorized to post.',
    };
  }

  const currentPosts = getCampusFeed();
  const newPost: FeedPost = {
    ...post,
    id: `post-${Date.now()}`,
    likes: 0,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date().toISOString(),
  };
  saveCampusFeed([newPost, ...currentPosts]);
  return { success: true, post: newPost };
};

export const deletePost = (postId: string): void => {
  if (!canPostCampusUpdates()) {
    console.warn('Unauthorized delete attempt.');
    return;
  }
  const currentPosts = getCampusFeed();
  saveCampusFeed(currentPosts.filter((p) => p.id !== postId));
};
