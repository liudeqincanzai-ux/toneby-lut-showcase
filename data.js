// ================================================================
// LUT 展示站 · 数据配置（唯一的分组配置文件，改分组只改这里）
// cover 编号与 app 内置 LUT 顺序一一对应：
// lut_icon_01=过期胶卷 02=FILM LIKE 03=FILM LIKEⅡ 04=CC
// 05=仿胶卷 06=仿胶卷Y 07=CLASSIC FILM 08=Gold200H 09=Gold200
// 10=CLASSIC FEATURE 11=CLASSIC NEGATIVE 12=NEGATIVE 13=5219S 14=5219
// 15=GRF 16=BWL 17=BWLL 18=GRFⅡ 19=GS S800 20=GS P3
// 21=MOVIE 22=MOVIEⅡ 23=D55 24=D65 25=Classic F200 26=5207
//
// 结构：每组一个页面；组内每个 LUT 一个格子，从上往下依次展示。
// ★ 当前为临时分组，等用户给出最终分组后替换 GROUPS 即可。
// ================================================================
const GROUPS = [
  { name: "FILM LIKE / FILM LIKEⅡ", luts: [
    { name: "FILM LIKE",   cover: "covers/lut_icon_02.jpg" },
    { name: "FILM LIKEⅡ", cover: "covers/lut_icon_03.jpg" },
  ]},
  { name: "仿胶卷 / 仿胶卷Y", luts: [
    { name: "仿胶卷",  cover: "covers/lut_icon_05.jpg" },
    { name: "仿胶卷Y", cover: "covers/lut_icon_06.jpg" },
  ]},
  { name: "Gold200 / Gold200H", luts: [
    { name: "Gold200",  cover: "covers/lut_icon_09.jpg" },
    { name: "Gold200H", cover: "covers/lut_icon_08.jpg" },
  ]},
  { name: "CLASSIC FEATURE / CLASSIC NEGATIVE", luts: [
    { name: "CLASSIC FEATURE",  cover: "covers/lut_icon_10.jpg" },
    { name: "CLASSIC NEGATIVE", cover: "covers/lut_icon_11.jpg" },
  ]},
  { name: "5219 / 5219S", luts: [
    { name: "5219",  cover: "covers/lut_icon_14.jpg" },
    { name: "5219S", cover: "covers/lut_icon_13.jpg" },
  ]},
  { name: "过期胶卷 / GRF", luts: [
    { name: "过期胶卷", cover: "covers/lut_icon_01.jpg" },
    { name: "GRF",      cover: "covers/lut_icon_15.jpg" },
  ]},
  { name: "GRFⅡ / CLASSIC FILM", luts: [
    { name: "GRFⅡ",        cover: "covers/lut_icon_18.jpg" },
    { name: "CLASSIC FILM", cover: "covers/lut_icon_07.jpg" },
  ]},
  { name: "BWL / BWLL", luts: [
    { name: "BWL",  cover: "covers/lut_icon_16.jpg" },
    { name: "BWLL", cover: "covers/lut_icon_17.jpg" },
  ]},
  { name: "GS S800 / GS P3", luts: [
    { name: "GS S800", cover: "covers/lut_icon_19.jpg" },
    { name: "GS P3",   cover: "covers/lut_icon_20.jpg" },
  ]},
  { name: "MOVIE / MOVIEⅡ", luts: [
    { name: "MOVIE",   cover: "covers/lut_icon_21.jpg" },
    { name: "MOVIEⅡ", cover: "covers/lut_icon_22.jpg" },
  ]},
  { name: "D55 / D65", luts: [
    { name: "D55", cover: "covers/lut_icon_23.jpg" },
    { name: "D65", cover: "covers/lut_icon_24.jpg" },
  ]},
  { name: "CC / NEGATIVE", luts: [
    { name: "CC",       cover: "covers/lut_icon_04.jpg" },
    { name: "NEGATIVE", cover: "covers/lut_icon_12.jpg" },
  ]},
  { name: "Classic F200 / 5207", luts: [
    { name: "Classic F200", cover: "covers/lut_icon_25.jpg" },
    { name: "5207",         cover: "covers/lut_icon_26.jpg" },
  ]},
];
