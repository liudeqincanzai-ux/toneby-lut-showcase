// 内容编辑器 · 密码门 + 加图片/写文案全在这里操作
// 入口：访客不知道 edit.html 与密码就进不来；展示页(index.html)无任何编辑入口
// 保存：自动存进浏览器 localStorage（本机立即生效，预览页同步显示）
// 发布：「保存并同步到网站」一键 = 保存 + 直接提交 GitHub + 网站自动更新
//       （首次需在「网站设置」里填一次 GitHub Token；「导出 data.js」留作备份手段）
(function () {
  var SAVE_KEY = "lut_site_edits_v1";
  var PASS_KEY = "lut_site_admin_pass";
  var TOKEN_KEY = "lut_gh_token";
  var GH_REPO = "liudeqincanzai-ux/toneby-lut-showcase"; // 同步目标仓库
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
  function getToken() {
    try { return (localStorage.getItem(TOKEN_KEY) || "").trim(); } catch (e) { return ""; }
  }
  function setToken(t) {
    try {
      if (t && t.trim()) localStorage.setItem(TOKEN_KEY, t.trim());
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
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
    var objUrls = {};     // 运行期预览用 objectURL
    var pendingFiles = {}; // path -> File（本会话新选的图片，待同步上传）

    var listEl = document.getElementById("lutList");
    var editorEl = document.getElementById("editor");
    var toastEl = document.getElementById("toast");
    var statusEl = document.getElementById("syncStatus");
    var btnSync = document.getElementById("btnSync");

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

    // ---------- 左侧列表（支持拖拽分组） ----------
    var dragSrc = null; // {type:'lut',gi,li} 或 {type:'group',gi}

    function moveLut(fgi, fli, tgi, tli, before) {
      if (fgi === tgi && fli === tli) return;
      var lut = DATA[fgi].luts.splice(fli, 1)[0];
      var idx = tli;
      if (fgi === tgi && fli < tli) idx = tli - 1; // 同组前移后目标索引左移
      if (!before) idx += 1;
      DATA[tgi].luts.splice(idx, 0, lut);
      cur = { g: tgi, l: DATA[tgi].luts.indexOf(lut) };
      saveQuiet(); renderList(); renderEditor();
    }

    function makeLutLink(lut, gi, li) {
      var a = document.createElement("a");
      a.className = "lut-link" + (gi === cur.g && li === cur.l ? " active" : "");
      a.textContent = lut.name;
      a.draggable = true;
      a.title = "拖动=移动/排序；双击=改 LUT 名称";
      a.onclick = function () { cur = { g: gi, l: li }; renderList(); renderEditor(); };
      a.ondblclick = function () {
        var n = prompt("修改 LUT 名称", lut.name);
        if (n && n.trim()) {
          lut.name = n.trim();
          saveQuiet(); renderList(); renderEditor();
          toast("LUT 名称已修改 ✓");
        }
      };
      a.ondragstart = function (e) {
        dragSrc = { type: "lut", gi: gi, li: li };
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", "lut"); } catch (x) {}
        a.classList.add("dragging");
      };
      a.ondragend = function () { dragSrc = null; renderList(); };
      a.ondragover = function (e) {
        if (!dragSrc) return;
        e.preventDefault();
        var r = a.getBoundingClientRect();
        var before = (e.clientY - r.top) < r.height / 2;
        a.classList.toggle("drop-before", before);
        a.classList.toggle("drop-after", !before);
      };
      a.ondragleave = function () { a.classList.remove("drop-before", "drop-after"); };
      a.ondrop = function (e) {
        e.preventDefault();
        var r = a.getBoundingClientRect();
        var before = (e.clientY - r.top) < r.height / 2;
        a.classList.remove("drop-before", "drop-after");
        if (dragSrc && dragSrc.type === "lut") moveLut(dragSrc.gi, dragSrc.li, gi, li, before);
        dragSrc = null;
      };
      return a;
    }

    function makeGroupHead(g, gi) {
      var head = document.createElement("div");
      head.className = "group-head droppable";
      var nameSpan = document.createElement("span");
      nameSpan.textContent = g.name + (g.luts.length ? "" : "（空分组）");
      head.appendChild(nameSpan);
      head.title = "拖动可整组换位；双击可改名；把 LUT 拖到这里=移入该分组";
      if (!g.luts.length) {
        var del = document.createElement("span");
        del.className = "g-del";
        del.textContent = " ✕删除";
        del.onclick = function (e) {
          e.stopPropagation();
          DATA.splice(gi, 1);
          cur = { g: 0, l: 0 };
          saveQuiet(); renderList(); renderEditor();
          toast("空分组已删除");
        };
        head.appendChild(del);
      }
      head.ondblclick = function () {
        var n = prompt("修改分组名称（显示在网站顶部下拉里）", g.name);
        if (n && n.trim()) { g.name = n.trim(); saveQuiet(); renderList(); }
      };
      head.draggable = true;
      head.ondragstart = function (e) {
        dragSrc = { type: "group", gi: gi };
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", "group"); } catch (x) {}
        head.classList.add("dragging");
      };
      head.ondragend = function () { dragSrc = null; renderList(); };
      head.ondragover = function (e) {
        if (!dragSrc) return;
        e.preventDefault();
        head.classList.add("drop-into");
      };
      head.ondragleave = function () { head.classList.remove("drop-into"); };
      head.ondrop = function (e) {
        e.preventDefault();
        head.classList.remove("drop-into");
        if (!dragSrc) return;
        if (dragSrc.type === "lut") {
          // 拖到分组标题 = 放入该分组末尾
          var lut = DATA[dragSrc.gi].luts.splice(dragSrc.li, 1)[0];
          g.luts.push(lut);
          cur = { g: gi, l: g.luts.length - 1 };
          saveQuiet(); renderList(); renderEditor();
        } else if (dragSrc.type === "group" && dragSrc.gi !== gi) {
          // 整组拖到另一组标题前 = 移动到它前面
          var grp = DATA.splice(dragSrc.gi, 1)[0];
          var idx = gi;
          if (dragSrc.gi < gi) idx = gi - 1;
          DATA.splice(idx, 0, grp);
          cur = { g: idx, l: 0 };
          saveQuiet(); renderList(); renderEditor();
        }
        dragSrc = null;
      };
      return head;
    }

    function makeNewGroupZone() {
      var zone = document.createElement("div");
      zone.className = "new-group-zone";
      zone.textContent = "＋ 把 LUT 拖到此处 = 新建分组";
      zone.ondragover = function (e) {
        if (!dragSrc || dragSrc.type !== "lut") return;
        e.preventDefault();
        zone.classList.add("drop-into");
      };
      zone.ondragleave = function () { zone.classList.remove("drop-into"); };
      zone.ondrop = function (e) {
        e.preventDefault();
        zone.classList.remove("drop-into");
        if (!dragSrc || dragSrc.type !== "lut") return;
        var lut = DATA[dragSrc.gi].luts.splice(dragSrc.li, 1)[0];
        var ng = { name: "新分组", luts: [lut] };
        DATA.push(ng);
        cur = { g: DATA.length - 1, l: 0 };
        saveQuiet(); renderList(); renderEditor();
        toast("已新建分组，双击分组名可改名");
        dragSrc = null;
      };
      return zone;
    }

    // ＋ 增加 LUT：在当前选中的分组末尾新建一个 LUT 并进入编辑
    function makeAddLutZone() {
      var zone = document.createElement("div");
      zone.className = "new-group-zone";
      zone.textContent = "＋ 增加 LUT";
      zone.style.cursor = "pointer";
      zone.onclick = function () {
        var gi = (cur.g >= 0) ? cur.g : DATA.length - 1;
        var lut = { name: "新 LUT", title: "", desc: "", images: [], film: "", note: "", credits: [] };
        DATA[gi].luts.push(lut);
        cur = { g: gi, l: DATA[gi].luts.length - 1 };
        saveQuiet(); renderList(); renderEditor();
        listEl.scrollTop = listEl.scrollHeight;
        toast("已添加 ✓ 双击左侧名称改名，右侧填写内容");
      };
      return zone;
    }

    function renderList() {
      listEl.textContent = "";
      var siteLink = document.createElement("a");
      siteLink.className = "lut-link" + (cur.g === -1 ? " active" : "");
      siteLink.textContent = "⚙ 网站标题 / 密码";
      siteLink.onclick = function () { cur = { g: -1, l: 0 }; renderList(); renderEditor(); };
      listEl.appendChild(siteLink);

      var tip = document.createElement("div");
      tip.className = "group-head";
      tip.textContent = "拖动 LUT 分组 · 双击组名改名";
      listEl.appendChild(tip);

      DATA.forEach(function (g, gi) {
        listEl.appendChild(makeGroupHead(g, gi));
        g.luts.forEach(function (lut, li) {
          listEl.appendChild(makeLutLink(lut, gi, li));
        });
      });
      listEl.appendChild(makeNewGroupZone());
      listEl.appendChild(makeAddLutZone());
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

      // GitHub Token（「保存并同步到网站」用，只需填一次）
      var ghField = document.createElement("div");
      ghField.className = "field";
      var ghLab = document.createElement("label");
      ghLab.innerHTML = "GitHub Token（一键同步网站用，只需填一次）<span class=\"hint\">（点右上角「保存并同步到网站」按钮即自动更新网站；没有 Token 时按钮会提示）</span>";
      ghField.appendChild(ghLab);
      var ghInput = document.createElement("input");
      ghInput.type = "password";
      ghInput.placeholder = getToken() ? "已设置（重新粘贴可更换）" : "粘贴 GitHub Token";
      ghInput.value = "";
      ghInput.oninput = function () {
        if (ghInput.value.trim()) { setToken(ghInput.value); toast("Token 已保存 ✓"); }
      };
      ghField.appendChild(ghInput);
      editorEl.appendChild(ghField);

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

      editorEl.appendChild(field("LUT 名称", "左侧列表与数据里的名称；也可在左侧双击改名", lut.name, function (v) {
        lut.name = v;
        h.textContent = v || lut.name;
        renderList();
      }));
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

      // 添加图片：多选文件。上传前自动压缩（长边 1600px、JPEG q82），保证网页秒开
      function shrinkImage(file, cb) {
        var url = URL.createObjectURL(file);
        var im = new Image();
        im.onload = function () {
          URL.revokeObjectURL(url);
          var scale = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
          if (scale >= 1 && file.size < 500 * 1024) { cb(file); return; } // 已够小，不压
          var c = document.createElement("canvas");
          c.width = Math.round(im.naturalWidth * scale);
          c.height = Math.round(im.naturalHeight * scale);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
          c.toBlob(function (blob) {
            if (!blob) { cb(file); return; }
            var outName = file.name.replace(/\.(png|webp|jpeg|jpg)$/i, ".jpg");
            cb(new File([blob], outName, { type: "image/jpeg" }));
          }, "image/jpeg", 0.82);
        };
        im.onerror = function () { URL.revokeObjectURL(url); cb(file); };
        im.src = url;
      }

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
        var left = files.length;
        if (!left) { fileInput.value = ""; return; }
        files.forEach(function (f) {
          shrinkImage(f, function (out) {
            var path = "photos/" + out.name;
            if (objUrls[path]) URL.revokeObjectURL(objUrls[path]);
            objUrls[path] = URL.createObjectURL(out);
            pendingFiles[path] = out; // 压缩后的文件，同步时上传到 GitHub
            if (!lut.images) lut.images = [];
            lut.images.push(path);
            saveQuiet();
            rerenderImages();
            left--;
            if (left === 0) {
              toast("已添加 ✓ 已自动压缩（点「保存并同步到网站」上线）");
              fileInput.value = "";
            }
          });
        });
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

    // ---------- 首次连接 GitHub 的友好弹窗 ----------
    function showTokenModal(afterSave) {
      var overlay = document.createElement("div");
      overlay.className = "gate";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;";
      var box = document.createElement("div");
      box.className = "gate-box";
      box.style.textAlign = "left";

      var h = document.createElement("h1");
      h.textContent = "首次使用：连接 GitHub（只需一次）";
      box.appendChild(h);

      var steps = document.createElement("p");
      steps.className = "gate-hint";
      steps.style.textAlign = "left";
      steps.innerHTML = "为了让你点一下按钮就能把内容发布到网站，需要给编辑器一把「只管这一个仓库」的钥匙：<br>"
        + "1. 点下面按钮打开 GitHub 授权页（名称、账号、Contents 权限已预填好）<br>"
        + "2. 在「存储库访问」选「仅选择存储库」→ 勾选 toneby-lut-showcase<br>"
        + "3. 拉到页面最底，点绿色的 Generate token<br>"
        + "4. 复制生成的串（github_pat_ 开头），粘贴到下面输入框<br>"
        + "5. 点「保存并同步」，以后就一直一键发布了";
      box.appendChild(steps);

      var linkBtn = document.createElement("button");
      linkBtn.type = "button";
      linkBtn.style.cssText = "width:100%;margin-bottom:12px;";
      linkBtn.textContent = "① 打开 GitHub 授权页（新窗口）";
      linkBtn.onclick = function () {
        // target_name=资源所有者(账号名)；GitHub 不支持用 URL 预选具体仓库，需在页面「存储库访问」手动勾选
        window.open("https://github.com/settings/personal-access-tokens/new"
          + "?name=Toneby%20LUT%20editor&target_name=liudeqincanzai-ux&contents=write", "_blank");
      };
      box.appendChild(linkBtn);

      var input = document.createElement("input");
      input.type = "password";
      input.placeholder = "② 粘贴刚才复制的 Token";
      box.appendChild(input);

      var errP = document.createElement("p");
      errP.className = "gate-err";
      box.appendChild(errP);

      var saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.textContent = "③ 保存并同步到网站";
      saveBtn.onclick = function () {
        var v = input.value.trim();
        if (!v) { errP.textContent = "先把 Token 粘贴进来"; return; }
        setToken(v);
        overlay.remove();
        toast("Token 已保存 ✓");
        afterSave();
      };
      box.appendChild(saveBtn);

      var later = document.createElement("a");
      later.className = "bar-link";
      later.href = "#";
      later.style.cssText = "display:block;margin-top:10px;text-align:center;";
      later.textContent = "先跳过，稍后再连（内容仍会自动保存在本机）";
      later.onclick = function (e) { e.preventDefault(); overlay.remove(); };
      box.appendChild(later);

      overlay.appendChild(box);
      document.body.appendChild(overlay);
      input.focus();
    }

    // ---------- 一键同步到 GitHub（网站自动更新） ----------
    function buildDataJs() {
      return "// 本文件由内容编辑器同步生成（" + new Date().toISOString() + "）\n"
        + "// 手动编辑请改下面的 SITE / GROUPS；图片文件需放在 photos/ 文件夹内。\n"
        + "const SITE = " + JSON.stringify(SITE_DATA, null, 2) + ";\n\n"
        + "const GROUPS = " + JSON.stringify(DATA, null, 2) + ";\n";
    }

    function toB64(bytes) {
      var bin = "";
      var CHUNK = 0x8000;
      for (var i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
      }
      return btoa(bin);
    }

    function ghApi(path, opts) {
      opts = opts || {};
      opts.headers = Object.assign({
        "Authorization": "Bearer " + getToken(),
        "Accept": "application/vnd.github+json",
      }, opts.headers || {});
      return fetch("https://api.github.com" + path, opts).then(function (res) {
        if (res.status === 401) throw new Error("Token 无效或已过期，请到「网站设置」重新粘贴");
        if (res.status === 403) throw new Error("Token 权限不足（需要该仓库 Contents 读写权限）");
        return res;
      });
    }

    // 提交单个文件（自动带 sha 覆盖已有文件）
    function ghPutFile(path, contentB64, message) {
      return ghApi("/repos/" + GH_REPO + "/contents/" + encodeURI(path))
        .then(function (r) { return r.json(); })
        .then(function (info) { return info.sha; })
        .catch(function (e) {
          if (e.message.indexOf("Token") === 0 || e.message.indexOf("权限") >= 0) throw e;
          return null; // 404 = 新文件
        })
        .then(function (sha) {
          return ghApi("/repos/" + GH_REPO + "/contents/" + encodeURI(path), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message, content: contentB64, sha: sha || undefined }),
          });
        });
    }

    function setStatus(msg, isErr) {
      statusEl.textContent = msg;
      statusEl.className = "sync-status" + (isErr ? " err" : "");
    }

    document.getElementById("btnSync").onclick = function () {
      if (!getToken()) {
        setStatus("", false);
        showTokenModal(function () { document.getElementById("btnSync").click(); });
        return;
      }
      // 先本地保存
      saveQuiet();

      btnSync.disabled = true;
      var jobs = [["data.js", Promise.resolve(toB64(new TextEncoder().encode(buildDataJs())))]];

      // 本会话新选的图片一起上传
      Object.keys(pendingFiles).forEach(function (path) {
        jobs.push([path, pendingFiles[path].arrayBuffer().then(function (buf) {
          return toB64(new Uint8Array(buf));
        })]);
      });

      var done = 0, failed = 0;
      setStatus("同步中 0/" + jobs.length + " …");

      jobs.reduce(function (chain, job) {
        return chain.then(function () {
          return job[1].then(function (b64) {
            return ghPutFile(job[0], b64, "编辑器更新: " + job[0]);
          }).then(function () {
            done++;
            setStatus("同步中 " + done + "/" + jobs.length + " …");
            if (job[0] !== "data.js") delete pendingFiles[job[0]];
          }).catch(function (e) {
            failed++;
            setStatus("「" + job[0] + "」同步失败：" + e.message, true);
          });
        });
      }, Promise.resolve()).then(function () {
        btnSync.disabled = false;
        if (failed === 0) {
          setStatus("✓ 已同步到 GitHub，网站约 1 分钟内自动更新完成");
          toast("同步成功 ✓");
        } else {
          setStatus("部分失败（" + failed + " 个），可再点一次重试", true);
        }
      });
    };

    // ---------- 导出 data.js ----------
    document.getElementById("btnExport").onclick = function () {
      var text = buildDataJs();
      var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "data.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("data.js 已下载 ✓（备份用；日常发布用「保存并同步到网站」）");
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
