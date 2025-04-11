import styles from '@assets/scss/vars.module.scss';
import FuncIconButton from '@components/inputs/button/FuncIconButton';
import IconButton from '@components/inputs/button/IconButton';
import { useSettingsContext } from '@hooks/useSettingsContext';
import ConsoleSection from '@sections/ConsoleSection';
import type { LogItemType, StatsDataType, TaskItemType } from '@sections/ConsoleSection/types';
import SettingsSection from '@sections/SettingsSection';
import { getCsrfToken } from '@server/core';
import { getTopicList, getTopicTrack, TopicData } from '@server/topic';
import { ensureNativeMethods, genRandId, isTimingsUrl, isTopicUrl, randInt, randSleep } from '@utils/core';
import { dayjs } from '@utils/time';
import nativeDayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type ContentType = 'settings' | 'console';

function App() {
  const settings = useSettingsContext();

  // XMLHttpRequest 拦截
  const nativeXHROpen = useRef(XMLHttpRequest.prototype.open);
  const nativeXHRSend = useRef(XMLHttpRequest.prototype.send);

  // csrf token store
  const csrfTokenRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);

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
  const addLog = useCallback(
    (level: LogItemType['level'], message: LogItemType['message']) => {
      setLogs(prevState => {
        let nextState;
        if (prevState.length >= settings.maxLogLineNum) {
          nextState = prevState.slice(1);
        } else {
          nextState = prevState;
        }
        return [...nextState, { logId: genRandId(), time: dayjs().format('YYYY-MM-DD HH:mm:ss'), level, message }];
      });
    },
    [settings.maxLogLineNum],
  );

  /**
   * 清理日志
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', '日志已清除');
  }, [addLog]);

  const changeTaskStatus = (
    currentTask: TaskItemType,
    prevState: TaskItemType[],
    newStatus: TaskItemType['status'],
  ) => {
    const nextState = prevState;
    const currentItemIndex = prevState.findIndex(value => {
      return currentTask.topicId === value.topicId;
    });
    if (currentItemIndex !== -1) {
      nextState[currentItemIndex].status = newStatus;
    }
    return nextState;
  };

  /**
   * 分批处理帖子编号
   */
  const genReadingPostBatches = (postNums: number[], batchSize: number): number[][] => {
    const batches: number[][] = [];
    for (let i = 0; i < postNums.length; i += batchSize) {
      batches.push(postNums.slice(i, i + batchSize));
    }
    return batches;
  };

  /**
   * 构建请求体
   */
  const genReadingRequestBody = (topicId: string | number, postNums: number[]): string => {
    const readTime = randInt(60000, 61000);
    const postParams = postNums.filter(num => num !== 0).map(num => `timings%5B${num}%5D=${readTime}`);

    return [...postParams, `topic_time=${readTime}`, `topic_id=${topicId}`].join('&');
  };

  const handleReadingPosts = useCallback(
    async (task: TaskItemType) => {
      const { topicId, postNums, csrfToken, maxReadPosts, actionType, status } = task;
      const trackTopicId = await getTopicTrack(topicId, csrfToken);

      // 分批处理帖子
      const readingPostBatches = genReadingPostBatches(postNums, maxReadPosts);

      // eslint-disable-next-line no-restricted-syntax
      for (const readingPostBatch of readingPostBatches) {
        let retryCount = 0;
        let success = false;

        while (!success && retryCount <= settings.maxRetryTimes) {
          try {
            const readingRequestBody = genReadingRequestBody(topicId, readingPostBatch);
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch('https://linux.do/topics/timings', {
              method: 'POST',
              headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'discourse-background': 'true',
                'discourse-logged-in': 'true',
                'discourse-present': 'true',
                'x-csrf-token': csrfToken,
                'x-requested-with': 'XMLHttpRequest',
                'x-silence-logger': 'true',
              },
              referrer: `https://linux.do/t/topic/${topicId}/1`,
              body: readingRequestBody,
              mode: 'cors',
              credentials: 'include',
            });

            if (response.ok) {
              addLog(
                'success',
                `已完成话题[${topicId}]第${readingPostBatch[0]}至${readingPostBatch[readingPostBatch.length - 1]}层阅读`,
              );
              success = true;
              retryCount = 0;
              // eslint-disable-next-line no-await-in-loop
              await randSleep(1000, 2000); // 成功后的冷却时间
            } else if (response.status >= 400 && response.status < 600) {
              retryCount += 1;
              addLog(
                'warning',
                `阅读话题[${topicId}]出现错误(${response.status})！正在重试(${retryCount}/${settings.maxRetryTimes})……`,
              );
              setTaskQueue(prevState => {
                return changeTaskStatus(task, prevState, 'retrying');
              });
              // eslint-disable-next-line no-await-in-loop
              await randSleep(3000, 5000);
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (error: any) {
            console.error(error);
            retryCount += 1;
            addLog('error', `阅读话题[${topicId}]发生未知错误: ${error.message}`);
            // eslint-disable-next-line no-await-in-loop
            await randSleep(3000, 5000);
          }
        }

        // 如果当前批次处理失败，直接返回错误
        if (!success) {
          return { topicId, error: true, detail: '超过最大重试次数' };
        }
      }

      return { topicId, error: false, detail: '已完成阅读' };
    },
    [addLog, settings.maxRetryTimes],
  );

  /**
   * 执行队列任务
   */
  const processQueue = useCallback(async () => {
    if (taskQueue.length > 0) {
      const task = taskQueue[0];
      addLog('info', `正在阅读：${task.topicId}`);

      setTaskQueue(prevState => {
        processingRef.current = true;
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
        const nextState = prevState.filter(t => t.taskId !== task.taskId);
        processingRef.current = false;
        return nextState;
      });
    }
  }, [addLog, handleReadingPosts, lastTaskTime, taskQueue]);

  const addTask = useCallback(
    ({ topicId, postNums, csrfToken, maxReadPosts, actionType }: Omit<TaskItemType, 'taskId' | 'status'>) => {
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
    },
    [addLog, enableBrowseAssist],
  );

  const addInitTask = useCallback(async () => {
    let csrfToken;
    if (csrfTokenRef.current) {
      csrfToken = csrfTokenRef.current;
    } else {
      csrfToken = await getCsrfToken(settings.getCsrfTokenFromHtml);
    }

    // const unseenTopics = await getTopicList("https://linux.do/unseen.json?order=created&ascending=true", csrfToken);
    // const unreadTopics = await getTopicList("https://linux.do/unread.json?order=created&ascending=true", csrfToken);
    // const newTopics = await getTopicList("https://linux.do/new.json?order=created&ascending=true", csrfToken);

    let unseenTopics = await getTopicList('https://linux.do/unseen.json?order=created&ascending=true', csrfToken);
    if (unseenTopics.length === 0) {
      unseenTopics = await getTopicList('https://linux.do/unread.json?order=created&ascending=true', csrfToken);
    }
    if (unseenTopics.length === 0) {
      unseenTopics = await getTopicList('https://linux.do/new.json?order=created&ascending=true', csrfToken);
    }
    if (unseenTopics.length === 0) {
      const postNums = Array.from({ length: 500 }, (v, k) => k + 1);
      addTask({
        topicId: 111891,
        postNums,
        csrfToken,
        maxReadPosts: settings.singlePostsReading,
        actionType: '无限月读',
      });
    } else {
      unseenTopics.forEach(unseenTopic => {
        const highestPostNumber = unseenTopic.highest_post_number;
        let lastReadPostNumber;
        if (settings.readAllPostsInTopic) {
          lastReadPostNumber = 1;
        } else {
          lastReadPostNumber = unseenTopic.last_read_post_number || 1;
        }
        const postNums = Array.from(
          { length: highestPostNumber - lastReadPostNumber + 1 },
          (v, k) => k + lastReadPostNumber,
        );
        addTask({
          topicId: unseenTopic.id,
          postNums,
          csrfToken,
          maxReadPosts: settings.singlePostsReading,
          actionType: '清理未读',
        });
      });
    }
    // const windowPeriodTopicSelected = settings.windowPeriodTopics[randInt(0, settings.windowPeriodTopics.length - 1)];
    // const [windowPeriodTopicId, windowPeriodTopicNums] = windowPeriodTopicSelected;
    // const postNums = Array.from({ length: windowPeriodTopicNums }, (v, k) => k + 1);
    // addTask({
    //   topicId: windowPeriodTopicId,
    //   postNums,
    //   csrfToken,
    //   maxReadPosts: settings.singlePostsReading,
    //   actionType: '无限月读',
    // });
  }, [addTask, settings.getCsrfTokenFromHtml, settings.readAllPostsInTopic, settings.singlePostsReading]);

  /**
   * 阅读 topic
   *
   * @param topicData
   */
  const readTopic = useCallback(
    async (topicData: TopicData) => {
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
    },
    [addTask, settings.getCsrfTokenFromHtml, settings.readAllPostsInTopic, settings.singlePostsReading],
  );

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

  const interceptXHR = (customOpen: VoidFunction, customSend: VoidFunction) => {};

  const enableXMLHttpRequestHooks = () => {
    // @ts-ignore
    XMLHttpRequest.prototype.open = function (method, url, async, username, password) {
      if (typeof url === 'string' && isTimingsUrl(url)) {
        return;
      }
      if (url instanceof URL && isTimingsUrl(url.pathname)) {
        return;
      }
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle,react/no-this-in-sfc
      this._custom_storage = { method, url };
      // @ts-ignore
      // eslint-disable-next-line prefer-rest-params,consistent-return
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

  useEffect(() => {
    const start = () => {
      enableXMLHttpRequestHooks();
      addLog('success', '助手已开启');
      addLog('success', '未读拦截已开启');
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
    const processNextTask = async () => {
      if (enableBrowseAssist && taskQueue.length > 0 && !processingRef.current) {
        await randSleep(3000, 5000);
        if (enableBrowseAssist && taskQueue.length > 0 && !processingRef.current) {
          await processQueue();
        }
      }
    };

    if (enableBrowseAssist) {
      processNextTask();
    }
  }, [enableBrowseAssist, processQueue, taskQueue, taskQueue.length]);

  useEffect(() => {
    const readingInfinite = async () => {
      if (enableBrowseAssist && taskQueue.length === 0 && !processingRef.current) {
        await randSleep(10000, 15000);
        if (enableBrowseAssist && taskQueue.length === 0 && !processingRef.current) {
          await addInitTask();
        }
      }
    };

    if (enableBrowseAssist) {
      readingInfinite();
    }
  }, [addInitTask, enableBrowseAssist, taskQueue, taskQueue.length]);

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
            icon={enableBrowseAssist ? 'circle-stop' : 'play'}
          />
          <FuncIconButton
            title="设置"
            aria-label="设置"
            onClick={() => switchContent('settings')}
            style={{ flex: 0 }}
            icon="gear"
          />
          <FuncIconButton
            title="控制台"
            aria-label="控制台"
            onClick={() => switchContent('console')}
            style={{ flex: 0 }}
            icon="code"
          />
          <FuncIconButton
            title="关闭"
            aria-label="关闭"
            onClick={settings.onCloseDialog}
            style={{ flex: 0 }}
            icon="xmark"
          />
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
