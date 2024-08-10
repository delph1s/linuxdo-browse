export type StatsDataType = {
  totalSuccess: number;
  totalFailed: number;
  totalReadingTime: number;
};

export type TaskItemType = {
  taskId: string;
  topicId: number;
  postNums: number[];
  csrfToken: string;
  maxReadPosts: number;
  actionType: '主动出击' | '无限月读';
  status: 'pending' | 'processing' | 'completed' | 'retrying' | 'failed';
};

export type LogItemType = {
  logId: string;
  time: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

export type StatusLevelMappingType = Record<TaskItemType['status'], LogItemType['level']>;
