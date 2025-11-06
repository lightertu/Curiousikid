import { format, formatDistanceToNow } from 'date-fns';

export function formatTimestamp(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}
