export type StatsDataType = {
  totalSuccess: number;
  totalFailed: number;
  totalReadingTime: number;
};

export type TaskItemType = {
  topicId: number;
  postNums: number[];
  csrfToken: string;
  maxReadPosts: number;
  actionType: '主动出击' | '无限月读';
  status: 'pending' | 'processing' | 'completed' | 'retrying' | 'failed';
};

export type LogItemType = {
  time: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

export type StatusLevelMappingType = Record<TaskItemType['status'], LogItemType['level']>;
