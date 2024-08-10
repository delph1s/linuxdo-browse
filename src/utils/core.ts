/**
 * 获取随机整数
 *
 * @param start 范围开始
 * @param end 范围结束
 * @returns 范围内随机整数
 */
export const randInt = (start: number, end: number): number => {
  return Math.floor(Math.random() * (end - start + 1)) + start;
};

/**
 * 随机睡眠（毫秒）
 *
 * @param start 范围开始
 * @param end 范围结束
 */
export const randSleep = async (start: number = 2000, end: number = 3000): Promise<unknown> => {
  // 生成随机整数 randSleepTime，范围在 start 到 end 之间
  const randSleepTime = randInt(start, end);
  // 睡眠时间
  return new Promise((resolve, reject) => {
    setTimeout(resolve, randSleepTime);
  });
};

/**
 * 检查是否为原生方法
 *
 * @param func 方法
 * @returns 是否为原生方法
 */
export const isNativeFunction = (func: any): boolean => {
  if (typeof func !== 'function') {
    return false;
  }

  // 获取函数的字符串表示形式
  const funcString = func.toString();

  // 检查字符串是否包含 "[native code]"
  return funcString.includes('[native code]');
};

/**
 * 是否为原生方法，不是则抛出异常
 *
 * @param func 方法
 * @returns 方法
 */
export const ensureNativeMethods = (func: any) => {
  if (isNativeFunction(func)) {
    return func;
  }

  throw new Error(`${func.name} is not native`);
};

/**
 * 匹配地址
 *
 * @param url 地址
 * @param pattern 模式
 */
export const matchUrl = (url: string | URL, pattern: RegExp) => {
  if (typeof url === 'string') {
    return pattern.test(url);
  }
  return false;
};

/**
 * 匹配话题地址
 *
 * @param url 地址
 */
export const isTopicUrl = (url: string | URL) => {
  // const pattern = /^https:\/\/linux\.do\/t\/[a-zA-Z0-9_-]+\.json($|\?)/;
  const patternTopic = /^\/t\/[0-9]+\.json($|\?)/;
  const patternPost = /^\/t\/[0-9]+\/[0-9]+\.json($|\?)/;
  return matchUrl(url, patternPost) || matchUrl(url, patternTopic);
};

/**
 * 匹配计时地址
 *
 * @param url 地址
 */
export const isTimingsUrl = (url: string) => {
  const patternTimings = '/topics/timings';
  return url === patternTimings;
};

/**
 * 匹配拉取地址
 *
 * @param url 地址
 */
export const isPollUrl = (url: string) => {
  const patternPoll = /^\/message-bus\/[a-z0-9]+\/poll(\?.*)?$/;
  return matchUrl(url, patternPoll);
};
