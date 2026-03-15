---
name: local-app-control
description: 当用户说"截图"、"screenshot"、"截个图"、"切换路由"、"navigate"、"go to"、"打开某页面"、"刷新"、"reload"、"返回"、"back"、"查看当前页面"、"检查 UI"或请求与本地 Electron 应用交互时，使用 curl 调用 http://localhost:7000/api 执行操作（截图/导航/刷新）。
version: 1.0.0
---

# Local App Control

用于与本地 Electron 应用 (OpenClaw Desktop) 交互的通用控制技能。

## 可用操作

### 1. 截图
```bash
curl -s http://localhost:7000/api/screenshot -o "$env:TEMP/screenshot_current.png"
```
然后读取 `$env:TEMP/screenshot_current.png` 分析页面内容。

### 2. 路由导航
```bash
curl -X POST http://localhost:7000/api/navigate \
  -H "Content-Type: application/json" \
  -d '{"path": "/settings"}'
```
常用路由：
- `/` - 主页/仪表盘
- `/sessions` - 会话列表
- `/settings` - 设置
- `/memory` - 记忆文件
- `/logs` - 日志查看

### 3. 刷新页面
```bash
curl -X POST http://localhost:7000/api/reload
```

### 4. 获取应用状态
```bash
curl -s http://localhost:7000/api/health
curl -s http://localhost:7000/api/sessions
curl -s http://localhost:7000/api/system
```

## 使用场景

| 用户请求 | 操作 |
|---------|------|
| "截图看看" | 调用 `/api/screenshot` |
| "打开设置页面" | 调用 `/api/navigate` with `path: /settings` |
| "切换到会话列表" | 调用 `/api/navigate` with `path: /sessions` |
| "刷新一下" | 调用 `/api/reload` |
| "看看现在什么样" | 先截图，再分析 |
| "go to dashboard" | 调用 `/api/navigate` with `path: /` |

## 注意事项

1. 如果 API 调用失败，检查应用是否在运行：`tasklist | findstr electron`
2. 截图后主动读取并分析图片内容
3. 导航后可以截图确认路由切换成功
4. **截图文件用完即删**：分析完截图后，执行 `rm "$env:TEMP/screenshot_*.png"` 清理临时文件
