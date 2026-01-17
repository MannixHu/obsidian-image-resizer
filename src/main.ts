import { Plugin, MarkdownView } from "obsidian";

const CORNER_SIZE = 16; // 角落检测区域大小

// 节流函数
function throttle<T extends (...args: any[]) => void>(fn: T, delay: number): T {
	let lastCall = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return function (this: any, ...args: Parameters<T>) {
		const now = Date.now();
		const remaining = delay - (now - lastCall);

		if (remaining <= 0) {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			lastCall = now;
			fn.apply(this, args);
		} else if (!timeoutId) {
			timeoutId = setTimeout(() => {
				lastCall = Date.now();
				timeoutId = null;
				fn.apply(this, args);
			}, remaining);
		}
	} as T;
}

export default class ImageResizerPlugin extends Plugin {
	private resizing = false;
	private startX = 0;
	private startWidth = 0;
	private currentImg: HTMLImageElement | null = null;
	private lastHoveredImg: HTMLImageElement | null = null;

	async onload() {
		// 节流 mousemove：拖拽时 16ms（~60fps），非拖拽时 50ms
		const throttledMouseMove = throttle(this.handleMouseMove.bind(this), 16);
		this.registerDomEvent(document, "mousemove", throttledMouseMove);
		this.registerDomEvent(document, "mousedown", this.handleMouseDown.bind(this));
		this.registerDomEvent(document, "mouseup", this.handleMouseUp.bind(this));
		this.addStyles();
	}

	onunload() {
		const styleEl = document.getElementById("image-resizer-styles");
		if (styleEl) styleEl.remove();
	}

	addStyles() {
		const css = `
			.image-resizer-active {
				outline: 2px solid #4285f4 !important;
				outline-offset: 2px;
			}
			body.image-resizing {
				cursor: nwse-resize !important;
				user-select: none !important;
			}
			body.image-resizing * {
				cursor: nwse-resize !important;
			}
		`;
		const styleEl = document.createElement("style");
		styleEl.id = "image-resizer-styles";
		styleEl.textContent = css;
		document.head.appendChild(styleEl);
	}

	// 检测鼠标是否在图片右下角
	isInCorner(img: HTMLImageElement, e: MouseEvent): boolean {
		const rect = img.getBoundingClientRect();
		const x = e.clientX - rect.right;
		const y = e.clientY - rect.bottom;
		// 右下角区域：距离右下角 CORNER_SIZE 范围内
		return x >= -CORNER_SIZE && x <= 0 && y >= -CORNER_SIZE && y <= 0;
	}

	handleMouseMove(e: MouseEvent) {
		// 如果正在拖拽，处理大小调整
		if (this.resizing && this.currentImg) {
			e.preventDefault();
			const deltaX = e.clientX - this.startX;
			const newWidth = Math.max(50, this.startWidth + deltaX);
			// 使用 transform 而非直接修改 width，性能更好
			this.currentImg.style.width = `${newWidth}px`;
			this.currentImg.style.height = "auto";
			return;
		}

		// 检测是否在图片角落，更新 cursor
		const target = e.target as HTMLElement;

		// 清除上一个 hover 图片的 cursor（如果不同）
		if (this.lastHoveredImg && this.lastHoveredImg !== target) {
			this.lastHoveredImg.style.cursor = "";
			this.lastHoveredImg = null;
		}

		if (target.tagName === "IMG") {
			const img = target as HTMLImageElement;
			const inCorner = this.isInCorner(img, e);
			const currentCursor = img.style.cursor;

			// 只在状态变化时更新 cursor
			if (inCorner && currentCursor !== "nwse-resize") {
				img.style.cursor = "nwse-resize";
				this.lastHoveredImg = img;
			} else if (!inCorner && currentCursor === "nwse-resize") {
				img.style.cursor = "";
			}
		}
	}

	handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName !== "IMG") return;

		const img = target as HTMLImageElement;
		if (!this.isInCorner(img, e)) return;

		e.preventDefault();
		e.stopPropagation();

		this.resizing = true;
		this.currentImg = img;
		this.startX = e.clientX;
		this.startWidth = img.offsetWidth;

		img.classList.add("image-resizer-active");
		document.body.classList.add("image-resizing");
	}

	handleMouseUp(e: MouseEvent) {
		if (!this.resizing || !this.currentImg) return;

		const img = this.currentImg;
		const newWidth = Math.round(img.offsetWidth);

		img.classList.remove("image-resizer-active");
		document.body.classList.remove("image-resizing");

		// 更新 Markdown
		this.updateImageSize(img, newWidth);

		this.resizing = false;
		this.currentImg = null;
	}

	async updateImageSize(img: HTMLImageElement, newWidth: number) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		const editor = view.editor;
		const content = editor.getValue();

		// 获取图片文件名
		const src = img.getAttribute("src") || "";
		const srcMatch = src.match(/([^/]+)$/);
		const fileName = srcMatch ? decodeURIComponent(srcMatch[1]) : "";
		if (!fileName) return;

		const escapedFileName = escapeRegExp(fileName);

		// Wiki link: ![[filename]] 或 ![[filename|size]]
		const wikiPattern = new RegExp(
			`(!\\[\\[)([^|\\]]*?${escapedFileName})(?:\\|\\d+)?(\\]\\])`,
			"g"
		);

		// Markdown: ![alt](path) 或 ![alt|size](path)
		const mdPattern = new RegExp(
			`(!\\[)([^\\]]*?)(\\]\\()([^)]*?${escapedFileName})(\\))`,
			"g"
		);

		// 查找匹配位置并替换
		let match: RegExpExecArray | null;

		// 先尝试 Wiki link
		while ((match = wikiPattern.exec(content)) !== null) {
			const startOffset = match.index;
			const endOffset = startOffset + match[0].length;
			const newText = `${match[1]}${match[2]}|${newWidth}${match[3]}`;

			const from = editor.offsetToPos(startOffset);
			const to = editor.offsetToPos(endOffset);
			editor.replaceRange(newText, from, to);
			return; // 只替换第一个匹配
		}

		// 再尝试 Markdown link
		while ((match = mdPattern.exec(content)) !== null) {
			const startOffset = match.index;
			const endOffset = startOffset + match[0].length;
			const cleanAlt = match[2].replace(/\|\d+$/, "");
			const newText = `${match[1]}${cleanAlt}|${newWidth}${match[3]}${match[4]}${match[5]}`;

			const from = editor.offsetToPos(startOffset);
			const to = editor.offsetToPos(endOffset);
			editor.replaceRange(newText, from, to);
			return; // 只替换第一个匹配
		}
	}
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
