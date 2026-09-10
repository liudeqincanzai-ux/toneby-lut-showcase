// Toneby LUT 展示站 · 逻辑：下拉选组 → 渲染该组 LUT（一格一个，上→下）
(function () {
  var picker = document.getElementById("groupPicker");
  var page = document.getElementById("page");

  // 填充下拉选项
  GROUPS.forEach(function (g, i) {
    var opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = g.name;
    picker.appendChild(opt);
  });

  function render(index) {
    var g = GROUPS[index];
    if (!g) return;
    picker.value = String(index);
    page.textContent = ""; // 清空
    g.luts.forEach(function (lut) {
      var fig = document.createElement("figure");
      fig.className = "lut-item";

      var cell = document.createElement("div");
      cell.className = "lut-cell";
      var img = document.createElement("img");
      img.src = lut.cover;
      img.alt = lut.name;
      img.loading = "lazy";
      cell.appendChild(img);

      var cap = document.createElement("figcaption");
      cap.textContent = lut.name;

      fig.appendChild(cell);
      fig.appendChild(cap);
      page.appendChild(fig);
    });
    window.scrollTo(0, 0);
  }

  picker.addEventListener("change", function () {
    location.hash = "g" + picker.value;
  });

  // 支持 #g3 形式的直达（app WebView 里返回键也能正常回退）
  function fromHash() {
    var m = /^#g(\d+)$/.exec(location.hash);
    var idx = m ? Math.min(Math.max(0, +m[1]), GROUPS.length - 1) : 0;
    render(idx);
  }

  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
