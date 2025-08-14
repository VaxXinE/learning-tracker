// src/lib/utils.ts

export function cn(...classes: Array<string | undefined | null | boolean>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Debounce: tunda eksekusi hingga tidak ada pemanggilan baru dalam 'wait' ms.
 * Menghindari 'any' dan NodeJS.Timeout.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle: jalankan paling sering setiap 'limit' ms.
 * Panggilan trailing terakhir dieksekusi setelah jeda.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let trailingArgs: Parameters<T> | null = null;
  let trailingTimer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      trailingTimer = setTimeout(() => {
        inThrottle = false;
        if (trailingArgs) {
          const nextArgs = trailingArgs;
          trailingArgs = null;
          func(...nextArgs);
          // set lagi throttle window untuk trailing call
          inThrottle = true;
          trailingTimer = setTimeout(() => {
            inThrottle = false;
            trailingArgs = null;
          }, limit);
        }
      }, limit);
    } else {
      trailingArgs = args;
      // tidak perlu reset timer; call akan dieksekusi saat window selesai
    }
  };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = Number((bytes / Math.pow(k, i)).toFixed(dm));
  const unit = sizes[Math.min(i, sizes.length - 1)];

  return `${value} ${unit}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}
