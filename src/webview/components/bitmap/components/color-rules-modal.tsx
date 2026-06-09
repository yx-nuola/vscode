import { useEffect, useState } from 'react';
import { IconDelete } from '@arco-design/web-react/icon';
import {
  createAdditionalColorRule,
  DEFAULT_COLOR_RULE_COUNT,
  MAX_COLOR_RULE_COUNT,
  validateColorRules,
} from '../color-rules';
import type { ColorRule } from '../types';

interface ColorRulesModalProps {
  open: boolean;
  rules: ColorRule[];
  onCancel: () => void;
  onSave: (rules: ColorRule[]) => void;
}

const inputStyle = {
  height: '30px',
  padding: '4px 8px',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  fontSize: '12px',
} as const;

export function ColorRulesModal({
  open,
  rules,
  onCancel,
  onSave,
}: ColorRulesModalProps) {
  const [draftRules, setDraftRules] = useState<ColorRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftRules(rules.map((rule) => ({ ...rule })));
      setError(null);
    }
  }, [open, rules]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

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
    setDraftRules((currentRules) => {
      if (currentRules.length >= MAX_COLOR_RULE_COUNT) {
        return currentRules;
      }

      return [...currentRules, createAdditionalColorRule(currentRules)];
    });
    setError(null);
  };

  const handleDelete = (index: number) => {
    if (index < DEFAULT_COLOR_RULE_COUNT) {
      return;
    }

    setDraftRules((currentRules) =>
      currentRules.filter((_, ruleIndex) => ruleIndex !== index)
    );
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
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-rules-modal-title"
        style={{
          width: 'min(760px, 100%)',
          maxHeight: 'min(720px, calc(100vh - 48px))',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e6eb',
          }}
        >
          <div>
            <h3 id="color-rules-modal-title" style={{ margin: 0, fontSize: '16px' }}>
              Color Rules
            </h3>
            <div style={{ marginTop: '4px', color: '#86909c', fontSize: '12px' }}>
              默认三项不可删除，最多支持 {MAX_COLOR_RULE_COUNT} 项
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={onCancel}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#4e5969',
              cursor: 'pointer',
              fontSize: '22px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '32px minmax(120px, 1fr) 100px 100px 150px 64px',
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
            <span>operation</span>
          </div>

          {draftRules.map((rule, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px minmax(120px, 1fr) 100px 100px 150px 64px',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <input
                aria-label={`规则 ${index + 1} 标题`}
                value={rule.title}
                maxLength={40}
                onChange={(event) => updateRule(index, 'title', event.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
              <input
                aria-label={`规则 ${index + 1} 最小值`}
                type="number"
                value={rule.min}
                onChange={(event) => updateRule(index, 'min', event.target.valueAsNumber)}
                style={{ ...inputStyle, width: '100%' }}
              />
              <input
                aria-label={`规则 ${index + 1} 最大值`}
                type="number"
                value={rule.max}
                onChange={(event) => updateRule(index, 'max', event.target.valueAsNumber)}
                style={{ ...inputStyle, width: '100%' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  aria-label={`规则 ${index + 1} 颜色选择器`}
                  type="color"
                  value={rule.color}
                  onChange={(event) => updateRule(index, 'color', event.target.value)}
                  style={{
                    width: '32px',
                    height: '30px',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
                <input
                  aria-label={`规则 ${index + 1} 色值`}
                  value={rule.color}
                  maxLength={7}
                  onChange={(event) => updateRule(index, 'color', event.target.value)}
                  style={{ ...inputStyle, width: '104px' }}
                />
              </div>
              <button
                type="button"
                aria-label={`删除规则 ${index + 1}`}
                title={index < DEFAULT_COLOR_RULE_COUNT ? '默认规则不可删除' : '删除规则'}
                disabled={index < DEFAULT_COLOR_RULE_COUNT}
                onClick={() => handleDelete(index)}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  // border: '1px solid',
                  // borderColor: index < DEFAULT_COLOR_RULE_COUNT ? '#e5e6eb' : '#ffccc7',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  color: index < DEFAULT_COLOR_RULE_COUNT ? '#c9cdd4' : '#f53f3f',
                  cursor: index < DEFAULT_COLOR_RULE_COUNT ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                <IconDelete />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={draftRules.length >= MAX_COLOR_RULE_COUNT}
            onClick={handleAdd}
            style={{
              width: '100%',
              padding: '7px',
              border: '1px dashed #c9cdd4',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: draftRules.length >= MAX_COLOR_RULE_COUNT ? '#c9cdd4' : '#165dff',
              cursor: draftRules.length >= MAX_COLOR_RULE_COUNT ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            + add rule
          </button>

          {error && (
            <div role="alert" style={{ marginTop: '10px', color: '#f53f3f', fontSize: '12px' }}>
              {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '12px 20px',
            borderTop: '1px solid #e5e6eb',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '6px 14px',
              border: '1px solid #165dff',
              borderRadius: '4px',
              backgroundColor: '#165dff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            save
          </button>
        </div>
      </div>
    </div>
  );
}
