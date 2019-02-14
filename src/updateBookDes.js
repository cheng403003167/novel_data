// 更新书的详细信息
const crawlPage = require('./getData');
const insertDatejs = require('./updatamysql');

async function updatabookDes(start,blank){
  // 查询数据
  var insertData = new insertDatejs({openFile:0});
  let bookResult = await insertData.getBookList(start,blank);
  // 获取最新数据
  let tempArr = [];
  bookResult.on('err',function(err){
    console.log(err);
  }).on('result',function(row){
    tempArr.push(JSON.parse(JSON.stringify(row)));
  }).on('end',async function(){
    // 获取数据
    let onePage = await new crawlPage({listData:tempArr});
    await onePage.defineBrowser();
    await onePage.jqGetDes();
    // 更新新数据
    await insertData.updateDes(onePage.listData);
    if(tempArr.length == blank){
      await updatabookDes(start+blank,blank)
    }
  })
};
updatabookDes(0,5);
