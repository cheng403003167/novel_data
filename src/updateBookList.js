// 更新书的排列信息
const crawlPage = require('./getData');
const upDate = require('./updata');
const insertDatejs = require('./updatamysql');

async function updataF(currentPage,countPage){
  let onePage = await new crawlPage({currentPage:currentPage,countPage:countPage});
  await onePage.defineBrowser();
  await onePage.jqGetListDate(1);
  // 上传图片
  if(onePage.listData.length>0){
    for(let i = 0;i< onePage.listData.length;i++){
        await upDate(onePage.listData[i].imgLink+'.jpg',onePage.listData[i].bid)
        .then(res=>{
          onePage.listData[i].imgLink = "http://www.dnitu.top/" + res.name;
          return res.name;
        }).catch(function(err){
          console.log(err);
        })
    };
    // 插入数据库
    let insertData = await new insertDatejs({dataArr:onePage.listData,openFile:0});
    await insertData.createConnInsert();
  }
  if(onePage.listDataHave.length > 0){
    // 更新数据库
    let insertData = await new insertDatejs({dataArr:onePage.listDataHave,openFile:0});
    await insertData.updateData();
  }
}

for(t = 1;t < 3;t++){
  updataF(t,t)
};