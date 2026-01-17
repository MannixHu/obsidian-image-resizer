# Image Resizer for Obsidian

**[English](./README_EN.md) | 中文**

一个轻量级的 Obsidian 插件，支持通过拖拽图片角落来调整图片大小。

## 功能特点

- **拖拽调整** - 从图片右下角拖拽即可调整大小
- **视觉反馈** - 鼠标悬停在角落时显示调整大小的光标
- **自动保存** - 自动更新 Markdown 源文件中的图片尺寸
- **多格式支持** - 同时支持 Wiki 链接 (`![[image.png]]`) 和 Markdown 链接 (`![](image.png)`)
- **性能优化** - 使用节流函数（约 60fps）确保流畅调整

## 使用方法

1. 将鼠标悬停在笔记中的任意图片上
2. 移动到图片右下角 - 光标会变成调整大小的指示器
3. 点击并拖拽来调整图片大小
4. 松开鼠标确认新尺寸

## 工作原理

当你调整图片大小时，插件会：

1. 检测鼠标相对于图片角落的位置（16px 检测区域）
2. 在角落区域时显示调整大小的光标
3. 拖拽时根据鼠标移动计算新宽度
4. 松开时更新 Markdown 源文件中的尺寸

**Wiki 链接：** `![[image.png]]` → `![[image.png|300]]`

**Markdown 链接：** `![alt](image.png)` → `![alt|300](image.png)`

## 安装

### 手动安装

1. 从 releases 下载 `main.js` 和 `manifest.json`
2. 在你的 vault 的 `.obsidian/plugins/` 目录下创建 `image-resizer` 文件夹
3. 将下载的文件复制到该文件夹
4. 在 Obsidian 设置中启用插件

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/anthropics/obsidian-image-resizer.git

# 安装依赖
npm install

# 构建
npm run build

# 复制到你的 vault
cp main.js manifest.json /path/to/vault/.obsidian/plugins/image-resizer/
```

## 技术细节

| 参数 | 值 |
|------|-----|
| 角落检测区域 | 距右下角 16px × 16px |
| 最小宽度 | 50px |
| 节流间隔 | 16ms（约 60fps） |
| 宽高比 | 保持原比例（高度设为 `auto`） |

## 许可证

MIT License

## 作者

Mannix
