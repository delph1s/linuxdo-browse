export const DEFAULT_APP_SETTINGS = {
  readAllPostsInTopic: false, // 是否阅读主题所有帖子，false 从最后的内容开始看
  singlePostsReading: 1000, // 单次阅读帖子数，控制 timings 请求 body 行为
  maxRetryTimes: 10, // 最大重试次数
  windowPeriodTopics: [[26306, 200]], // 空窗期随机阅读的帖子列表，[[<topic_id>, <阅读楼层数>]]
  getCsrfTokenFromHtml: false, // 是否从 html 中获取 csrf token
  maxLogLineNum: 100, // 日志最大条数
  uiWidth: "36rem", // ui 宽度
  uiQueueHeight: "100px", // ui 任务队列高度
  uiLogHeight: "400px", // ui 日志高度
  uiTagFontSize: "0.75rem", // ui 标签字体大小
  uiQueueFontSize: "0.75rem", // ui 队列字体大小
  uiLogFontSize: "0.75rem", // ui 日志字体大小
};

export const APP_SETTINGS_KEY = "linuxdo-browse-app-settings";
