// Toneby LUT 展示站 · 逻辑
// 顶部菜单按钮（一长一短两横杠）→ 侧边抽屉展示全部分组与 LUT（粉色高亮）
// 照片排版：两端对齐画廊——图片保持原始比例、不裁切不变形，每行铺满矩形宽度
(function () {
  var page = document.getElementById("page");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("overlay");
  var menuBtn = document.getElementById("menuBtn");
  var GAP = 8; // 图片固定间距

  // 数据来源：编辑器保存过的本地版本优先，否则用 data.js 默认
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem("lut_site_edits_v1")); } catch (e) {}
  var DATA = (saved && saved.groups && saved.groups.length) ? saved.groups : GROUPS;
  var site = (saved && saved.site) ? saved.site
    : (typeof SITE !== "undefined" ? SITE : { title: "Toneby LUT Showcase", subtitle: "Explore the colors of Toneby." });

  // 顶部大标题 + 小字（编辑器里可改）
  var titleEl = document.getElementById("siteTitle");
  var subEl = document.getElementById("siteSubtitle");
  if (site.title && String(site.title).trim()) titleEl.textContent = site.title;
  else titleEl.style.display = "none";
  if (site.subtitle && String(site.subtitle).trim()) subEl.textContent = site.subtitle;
  else subEl.style.display = "none";
  if (site.title || site.subtitle) document.title = site.title || document.title;

  var curGi = 0;

  // ---------- 侧边抽屉 ----------
  function buildSidebar(activeGi) {
    sidebar.textContent = "";
    var head = document.createElement("div");
    head.className = "sidebar-head";
    var t = document.createElement("span");
    t.className = "t";
    t.textContent = "LUT 分组";
    var x = document.createElement("button");
    x.className = "sidebar-close";
    x.textContent = "×";
    x.setAttribute("aria-label", "关闭");
    x.onclick = closeDrawer;
    head.appendChild(t);
    head.appendChild(x);
    sidebar.appendChild(head);

    DATA.forEach(function (g, gi) {
      var label = document.createElement("div");
      label.className = "side-group-label";
      label.textContent = g.name;
      sidebar.appendChild(label);
      g.luts.forEach(function (lut, li) {
        var b = document.createElement("button");
        b.className = "side-lut" + (gi === activeGi ? " active" : "");
        b.textContent = lut.name;
        b.onclick = function () { selectGroup(gi, li); };
        sidebar.appendChild(b);
      });
    });
  }

  function openDrawer() { buildSidebar(curGi); sidebar.classList.add("open"); overlay.classList.add("show"); }
  function closeDrawer() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
  menuBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  // 有内容才创建节点（不填不显示）
  function fillText(parent, className, text) {
    if (!text || !String(text).trim()) return;
    var el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    parent.appendChild(el);
  }

  // ---------- 两端对齐画廊 ----------
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

  // 动态规划全局最优分行：所有行高尽可能接近目标高，行高差最小
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
        if (h < targetH * 0.5) continue;
        var cost = dp[j] + (h - targetH) * (h - targetH);
        if (cost < dp[i]) { dp[i] = cost; from[i] = j; }
      }
    }
    var rows = [], i2 = n;
    if (dp[n] >= INF) {
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
        img.style.flexGrow = String(im.ar); // 宽度按宽高比分配 → 不裁切不变形
        img.style.flexBasis = "0";
        rowEl.appendChild(img);
      });
      container.appendChild(rowEl);
    });
  }

  var photoBlocks = [];

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

  function renderPost(lut, gi, li) {
    var post = document.createElement("section");
    post.className = "lut-post";
    post.id = "post-" + gi + "-" + li; // 侧边栏点 LUT 跳转锚点

    fillText(post, "lut-title", lut.title);
    fillText(post, "lut-desc", lut.desc);
    renderPhotos(post, lut);

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

  var pendingScroll = -1; // 渲染后要滚动到的 LUT 索引（-1 = 回到顶部）

  function render(index) {
    var g = DATA[index];
    if (!g) return;
    curGi = index;
    page.textContent = "";
    photoBlocks = [];
    g.luts.forEach(function (lut, li) {
      page.appendChild(renderPost(lut, index, li));
    });
    if (pendingScroll >= 0) {
      var el = document.getElementById("post-" + index + "-" + pendingScroll);
      pendingScroll = -1;
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo(0, 0);
  }

  function selectGroup(gi, lutIndex) {
    closeDrawer();
    pendingScroll = (typeof lutIndex === "number") ? lutIndex : -1;
    if (("#g" + gi) === location.hash) render(gi);
    else location.hash = "g" + gi;
  }

  // 支持 #gN 直达（app WebView 返回键可正常回退）
  function fromHash() {
    var m = /^#g(\d+)$/.exec(location.hash);
    var idx = m ? Math.min(Math.max(0, +m[1]), DATA.length - 1) : 0;
    render(idx);
  }

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
