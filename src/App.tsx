import styles from '@assets/scss/vars.module.scss';
import FuncIconButton from '@components/inputs/button/FuncIconButton';
import IconButton from '@components/inputs/button/IconButton';
import { useSettingsContext } from '@hooks/useSettingsContext';
import ConsoleSection from '@sections/ConsoleSection';
import type { LogItemType, StatsDataType, TaskItemType } from '@sections/ConsoleSection/types';
import SettingsSection from '@sections/SettingsSection';
import { getCsrfToken } from '@server/core';
import { ensureNativeMethods, genRandId, isTopicUrl, randInt, randSleep } from '@utils/core';
import { dayjs } from '@utils/time';
import nativeDayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type ContentType = 'settings' | 'console';

type TopicData = {
  id: number;
  highest_post_number: number;
  last_read_post_number?: number;
};

function App() {
  const settings = useSettingsContext();

  // XMLHttpRequest 拦截
  const nativeXHROpen = useRef(XMLHttpRequest.prototype.open);
  const nativeXHRSend = useRef(XMLHttpRequest.prototype.send);

  // csrf token store
  const csrfTokenRef = useRef<string>('');

  // Queue & Log Dialog open state
  const [taskQueue, setTaskQueue] = useState<TaskItemType[]>([]);
  const [logs, setLogs] = useState<LogItemType[]>([]);
  const [lastTaskTime, setLastTaskTime] = useState<nativeDayjs.Dayjs>(dayjs('1970-01-01 00:00:00'));
  const [statsData, setStatsData] = useState<StatsDataType>({
    totalSuccess: 0,
    totalFailed: 0,
    totalReadingTime: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  // Enable Assistant
  const [enableBrowseAssist, setEnableBrowseAssist] = useState<boolean>(false);
  // Switch Content
  const [activeContent, setActiveContent] = useState<ContentType>('console');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  /**
   * 切换 dialog 内容
   *
   * @param t
   */
  const switchContent = (t: ContentType) => {
    if (t !== activeContent && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveContent(t);
        setTimeout(() => {
          setIsAnimating(false);
        }, styles.dialogBodySwitchDuration); // 第二个页面出现的延迟
      }, styles.dialogBodySwitchDuration); // 等待第一个页面消失
    }
  };

  /**
   * 修改 css
   *
   * @param t
   */
  const switchContentCSS = (t: ContentType) => {
    if (activeContent === t) {
      if (isAnimating) {
        return 'animating';
      }
      return 'active';
    }
    return '';
  };

  /**
   * 添加日志
   *
   * @param level
   * @param message
   */
  const addLog = (level: LogItemType['level'], message: LogItemType['message']) => {
    setLogs(prevState => {
      let nextState = prevState;
      if (nextState.length >= settings.maxLogLineNum) {
        nextState = nextState.slice(1);
      }
      return [...nextState, { logId: genRandId(),time: dayjs().format('YYYY-MM-DD HH:mm:ss'), level, message }];
    });
  };

  /**
   * 清理日志
   */
  const clearLogs = () => {
    setLogs([]);
    addLog('info', '日志已清除');
  };

  const changeTaskStatus = (
    currentTask: TaskItemType,
    prevState: TaskItemType[],
    newStatus: TaskItemType['status'],
  ) => {
    const nextState = prevState;
    const currentItemIndex = nextState.findIndex(value => {
      return currentTask.topicId === value.topicId;
    });
    if (currentItemIndex !== -1) {
      nextState[currentItemIndex].status = newStatus;
    }
    return nextState;
  };

  const handleReadingPosts = async (task: TaskItemType) => {
    const { topicId, postNums, csrfToken, maxReadPosts, actionType, status } = task;

    let retryTimes = 0;
    let newPostNums = postNums;
    while (newPostNums.length > 0 && retryTimes <= settings.maxRetryTimes) {
      let processPostNums = newPostNums.slice(0, maxReadPosts);
      processPostNums = processPostNums[0] === 0 ? processPostNums.slice(1) : processPostNums;

      const randTime = randInt(60000, 61000);
      const processPostNumsStr = processPostNums.map(num => `timings%5B${num}%5D=${randTime}`);
      const resultStr = [...processPostNumsStr, `topic_time=${randTime}`, `topic_id=${topicId}`].join('&');

      // eslint-disable-next-line no-await-in-loop
      await randSleep(2000, 3000);

      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch('https://linux.do/topics/timings', {
          headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'x-csrf-token': task.csrfToken,
            'x-requested-with': 'XMLHttpRequest',
          },
          body: resultStr,
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        });

        if (res.status === 200) {
          addLog(
            'success',
            `已完成话题[${topicId}]${processPostNums[0]}至${processPostNums[processPostNums.length - 1]}层话题阅读`,
          );
          newPostNums = newPostNums.slice(maxReadPosts);
          retryTimes = 0;
          // eslint-disable-next-line no-await-in-loop
          await randSleep(1000, 2000);
        } else if (res.status >= 400 && res.status < 600) {
          addLog('warning', `阅读话题[${topicId}]出现错误(${res.status})！正在重试(${retryTimes + 1})……`);
          setTaskQueue(prevState => {
            return changeTaskStatus(task, prevState, 'retrying');
          });
          retryTimes += 1;
          // eslint-disable-next-line no-await-in-loop
          await randSleep(3000, 5000);
        } else {
          throw new Error(`Unexpected status: ${res.status}`);
        }
      } catch (err: any) {
        console.error(err);
        retryTimes += 1;
        addLog('error', `阅读话题[${topicId}]发生未知错误: ${err.message}`);
        // eslint-disable-next-line no-await-in-loop
        await randSleep(3000, 5000);
      }
    }

    if (retryTimes > settings.maxRetryTimes) {
      return { topicId, error: true, detail: '超过最大重试次数' };
    }

    return { topicId, error: false, detail: '已完成阅读' };
  };

  /**
   * 执行队列任务
   */
  const processQueue = async () => {
    if (taskQueue.length > 0) {
      const task = taskQueue[0];
      addLog('info', `正在阅读：${task.topicId}`);

      setTaskQueue(prevState => {
        return changeTaskStatus(task, prevState, 'processing');
      });

      try {
        const readingRes = await handleReadingPosts(task);

        const finishTime = dayjs();
        const timeDiff = finishTime.diff(lastTaskTime);

        if (readingRes.error) {
          setStatsData(prevState => {
            return {
              ...prevState,
              totalFailed: prevState.totalFailed + 1,
            };
          });
          setTaskQueue(prevState => {
            return changeTaskStatus(task, prevState, 'failed');
          });
          addLog('error', readingRes.detail);
        } else {
          setStatsData(prevState => {
            return {
              ...prevState,
              totalSuccess: prevState.totalSuccess + 1,
              totalReadingTime: prevState.totalReadingTime + Math.min(timeDiff, 60000),
            };
          });
          setLastTaskTime(finishTime);
          setTaskQueue(prevState => {
            return changeTaskStatus(task, prevState, 'completed');
          });
          addLog('success', `任务已完成：${task.topicId}`);
        }
      } catch (err: any) {
        console.error(err);
        setStatsData(prevState => {
          return {
            ...prevState,
            totalFailed: prevState.totalFailed + 1,
          };
        });
        setTaskQueue(prevState => {
          return changeTaskStatus(task, prevState, 'failed');
        });
        addLog('error', `处理任务时发生错误：${err.message}`);
      }

      // 删除已完成任务
      setTaskQueue(prevState => {
        const nextState = prevState;
        nextState.shift();
        return nextState;
      });
    }
  };

  const addTask = ({ topicId, postNums, csrfToken, maxReadPosts, actionType }: Omit<TaskItemType, 'taskId' | 'status'>) => {
    if (enableBrowseAssist) {
      setTaskQueue(prevState => {
        const isDuplicate = prevState.some(task => task.topicId === topicId);

        if (!isDuplicate) {
          const nextState: TaskItemType[] = [
            ...prevState,
            {
              taskId: genRandId(),
              topicId,
              postNums,
              csrfToken,
              maxReadPosts,
              actionType,
              status: 'pending',
            },
          ];
          addLog('info', `任务已添加，目前队列长度：${nextState.length}`);

          return nextState;
        }

        return prevState;
      });
    }
  };

  const addInitTask = async () => {
    let csrfToken;
    if (csrfTokenRef.current) {
      csrfToken = csrfTokenRef.current;
    } else {
      csrfToken = await getCsrfToken(settings.getCsrfTokenFromHtml);
    }
    const windowPeriodTopicSelected = settings.windowPeriodTopics[randInt(0, settings.windowPeriodTopics.length - 1)];
    const [windowPeriodTopicId, windowPeriodTopicNums] = windowPeriodTopicSelected;
    const postNums = Array.from({ length: windowPeriodTopicNums }, (v, k) => k + 1);
    addTask({
      topicId: windowPeriodTopicId,
      postNums,
      csrfToken,
      maxReadPosts: settings.singlePostsReading,
      actionType: '无限月读',
    });
  };

  /**
   * 阅读 topic
   *
   * @param topicData
   */
  const readTopic = async (topicData: TopicData) => {
    let csrfToken;
    if (csrfTokenRef.current) {
      csrfToken = csrfTokenRef.current;
    } else {
      csrfToken = await getCsrfToken(settings.getCsrfTokenFromHtml);
    }
    const highestPostNumber = topicData.highest_post_number;
    let lastReadPostNumber;
    // TODO: 需要修复修改后不生效的 bug
    console.log(settings.readAllPostsInTopic);
    if (settings.readAllPostsInTopic) {
      lastReadPostNumber = 1;
    } else {
      lastReadPostNumber = topicData.last_read_post_number || 1;
    }
    const postNums = Array.from(
      { length: highestPostNumber - lastReadPostNumber + 1 },
      (v, k) => k + lastReadPostNumber,
    );
    addTask({
      topicId: topicData.id,
      postNums,
      csrfToken,
      maxReadPosts: settings.singlePostsReading,
      actionType: '主动出击',
    });
  };

  /**
   * 拦截 topic url 逻辑
   *
   * @param request XMLHttpRequest 对象
   */
  const handleProcessTopic = (request: XMLHttpRequest) => {
    try {
      const topicData = JSON.parse(request.response);
      readTopic(topicData);
    } catch (err) {
      console.error(err);
      addLog('error', '未知错误，请查看控制台！');
    }
  };

  const interceptXHR = (customOpen: VoidFunction, customSend: VoidFunction) => {

  }

  const enableXMLHttpRequestHooks = () => {
    // @ts-ignore
    XMLHttpRequest.prototype.open = function (method, url, async, username, password) {
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle,react/no-this-in-sfc
      this._custom_storage = { method, url };
      // @ts-ignore
      // eslint-disable-next-line prefer-rest-params
      return nativeXHROpen.current.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (data) {
      // @ts-ignore
      // eslint-disable-next-line react/no-this-in-sfc
      this.addEventListener(
        'readystatechange',
        function () {
          // @ts-ignore
          // eslint-disable-next-line react/no-this-in-sfc
          if (this.readyState === 4) {
            // @ts-ignore
            // eslint-disable-next-line no-underscore-dangle,react/no-this-in-sfc
            if (isTopicUrl(this._custom_storage.url) && this._custom_storage.method === 'GET') {
              // @ts-ignore
              handleProcessTopic(this);
            }
          }
        },
        false,
      );
      // @ts-ignore
      // eslint-disable-next-line prefer-rest-params
      return nativeXHRSend.current.apply(this, arguments);
    };
  };

  const disableXMLHttpRequestHooks = () => {
    XMLHttpRequest.prototype.open = nativeXHROpen.current;
    XMLHttpRequest.prototype.send = nativeXHRSend.current;
    // console.log(XMLHttpRequest.prototype.open);
    // console.log(XMLHttpRequest.prototype.send);
  };

  const init = () => {
    // nativeXMLHttpRequestOpen.current = ensureNativeMethods(XMLHttpRequest.prototype.open);
    // nativeXMLHttpRequestSend.current = ensureNativeMethods(XMLHttpRequest.prototype.send);
    // console.log(nativeXMLHttpRequestOpen.current);
    // console.log(nativeXMLHttpRequestSend.current);
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const start = () => {
      enableXMLHttpRequestHooks();
      addLog('success', '助手已开启');
      addLog('success', '未读拦截已开启');
      addInitTask();
    };

    const stop = () => {
      disableXMLHttpRequestHooks();
      if (taskQueue.length > 1) {
        addLog('warning', '正在删除多余任务，仅保留最后进行的任务');
        setTaskQueue(prevState => prevState.slice(0, 1));
      }
      addLog('error', '助手已停止');
    };

    if (enableBrowseAssist) {
      start();
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBrowseAssist]);

  useEffect(() => {
    const readingOnce = async () => {
      await randSleep(1000, 1000);
      const isProcessing = taskQueue.some(value => value.status === 'processing');
      if (enableBrowseAssist && !isProcessing) {
        processQueue();
      }
    };

    const readingInfinite = async () => {
      await randSleep(10000, 15000);
      // TODO: 无法判断0
      if (enableBrowseAssist && taskQueue.length === 0) {
        addInitTask();
      }
    };

    if (taskQueue.length >= 1) {
      readingOnce();
    }

    if (taskQueue.length === 0) {
      readingInfinite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableBrowseAssist, taskQueue, taskQueue.length]);

  return (
    <div>
      <IconButton
        id={styles.browseButton}
        title="疯狂阅读"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
        onClick={settings.onToggleDialog}
      />
      <div
        id={styles.browseContainer}
        className={`d-modal__container ${settings.openDialog ? 'open' : ''}`}
        style={{ width: settings.uiWidth }}
      >
        <div className="d-modal__header">
          <h3 id="discourse-modal-title" className="d-modal__title-text" style={{ flex: 1 }}>
            Task Queue & Logs
          </h3>
          <FuncIconButton
            title={`${enableBrowseAssist ? '停止' : '开始'}`}
            aria-label={`${enableBrowseAssist ? '停止' : '开始'}`}
            onClick={() => setEnableBrowseAssist(prevState => !prevState)}
            style={{ flex: 0 }}
            icon={enableBrowseAssist ? 'stop-circle' : 'play'}
          />
          <FuncIconButton
            title="设置"
            aria-label="设置"
            onClick={() => switchContent('settings')}
            style={{ flex: 0 }}
            icon="cog"
          />
          <FuncIconButton
            title="控制台"
            aria-label="控制台"
            onClick={() => switchContent('console')}
            style={{ flex: 0 }}
            icon="code"
          />
          <FuncIconButton title="关闭" aria-label="关闭" onClick={settings.onCloseDialog} style={{ flex: 0 }} icon="times" />
        </div>
        <div className="d-modal__body" style={{ padding: '0.5rem' }}>
          <div className={`${styles.dialogBodyName} ${switchContentCSS('console')}`}>
            <ConsoleSection taskQueue={taskQueue} logs={logs} statsData={statsData} onClearLogs={clearLogs} />
          </div>
          <div className={`${styles.dialogBodyName} ${switchContentCSS('settings')}`}>
            <SettingsSection />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
