# ptz-map-localizer

球机画面点击定位到天地图的独立原型项目。

## 功能

- 登录参考系统 `/pano/user/login`，验证码来自 `/pano/user/getPicVerifyCode?type=1`。
- 使用登录 token 调用 `/pano/organization/all` 读取真实树形设备；目录展开时继续携带 `orgCode` 和 `openLevel:1`。
- 点击设备后调用 `/pano/realTimeVideo/getVideoRealtimeUrl` 拉取真实实时流，不使用模拟画面。
- 每 2 秒自动调用 `/pano/realTimeVideo/viewPitchAngle` 和 `/pano/operate/queryPtzPosition` 刷新 PTZ、FOV 和变倍状态。
- 云台控制使用 `/pano/operate/doLockOrReleasePtz` 获取控制 token，再通过 `/pano/operate/doPtzCmds` 和 `/pano/operate/doCameraFocusOrZoom` 下发方向/变倍指令。
- 支持画面点击，将点击像素、PTZ 姿态、球机位置和标定参数转换为目标经纬度。
- 使用天地图 JS API 显示球机、定位点和误差半径；地图面板会显示 Key 是否读到和实际脚本地址。

## 开发

```bash
cd ptz-map-localizer
npm install
npm run dev
```

复制 `.env.example` 为 `.env` 并填写天地图 Key；修改 `.env` 后需要重启 Vite dev server。真实系统账号密码只在运行时输入，不写入源码。

## 测试

```bash
npm run test
```

定位精度依赖现场标定、球机高度、同步 PTZ 状态、镜头 FOV 和目标是否位于地面。未标定时只能作为低置信估算。
