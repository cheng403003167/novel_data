// 更新书的排列信息
const crawlPage = require('./bin/getData');
const upDate = require('./bin/updata');
const insertDatejs = require('./bin/updatamysql');

async function updataF(currentPage,countPage){
  let onePage = await new crawlPage({currentPage:currentPage,countPage:countPage});
  await onePage.defineBrowser();
  await onePage.jqGetListDate(1);
  await onePage.closeBrowser();
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
    let insertData1 = await new insertDatejs({dataArr:onePage.listData,openFile:1});
    await insertData1.createConnInsert();
  }
  if(onePage.listDataHave.length > 0){
    // 更新数据库
    let insertData2 = await new insertDatejs({dataArr:onePage.listDataHave,openFile:0});
    await insertData2.updateData();
  }
}
(async()=>{
  for(t = 1;t < 2;t++){
    await updataF(t,t)
  };
})()
  