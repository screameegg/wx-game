# 素材放置说明

运行时图片只放在 `resources/art/`。游戏从这一棵目录加载，不再读取 `images/` 或旧的平铺图库。

| 文件夹 | 放什么 |
| --- | --- |
| `resources/art/` | 会画进画面的图集：货柜、角色、货物，以及 `band/`、`lots/photo/`、`lots/repair/`、`fx/` |
| `resources/art/reference/` | 带标题的对照板。路径映射仍指向这里，但发布包会排除整个目录 |
| `audio/music/` | 背景音乐 |
| `audio/effects/` | 落槌、开箱、揭晓等音效 |
| `references/` | 风格参考图和说明文件，仅供开发参考 |

没有接进画面的旧图在仓库的 `archive/sources/`：`studio-images/reveal|items|ui` 按乐队、摄影、维修或按钮/界面分开，原始压缩包在 `raw-images/`。这些目录不进入小游戏发布包。

建议图片使用 PNG（需要透明背景时尤其适合），音频使用 MP3 或 WAV；请保留素材原始文件。素材接入前会确认用途、尺寸与授权。`references/`、`resources/art/reference/` 和 `archive/` 不放入最终发布包。

直接放入文件后请告诉我用途；图片不会自动进入游戏，需要在代码中完成映射并检查显示效果。新的可发布图片放进 `resources/art/` 对应主题目录，并改路径映射。
