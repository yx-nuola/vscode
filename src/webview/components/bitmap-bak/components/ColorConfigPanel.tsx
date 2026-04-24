import React from 'react';
import { Button, InputNumber, ColorPicker, Typography, Popconfirm } from '@arco-design/web-react';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import { ColorRange, ColorConfig } from '../types';

const { Text } = Typography;

interface ColorConfigPanelProps {
	config: ColorConfig;
	onChange: (config: ColorConfig) => void;
}

export const ColorConfigPanel: React.FC<ColorConfigPanelProps> = ({ config, onChange }) => {
	const handleAddRange = () => {
		const lastRange = config.ranges[config.ranges.length - 1];
		const newRange: ColorRange = {
			min: lastRange ? lastRange.max : 0,
			max: lastRange ? lastRange.max + 5 : 5,
			color: '#888888',
			label: '',
		};
		onChange({
			...config,
			ranges: [...config.ranges, newRange],
		});
	};

	const handleRemoveRange = (index: number) => {
		const newRanges = config.ranges.filter((_, i) => i !== index);
		onChange({
			...config,
			ranges: newRanges,
		});
	};

	const handleRangeChange = (index: number, field: keyof ColorRange, value: number | string) => {
		const newRanges = [...config.ranges];
		newRanges[index] = {
			...newRanges[index],
			[field]: value,
		};
		onChange({
			...config,
			ranges: newRanges,
		});
	};

	const handleColorChange = (index: number, value: string | unknown) => {
		const colorStr = typeof value === 'string' ? value : String(value);
		handleRangeChange(index, 'color', colorStr);
	};

	const handleFallbackColorChange = (value: string | unknown) => {
		const colorStr = typeof value === 'string' ? value : String(value);
		onChange({
			...config,
			fallbackColor: colorStr,
		});
	};

	return (
		<div className="color-config-panel">
			<div className="color-config-header">
				<Text bold>颜色区间配置</Text>
				<Button
					size="small"
					type="primary"
					icon={<IconPlus />}
					onClick={handleAddRange}
				>
					添加区间
				</Button>
			</div>

			<div className="color-ranges">
				{config.ranges.map((range, index) => (
					<div key={index} className="color-range-item">
						<div className="color-range-index">{index + 1}</div>
						<InputNumber
							size="small"
							value={range.min}
							onChange={(value) => handleRangeChange(index, 'min', value ?? 0)}
							placeholder="最小值"
							style={{ width: 80 }}
						/>
						<Text>-</Text>
						<InputNumber
							size="small"
							value={range.max}
							onChange={(value) => handleRangeChange(index, 'max', value ?? 0)}
							placeholder="最大值"
							style={{ width: 80 }}
						/>
						<Text>mA</Text>
						<ColorPicker
							value={range.color}
							onChange={(color) => handleColorChange(index, color)}
							showText={false}
						/>
						<InputNumber
							size="small"
							value={range.label ? parseFloat(range.label) : undefined}
							onChange={(value) => handleRangeChange(index, 'label', `${value ?? ''}mA`)}
							placeholder="标签"
							style={{ width: 80 }}
						/>
						<Popconfirm
							title="确定删除此颜色区间？"
							onConfirm={() => handleRemoveRange(index)}
						>
							<Button
								size="small"
								status="danger"
								icon={<IconDelete />}
							/>
						</Popconfirm>
					</div>
				))}
			</div>

			<div className="fallback-color">
				<Text>超出范围颜色：</Text>
				<ColorPicker
					value={config.fallbackColor}
					onChange={handleFallbackColorChange}
					showText
				/>
			</div>
		</div>
	);
};
