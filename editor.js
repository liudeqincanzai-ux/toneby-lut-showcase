// 内容编辑器 · 密码门 + 加图片/写文案全在这里操作
// 入口：访客不知道 edit.html 与密码就进不来；展示页(index.html)无任何编辑入口
// 保存：自动存进浏览器 localStorage（本机立即生效，预览页同步显示）
// 发布：点「导出 data.js」下载文件，替换站点里的 data.js（提交到 GitHub 即正式发布）
(function () {
  var SAVE_KEY = "lut_site_edits_v1";
  var PASS_KEY = "lut_site_admin_pass";
  var DEFAULT_SITE = (typeof SITE !== "undefined")
    ? SITE
    : { title: "Toneby LUT Showcase", subtitle: "Explore the colors of Toneby." };

  // ---------- 数据载入 ----------
  var SITE_DATA, DATA;
  try {
    var saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    SITE_DATA = (saved && saved.site) ? saved.site : Object.assign({}, DEFAULT_SITE);
    DATA = (saved && saved.groups && saved.groups.length) ? saved.groups : GROUPS;
  } catch (e) {
    SITE_DATA = Object.assign({}, DEFAULT_SITE);
    DATA = GROUPS;
  }

  function getPassword() {
    try { return localStorage.getItem(PASS_KEY) || "toneby"; } catch (e) { return "toneby"; }
  }
  function setPassword(p) {
    try { localStorage.setItem(PASS_KEY, p); } catch (e) {}
  }

  // ---------- 密码门 ----------
  var gateEl = document.getElementById("gate");
  var appEl = document.getElementById("app");
  var passInput = document.getElementById("gatePass");
  var gateErr = document.getElementById("gateErr");

  function unlocked() {
    try { return sessionStorage.getItem("lut_admin_unlocked") === "1"; } catch (e) { return false; }
  }
  function enter() {
    if (passInput.value === getPassword()) {
      try { sessionStorage.setItem("lut_admin_unlocked", "1"); } catch (e) {}
      gateEl.style.display = "none";
      appEl.style.display = "";
      initEditor();
    } else {
      gateErr.textContent = "密码不对，再试一次";
      passInput.value = "";
      passInput.focus();
    }
  }
  document.getElementById("gateBtn").onclick = enter;
  passInput.addEventListener("keydown", function (e) { if (e.key === "Enter") enter(); });

  if (unlocked()) {
    gateEl.style.display = "none";
    appEl.style.display = "";
    initEditor();
  } else {
    passInput.focus();
  }

  // ---------- 编辑器主体 ----------
  function initEditor() {
    var cur = { g: 0, l: 0 }; // g=-1 表示「网站设置」页
    var objUrls = {}; // 运行期预览用 objectURL

    var listEl = document.getElementById("lutList");
    var editorEl = document.getElementById("editor");
    var toastEl = document.getElementById("toast");

    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
    }

    function save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ site: SITE_DATA, groups: DATA }));
      } catch (e) { toast("保存失败：" + e.message); return; }
      toast("已保存 ✓（预览页同步生效）");
    }
    function saveQuiet() {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ site: SITE_DATA, groups: DATA })); } catch (e) {}
    }

    // ---------- 左侧列表 ----------
    function renderList() {
      listEl.textContent = "";
      var siteLink = document.createElement("a");
      siteLink.className = "lut-link" + (cur.g === -1 ? " active" : "");
      siteLink.textContent = "⚙ 网站标题 / 密码";
      siteLink.onclick = function () { cur = { g: -1, l: 0 }; renderList(); renderEditor(); };
      listEl.appendChild(siteLink);

      DATA.forEach(function (g, gi) {
        var head = document.createElement("div");
        head.className = "group-head";
        head.textContent = g.name;
        listEl.appendChild(head);
        g.luts.forEach(function (lut, li) {
          var a = document.createElement("a");
          a.className = "lut-link" + (gi === cur.g && li === cur.l ? " active" : "");
          a.textContent = lut.name;
          a.onclick = function () { cur = { g: gi, l: li }; renderList(); renderEditor(); };
          listEl.appendChild(a);
        });
      });
    }

    // ---------- 编辑控件 ----------
    function field(label, hint, value, onChange, rows) {
      var wrap = document.createElement("div");
      wrap.className = "field";
      var lab = document.createElement("label");
      lab.textContent = label;
      if (hint) {
        var h = document.createElement("span");
        h.className = "hint";
        h.textContent = "（" + hint + "）";
        lab.appendChild(h);
      }
      var input = document.createElement(rows ? "textarea" : "input");
      if (rows) input.rows = rows; else input.type = "text";
      input.value = value || "";
      input.oninput = function () { onChange(input.value); saveQuiet(); };
      wrap.appendChild(lab);
      wrap.appendChild(input);
      return wrap;
    }

    // ---------- 网站设置页 ----------
    function renderSiteEditor() {
      editorEl.textContent = "";
      var h = document.createElement("h2");
      h.textContent = "网站设置";
      editorEl.appendChild(h);

      editorEl.appendChild(field("顶部大标题", "预览页顶部的大标题", SITE_DATA.title, function (v) { SITE_DATA.title = v; }, 2));
      editorEl.appendChild(field("顶部小字", "大标题下面的一行小字", SITE_DATA.subtitle, function (v) { SITE_DATA.subtitle = v; }, 2));
      editorEl.appendChild(field("修改管理密码", "留空表示不修改；改完下次进编辑器用新密码", "", function (v) {
        if (v && v.trim()) { setPassword(v.trim()); toast("密码已修改 ✓"); }
      }));

      var tip = document.createElement("p");
      tip.className = "gate-hint";
      tip.style.textAlign = "left";
      tip.textContent = "提示：访客只能看到预览页（index.html），没有编辑入口；编辑器入口只有你知道（edit.html + 密码）。";
      editorEl.appendChild(tip);
    }

    // ---------- LUT 编辑页 ----------
    function renderLutEditor(lut) {
      editorEl.textContent = "";
      editorEl.scrollTop = 0;

      var h = document.createElement("h2");
      h.textContent = lut.name;
      editorEl.appendChild(h);

      editorEl.appendChild(field("标题介绍", "展示块顶部的大标题", lut.title, function (v) { lut.title = v; }, 2));
      editorEl.appendChild(field("文字描述", "标题下方的介绍文字", lut.desc, function (v) { lut.desc = v; }, 4));
      editorEl.appendChild(field("使用的胶片", "显示在图片正下方居中；留空则不显示", lut.film, function (v) { lut.film = v; }));
      editorEl.appendChild(field("作者对这组照片的介绍", "胶片下一行居中；留空则不显示", lut.note, function (v) { lut.note = v; }, 2));
      editorEl.appendChild(field("补充信息行", "如「导演：xx」，一行一条；留空则不显示", (lut.credits || []).join("\n"), function (v) {
        lut.credits = v.split("\n").filter(function (s) { return s.trim(); });
      }, 3));

      // ---- 图片管理 ----
      var imgField = document.createElement("div");
      imgField.className = "field";
      var imgLabel = document.createElement("label");
      imgLabel.textContent = "图片（数量不限，自动排成规则矩形；顺序即展示顺序）";
      imgField.appendChild(imgLabel);

      var manager = document.createElement("div");
      manager.className = "img-manager";

      function rerenderImages() {
        manager.textContent = "";
        (lut.images || []).forEach(function (src, idx) {
          var row = document.createElement("div");
          row.className = "img-row";

          var img = document.createElement("img");
          img.className = "thumb";
          img.src = objUrls[src] || src; // 本地新选的文件用 objectURL 预览
          img.onerror = function () { img.style.visibility = "hidden"; };
          img.onload = function () { img.style.visibility = "visible"; };
          row.appendChild(img);

          var name = document.createElement("span");
          name.className = "img-name";
          name.textContent = src;
          row.appendChild(name);

          var acts = document.createElement("span");
          acts.className = "img-actions";
          [
            ["↑", function () { if (idx > 0) { var t = lut.images[idx - 1]; lut.images[idx - 1] = lut.images[idx]; lut.images[idx] = t; saveQuiet(); rerenderImages(); } }],
            ["↓", function () { if (idx < lut.images.length - 1) { var t = lut.images[idx + 1]; lut.images[idx + 1] = lut.images[idx]; lut.images[idx] = t; saveQuiet(); rerenderImages(); } }],
            ["删除", function () { lut.images.splice(idx, 1); saveQuiet(); rerenderImages(); }, "ghost"],
          ].forEach(function (def) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = def[0];
            if (def[2]) b.className = def[2];
            b.onclick = def[1];
            acts.appendChild(b);
          });
          row.appendChild(acts);
          manager.appendChild(row);
        });
      }
      rerenderImages();

      // 添加图片：多选文件。文件名即最终路径 photos/文件名（发布前把文件放进 photos/ 文件夹）
      var addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "add-img-btn";
      addBtn.textContent = "＋ 添加图片（可多选）";
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.multiple = true;
      fileInput.style.display = "none";
      fileInput.onchange = function () {
        var files = Array.prototype.slice.call(fileInput.files || []);
        files.forEach(function (f) {
          var path = "photos/" + f.name;
          if (objUrls[f.name]) URL.revokeObjectURL(objUrls[f.name]);
          objUrls[path] = URL.createObjectURL(f);
          if (!lut.images) lut.images = [];
          lut.images.push(path);
        });
        saveQuiet();
        rerenderImages();
        if (files.length) toast("已添加 " + files.length + " 张 ✓ 记得把原图放进 photos/ 文件夹");
        fileInput.value = "";
      };
      addBtn.onclick = function () { fileInput.click(); };
      imgField.appendChild(manager);
      imgField.appendChild(addBtn);
      imgField.appendChild(fileInput);
      editorEl.appendChild(imgField);
    }

    function renderEditor() {
      if (cur.g === -1) renderSiteEditor();
      else renderLutEditor(DATA[cur.g].luts[cur.l]);
    }

    // ---------- 导出 data.js ----------
    document.getElementById("btnExport").onclick = function () {
      var text = "// 本文件由内容编辑器导出（" + new Date().toLocaleString() + "）\n"
        + "// 手动编辑请改下面的 SITE / GROUPS；图片文件需放在 photos/ 文件夹内。\n"
        + "const SITE = " + JSON.stringify(SITE_DATA, null, 2) + ";\n\n"
        + "const GROUPS = " + JSON.stringify(DATA, null, 2) + ";\n";
      var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("data.js 已下载 ✓ 替换站点同名文件即发布");
    };

    // ---------- 恢复默认 ----------
    document.getElementById("btnReset").onclick = function () {
      if (!confirm("确定放弃全部本地修改（含网站标题），恢复到 data.js 默认内容？")) return;
      localStorage.removeItem(SAVE_KEY);
      SITE_DATA = Object.assign({}, DEFAULT_SITE);
      DATA = GROUPS;
      cur = { g: 0, l: 0 };
      renderList();
      renderEditor();
      toast("已恢复默认");
    };

    renderList();
    renderEditor();
  }
})();
