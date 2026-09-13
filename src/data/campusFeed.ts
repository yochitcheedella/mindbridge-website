export interface Comment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string; // e.g., 'Wellness Admin' or 'Vishnu Wellness Centre'
  authorAvatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  likedByCurrentUser: boolean;
  comments: Comment[];
  timestamp: string;
}

const STORAGE_KEY = 'mindbridge_campus_feed_v3';

const defaultPosts: FeedPost[] = [
  {
    id: 'post-1',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80',
    caption: 'World Suicide Prevention Day PLEDGE 🤍 A kinder, more connected tomorrow starts with us. I pledge to listen with empathy without judgment, check in on friends and loved ones, and create a supportive & caring community. #WSPD2026 #StartTheConversation',
    likes: 124,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c1',
        authorName: 'vit_student',
        text: 'I pledge to listen! ❤️',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'post-2',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: 'https://images.unsplash.com/photo-1527137342181-19aab11a8ee8?auto=format&fit=crop&q=80',
    caption: 'Meet the New Unfold Duo™ - Mental Health Awareness. Sometimes "I\'m fine" isn\'t always the full picture. Let\'s take a closer look. When closed, looks pretty okay. When opened: "I\'m actually exhausted", "I\'m overthinking everything". Sometimes, people need unfolding too. Check on your friends. 🌻',
    likes: 89,
    likedByCurrentUser: true,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'post-3',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80',
    caption: 'World Suicide Prevention Day 2026. Changing the Narrative on Suicide - Start the conversation. 🗣️ Let\'s break the stigma together. #MentalHealthMatters',
    likes: 156,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c2',
        authorName: 'svecw_wellness',
        text: 'Such an important message!',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'post-4',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80',
    caption: '10th SEPTEMBER WORLD SUICIDE PREVENTION DAY 🎗️ Real Conversations Create Real Change. It\'s okay to not be okay. Let\'s support each other and create a safe space for open conversations on campus. #SVESWellness',
    likes: 210,
    likedByCurrentUser: false,
    comments: [
      {
        id: 'c3',
        authorName: 'vit_counseling',
        text: 'Always here to listen! 💛',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString()
  },
  {
    id: 'post-c1',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/sahithi_challa_full.jpg?v=2',
    caption: 'Hello, I am Sahithi Challa, Wellness Counsellor at Vishnu School! Helping you untangle your thoughts with empathy and practical tools. Let\'s work together. 💛',
    likes: 132,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 120).toISOString()
  },
  {
    id: 'post-c2',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/gadi_navya_sri_full.jpg?v=2',
    caption: 'Glad you\'re here, let\'s connect! 🌻 Navya Sri, Wellness Counsellor at B.V. Raju College. I believe in slowing down and finding small, practical ways to move forward.',
    likes: 145,
    likedByCurrentUser: true,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 144).toISOString()
  },
  {
    id: 'post-c3',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/bantu_anumitha_full.jpg?v=2',
    caption: 'It\'s nice to meet you! Bantu Anumitha, Wellness Counsellor at Smt. B. Seetha Polytechnic College. Healing isn\'t changing who you are, it\'s uncovering who you\'ve always been.',
    likes: 98,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 168).toISOString()
  },
  {
    id: 'post-c4',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/akshitha_selvaraj_full.jpg?v=2',
    caption: 'Let me introduce myself 🌸 Akshitha Selvaraj, Wellness Counsellor at Sri Vishnu College of Pharmacy. Every conversation is a step toward healing and self-discovery.',
    likes: 112,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 192).toISOString()
  },
  {
    id: 'post-c5',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/angel_mariam_benny_full.jpg?v=2',
    caption: 'Hi there, meet Angel Benny, Wellness Counsellor at VDC (Vishnu Dental College). Book your session through the MindBridge app today!',
    likes: 167,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 216).toISOString()
  },
  {
    id: 'post-c6',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/devika_babu_full.jpg?v=2',
    caption: 'Hey there, I\'m Devika Babu, Wellness Counsellor at Vishnu Women\'s University. Excited to be here and support your wellness journey!',
    likes: 189,
    likedByCurrentUser: true,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 240).toISOString()
  },
  {
    id: 'post-c7',
    authorName: 'vishnu_wellness_centre',
    authorRole: 'Official Campus Update',
    authorAvatar: '/vishnu_wellness_logo.png',
    imageUrl: '/counselors/ram_prudhvi_teja_full.jpg?v=2',
    caption: 'Hello there, I am Ram Prudhvi Teja, Senior Wellness Counsellor at VIT (Vishnu Institute of Technology). Your mental health is our priority.',
    likes: 245,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date(Date.now() - 3600000 * 264).toISOString()
  }
];

export const getCampusFeed = (): FeedPost[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse campus feed', e);
    }
  }
  return defaultPosts;
};

export const saveCampusFeed = (posts: FeedPost[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

export const createPost = (post: Omit<FeedPost, 'id' | 'likes' | 'likedByCurrentUser' | 'comments' | 'timestamp'>) => {
  const posts = getCampusFeed();
  const newPost: FeedPost = {
    ...post,
    id: `post-${Date.now()}`,
    likes: 0,
    likedByCurrentUser: false,
    comments: [],
    timestamp: new Date().toISOString()
  };
  saveCampusFeed([newPost, ...posts]);
  return newPost;
};

export const deletePost = (postId: string) => {
  const posts = getCampusFeed();
  saveCampusFeed(posts.filter(p => p.id !== postId));
};

export const toggleLike = (postId: string) => {
  const posts = getCampusFeed();
  const updated = posts.map(post => {
    if (post.id === postId) {
      const isLiked = post.likedByCurrentUser;
      return {
        ...post,
        likedByCurrentUser: !isLiked,
        likes: isLiked ? post.likes - 1 : post.likes + 1
      };
    }
    return post;
  });
  saveCampusFeed(updated);
  return updated;
};

export const addComment = (postId: string, authorName: string, text: string) => {
  const posts = getCampusFeed();
  const updated = posts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        comments: [
          ...post.comments,
          {
            id: `c-${Date.now()}`,
            authorName,
            text,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    return post;
  });
  saveCampusFeed(updated);
  return updated;
};
