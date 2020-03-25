const moment = require("moment");
const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");
const download = require("download");
const path = require("path");

function page_to_url(page) {
  let end_date = moment().format("YYYY-MM-DD+HH:mm:ss");
  let url =
    "https://beautyptt.cc/extend/?EndDate=" +
    end_date +
    "&infinite_json&page=" +
    page;
  return url;
}

// 下载图片
async function download_img(imgAndName) {
  console.log("imgAndName::", imgAndName);

  let path_and_name = path.join(__dirname, "images", imgAndName["name"]);
  if (fs.existsSync(path_and_name)) {
    console.log("跳过", path_and_name);
  } else {
    await download(imgAndName["url"], path.join(__dirname, "images"), {
      filename: imgAndName["name"]
    });
  }
}

// 根据html提取图片和名称

async function html_to_json(html) {
  let $ = cheerio.load(html);

  let grid_item_a_img = $(".grid-item a img");

  let grid_item_a_img_length = grid_item_a_img.length;

  console.log("length:::", grid_item_a_img_length);

  let name_and_url_list = [];

  for (let i = 0; i < grid_item_a_img_length; i++) {
    let tmp_img_info = grid_item_a_img[i];
    // console.log("==="+ i +"=>>>", tmp_img_info["attribs"]);

    let attribs = JSON.parse(JSON.stringify(tmp_img_info["attribs"]));

    let alt = attribs.alt;
    let src = attribs.src;

    let name = alt + src.split("/").reverse()[0];
    if (name !== "undefinedPinExt.png") {
      if(src.indexOf("//") === 0){
        src = "http:"+src;
      }


      name_and_url_list.push({
        name: name,
        url: src
      });
    }
  }

  return name_and_url_list;
}

async function url_to_html(url) {
  let response = await axios({
    url: url,
    method: "GET"
  });

  //  console.log(data);

  let html = response.data;
  return html;
}

async function main() {
  // 创建文件夹
  try {
    await fs.mkdir(path.join(__dirname, "images"));
  } catch (err) {
    // console.log("==>", err);
  }

  let page = 1;

  let next_downlaod = true;

  while (next_downlaod) {
    let tmp_url = page_to_url(page);
    console.log(tmp_url);
    let tmp_html = await url_to_html(tmp_url);

    if (tmp_html.length < 1) {
      console.log("==停止==", tmp_html);
      next_downlaod = false;
    } else {
      //  console.log(tmp_html);
      let img_json = await html_to_json(tmp_html);

      let img_json_length = img_json.length;

      for (let m = 0; m < img_json_length; m++) {
        try {
          await download_img(img_json[m]);
        } catch (e) {
          console.log("下载出错==>>", e);
        }
      }

      page = page + 1;
    }
  }
}

main();
