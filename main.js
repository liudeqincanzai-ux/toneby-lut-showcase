// Toneby LUT 展示站 · 逻辑：下拉选组 → 渲染该组每个 LUT 的展示块（上→下）
// 照片排版：两端对齐画廊（justified）——图片保持原始比例、不裁切不变形，
//           每行精确铺满整个矩形宽度，固定 8px 间距，几张图都无空缺。
(function () {
  var picker = document.getElementById("groupPicker");
  var page = document.getElementById("page");
  var GAP = 8; // 图片固定间距

  // 数据来源：编辑器保存过的本地版本优先，否则用 data.js 默认
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem("lut_site_edits_v1")); } catch (e) {}
  var DATA = (saved && saved.groups && saved.groups.length) ? saved.groups : GROUPS;
  var site = (saved && saved.site) ? saved.site
    : (typeof SITE !== "undefined" ? SITE : { title: "Toneby LUT Showcase", subtitle: "Explore the colors of Toneby." });

  // 渲染顶部大标题 + 小字（编辑器里可改）
  var titleEl = document.getElementById("siteTitle");
  var subEl = document.getElementById("siteSubtitle");
  if (site.title && String(site.title).trim()) titleEl.textContent = site.title;
  else titleEl.style.display = "none";
  if (site.subtitle && String(site.subtitle).trim()) subEl.textContent = site.subtitle;
  else subEl.style.display = "none";
  if (site.title || site.subtitle) document.title = site.title || document.title;

  // 填充下拉选项
  DATA.forEach(function (g, i) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = g.name;
    picker.appendChild(opt);
  });

  // 有内容才创建节点（不填不显示）
  function fillText(parent, className, text) {
    if (!text || !String(text).trim()) return;
    var el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    parent.appendChild(el);
  }

  // ---------- 两端对齐画廊 ----------
  // 预加载图片拿原始宽高比（不裁切不变形的前提）
  function loadAll(srcs) {
    return Promise.all(srcs.map(function (src) {
      return new Promise(function (resolve) {
        var im = new Image();
        im.onload = function () {
          resolve({ src: src, ar: Math.max(0.25, im.naturalWidth / Math.max(1, im.naturalHeight)) });
        };
        im.onerror = function () { resolve({ src: src, ar: 1.5, broken: true }); };
        im.src = src;
      });
    }));
  }

  // 分行：动态规划全局最优——所有行的高度都尽可能接近目标高，行高差最小化
  // （每行仍按 Σ宽高比 精确铺满宽度，末行同样参与优化，无空缺）
  function splitRows(items, W, targetH) {
    var n = items.length;
    var pre = [0];
    for (var k = 0; k < n; k++) pre.push(pre[k] + items[k].ar);
    var INF = 1e18;
    var dp = new Array(n + 1).fill(INF);
    var from = new Array(n + 1).fill(-1);
    dp[0] = 0;
    for (var i = 1; i <= n; i++) {
      for (var j = 0; j < i; j++) {
        var cnt = i - j;
        var sum = pre[i] - pre[j];
        var h = (W - GAP * (cnt - 1)) / sum;
        if (h < targetH * 0.5) continue; // 单行图太多导致行高过矮，不划算
        var cost = dp[j] + (h - targetH) * (h - targetH);
        if (cost < dp[i]) { dp[i] = cost; from[i] = j; }
      }
    }
    var rows = [], i2 = n;
    if (dp[n] >= INF) { // 兜底（理论不会走到）：逐图一行
      for (var q = 0; q < n; q++) rows.push([items[q]]);
      return rows;
    }
    while (i2 > 0) {
      var j2 = from[i2];
      rows.unshift(items.slice(j2, i2));
      i2 = j2;
    }
    return rows;
  }

  // 按行渲染：每行高度 = 行内图片按原始比例恰好铺满宽度的高度 → 无空缺
  function renderRows(container, items, W) {
    container.textContent = "";
    var targetH = W < 480 ? 110 : 150;
    var rows = splitRows(items, W, targetH);
    rows.forEach(function (row) {
      var sum = row.reduce(function (a, b) { return a + b.ar; }, 0);
      var h = (W - GAP * (row.length - 1)) / sum;
      var rowEl = document.createElement("div");
      rowEl.className = "photo-row";
      rowEl.style.height = h + "px";
      row.forEach(function (im) {
        var img = document.createElement("img");
        img.src = im.src;
        img.alt = "";
        img.style.flexGrow = String(im.ar); // 宽度按宽高比精确分配 → 比例原样保留
        img.style.flexBasis = "0";
        rowEl.appendChild(img);
      });
      container.appendChild(rowEl);
    });
  }

  var photoBlocks = []; // {wrap, items} 供窗口缩放时重排

  function renderPhotos(post, lut) {
    if (!lut.images || !lut.images.length) return;
    var wrap = document.createElement("div");
    wrap.className = "photo-rows";
    post.appendChild(wrap);
    loadAll(lut.images).then(function (items) {
      photoBlocks.push({ wrap: wrap, items: items });
      var W = wrap.clientWidth || 620;
      renderRows(wrap, items, W);
    });
  }

  // 窗口尺寸变化时按新宽度重排
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      photoBlocks.forEach(function (b) {
        var W = b.wrap.clientWidth;
        if (W) renderRows(b.wrap, b.items, W);
      });
    }, 150);
  });

  function renderPost(lut) {
    var post = document.createElement("section");
    post.className = "lut-post";

    fillText(post, "lut-title", lut.title);
    fillText(post, "lut-desc", lut.desc);

    renderPhotos(post, lut);

    // 图片正下方居中：胶片 + 作者介绍（任一填写才显示整个块）
    var cap = document.createElement("div");
    cap.className = "photo-caption";
    if (lut.film && String(lut.film).trim()) {
      var film = document.createElement("span");
      film.className = "film-line";
      film.textContent = lut.film;
      cap.appendChild(film);
    }
    if (lut.note && String(lut.note).trim()) {
      var note = document.createElement("span");
      note.className = "note-line";
      note.textContent = lut.note;
      cap.appendChild(note);
    }
    if (cap.childNodes.length) post.appendChild(cap);

    // 可选补充信息行（如 导演/摄影指导）
    if (lut.credits && lut.credits.length) {
      var credits = document.createElement("div");
      credits.className = "credits";
      lut.credits.forEach(function (line) {
        if (line && String(line).trim()) {
          var d = document.createElement("div");
          d.textContent = line;
          credits.appendChild(d);
        }
      });
      if (credits.childNodes.length) post.appendChild(credits);
    }

    return post;
  }

  function render(index) {
    var g = DATA[index];
    if (!g) return;
    picker.value = String(index);
    page.textContent = ""; // 清空
    photoBlocks = [];
    g.luts.forEach(function (lut) {
      page.appendChild(renderPost(lut));
    });
    window.scrollTo(0, 0);
  }

  picker.addEventListener("change", function () {
    location.hash = "g" + picker.value;
  });

  // 支持 #gN 直达（app WebView 返回键可正常回退）
  function fromHash() {
    var m = /^#g(\d+)$/.exec(location.hash);
    var idx = m ? Math.min(Math.max(0, +m[1]), DATA.length - 1) : 0;
    render(idx);
  }

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
