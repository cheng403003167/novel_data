class crawlPage{
  constructor({currentPage=1,countPage=0}={}){
    const puppeteer = require('puppeteer');
    this.puppeteer = puppeteer;
    this.currentPage = currentPage;
    this.countPage = countPage;
    this.listData = [];
    this.url = 'https://www.qidian.com/all?page='+this.currentPage;
  }
  async defineBrowser(){
    this.browser = await this.puppeteer.launch({headless:true});
  }
  // 插入jq代码
  async defineJq(page,url='https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js'){
    page.on('load',async()=>{
      await page.addScriptTag({
        url:url
      })
    })
  }
  // 使用jq获取列表数据
  async jqGetListDate(){
    this.listPage = await this.browser.newPage();
    await this.defineJq(this.listPage);
    await this.listPage.goto(this.url);
    await this.getListtDate(this.listPage,this.countPage);
    await this.criclGetData(this.listPage,this.countPage);
    await this.getDetailData(0,this.listData.length);
    await this.browser.close();
  }
  // 循环获取列表数据
  async criclGetData(page,countPage){
    if(this.currentPage >= countPage){
      return false;
    }
    await Promise.all([
      page.waitForNavigation(),
      page.click('.lbf-pagination-next')
    ]).then(async ()=>{
      await this.getListtDate(page,countPage);
      if(this.currentPage < countPage){
        this.currentPage++;
        await this.criclGetData(page,countPage);
      }
    });
  }
  // 获取一页列表数据
  async getListtDate(page,countPage){
    let date =  await page.evaluate((countPage)=>{
      // 删除起点临时弹框----开始
      let divList = $("div");
      let divListLength = divList.length;
      for(let i=0;i<divListLength;i++){
        if($("div").eq(i).css('z-index') == 9999){
          $("div").eq(i).hide();
        }
      }
      // 删除起点临时弹框----结束
      let list = $(".all-img-list li");
      let pageLength = $(".lbf-pagination-item-list li").length;
      if(countPage == 0){
        countPage = $(".lbf-pagination-item-list li").eq(pageLength-2).text();
      }
      let data = [];
      for(let i = 0,listLength = list.length;i < listLength;i++){
        let itemName = list.eq(i).find('h4').text();
        let author = list.eq(i).find('.author .name').text();
        let link = 'https:'+list.eq(i).find('h4 a').attr('href');
        let bid = list.eq(i).find('h4 a').attr('data-bid');
        let tag = list.eq(i).find('.author').find('a').eq(1).text();
        let status = list.eq(i).find('.author').find('span').text();
        data.push({
          name:itemName,
          tag: tag,
          author: author,
          status: status,
          link:link,
          bid: parseInt(bid)
        })
      }
      return {data:data,countPage:parseInt(countPage)};
    },countPage);
    if(date.countPage != 0){
      this.countPage = date.countPage;
    }
    this.listData = this.listData.concat(date.data);
  }
  // 获取详情页内容
  async getDetailData(j,len){
    this.detailIndex = j || 0;
    let length = len || this.listData.length;
    this.detailPage = await this.browser.newPage();
    do{
      await this.getDetailDataF(this.detailIndex,length);
      if(this.detailIndex >= length){
        this.detailPage.close();
      }
    }while(this.detailIndex<length)
  }
  async getDetailDataF(index,length){
    await this.detailPage.goto(this.listData[index].link);
    //分数
    let score = await this.detailPage.waitForSelector('#j_bookScore',{visible:true}).catch(function(e){
      if(e) this.getDetailData(index,length);
    });
    let s1 = await score.$eval('#score1',node => node.innerText);
    let s2 = await score.$eval('#score2',node => node.innerText);
    this.listData[index].score = parseFloat(s1+'.'+s2);
    // 简介
    let describe = await this.detailPage.$eval('.book-intro p',(node) => {return node.innerHTML.trim();});
    // 作者id
    let authorId = await this.detailPage.$eval('#authorId',(node) => {return node.getAttribute('data-authorid')});
    
    // 封面
    let img = await this.detailPage.$eval('#bookImg img',(node) => {return 'https:' + node.getAttribute('src').trim()});
    
    //章节和字数
    await this.detailPage.click('.j_catalog_block');
    await this.detailPage.waitFor(1000);
    let chapter = await this.detailPage.$eval('#J-catalogCount',(node) => {let chapter = node.innerText.slice(1);return parseInt(chapter);})
    let count = await this.detailPage.$$eval('.count > cite',(data) => {let arr = 0;data.forEach(function(item){arr += parseInt(item.innerText)});return arr;});
    this.listData[index].totalChapter = chapter;
    this.listData[index].totalNumber = count;
    this.listData[index].describe = describe;
    this.listData[index].authorId = parseInt(authorId);
    this.listData[index].img = img;
    if(count != 0){
      this.detailIndex++;
    }else{
      await this.getDetailDataF(index,length);
    }
  }
}

module.exports = crawlPage;

// 测试语句
// (async ()=>{
//   const onePage = new crawlPage({countPage:2});
//   await onePage.defineBrowser();
//   await onePage.jqGetListDate();
//   console.log(onePage.listData);
// })()
