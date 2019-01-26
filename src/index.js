const crawlPage = require('./getData');
const upDate = require('./updata');

(async ()=>{
  const onePage = await new crawlPage({countPage:1});
  await onePage.defineBrowser();
  await onePage.jqGetListDate();
  for(let i = 0;i< onePage.listData.length;i++){
      await upDate(onePage.listData[i].img+'.jpg',onePage.listData[i].bid)
      .then(res=>{
        onePage.listData[i].imgLink = "http://www.dnitu.top/" + res.name;
        return res.name;
      }).catch(function(err){
        console.log(err);
      })
  };
  console.log(onePage.listData);
})();

