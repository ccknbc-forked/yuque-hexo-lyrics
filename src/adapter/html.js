const ejs = require('ejs');
const Entities = require('html-entities').AllHtmlEntities;
const FrontMatter = require('hexo-front-matter');
const { formatDate, formatRaw } = require('../util');

const entities = new Entities();
// 背景色区块支持
const colorBlocks = {
  ':::tips\n':
    '<div style="background: #FFFBE6;padding:10px;border: 1px solid #C3C3C3;border-radius:5px;margin-bottom:5px;">',
  ':::danger\n':
    '<div style="background: #FFF3F3;padding:10px;border: 1px solid #DEB8BE;border-radius:5px;margin-bottom:5px;">',
  ':::info\n':
    '<div style="background: #E8F7FF;padding:10px;border: 1px solid #ABD2DA;border-radius:5px;margin-bottom:5px;">',
  ':::warning\n':
    '<div style="background: #fffbe6;padding:10px;border: 1px solid #e0d1b1;border-radius:5px;margin-bottom:5px;">',
  ':::success\n':
    '<div style="background: #edf9e8;padding:10px;border: 1px solid #c2d2b5;border-radius:5px;margin-bottom:5px;">',
  '\\s+:::': '</div>'
};

// 文章模板
const template = `---
<%- matter -%>

<%- raw -%>`;

/**
 * front matter 反序列化
 * @description
 * docs: https://www.npmjs.com/package/hexo-front-matter
 *
 * @param {String} body md 文档
 * @return {String} result
 */
function parseMatter(body) {
  // 格式化body，这个body可能是从语雀api拉取过来的，转换成了markdown
  body = entities.decode(body);
  try {
    // front matter信息的<br/>换成 \n
    const regex = /(title:|layout:|tags:|date:|categories:){1}(\S|\s)+?---/gi;
    body = body.replace(regex, (a) =>
      a.replace(/(<br \/>|<br>|<br\/>)/gi, '\n')
    );
    // 支持提示区块语法
    for (const key in colorBlocks) {
      body = body.replace(new RegExp(key, 'igm'), colorBlocks[key]);
    }
    const result = FrontMatter.parse(body);
    result.body = result._content;
    if (result.date) {
      result.date = formatDate(result.date);
    }
    delete result._content;
    return result;
  } catch (error) {
    return {
      body
    };
  }
}
let tranPreFun = (str) => {
  // 匹配所有pre标签（开闭）
  let patt = /<pre data-language="(([\s\S])*?)<\/pre>/g;
  // 开pre
  let patt_replace = /<.*?>/;
  // 获取语言类型
  let patt_lang = /data-language=".*?"/;

  let result = str.replace(patt, (data) => {
    let tran_last = data.slice(0, -6) + '\n' + '```' + '\n\n';
    let tran_head = tran_last.replace(patt_replace, (_pre) => {
      let _temp =
        '\n\n' +
        '```' +
        _pre.match(patt_lang)[0].replace('data-language="', '').slice(0, -1) +
        '\n';
      return _temp;
    });
    return tran_head;
  });
  return result;
};
/**
 * hexo 文章生产适配器
 *
 * @param {Object} post 文章
 * @return {String} text
 */
module.exports = function (post, cates, secret, belong_book) {
  // matter 解析
  // const parseRet = parseMatter(post.body); // 格式化body
  const parseRet = parseMatter(post.body_html);
  const { body, ...data } = parseRet;
  // public接口不能用，只能在generatePost函数中用传参的形式放进来
  // description updated_at cover
  const { title, slug: urlname, created_at, word_count } = post;
  // console.log(title,cover);

  let raw = formatRaw(body); // util工具里面的格式化markdown函数
  raw = tranPreFun(raw);
  // let raw = body_html; // util工具里面的格式化markdown函数
  if (secret === 0) {
    raw = '这是加密文章！'; //如果文章加密了，就不拉取文章内容
  }
  const date = data.date || formatDate(created_at); // util工具里面的处理时间date函数
  const tags = data.tags || [];
  const categories = cates || data.categories || [];
  const props = {
    title: title.replace(/"/g, ''), // 临时去掉标题中的引号，至少保证文章页面是正常可访问的
    urlname,
    date,
    ...data,
    tags,
    categories,
    word_count: word_count,
    secret: secret,
    belong_book: belong_book
  };
  const text = ejs.render(template, {
    raw,
    matter: FrontMatter.stringify(props)
  });
  return text;
};