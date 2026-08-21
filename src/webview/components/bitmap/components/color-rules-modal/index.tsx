import { useEffect, useState } from 'react';
import { Button, ColorPicker, Input, InputNumber, Modal, Typography } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import {
  createAdditionalColorRule,
  DEFAULT_COLOR_RULE_COUNT,
  MAX_COLOR_RULE_COUNT,
  validateColorRules,
} from './color-rules';
import type { ColorRule } from '../../types';

interface ColorRulesModalProps {
  open: boolean;
  rules: ColorRule[];
  onCancel: () => void;
  onSave: (rules: ColorRule[]) => void;
}

export function ColorRulesModal({ open, rules, onCancel, onSave }: ColorRulesModalProps) {
  const [draftRules, setDraftRules] = useState<ColorRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftRules(rules.map((rule) => ({ ...rule })));
      setError(null);
    }
  }, [open, rules]);

  const updateRule = <Key extends keyof ColorRule>(
    index: number,
    key: Key,
    value: ColorRule[Key]
  ) => {
    setDraftRules((currentRules) =>
      currentRules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [key]: value } : rule
      )
    );
    setError(null);
  };

  const handleAdd = () => {
    setDraftRules((currentRules: any) => {
      if (currentRules.length >= MAX_COLOR_RULE_COUNT) {
        return currentRules;
      }
      console.log(currentRules);

      return [...currentRules, createAdditionalColorRule(currentRules)];
    });
    setError(null);
  };

  const handleDelete = (index: number) => {
    if (index < DEFAULT_COLOR_RULE_COUNT) {
      return;
    }

    setDraftRules((currentRules) => currentRules.filter((_, ruleIndex) => ruleIndex !== index));
    setError(null);
  };

  const handleSave = () => {
    const validationError = validateColorRules(draftRules);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(draftRules.map((rule) => ({ ...rule, title: rule.title.trim() })));
  };

  return (
    <Modal
      title="Color Rules"
      visible={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText="save"
      cancelText="cancel"
      unmountOnExit
      maskClosable={false}
      closable={false}
      style={{ width: 600 }}
    >
      <div style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(100px, 1fr) 80px 80px 100px 80px 50px',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px',
            color: '#86909c',
            fontSize: '12px',
          }}
        >
          <span>title</span>
          <span>min</span>
          <span>max</span>
          <span>color</span>
          <span>value</span>
          <span></span>
        </div>

        {draftRules.map((rule, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(100px, 1fr) 80px 80px 100px 80px 50px',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <Input
              aria-label={`规则 ${index + 1} 标题`}
              value={rule.title}
              maxLength={40}
              size="small"
              onChange={(value) => updateRule(index, 'title', value)}
              width="100px"
            />
            <InputNumber
              aria-label={`规则 ${index + 1} 最小值`}
              value={rule.min}
              size="small"
              hideControl
              onChange={(value) => updateRule(index, 'min', value)}
            />
            <InputNumber
              aria-label={`规则 ${index + 1} 最大值`}
              value={rule.max}
              size="small"
              hideControl
              onChange={(value) => updateRule(index, 'max', value)}
            />
            <ColorPicker
              value={rule.color}
              size="small"
              format="hex"
              mode="single"
              showText
              disabledAlpha
              onChange={(value) => {
                if (typeof value === 'string') {
                  updateRule(index, 'color', value);
                }
              }}
              style={{ width: '100%' }}
            />
            <InputNumber
              aria-label={`规则 ${index + 1} value`}
              value={rule.value}
              size="small"
              hideControl
              onChange={(value) => updateRule(index, 'value', value)}
            />
            <Button
              aria-label={`删除规则 ${index + 1}`}
              title={index < DEFAULT_COLOR_RULE_COUNT ? '默认规则不可删除' : '删除规则'}
              type="text"
              status="danger"
              size="small"
              icon={<IconDelete />}
              disabled={index < DEFAULT_COLOR_RULE_COUNT}
              onClick={() => handleDelete(index)}
            />
          </div>
        ))}

        <Button
          type="dashed"
          long
          size="small"
          disabled={draftRules.length >= MAX_COLOR_RULE_COUNT}
          onClick={handleAdd}
        >
          + add rule
        </Button>

        {error && (
          <Typography.Text
            type="error"
            role="alert"
            style={{ display: 'block', marginTop: '10px', fontSize: '12px' }}
          >
            {error}
          </Typography.Text>
        )}
      </div>
    </Modal>
  );
}
