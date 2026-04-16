/**
 * 滚动逻辑优化 - 最终版本(包含 requestAnimationFrame 清理)
 * 
 * 优化点:
 * 1. 使用 useMemo 创建防抖函数,避免频繁创建
 * 2. 使用 useRef 存储 logData 最新引用,避免闭包陷阱
 * 3. 正确清理 requestAnimationFrame,避免内存泄漏
 * 4. 保持两种模式正确行为:
 *    - 锁定模式: 自动滚动到底部
 *    - 非锁定模式: 保持锚点位置
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';
import { debounce } from 'lodash-es';

/**
 * 优化后的滚动 Hook
 */
const useOptimizedScroll = (
  logContainerRef: React.RefObject<VirtuosoHandle>,
  logData: any[],
  isLocked: boolean,
  anchorRef: React.MutableRefObject<{
    logId: string;
    relativePosition: number;
  } | null>,
  setIsLocked: (value: boolean) => void
) => {
  // ============================================
  // 1. 使用 ref 存储最新值
  // ============================================
  const isLockedRef = useRef(isLocked);
  const logDataRef = useRef(logData);
  const rafIdRef = useRef<number | null>(null); // 存储动画帧 ID

  // 保持 isLockedRef 同步
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // 保持 logDataRef 同步
  useEffect(() => {
    logDataRef.current = logData;
  }, [logData]);

  // ============================================
  // 2. 清理动画帧的辅助函数
  // ============================================
  const cancelPendingRAF = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // ============================================
  // 3. 创建防抖函数 - 只创建一次
  // ============================================
  const debouncedScroll = useMemo(
    () =>
      debounce(() => {
        // 先清理之前的动画帧,避免多个动画帧同时执行
        cancelPendingRAF();

        // 通过 ref 获取最新的 logData
        const currentLogData = logDataRef.current;

        if (isLockedRef.current) {
          // ===== 锁定模式: 自动滚动到底部 =====
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null; // 执行后清空 ID

            if (logContainerRef.current && currentLogData.length > 0) {
              logContainerRef.current.scrollToIndex({
                index: currentLogData.length - 1,
                behavior: 'auto',
                align: 'end',
              });
            }
          });
        } else {
          // ===== 非锁定模式: 保持锚点位置 =====
          if (anchorRef.current) {
            rafIdRef.current = requestAnimationFrame(() => {
              rafIdRef.current = null; // 执行后清空 ID

              // 安全检查
              if (!logContainerRef.current || currentLogData.length === 0) {
                return;
              }

              const { logId, relativePosition } = anchorRef.current!;

              // 查找锚点日志的新位置
              const newIndex = currentLogData.findIndex((log: any) =>
                log?.includes(logId)
              );

              if (newIndex !== -1) {
                // 锚点日志还在 > 滚动到它,保持相对位置
                logContainerRef.current.scrollToIndex({
                  index: newIndex,
                  align:
                    relativePosition < 0.3
                      ? 'start'
                      : relativePosition > 0.7
                        ? 'end'
                        : 'center',
                  behavior: 'auto',
                });
              } else {
                // 锚点日志已被删除 > 恢复自动滚动
                console.warn('锁定的日志已被删除,自动恢复滚动。');
                setIsLocked(true);
                logContainerRef.current.scrollToIndex({
                  index: currentLogData.length - 1,
                  align: 'end',
                  behavior: 'auto',
                });
              }
            });
          }
          // 如果没有锚点,不做任何操作(保持当前位置)
        }
      }, 100), // 防抖 100ms
    [] // 无依赖,只创建一次
  );

  // ============================================
  // 4. 触发滚动的 useEffect
  // ============================================
  useEffect(() => {
    if (!logContainerRef.current || logData.length === 0) {
      return;
    }

    // 调用防抖函数
    debouncedScroll();

    // 清理函数: 取消防抖
    return () => {
      debouncedScroll.cancel();
    };
  }, [logData, isLocked]); // 依赖 logData 和 isLocked 来触发滚动

  // ============================================
  // 5. 组件卸载时清理所有资源
  // ============================================
  useEffect(() => {
    return () => {
      debouncedScroll.cancel(); // 取消防抖
      cancelPendingRAF(); // 清理动画帧
    };
  }, []);
};

// ============================================
// 在 LogMonitoring 组件中使用
// ============================================

/**
 * const LogMonitoring = () => {
 *   const [logData, setLogData] = useState<any[]>([]);
 *   const [isLocked, setIsLocked] = useState<boolean>(true);
 *   const logContainerRef = useRef<VirtuosoHandle>(null);
 *   const anchorRef = useRef<{ logId: string; relativePosition: number } | null>(null);
 *
 *   // 使用优化后的滚动逻辑
 *   useOptimizedScroll(
 *     logContainerRef,
 *     logData,
 *     isLocked,
 *     anchorRef,
 *     setIsLocked
 *   );
 *
 *   // ... 其他逻辑
 * };
 */

// ============================================
// 为什么需要清理 requestAnimationFrame?
// ============================================

/**
 * 场景分析:
 *
 * 1. 防抖触发 (100ms)
 * 2. requestAnimationFrame 注册动画帧
 * 3. 在动画帧执行前,组件卸载
 *
 * 如果不清理:
 * - 回调函数仍会执行
 * - 访问已卸载的组件引用 (logContainerRef.current)
 * - 虽然有 null 检查,但仍有潜在风险
 * - 持有组件作用域的引用,可能阻止 GC 回收
 *
 * 清理的好处:
 * - ✅ 避免访问已卸载的组件
 * - ✅ 减少内存泄漏风险
 * - ✅ 符合 React 最佳实践
 * - ✅ 代码更健壮,避免潜在 bug
 *
 * 内存影响:
 * - rafIdRef.current 只是一个数字 (动画帧 ID)
 * - 大小约 8 bytes,完全可以忽略不计
 */

// ============================================
// 为什么不能用 logData.length 作为依赖?
// ============================================

/**
 * 当数据超过 20000 条时,执行"首删尾插":
 *
 * Before: [...19999条旧数据, 新数据1, 新数据2]
 *         长度 = 20002
 *
 * After:  [新数据1, 新数据2, ...其他20000条]
 *         长度 = 20000
 *
 * Next:   [新数据2, 新数据3, ...其他20000条]
 *         长度 = 20000 (长度没变!)
 *
 * 如果用 logData.length 作为依赖:
 * - 长度相同,依赖不会触发更新
 * - 用户期望看到新数据自动滚动到底部
 * - 但滚动不会触发,用户体验受损
 *
 * 正确做法:
 * - 依赖整个 logData 对象
 * - 每次数据变化都触发滚动逻辑
 */

export { useOptimizedScroll };
