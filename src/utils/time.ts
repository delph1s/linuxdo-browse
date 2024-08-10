import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export const formatDuration = (t: number) => {
  const diff = dayjs.duration(t);

  const years = diff.years();
  const days = diff.days();
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();
  const ms = diff.milliseconds();

  const result = [];

  if (years > 0) result.push(`${years}年`);
  if (days > 0) result.push(`${days}天`);
  if (hours > 0) result.push(`${hours}小时`);
  if (minutes > 0) result.push(`${minutes}分钟`);
  if (seconds > 0) result.push(`${seconds}秒`);
  if (ms > 0) result.push(`${ms}毫秒`);

  return result.join('');
};

export const formatDurationShort = (t: number) => {
  const diff = dayjs.duration(t);

  const years = diff.years();
  const days = diff.days();
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();
  const ms = diff.milliseconds();

  if (years > 0) return `${years}年`;
  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  if (seconds > 0) return `${seconds}秒`;
  if (ms > 0) return `${ms}毫秒`;

  return '0秒';
};

export { dayjs };
