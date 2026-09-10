// Toneby LUT 展示站 · 逻辑：下拉选组 → 渲染该组每个 LUT 的展示块（上→下）
// 块结构：标题介绍 + 文字描述 + 照片网格（规则矩形、固定间距）
//         + 图片正下方居中的胶片/作者介绍（不填不显示）+ 可选补充信息行
(function () {
  var picker = document.getElementById("groupPicker");
  var page = document.getElementById("page");

  // 数据来源：编辑器保存过的本地版本优先，否则用 data.js 默认
  var DATA;
  try {
    var saved = JSON.parse(localStorage.getItem("lut_site_edits_v1"));
    DATA = (saved && saved.groups && saved.groups.length) ? saved.groups : GROUPS;
  } catch (e) { DATA = GROUPS; }

  // 填充下拉选项
  DATA.forEach(function (g, i) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = g.name;
    picker.appendChild(opt);
  });

  // 有内容才创建节点（不填不展示）
  function fillText(parent, className, text) {
    if (!text || !String(text).trim()) return;
    var el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    parent.appendChild(el);
  }

  function renderPost(lut) {
    var post = document.createElement("section");
    post.className = "lut-post";

    fillText(post, "lut-title", lut.title);
    fillText(post, "lut-desc", lut.desc);

    // 照片网格：images 数量不限，自动排成规则矩形
    if (lut.images && lut.images.length) {
      var grid = document.createElement("div");
      grid.className = "photo-grid";
      lut.images.forEach(function (src) {
        var img = document.createElement("img");
        img.src = src;
        img.alt = lut.name;
        img.loading = "lazy";
        grid.appendChild(img);
      });
      post.appendChild(grid);

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
    }

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
