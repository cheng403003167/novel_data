// 插入新书
const crawlPage = require('./bin/getData');
const upDate = require('./bin/updata');
const insertDatejs = require('./bin/updatamysql');

async function getDataBlank(currentPage,countPage){
  // 获取数据
  let onePage = await new crawlPage({currentPage:currentPage,countPage:countPage});
  await onePage.defineBrowser();
  await onePage.jqGetListDate(0);

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
    let insertData = await new insertDatejs({dataArr:onePage.listData,openFile:1});
    await insertData.createConnInsert();
  }

  console.log(currentPage+'-'+countPage+'列表数据获取完成');
};
// for(t = 0;t <= 1;t++){
//   getDataBlank(t*2+1,(t+1)*2)
// };
getDataBlank(1,1)

