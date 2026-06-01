// script.js

// 1. 爱意计时器 (1988年6月1日出生)
const birthDate = new Date("1988-06-01T00:00:00");

function updateTimer() {
    const now = new Date();
    const diffMs = now - birthDate;

    // 粗略年数计算
    let years = now.getFullYear() - birthDate.getFullYear();
    // 检查今年生日是否已过（当前正好是6月1日，所以刚好是满 38 周年）
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        years--;
    }

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    document.getElementById("years").textContent = years;
    document.getElementById("days").textContent = diffDays;
    document.getElementById("hours").textContent = diffHours % 24;
    document.getElementById("minutes").textContent = diffMins % 60;
    document.getElementById("seconds").textContent = diffSecs % 60;
}
setInterval(updateTimer, 1000);
updateTimer();

// 2. 音乐播放逻辑
const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicToggle");
const musicIcon = musicBtn.querySelector(".music-icon");
const musicText = musicBtn.querySelector(".music-text");

let isPlaying = false;

musicBtn.addEventListener("click", () => {
    if (isPlaying) {
        music.pause();
        musicIcon.textContent = "🎵";
        musicText.textContent = "播放音乐";
        musicBtn.classList.remove("playing");
    } else {
        music.play().then(() => {
            musicIcon.textContent = "⏸️";
            musicText.textContent = "暂停播放";
            musicBtn.classList.add("playing");
        }).catch(err => {
            console.log("音频播放被浏览器阻止:", err);
            alert("点击页面任意位置后再试一次吧！");
        });
    }
    isPlaying = !isPlaying;
});

// 3. 信封互动与彩纸碎屑特效 (Confetti)
const envelopeWrapper = document.getElementById("envelopeWrapper");
envelopeWrapper.addEventListener("click", function (e) {
    const wasOpen = this.classList.contains("open");
    this.classList.toggle("open");
    
    // 如果是打开信封，触发满屏彩屑爆炸效果
    if (!wasOpen) {
        const rect = envelopeWrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createExplosion(centerX, centerY);
    }
});

// 4. 心愿墙 / 情话库
const loveQuotes = [
    "遇上你，是我这辈子最美丽的意外。媳妇，生日快乐！",
    "你在我身边，每一个普通的日子都变成了珍贵的纪念日。",
    "哪怕岁月流逝，你在我心中永远是那个18岁的阳光女孩。",
    "感谢你把温柔给了我们，愿你今天的生日愿望全部实现！",
    "有你的陪伴，风雨皆是风景，余生我们继续并肩漫步。",
    "亲爱的，愿你一生被爱，生日快乐，不止今天，而是岁岁年年。",
    "愿你眼里永远闪烁着少女般的光芒，平安喜乐，顺遂无忧。"
];

const wishBtn = document.getElementById("wishBtn");
const wishDisplay = document.getElementById("wishDisplay");
let quoteIndex = 0;

wishBtn.addEventListener("click", (e) => {
    // 切换情话
    quoteIndex = (quoteIndex + 1) % loveQuotes.length;
    wishDisplay.style.opacity = 0;
    setTimeout(() => {
        wishDisplay.textContent = `“${loveQuotes[quoteIndex]}”`;
        wishDisplay.style.opacity = 1;
    }, 200);

    // 按钮处爆发一小波爱心粒子
    createExplosion(e.clientX, e.clientY);
});

// 5. Canvas 星空与爱心漂浮背景逻辑
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let stars = [];
let floatingHearts = [];
let explosionParticles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 初始化背景星星
for (let i = 0; i < 80; i++) {
    stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.8,
        radius: Math.random() * 1.5,
        alpha: Math.random(),
        speed: 0.01 + Math.random() * 0.02
    });
}

// 产生漂浮爱心粒子
function spawnFloatingHeart() {
    if (floatingHearts.length < 20) {
        floatingHearts.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            size: 5 + Math.random() * 15,
            speedY: 0.5 + Math.random() * 1.5,
            speedX: Math.sin(Math.random() * Math.PI) * 0.5,
            wiggleSpeed: 0.02 + Math.random() * 0.03,
            wiggleAmp: 0.5 + Math.random() * 1.5,
            wiggleTimer: Math.random() * 100,
            alpha: 0.2 + Math.random() * 0.5
        });
    }
}

// 创建彩色/粉色纸屑爆炸粒子
function createExplosion(x, y) {
    const colors = ["#ff7597", "#ffd275", "#ff4d76", "#fff", "#ff8fa3", "#ffd885"];
    for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        explosionParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // 略微向上喷洒
            radius: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            decay: 0.015 + Math.random() * 0.02,
            gravity: 0.15
        });
    }
}

// 绘制心形
function drawHeart(ctx, x, y, size, alpha, color = "#ff7597") {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    // 使用贝塞尔曲线画心形
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
    ctx.fill();
    ctx.restore();
}

// 动画主循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制背景星空并呼吸闪烁
    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
            star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // 2. 更新并绘制漂浮的爱心
    spawnFloatingHeart();
    for (let i = floatingHearts.length - 1; i >= 0; i--) {
        const h = floatingHearts[i];
        h.y -= h.speedY;
        h.wiggleTimer += h.wiggleSpeed;
        h.x += Math.sin(h.wiggleTimer) * h.wiggleAmp;

        drawHeart(ctx, h.x, h.y, h.size, h.alpha);

        // 超出屏幕则移除
        if (h.y < -30) {
            floatingHearts.splice(i, 1);
        }
    }

    // 3. 更新并绘制爆炸粒子 (Confetti / Heart Explosion)
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const p = explosionParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.alpha <= 0) {
            explosionParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();
