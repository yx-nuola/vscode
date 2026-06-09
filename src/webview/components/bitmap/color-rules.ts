import type { ColorRule } from './types';

export const DEFAULT_COLOR_RULE_COUNT = 3;
export const MAX_COLOR_RULE_COUNT = 10;

const COLOR_PALETTE = [
  '#1890ff',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#faad14',
  '#52c41a',
  '#f5222d',
];

export function createDefaultColorRules(): ColorRule[] {
  return [
    { title: 'Low', min: 0, max: 5, color: '#ff9800' },
    { title: 'Medium', min: 5, max: 10, color: '#4caf50' },
    { title: 'High', min: 10, max: 100, color: '#ec4646' },
  ];
}

export function createAdditionalColorRule(rules: ColorRule[]): ColorRule {
  const previousMax = rules.at(-1)?.max ?? 0;

  return {
    title: `Rule ${rules.length + 1}`,
    min: previousMax,
    max: previousMax + 10,
    color: COLOR_PALETTE[(rules.length - DEFAULT_COLOR_RULE_COUNT) % COLOR_PALETTE.length],
  };
}

export function validateColorRules(rules: ColorRule[]): string | null {
  if (rules.length < DEFAULT_COLOR_RULE_COUNT) {
    return '默认的三个配置不能删除。';
  }

  if (rules.length > MAX_COLOR_RULE_COUNT) {
    return `颜色规则最多支持 ${MAX_COLOR_RULE_COUNT} 项。`;
  }

  for (const [index, rule] of rules.entries()) {
    if (!rule.title.trim()) {
      return `第 ${index + 1} 项的标题不能为空。`;
    }

    if (!Number.isFinite(rule.min) || !Number.isFinite(rule.max)) {
      return `第 ${index + 1} 项的区间必须是有效数字。`;
    }

    if (rule.min > rule.max) {
      return `第 ${index + 1} 项的最小值不能大于最大值。`;
    }

    if (!/^#[0-9a-f]{6}$/i.test(rule.color)) {
      return `第 ${index + 1} 项的颜色必须是六位十六进制色值。`;
    }
  }

  return null;
}
