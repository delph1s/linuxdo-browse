export type TopicData = {
  id: number;
  highest_post_number: number;
  last_read_post_number?: number;
};

// 用户相关接口
type User = {
  id: number;
  username: string;
  name: string;
  avatar_template: string;
  trust_level: number;
  animated_avatar: string | null;
  primary_group_name?: string;
  flair_name?: string;
  flair_url?: string;
  flair_bg_color?: string;
  flair_color?: string;
  flair_group_id?: number;
  admin?: boolean;
  moderator?: boolean;
};

type Group = {
  id: number;
  name: string;
  flair_url: string | null;
  flair_bg_color: string;
  flair_color: string;
};

type Poster = {
  extras: string | null;
  description: string;
  user_id: number;
  primary_group_id: number | null;
  flair_group_id: number | null;
};

type Topic = {
  id: number;
  title: string;
  fancy_title: string;
  slug: string;
  posts_count: number;
  reply_count: number;
  highest_post_number: number;
  image_url: string | null;
  created_at: string;
  last_posted_at: string;
  bumped: boolean;
  bumped_at: string;
  archetype: string;
  unseen: boolean;
  last_read_post_number?: number;
  unread?: number;
  new_posts?: number;
  unread_posts?: number;
  pinned: boolean;
  unpinned: null;
  visible: boolean;
  closed: boolean;
  archived: boolean;
  notification_level?: number;
  bookmarked?: boolean;
  liked?: boolean;
  tags: string[];
  tags_descriptions: Record<string, string>;
  views: number;
  like_count: number;
  has_summary: boolean;
  last_poster_username: string | null;
  category_id: number;
  pinned_globally: boolean;
  featured_link: null;
  has_accepted_answer: boolean;
  can_have_answer: boolean;
  can_vote: boolean;
  posters: Poster[];
};

type TopicList = {
  can_create_topic: boolean;
  more_topics_url: string;
  per_page: number;
  top_tags: string[];
  topics: Topic[];
};

export type TopicListData = {
  users: User[];
  primary_groups: Group[];
  flair_groups: Group[];
  topic_list: TopicList;
};

export const getTopicList = async (url: string, csrfToken: string) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'x-csrf-token': csrfToken,
      'x-requested-with': 'XMLHttpRequest',
    },
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
    .then(res => res.json())
    .then((res: TopicListData) => {
      return res.topic_list.topics;
    })
    .catch(err => {
      console.error(err);
      return [];
    });

  return response;
};

export const getTopicTrack = async (topicId: number, csrfToken: string) => {
  const response = await fetch(`https://linux.do/t/${topicId}/1.json?track_visit=true&forceLoad=true`, {
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9',
      'discourse-logged-in': 'true',
      'discourse-present': 'true',
      'discourse-track-view': 'true',
      'discourse-track-view-topic-id': `${topicId}`,
      'x-csrf-token': csrfToken,
      'x-requested-with': 'XMLHttpRequest',
    },
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  })
    .then(res => res.json())
    .then((res: any) => {
      return res.id;
    })
    .catch(err => {
      console.error(err);
      return [];
    });

  return response;
};
