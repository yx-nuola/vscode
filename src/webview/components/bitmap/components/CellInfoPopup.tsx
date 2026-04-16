import React from 'react';
import { Modal, Tabs, Tag } from '@arco-design/web-react';
import { CellData } from '../types';

const TabPane = Tabs.TabPane;

interface CellInfoPopupProps {
	visible: boolean;
	cell: CellData | null;
	onClose: () => void;
	position?: { x: number; y: number };
}

export const CellInfoPopup: React.FC<CellInfoPopupProps> = ({
	visible,
	cell,
	onClose,
	position,
}) => {
	if (!cell) return null;

	const modalStyle: React.CSSProperties = position
		? {
				position: 'fixed',
				left: Math.min(position.x, window.innerWidth - 400),
				top: Math.min(position.y, window.innerHeight - 300),
			}
		: {};

	return (
		<Modal
			visible={visible}
			onCancel={onClose}
			footer={null}
			title={`单元格信息 (BL: ${cell.bl}, WL: ${cell.wl})`}
			style={modalStyle}
			autoFocus={false}
			focusLock={false}
		>
			<Tabs defaultActiveTab="information">
				<TabPane key="information" title="Information">
					<div className="info-grid">
						<div className="info-row">
							<span className="info-label">Vset:</span>
							<span className="info-value">{cell.vset?.toFixed(3) ?? '-'} V</span>
						</div>
						<div className="info-row">
							<span className="info-label">Vreset:</span>
							<span className="info-value">{cell.vreset?.toFixed(3) ?? '-'} V</span>
						</div>
						<div className="info-row">
							<span className="info-label">Imeas:</span>
							<span className="info-value">{cell.imeas?.toFixed(3) ?? '-'} mA</span>
						</div>
						<div className="info-row">
							<span className="info-label">状态:</span>
							<span className="info-value">
								{cell.status ? (
									<Tag color={cell.status === 'pass' ? 'green' : 'red'}>
										{cell.status === 'pass' ? 'Pass' : 'Fail'}
									</Tag>
								) : '-'}
							</span>
						</div>
					</div>
				</TabPane>

				<TabPane key="address" title="Address">
					<div className="info-grid">
						<div className="info-row">
							<span className="info-label">BL (位线):</span>
							<span className="info-value">{cell.bl}</span>
						</div>
						<div className="info-row">
							<span className="info-label">WL (字线):</span>
							<span className="info-value">{cell.wl}</span>
						</div>
						<div className="info-row">
							<span className="info-label">行号:</span>
							<span className="info-value">{cell.bl}</span>
						</div>
						<div className="info-row">
							<span className="info-label">列号:</span>
							<span className="info-value">{cell.wl}</span>
						</div>
					</div>
				</TabPane>

				<TabPane key="logical" title="Logical">
					<div className="info-grid">
						<div className="info-row">
							<span className="info-label">逻辑地址:</span>
							<span className="info-value">({cell.bl}, {cell.wl})</span>
						</div>
						<div className="info-row">
							<span className="info-label">物理地址:</span>
							<span className="info-value">待实现</span>
						</div>
						<div className="info-row">
							<span className="info-label">块号:</span>
							<span className="info-value">-</span>
						</div>
					</div>
				</TabPane>
			</Tabs>
		</Modal>
	);
};
