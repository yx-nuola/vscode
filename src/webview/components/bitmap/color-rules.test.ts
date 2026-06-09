import { describe, expect, test } from 'vitest';
import {
  createAdditionalColorRule,
  createDefaultColorRules,
  MAX_COLOR_RULE_COUNT,
  validateColorRules,
} from './color-rules';

describe('color rules', () => {
  test('creates the three default rules', () => {
    const rules = createDefaultColorRules();

    expect(rules).toHaveLength(3);
    expect(rules.map((rule) => rule.title)).toEqual(['Low', 'Medium', 'High']);
  });

  test('creates an additional rule after the previous range', () => {
    const rules = createDefaultColorRules();
    const additionalRule = createAdditionalColorRule(rules);

    expect(additionalRule).toMatchObject({
      title: 'Rule 4',
      min: 100,
      max: 110,
    });
  });

  test('rejects invalid ranges and more than ten rules', () => {
    const invalidRangeRules = createDefaultColorRules();
    invalidRangeRules[0] = { ...invalidRangeRules[0], min: 6, max: 5 };

    expect(validateColorRules(invalidRangeRules)).toContain('最小值不能大于最大值');

    const tooManyRules = Array.from(
      { length: MAX_COLOR_RULE_COUNT + 1 },
      (_, index) => ({
        title: `Rule ${index + 1}`,
        min: index,
        max: index + 1,
        color: '#1890ff',
      })
    );

    expect(validateColorRules(tooManyRules)).toContain('最多支持');
  });
});
