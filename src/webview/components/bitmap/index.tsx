import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Card, Button, Switch, Progress, Message, Space, Typography, Spin } from '@arco-design/web-react';
import { IconUpload } from '@arco-design/web-react/icon';
import { BitmapProvider, useBitmap } from './context';
import { BitmapCanvas } from './components/BitmapCanvas';
import { BitmapDataTable } from './components/BitmapDataTable';
import { CellInfoPopup } from './components/CellInfoPopup';
import { ColorConfigPanel } from './components/ColorConfigPanel';
import { parseFile, validateFile, mergeBitmapData } from './parsers';
import { CellData } from './types';

const { Title, Text } = Typography;

const BitmapVisualizationInner: React.FC = () => {
	const { state, dispatch } = useBitmap();
	const [showPopup, setShowPopup] = useState(false);
	const [selectedCellData, setSelectedCellData] = useState<CellData | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleCellClick = useCallback((bl: number, wl: number) => {
		if (!state.data) return;

		const cell = state.data.cells.find(c => c.bl === bl && c.wl === wl);
		if (cell) {
			setSelectedCellData(cell);
			setShowPopup(true);
		}
	}, [state.data]);

	const handleFileUpload = useCallback(async (file: File) => {
		const validation = validateFile(file);
		if (!validation.valid) {
			Message.error(validation.error || '文件验证失败');
			return;
		}

		if (validation.warning) {
			Message.warning(validation.warning);
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			const result = await parseFile(file, {
				onProgress: (progress) => setUploadProgress(progress),
			});

			if (!result.success || !result.data) {
				Message.error(result.error || '解析失败');
				return;
			}

			if (state.dataMode === 'merge' && state.data) {
				const mergedData = mergeBitmapData(state.data, result.data);
				dispatch({ type: 'SET_DATA', payload: mergedData });
				Message.success(`数据已合并，共 ${mergedData.cells.length} 个单元格`);
			} else {
				dispatch({ type: 'SET_DATA', payload: result.data });
				Message.success(`加载成功，共 ${result.data.cells.length} 个单元格`);
			}
		} catch (error) {
			Message.error('文件解析失败');
			console.error(error);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	}, [state.dataMode, state.data, dispatch]);

	const handleDataModeChange = useCallback((checked: boolean) => {
		dispatch({ type: 'SET_DATA_MODE', payload: checked ? 'merge' : 'overwrite' });
	}, [dispatch]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileUpload(files[0]);
		}
	}, [handleFileUpload]);

	const stats = useMemo(() => {
		if (!state.data) return null;

		const total = state.data.cells.length;
		const passCount = state.data.cells.filter(c => c.status === 'pass').length;
		const failCount = state.data.cells.filter(c => c.status === 'fail').length;

		return { total, passCount, failCount };
	}, [state.data]);

	return (
		<div className="bitmap-visualization">
			<div className="bitmap-header">
				<Title heading={5}>RRAM 测试结果可视化</Title>
				<Space>
					<Text>合并模式</Text>
					<Switch
						checked={state.dataMode === 'merge'}
						onChange={handleDataModeChange}
					/>
				</Space>
			</div>

			<div className="bitmap-toolbar">
				<input
					ref={fileInputRef}
					type="file"
					accept=".json,.txt,.csv,.log,.dat,.stdf,.std"
					style={{ display: 'none' }}
					onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
				/>
				<Button
					type="primary"
					icon={<IconUpload />}
					onClick={() => fileInputRef.current?.click()}
					loading={isUploading}
				>
					上传文件
				</Button>
				{stats && (
					<Space>
						<Text type="secondary">总计: {stats.total}</Text>
						<Text type="success">Pass: {stats.passCount}</Text>
						<Text type="error">Fail: {stats.failCount}</Text>
					</Space>
				)}
			</div>

			{isUploading && (
				<Progress
					percent={uploadProgress}
					style={{ margin: '8px 0' }}
				/>
			)}

			<div className="bitmap-content">
				<div
					className="bitmap-canvas-wrapper"
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					{isUploading && <Spin tip="解析中..." />}
					{!isUploading && <BitmapCanvas onCellClick={handleCellClick} />}
				</div>

				<div className="bitmap-sidebar">
					<Card title="颜色配置" size="small" style={{ marginBottom: 8 }}>
						<ColorConfigPanel
							config={state.colorConfig}
							onChange={(config) => dispatch({ type: 'SET_COLOR_CONFIG', payload: config })}
						/>
					</Card>

					<Card title="数据表格" size="small">
						<BitmapDataTable />
					</Card>
				</div>
			</div>

			<CellInfoPopup
				visible={showPopup}
				cell={selectedCellData}
				onClose={() => setShowPopup(false)}
			/>
		</div>
	);
};

export const BitmapVisualization: React.FC = () => {
	return (
		<BitmapProvider>
			<BitmapVisualizationInner />
		</BitmapProvider>
	);
};
