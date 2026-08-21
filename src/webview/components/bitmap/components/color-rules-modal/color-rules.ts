import type { ColorRule } from '../../types';

export const DEFAULT_COLOR_RULE_COUNT = 3;
export const MAX_COLOR_RULE_COUNT = 10;

const COLOR_PALETTE = ['#1890ff', '#722ed1', '#13c2c2', '#eb2f96', '#faad14', '#52c41a', '#f5222d'];

export function createAdditionalColorRule(rules: ColorRule[]) {
  // const previousMax = rules.at(-1)?.max ?? 0;

  return {
    // title: `Rule ${rules.length + 1}`,
    // min: previousMax,
    // max: previousMax + 10,
    color: COLOR_PALETTE[(rules.length - DEFAULT_COLOR_RULE_COUNT) % COLOR_PALETTE.length],
  };
}

export function validateColorRules(rules: ColorRule[]): string | null {
  if (rules.length < DEFAULT_COLOR_RULE_COUNT) {
    return 'The default three configurations cannot be deleted';
  }

  if (rules.length > MAX_COLOR_RULE_COUNT) {
    return `The color rule supports up to ${MAX_COLOR_RULE_COUNT} items`;
  }

  for (const [index, rule] of rules.entries()) {
    console.log('---------validateColorRules', rule);
    if (!rule.title || !rule.title.trim()) {
      return `The title of item ${index + 1} cannot be empty`;
    }

    if (!Number.isFinite(rule.min) || !Number.isFinite(rule.max)) {
      return `The interval of the  ${index + 1} item must be a significant number`;
    }

    if (rule.min && rule.max && rule.min > rule.max) {
      return `The minimum value of item ${index + 1} cannot be greater than the maximum value`;
    }

    // if (!rule.min && !rule.max) {
    //   return `The minimum value of item ${index + 1} cannot be greater than the maximum value`;
    // }

    if (!/^#[0-9a-f]{6}$/i.test(rule.color)) {
      return `The color of item ${index + 1} must be a six digit hexadecimal color value`;
    }
  }

  return null;
}
