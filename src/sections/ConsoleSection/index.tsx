import Chip from '@components/dataDisplay/chip/Chip';
import FuncIconButton from '@components/inputs/button/FuncIconButton';
import { useSettingsContext } from '@hooks/useSettingsContext';
import { LogItemType, StatsDataType, StatusLevelMappingType, TaskItemType } from '@sections/ConsoleSection/types';
import { formatDuration, formatDurationShort } from '@utils/time';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

type ConsoleSectionProps = {
  taskQueue: TaskItemType[];
  logs: LogItemType[];
  statsData: StatsDataType;
  onClearLogs: () => void;
};

const statusLevelMapping: StatusLevelMappingType = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  retrying: 'error',
  failed: 'error',
};

function ConsoleSection({ taskQueue, logs, statsData, onClearLogs, ...restProps }: ConsoleSectionProps) {
  const settings = useSettingsContext();

  const logContainerRef = useRef(null);
  const logContainerEndRef = useRef(null);
  // 是否需要自动滚动
  const [shouldLogContainerAutoScroll, setShouldLogContainerAutoScroll] = useState<boolean>(true);

  /**
   * 判断是否需要滑动日志容器
   */
  const handleLogContainerScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const isScrolledToBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
      setShouldLogContainerAutoScroll(isScrolledToBottom);
    }
  };

  /**
   * 日志容器滑动到最底下
   */
  const scrollLogContainerToBottom = useCallback(() => {
    if (logContainerEndRef.current) {
      requestAnimationFrame(() => {
        (logContainerEndRef.current as unknown as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (shouldLogContainerAutoScroll) {
      scrollLogContainerToBottom();
    }
  }, [logs, scrollLogContainerToBottom, shouldLogContainerAutoScroll]);

  return (
    <>
      <section id="task-queue-container" style={{ display: 'inline-block', marginBottom: '1rem', width: '100%' }}>
        <h4>Queue</h4>
        <ul style={{ overflowX: 'auto', height: settings.uiQueueHeight }}>
          <li
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              display: 'flex',
              marginBottom: '0.5rem',
            }}
          >
            <Chip label={`总任务数：${statsData.totalSuccess + statsData.totalFailed}`} color="primary" />
            <Chip label={`队列数：${taskQueue.length}`} color="info" />
            <Chip label={`成功数：${statsData.totalSuccess}`} color="success" />
            <Chip label={`失败数：${statsData.totalFailed}`} color="error" />
            <Chip
              label={`阅读时间：${formatDurationShort(statsData.totalReadingTime)}`}
              color="warning"
              title={`格式时间：${formatDuration(statsData.totalReadingTime)}`}
            />
          </li>
          {taskQueue.map((task, i) => {
            return (
              <li
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  display: 'flex',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: settings.uiQueueFontSize }}>{`[${task.actionType}] ${task.topicId}`}</span>
                <Chip label={task.status} color={statusLevelMapping[task.status]} />
              </li>
            );
          })}
        </ul>
      </section>
      <section id="log-container" style={{ display: 'inline-block', marginBottom: 0, width: '100%' }}>
        <div style={{ display: 'flex' }}>
          <h4 style={{ flex: 1 }}>Logs</h4>
          <FuncIconButton
            title="清除日志"
            aria-label="清除日志"
            onClick={onClearLogs}
            style={{ flex: 0 }}
            icon="far-trash-alt"
          />
        </div>
        <ul
          ref={logContainerRef}
          onScroll={handleLogContainerScroll}
          style={{ overflowX: 'auto', height: settings.uiLogHeight }}
        >
          {logs.map((log, i) => {
            return (
              <li
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  display: 'flex',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: settings.uiLogFontSize }}>{`${log.time} - ${log.message}`}</span>
                <Chip label={log.level} color={log.level} />
              </li>
            );
          })}
          <div ref={logContainerEndRef} />
        </ul>
      </section>
    </>
  );
}

export default ConsoleSection;
