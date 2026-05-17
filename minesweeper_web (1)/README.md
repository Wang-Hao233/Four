# 经典扫雷网页版

这是一个可以直接部署到 GitHub Pages 的静态网页扫雷游戏。项目不需要后端，也不需要安装依赖，只要浏览器即可运行。

## 功能

- 三档难度：简单、中等、困难
- 左键翻开，右键插旗
- 手机端点击翻开，长按插旗
- 计时器、剩余地雷数、最佳成绩记录
- 首次点击安全，不会开局踩雷
- 自动展开空白区域
- 胜利/失败判定

## 项目结构

```text
minesweeper_web/
├── index.html
├── assets/
│   ├── style.css
│   └── app.js
├── .github/
│   └── workflows/
│       └── pages.yml
├── README.md
└── LICENSE
```

## 本地运行

直接双击 `index.html`，或者用 VS Code 的 Live Server 打开。

也可以用 Python 启动一个本地静态服务器：

```bash
python -m http.server 8000
```

然后浏览器访问：

```text
http://localhost:8000
```

## 上传到 GitHub

```bash
git init
git add .
git commit -m "完成扫雷网页版"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 发布到 GitHub Pages

方法一：使用仓库设置发布

1. 打开 GitHub 仓库页面。
2. 进入 `Settings`。
3. 左侧选择 `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub 生成网页地址。

方法二：使用本项目自带 GitHub Actions

如果你希望用 Actions 自动发布，进入 `Settings` → `Pages`，Source 选择 `GitHub Actions`。之后每次推送到 `main` 分支都会自动部署。

## 算法说明

### 地雷生成

游戏在第一次点击后才生成地雷，并避开第一次点击位置及其周围 8 个格子，实现“首击安全”。

### 相邻地雷数计算

对每个非雷格子遍历 8 个方向，统计周围地雷数量。

时间复杂度：`O(rows × cols)`，每个格子最多检查 8 个方向，8 是常数。

### 空白区域展开

使用队列进行广度优先搜索 BFS。当某个格子的周围地雷数为 0 时，将周围未翻开的安全格加入队列继续展开。

时间复杂度：`O(rows × cols)`，最坏情况下所有安全格都会被访问一次。

### 胜利判定

当已翻开的安全格数量等于总安全格数量时，游戏胜利。
