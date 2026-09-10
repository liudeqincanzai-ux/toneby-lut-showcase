// ================================================================
// LUT 展示站 · 数据配置（唯一的配置文件，改内容只改这里）
//
// 每个 LUT 一个展示块，从上往下排列；顶部下拉切换分组。
//
// 字段说明：
//   name    —— LUT 名称（下拉与标题用）
//   title   —— 展示块标题（LUT 介绍，可长可短，可不填）
//   desc    —— 文字描述（可不填，不填不显示）
//   images  —— 图片路径数组（自由添加，数量不限，自动排成规则矩形网格）
//   film    —— 使用的胶片（自由填写；不填则不显示；填了显示在图片正下方居中）
//   note    —— 作者对这组照片的介绍（自由填写；不填则不显示；填了显示在图片正下方居中）
//   credits —— 补充信息行（如 导演/摄影指导，数组，每行一条；不填不显示）
//
// 图片：把你的照片放进 photos/ 文件夹（可建子文件夹），然后把路径写到 images 里。
// ★ 下面 images 里的 covers/... 只是临时占位示例，替换成你自己的照片路径即可。
// ★ 分组仍是临时方案，等你给最终分组后再调整 GROUPS 的组合方式。
// ================================================================
const GROUPS = [
  { name: "FILM LIKE / FILM LIKEⅡ", luts: [
    {
      name: "FILM LIKE",
      title: "FILM LIKE——经典日系胶片质感",
      desc: "这里写这个 LUT 的介绍与文字描述：适合什么场景、什么光线、色彩倾向如何。示例文本，可在 data.js 中自由修改。",
      images: ["covers/lut_icon_02.jpg", "covers/lut_icon_03.jpg", "covers/lut_icon_05.jpg",
               "covers/lut_icon_06.jpg", "covers/lut_icon_07.jpg", "covers/lut_icon_08.jpg"],
      film: "胶片简介：示例胶片名 | 拍摄于示例地点",
      note: "作者对这组照片的介绍：示例文字，不填时此行不显示。",
      credits: [],
    },
    {
      name: "FILM LIKEⅡ",
      title: "FILM LIKEⅡ——更柔和的第二代配方",
      desc: "第二个展示块的文字描述示例。图片数量不限，无论几张都会排成规则的矩形网格。",
      images: ["covers/lut_icon_03.jpg", "covers/lut_icon_02.jpg"],
      film: "",
      note: "",
      credits: [],
    },
  ]},
  { name: "仿胶卷 / 仿胶卷Y", luts: [
    { name: "仿胶卷",  title: "", desc: "", images: ["covers/lut_icon_05.jpg"], film: "", note: "", credits: [] },
    { name: "仿胶卷Y", title: "", desc: "", images: ["covers/lut_icon_06.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "Gold200 / Gold200H", luts: [
    { name: "Gold200",  title: "", desc: "", images: ["covers/lut_icon_09.jpg"], film: "", note: "", credits: [] },
    { name: "Gold200H", title: "", desc: "", images: ["covers/lut_icon_08.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "CLASSIC FEATURE / CLASSIC NEGATIVE", luts: [
    { name: "CLASSIC FEATURE",  title: "", desc: "", images: ["covers/lut_icon_10.jpg"], film: "", note: "", credits: [] },
    { name: "CLASSIC NEGATIVE", title: "", desc: "", images: ["covers/lut_icon_11.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "5219 / 5219S", luts: [
    { name: "5219",  title: "", desc: "", images: ["covers/lut_icon_14.jpg"], film: "", note: "", credits: [] },
    { name: "5219S", title: "", desc: "", images: ["covers/lut_icon_13.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "过期胶卷 / GRF", luts: [
    { name: "过期胶卷", title: "", desc: "", images: ["covers/lut_icon_01.jpg"], film: "", note: "", credits: [] },
    { name: "GRF",      title: "", desc: "", images: ["covers/lut_icon_15.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "GRFⅡ / CLASSIC FILM", luts: [
    { name: "GRFⅡ",        title: "", desc: "", images: ["covers/lut_icon_18.jpg"], film: "", note: "", credits: [] },
    { name: "CLASSIC FILM", title: "", desc: "", images: ["covers/lut_icon_07.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "BWL / BWLL", luts: [
    { name: "BWL",  title: "", desc: "", images: ["covers/lut_icon_16.jpg"], film: "", note: "", credits: [] },
    { name: "BWLL", title: "", desc: "", images: ["covers/lut_icon_17.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "GS S800 / GS P3", luts: [
    { name: "GS S800", title: "", desc: "", images: ["covers/lut_icon_19.jpg"], film: "", note: "", credits: [] },
    { name: "GS P3",   title: "", desc: "", images: ["covers/lut_icon_20.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "MOVIE / MOVIEⅡ", luts: [
    { name: "MOVIE",   title: "", desc: "", images: ["covers/lut_icon_21.jpg"], film: "", note: "", credits: [] },
    { name: "MOVIEⅡ", title: "", desc: "", images: ["covers/lut_icon_22.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "D55 / D65", luts: [
    { name: "D55", title: "", desc: "", images: ["covers/lut_icon_23.jpg"], film: "", note: "", credits: [] },
    { name: "D65", title: "", desc: "", images: ["covers/lut_icon_24.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "CC / NEGATIVE", luts: [
    { name: "CC",       title: "", desc: "", images: ["covers/lut_icon_04.jpg"], film: "", note: "", credits: [] },
    { name: "NEGATIVE", title: "", desc: "", images: ["covers/lut_icon_12.jpg"], film: "", note: "", credits: [] },
  ]},
  { name: "Classic F200 / 5207", luts: [
    { name: "Classic F200", title: "", desc: "", images: ["covers/lut_icon_25.jpg"], film: "", note: "", credits: [] },
    { name: "5207",         title: "", desc: "", images: ["covers/lut_icon_26.jpg"], film: "", note: "", credits: [] },
  ]},
];
