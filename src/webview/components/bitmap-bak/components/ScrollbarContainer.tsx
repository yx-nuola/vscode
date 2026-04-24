import React, { useRef, useEffect, useCallback } from 'react';

interface ScrollbarContainerProps {
	showHorizontal: boolean;
	showVertical: boolean;
	autoHide?: boolean;
	contentWidth: number;
	contentHeight: number;
	viewportWidth: number;
	viewportHeight: number;
	offsetX: number;
	offsetY: number;
	onScroll: (offsetX: number, offsetY: number) => void;
	children: React.ReactNode;
}

export const ScrollbarContainer: React.FC<ScrollbarContainerProps> = ({
	showHorizontal,
	showVertical,
	autoHide = false,
	contentWidth,
	contentHeight,
	viewportWidth,
	viewportHeight,
	offsetX,
	offsetY,
	onScroll,
	children,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isDraggingH = useRef(false);
	const isDraggingV = useRef(false);
	const lastPos = useRef({ x: 0, y: 0 });

	const handleHorizontalScroll = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const thumbWidth = (viewportWidth / contentWidth) * rect.width;
		const clickX = e.clientX - rect.left - thumbWidth / 2;
		const scrollRatio = clickX / (rect.width - thumbWidth);
		const newOffsetX = -scrollRatio * (contentWidth - viewportWidth);

		onScroll(Math.max(-(contentWidth - viewportWidth), Math.min(0, newOffsetX)), offsetY);
	}, [contentWidth, viewportWidth, offsetY, onScroll]);

	const handleVerticalScroll = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!containerRef.current) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const thumbHeight = (viewportHeight / contentHeight) * rect.height;
		const clickY = e.clientY - rect.top - thumbHeight / 2;
		const scrollRatio = clickY / (rect.height - thumbHeight);
		const newOffsetY = -scrollRatio * (contentHeight - viewportHeight);

		onScroll(offsetX, Math.max(-(contentHeight - viewportHeight), Math.min(0, newOffsetY)));
	}, [contentHeight, viewportHeight, offsetX, onScroll]);

	const handleMouseDownH = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		isDraggingH.current = true;
		lastPos.current = { x: e.clientX, y: e.clientY };
	}, []);

	const handleMouseDownV = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		isDraggingV.current = true;
		lastPos.current = { x: e.clientX, y: e.clientY };
	}, []);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		if (isDraggingH.current && containerRef.current) {
			const dx = e.clientX - lastPos.current.x;
			const newOffsetX = offsetX + dx;
			onScroll(Math.max(-(contentWidth - viewportWidth), Math.min(0, newOffsetX)), offsetY);
			lastPos.current = { x: e.clientX, y: e.clientY };
		} else if (isDraggingV.current && containerRef.current) {
			const dy = e.clientY - lastPos.current.y;
			const newOffsetY = offsetY + dy;
			onScroll(offsetX, Math.max(-(contentHeight - viewportHeight), Math.min(0, newOffsetY)));
			lastPos.current = { x: e.clientX, y: e.clientY };
		}
	}, [offsetX, offsetY, contentWidth, contentHeight, viewportWidth, viewportHeight, onScroll]);

	const handleMouseUp = useCallback(() => {
		isDraggingH.current = false;
		isDraggingV.current = false;
	}, []);

	useEffect(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	const hScrollRatio = viewportWidth / contentWidth;
	const hThumbWidth = hScrollRatio * viewportWidth;
	const hThumbLeft = (-offsetX / contentWidth) * viewportWidth;

	const vScrollRatio = viewportHeight / contentHeight;
	const vThumbHeight = vScrollRatio * viewportHeight;
	const vThumbTop = (-offsetY / contentHeight) * viewportHeight;

	return (
		<div ref={containerRef} className="scrollbar-container">
			<div className="scrollbar-content">{children}</div>

			{showHorizontal && (
				<div
					className={`scrollbar-h ${autoHide ? 'auto-hide' : ''}`}
					onClick={handleHorizontalScroll}
				>
					<div
						className="scrollbar-thumb-h"
						style={{
							width: `${hThumbWidth}px`,
							left: `${hThumbLeft}px`,
						}}
						onMouseDown={handleMouseDownH}
					/>
				</div>
			)}

			{showVertical && (
				<div
					className={`scrollbar-v ${autoHide ? 'auto-hide' : ''}`}
					onClick={handleVerticalScroll}
				>
					<div
						className="scrollbar-thumb-v"
						style={{
							height: `${vThumbHeight}px`,
							top: `${vThumbTop}px`,
						}}
						onMouseDown={handleMouseDownV}
					/>
				</div>
			)}
		</div>
	);
};
