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

  // 分行：贪心装到行高低于下限就收行；末行过高的往前一行借图，保证整体无空缺
  function splitRows(items, W, targetH, minH) {
    var rows = [], cur = [], sum = 0;
    for (var i = 0; i < items.length; i++) {
      cur.push(items[i]); sum += items[i].ar;
      var h = (W - GAP * (cur.length - 1)) / sum;
      if (h < minH && cur.length > 1) {
        var moved = cur.pop(); sum -= moved.ar;
        rows.push(cur); cur = [moved]; sum = moved.ar;
      }
    }
    if (cur.length) rows.push(cur);
    var guard = 0;
    while (rows.length > 1 && guard++ < 50) {
      var lastR = rows[rows.length - 1], prevR = rows[rows.length - 2];
      var s = lastR.reduce(function (a, b) { return a + b.ar; }, 0);
      var lh = (W - GAP * (lastR.length - 1)) / s;
      if (lh > targetH * 1.6 && prevR.length > 1) lastR.unshift(prevR.pop());
      else break;
    }
    return rows;
  }

  // 按行渲染：每行高度 = 行内图片按原始比例恰好铺满宽度的高度 → 无空缺
  function renderRows(container, items, W) {
    container.textContent = "";
    var targetH = W < 480 ? 110 : 150;
    var minH = targetH * 0.7;
    var rows = splitRows(items, W, targetH, minH);
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
